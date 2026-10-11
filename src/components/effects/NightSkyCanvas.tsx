"use client";

import { useEffect, useRef } from "react";

interface RainDrop {
  x: number;
  y: number;
  speed: number;
  length: number;
  width: number;
  bounced: boolean;
}

interface SplashParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
}

export function NightSkyCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const drops: RainDrop[] = [];
    const splashes: SplashParticle[][] = [];
    let animationFrame = 0;
    let isRunning = false;

    const resizeCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
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
      const count = 3 + Math.floor(Math.random() * 3);
      const particles = Array.from({ length: count }, () => {
        const angle = Math.PI / 4 + Math.random() * (Math.PI / 2);
        const speed = 1 + Math.random() * 2;
        return {
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: -Math.sin(angle) * speed,
          alpha: 1,
        };
      });
      splashes.push(particles);
    };

    const animate = () => {
      if (!isRunning) return;

      const width = window.innerWidth;
      const height = window.innerHeight;
      const contentRect = document
        .querySelector(".night-sky-target")
        ?.getBoundingClientRect();
      const contentTop = contentRect?.top ?? height;

      context.clearRect(0, 0, width, height);

      if (Math.random() < 0.5) {
        drops.push({
          x: Math.random() * width,
          y: -20,
          speed: 4 + Math.random() * 2,
          length: 15 + Math.random() * 5,
          width: 1 + Math.random(),
          bounced: false,
        });
      }

      for (let i = drops.length - 1; i >= 0; i -= 1) {
        const drop = drops[i];
        drop.y += drop.speed;

        const hitsContent =
          contentRect !== undefined &&
          drop.x >= contentRect.left &&
          drop.x <= contentRect.right;

        if (hitsContent && !drop.bounced && drop.y > contentTop) {
          drop.bounced = true;
          drop.speed *= -0.3;
          createSplash(drop.x, drop.y);
        } else if (!hitsContent && drop.y > height) {
          drops.splice(i, 1);
          continue;
        } else if (drop.bounced) {
          drop.speed += 0.8;
          if (Math.abs(drop.speed) < 0.5) {
            drops.splice(i, 1);
            continue;
          }
        }

        context.beginPath();
        context.strokeStyle = "rgba(174, 194, 224, 0.5)";
        context.lineWidth = drop.width;
        context.moveTo(drop.x, drop.y);
        context.lineTo(drop.x, drop.y + drop.length);
        context.stroke();
      }

      for (let i = splashes.length - 1; i >= 0; i -= 1) {
        const particles = splashes[i];
        for (const particle of particles) {
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.vy += 0.1;
          particle.alpha -= 0.03;

          context.beginPath();
          context.strokeStyle = `rgba(174, 194, 224, ${Math.max(0, particle.alpha)})`;
          context.lineWidth = 1;
          context.moveTo(particle.x, particle.y);
          context.lineTo(particle.x + particle.vx, particle.y + particle.vy);
          context.stroke();
        }

        if (!particles.some((particle) => particle.alpha > 0)) {
          splashes.splice(i, 1);
        }
      }

      animationFrame = window.requestAnimationFrame(animate);
    };

    const stopAnimation = () => {
      isRunning = false;
      window.cancelAnimationFrame(animationFrame);
      drops.length = 0;
      splashes.length = 0;
    };

    const syncAnimation = () => {
      const isDark = document.documentElement.classList.contains("dark");
      if (!isDark) {
        stopAnimation();
        context.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

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
      className="night-sky-canvas pointer-events-none fixed inset-0 z-[1]"
    />
  );
}
