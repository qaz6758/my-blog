"use client";

import React, { useEffect, useRef } from "react";

/**
 * ArtPlum
 * 
 * 1:1 纯正复刻 Anthony Fu (antfu.me) 经典的生成艺术梅花枝桠算法：
 * 利用分形极坐标递归与 requestAnimationFrame 缓动画，
 * 在页面背景随风生长出轻灵、诗意的水墨梅花树枝与散落花瓣。
 */

type StepFunction = () => void;

export function ArtPlum() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let animationFrameId: number;

    const r180 = Math.PI;
    const r90 = Math.PI / 2;
    const r15 = Math.PI / 12;
    const color = "#88888820";

    const { random } = Math;
    const MIN_BRANCH = 30;
    const len = 6;

    function initCanvas() {
      if (!canvas || !ctx) return;
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = dpr * width;
      canvas.height = dpr * height;
      ctx.resetTransform?.();
      ctx.scale(dpr, dpr);
    }

    function polar2cart(x = 0, y = 0, r = 0, theta = 0) {
      const dx = r * Math.cos(theta);
      const dy = r * Math.sin(theta);
      return [x + dx, y + dy];
    }

    let steps: StepFunction[] = [];
    let prevSteps: StepFunction[] = [];

    const step = (
      x: number,
      y: number,
      rad: number,
      counter = { value: 0 }
    ) => {
      const length = random() * len;
      counter.value += 1;

      const [nx, ny] = polar2cart(x, y, length, rad);

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(nx, ny);
      ctx.stroke();

      const rad1 = rad + random() * r15;
      const rad2 = rad - random() * r15;

      // 出界检查
      if (
        nx < -100 ||
        nx > width + 100 ||
        ny < -100 ||
        ny > height + 100
      ) {
        return;
      }

      const rate = counter.value <= MIN_BRANCH ? 0.8 : 0.5;

      // 递归分叉
      if (random() < rate) {
        steps.push(() => step(nx, ny, rad1, counter));
      }
      if (random() < rate) {
        steps.push(() => step(nx, ny, rad2, counter));
      }
    };

    let lastTime = performance.now();
    const interval = 1000 / 40; // 40 FPS

    const frame = () => {
      if (performance.now() - lastTime < interval) {
        animationFrameId = requestAnimationFrame(frame);
        return;
      }

      prevSteps = steps;
      steps = [];
      lastTime = performance.now();

      if (!prevSteps.length) return;

      // 执行当前批次步长
      prevSteps.forEach((i) => {
        if (random() < 0.5) steps.push(i);
        else i();
      });

      animationFrameId = requestAnimationFrame(frame);
    };

    function start() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 1;
      ctx.strokeStyle = color;
      prevSteps = [];
      steps = [];

      // 从屏幕两侧和底部随机长出 2 ~ 3 簇梅花枝桠
      if (random() < 0.5) {
        steps.push(() => step(random() * width, -5, r90));
      }
      if (random() < 0.5) {
        steps.push(() => step(random() * width, height + 5, -r90));
      }
      if (random() < 0.5) {
        steps.push(() => step(-5, random() * height, 0));
      }
      if (random() < 0.5) {
        steps.push(() => step(width + 5, random() * height, r180));
      }

      // 如果碰巧全部为 false，兜底至少从左下角和右下角各生成一簇
      if (steps.length === 0) {
        steps.push(() => step(0, height * 0.8, -r15));
        steps.push(() => step(width, height * 0.8, r180 + r15));
      }

      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(frame);
    }

    initCanvas();
    start();

    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        initCanvas();
        start();
      }, 200);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
      style={{
        maskImage:
          "radial-gradient(circle at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 100%)",
        WebkitMaskImage:
          "radial-gradient(circle at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 100%)",
      }}
    >
      <canvas
        id="artplum-canvas"
        ref={canvasRef}
        className="h-full w-full opacity-15 sm:opacity-35 dark:opacity-60"
      />
    </div>
  );
}
