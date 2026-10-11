"use client";

import { useEffect, useRef } from "react";

interface RainDrop {
  x: number;
  y: number;
  speed: number;
  length: number;
  width: number;
  alpha: number;
}

interface SplashParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  decay: number;
  floorY: number;
}

interface SplashRipple {
  x: number;
  y: number;
  rx: number;
  maxRx: number;
  ry: number;
  alpha: number;
  decay: number;
}

export function NightSkyCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const drops: RainDrop[] = [];
    const particles: SplashParticle[] = [];
    const ripples: SplashRipple[] = [];
    let animationFrame = 0;
    let isRunning = false;

    const resizeCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      if (!isRunning) {
        context.clearRect(0, 0, width, height);
      }
    };

    const createSplash = (x: number, y: number) => {
      // 1. 水平接触水圈/碰撞涟漪（在方框顶边缘横向展开并消散）
      ripples.push({
        x,
        y,
        rx: 1.5,
        maxRx: 4.5 + Math.random() * 4,
        ry: 0.8,
        alpha: 0.85,
        decay: 0.065,
      });

      // 2. 向上飞溅的微型水珠（受重力反弹抛物线后落回消失，绝不下渗）
      const count = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: x + (Math.random() - 0.5) * 3,
          y: y - 0.5,
          vx: (Math.random() - 0.5) * 3.2,
          vy: -(1.4 + Math.random() * 2.2),
          size: 0.8 + Math.random() * 0.6,
          alpha: 0.9,
          decay: 0.045 + Math.random() * 0.02,
          floorY: y,
        });
      }
    };

    const animate = () => {
      if (!isRunning) return;

      const width = window.innerWidth;
      const height = window.innerHeight;
      const targetEl =
        document.querySelector("[data-home-main-panel]") ||
        document.querySelector(".night-sky-target");
      const targetRect = targetEl?.getBoundingClientRect();

      context.clearRect(0, 0, width, height);

      // 动态生成雨滴：适配宽度，营造宁静舒缓的夜雨感
      const spawnChance = Math.min(0.85, 0.45 + width / 3500);
      if (Math.random() < spawnChance) {
        drops.push({
          x: Math.random() * width,
          y: -25,
          speed: 5.5 + Math.random() * 3,
          length: 16 + Math.random() * 8,
          width: 1.1 + Math.random() * 0.7,
          alpha: 0.45 + Math.random() * 0.35,
        });
      }

      // 1. 更新并绘制雨滴
      for (let i = drops.length - 1; i >= 0; i -= 1) {
        const drop = drops[i];
        drop.y += drop.speed;

        const tipY = drop.y + drop.length;
        const isOverTarget =
          targetRect !== undefined &&
          drop.x >= targetRect.left &&
          drop.x <= targetRect.right;
        const surfaceY = isOverTarget ? targetRect.top : height;

        // 碰撞判断：雨滴尖端触碰顶边，立刻在接触点爆发水花，且当帧移除，严禁渗入方框内部！
        if (tipY >= surfaceY) {
          if (isOverTarget) {
            createSplash(drop.x, surfaceY);
          } else if (tipY >= height && Math.random() < 0.25) {
            createSplash(drop.x, height);
          }
          drops.splice(i, 1);
          continue;
        }

        // 仅在接触面上方渲染（数学级保证 drop.y < tipY < surfaceY，绝不穿透）
        context.beginPath();
        const gradient = context.createLinearGradient(drop.x, drop.y, drop.x, tipY);
        if (isDarkTheme) {
          gradient.addColorStop(0, `rgba(160, 190, 230, ${drop.alpha * 0.15})`);
          gradient.addColorStop(0.7, `rgba(185, 215, 250, ${drop.alpha * 0.6})`);
          gradient.addColorStop(1, `rgba(225, 240, 255, ${drop.alpha})`);
        } else {
          gradient.addColorStop(0, `rgba(9, 105, 218, ${drop.alpha * 0.06})`);
          gradient.addColorStop(0.7, `rgba(9, 105, 218, ${drop.alpha * 0.35})`);
          gradient.addColorStop(1, `rgba(9, 105, 218, ${drop.alpha * 0.65})`);
        }
        context.strokeStyle = gradient;
        context.lineWidth = drop.width;
        context.moveTo(drop.x, drop.y);
        context.lineTo(drop.x, tipY);
        context.stroke();
      }

      // 2. 更新并绘制接触水圈/微涟漪
      for (let i = ripples.length - 1; i >= 0; i -= 1) {
        const r = ripples[i];
        r.rx += (r.maxRx - r.rx) * 0.28;
        r.ry = Math.max(0.7, r.rx * 0.32);
        r.alpha -= r.decay;

        if (r.alpha <= 0) {
          ripples.splice(i, 1);
          continue;
        }

        context.beginPath();
        context.ellipse(r.x, r.y, r.rx, r.ry, 0, 0, Math.PI * 2);
        context.strokeStyle = isDarkTheme
          ? `rgba(225, 240, 255, ${Math.max(0, r.alpha)})`
          : `rgba(9, 105, 218, ${Math.max(0, r.alpha * 0.55)})`;
        context.lineWidth = 1.1;
        context.stroke();
      }

      // 3. 更新并绘制飞溅微水珠
      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22; // 重力加速度
        p.alpha -= p.decay;

        // 水珠落回方框顶边或完全透明时销毁，绝不掉进方框内部
        if (p.alpha <= 0 || (p.y >= p.floorY && p.vy > 0)) {
          particles.splice(i, 1);
          continue;
        }

        context.beginPath();
        context.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        context.fillStyle = isDarkTheme
          ? `rgba(220, 240, 255, ${Math.max(0, p.alpha)})`
          : `rgba(9, 105, 218, ${Math.max(0, p.alpha * 0.65)})`;
        context.fill();
      }

      animationFrame = window.requestAnimationFrame(animate);
    };

    const stopAnimation = () => {
      isRunning = false;
      window.cancelAnimationFrame(animationFrame);
      drops.length = 0;
      ripples.length = 0;
      particles.length = 0;
    };

    let isDarkTheme = true;

    const syncAnimation = () => {
      isDarkTheme = document.documentElement.classList.contains("dark");
      resizeCanvas();
      if (!reducedMotion.matches && !isRunning) {
        isRunning = true;
        animationFrame = window.requestAnimationFrame(animate);
      } else if (reducedMotion.matches) {
        stopAnimation();
      }
    };

    const themeObserver = new MutationObserver(syncAnimation);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    const handleResize = () => {
      resizeCanvas();
    };
    window.addEventListener("resize", handleResize);
    reducedMotion.addEventListener("change", syncAnimation);
    syncAnimation();

    return () => {
      stopAnimation();
      themeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
      reducedMotion.removeEventListener("change", syncAnimation);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="night-sky-canvas pointer-events-none fixed inset-0 z-[15]"
    />
  );
}
