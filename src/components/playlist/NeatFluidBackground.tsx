// components/playlist/NeatFluidBackground.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { NeatGradient } from "@firecms/neat";

interface NeatFluidBackgroundProps {
  coverUrl: string;
}

const DEFAULT_COLORS = ["#fa2d48", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981"];

// 内存缓存：记录提取到的颜色
const colorCache = new Map<string, string[]>();

/**
 * 确保图片通过支持 CORS 的低分辨率代理节点加载，防止 Canvas SecurityError (污染) 与加载超时
 */
function getCORSImageUrl(url: string): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("data:")) return trimmed;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    if (trimmed.includes("wsrv.nl")) {
      return trimmed.includes("w=") ? trimmed : `${trimmed}&w=64&h=64&output=jpg`;
    }
    return `https://wsrv.nl/?url=${encodeURIComponent(trimmed)}&w=64&h=64&output=jpg`;
  }
  return trimmed;
}

/**
 * RGB 转 HSL
 */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), s, l];
}

function toHex(n: number): string {
  return Math.max(0, Math.min(255, Math.round(n)))
    .toString(16)
    .padStart(2, "0");
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * 从封面提取 5 个极富质感与流动张力的高光流体色彩
 */
async function extractColorsFromImage(rawUrl: string): Promise<string[]> {
  if (!rawUrl) return DEFAULT_COLORS;
  if (colorCache.has(rawUrl)) {
    return colorCache.get(rawUrl)!;
  }

  const corsUrl = getCORSImageUrl(rawUrl);

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = corsUrl;

    const fallbackTimeout = setTimeout(() => {
      resolve(colorCache.get(rawUrl) || DEFAULT_COLORS);
    }, 2500);

    img.onload = () => {
      clearTimeout(fallbackTimeout);
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          resolve(DEFAULT_COLORS);
          return;
        }

        const size = 32;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imgData = ctx.getImageData(0, 0, size, size).data;
        interface Pixel {
          r: number;
          g: number;
          b: number;
          h: number;
          s: number;
          l: number;
        }

        const pixels: Pixel[] = [];
        let totalSat = 0;

        for (let i = 0; i < imgData.length; i += 16) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          if (a > 128) {
            const [h, s, l] = rgbToHsl(r, g, b);
            pixels.push({ r, g, b, h, s, l });
            totalSat += s;
          }
        }

        if (pixels.length === 0) {
          resolve(DEFAULT_COLORS);
          return;
        }

        const avgSat = totalSat / pixels.length;

        // 判定分支 1：黑白/灰色/冷调封面（如 Eminem - The Marshall Mathers LP）
        if (avgSat < 0.14) {
          // 根据亮度排序，提炼出 5 阶如水墨烟雾般的典雅冷阶灰度色
          pixels.sort((a, b) => a.l - b.l);
          const steps = [0.15, 0.35, 0.55, 0.72, 0.9];
          const palette = steps.map((p) => {
            const idx = Math.min(Math.floor(pixels.length * p), pixels.length - 1);
            const px = pixels[idx];
            return rgbToHex(px.r, px.g, px.b);
          });

          colorCache.set(rawUrl, palette);
          resolve(palette);
          return;
        }

        // 判定分支 2：彩色封面 (高保真色彩提取，按色相桶分散分布，呈现 Apple Music 般流光溢彩)
        const coloredPixels = pixels.filter((p) => p.s > 0.15 && p.l > 0.18 && p.l < 0.88);
        const sourceList = coloredPixels.length >= 10 ? coloredPixels : pixels;

        // 色相桶划分 (0-60, 60-120, 120-180, 180-240, 240-300, 300-360)
        const buckets: Pixel[][] = Array.from({ length: 6 }, () => []);
        for (const px of sourceList) {
          const bIndex = Math.min(Math.floor(px.h / 60), 5);
          buckets[bIndex].push(px);
        }

        // 每个非空桶中，按饱和度 * 适中亮度挑选最佳代表色
        const bucketWinners: Pixel[] = [];
        for (const b of buckets) {
          if (b.length > 0) {
            b.sort((a, bPixel) => {
              const scoreA = a.s * 1.5 + (1 - Math.abs(a.l - 0.5));
              const scoreB = bPixel.s * 1.5 + (1 - Math.abs(bPixel.l - 0.5));
              return scoreB - scoreA;
            });
            bucketWinners.push(b[0]);
          }
        }

        // 桶按代表色的饱和度从高到低排序
        bucketWinners.sort((a, b) => b.s - a.s);

        const chosenHex: string[] = [];
        for (const w of bucketWinners) {
          chosenHex.push(rgbToHex(w.r, w.g, w.b));
          if (chosenHex.length >= 5) break;
        }

        // 如果不足 5 种色相，用最高饱和度色微调亮度/互补色补足
        if (chosenHex.length < 5) {
          const lead = bucketWinners[0] || pixels[0];
          while (chosenHex.length < 5) {
            const shift = chosenHex.length * 0.15;
            const adjR = Math.min(255, Math.max(0, Math.round(lead.r * (0.7 + shift))));
            const adjG = Math.min(255, Math.max(0, Math.round(lead.g * (0.7 + shift))));
            const adjB = Math.min(255, Math.max(0, Math.round(lead.b * (0.7 + shift))));
            chosenHex.push(rgbToHex(adjR, adjG, adjB));
          }
        }

        colorCache.set(rawUrl, chosenHex);
        resolve(chosenHex);
      } catch {
        resolve(colorCache.get(rawUrl) || DEFAULT_COLORS);
      }
    };

    img.onerror = () => {
      clearTimeout(fallbackTimeout);
      resolve(colorCache.get(rawUrl) || DEFAULT_COLORS);
    };
  });
}

export function NeatFluidBackground({ coverUrl }: NeatFluidBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const neatRef = useRef<NeatGradient | null>(null);
  const colorsRef = useRef<string[]>(colorCache.get(coverUrl) || DEFAULT_COLORS);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. 当 coverUrl 变化时提取色彩并动态更新 WebGL Shader uniforms
  useEffect(() => {
    let isMounted = true;
    if (!coverUrl) return;

    // 先看缓存
    const cached = colorCache.get(coverUrl);
    if (cached) {
      colorsRef.current = cached;
      if (neatRef.current) {
        neatRef.current.colors = cached.map((c) => ({ color: c, enabled: true }));
      }
      return;
    }

    // 异步提取主色调
    extractColorsFromImage(coverUrl).then((extracted) => {
      if (!isMounted || !extracted || extracted.length === 0) return;
      colorCache.set(coverUrl, extracted);
      colorsRef.current = extracted;
      if (neatRef.current) {
        neatRef.current.colors = extracted.map((c) => ({ color: c, enabled: true }));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [coverUrl]);

  // 2. 初始化 WebGL 实例（仅在组件挂载时初始化一次，避免重复创建销毁导致上下文丢失）
  useEffect(() => {
    if (!canvasRef.current) return;

    let timeoutId: NodeJS.Timeout;

    timeoutId = setTimeout(() => {
      if (!canvasRef.current) return;

      try {
        if (!neatRef.current) {
          const initColors = colorsRef.current;
          neatRef.current = new NeatGradient({
            ref: canvasRef.current,
            colors: initColors.map((c) => ({ color: c, enabled: true })),
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
        }
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
  }, []);

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
