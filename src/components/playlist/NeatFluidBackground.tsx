// components/playlist/NeatFluidBackground.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { NeatGradient } from "@firecms/neat";

interface NeatFluidBackgroundProps {
  coverUrl: string;
}

// 快速从封面提取 4~5 个鲜活流体主色调 (带内存缓存)
const colorCache = new Map<string, string[]>();

async function extractColorsFromImage(url: string): Promise<string[]> {
  if (colorCache.has(url)) {
    return colorCache.get(url)!;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          const fallback = ["#fa2d48", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981"];
          colorCache.set(url, fallback);
          resolve(fallback);
          return;
        }

        const size = 24;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imgData = ctx.getImageData(0, 0, size, size).data;
        const sampledColors: { r: number; g: number; b: number; saturation: number }[] = [];

        for (let i = 0; i < imgData.length; i += 16) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          if (a > 128) {
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const delta = max - min;
            const saturation = max === 0 ? 0 : delta / max;
            const brightness = max / 255;

            if (brightness > 0.15 && brightness < 0.95) {
              sampledColors.push({ r, g, b, saturation });
            }
          }
        }

        if (sampledColors.length === 0) {
          const fallback = ["#fa2d48", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981"];
          colorCache.set(url, fallback);
          resolve(fallback);
          return;
        }

        sampledColors.sort((a, b) => b.saturation - a.saturation);

        const chosen: string[] = [];
        const step = Math.max(1, Math.floor(sampledColors.length / 5));

        for (let i = 0; i < 5; i++) {
          const idx = Math.min(i * step, sampledColors.length - 1);
          const c = sampledColors[idx];
          const toHex = (n: number) => n.toString(16).padStart(2, "0");
          chosen.push(`#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`);
        }

        colorCache.set(url, chosen);
        resolve(chosen);
      } catch {
        const fallback = ["#fa2d48", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981"];
        resolve(fallback);
      }
    };

    img.onerror = () => {
      resolve(["#fa2d48", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981"]);
    };
  });
}

export function NeatFluidBackground({ coverUrl }: NeatFluidBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const neatRef = useRef<NeatGradient | null>(null);
  const [colors, setColors] = useState<string[]>(() => {
    return colorCache.get(coverUrl) || ["#fa2d48", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981"];
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. 异步提取主色调 (使用缓存提速)
  useEffect(() => {
    let isMounted = true;
    if (coverUrl) {
      extractColorsFromImage(coverUrl).then((extracted) => {
        if (isMounted && extracted && extracted.length > 0) {
          setColors(extracted);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [coverUrl]);

  // 2. 延迟 1 帧初始化 WebGL，避开 Modal 展开瞬间的主线程 GPU 竞争
  useEffect(() => {
    if (!canvasRef.current) return;

    let timeoutId: NodeJS.Timeout;

    // 延迟 120ms 待展开动画跑顺后再启动 WebGL 编译与着色
    timeoutId = setTimeout(() => {
      if (!canvasRef.current) return;

      try {
        if (neatRef.current) {
          neatRef.current.destroy();
          neatRef.current = null;
        }

        neatRef.current = new NeatGradient({
          ref: canvasRef.current,
          colors: [
            { color: colors[0] || "#fa2d48", enabled: true },
            { color: colors[1] || "#3b82f6", enabled: true },
            { color: colors[2] || "#8b5cf6", enabled: true },
            { color: colors[3] || "#f59e0b", enabled: true },
            { color: colors[4] || "#10b981", enabled: true },
          ],
          speed: 2.0,
          horizontalPressure: 3,
          verticalPressure: 3,
          waveFrequencyX: 2,
          waveFrequencyY: 2,
          waveAmplitude: 4.0,
          shadows: 0,
          highlights: 1,
          colorBrightness: 1.05,
          colorSaturation: 1.2,
          wireframe: false,
          colorBlending: 6,
          backgroundColor: "#050508",
          backgroundAlpha: 1,
        });

        setIsLoaded(true);
      } catch (err) {
        console.warn("NeatGradient init error:", err);
      }
    }, 120);

    return () => {
      clearTimeout(timeoutId);
      if (neatRef.current) {
        try {
          neatRef.current.destroy();
        } catch {}
        neatRef.current = null;
      }
    };
  }, [colors]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none will-change-transform">
      {/* 🌟 第 1 层：秒开瞬态封面弥散底图 (0ms 零延迟极速 120fps 展开，保证丝滑无掉帧) */}
      <img
        src={coverUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-cover blur-[90px] brightness-[0.75] saturate-[2.0] scale-135"
        style={{ transform: "translateZ(0)" }}
      />

      {/* 🌟 第 2 层：WebGL 动态流体层 (编译完成后无缝平滑淡入交融) */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full object-cover scale-110 transition-opacity duration-700 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        style={{
          filter: "blur(50px) saturate(1.8) brightness(0.85)",
          transform: "translateZ(0)",
        }}
      />

      {/* 🌟 第 3 层：柔和通透暗角渐变 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-black/50 backdrop-blur-xl" />
    </div>
  );
}
