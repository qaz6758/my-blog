// src/components/effects/SeasonalBackground.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { useSeasonalEffect } from "@/hooks/useSeasonalEffect";

// ==========================================
// 1. 枫叶与秋日精灵图 (秋)
// ==========================================
function drawJapaneseMaplePath(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.moveTo(0, 16);
  ctx.bezierCurveTo(-3, 14, -6, 13, -9, 14);
  ctx.bezierCurveTo(-11, 15, -12, 18, -14, 17);
  ctx.bezierCurveTo(-16, 16, -14, 13, -16, 11);
  ctx.bezierCurveTo(-19, 9, -24, 10, -25, 8);
  ctx.bezierCurveTo(-26, 6, -22, 5, -23, 3);
  ctx.bezierCurveTo(-25, 1, -29, 1, -28, -1);
  ctx.bezierCurveTo(-27, -3, -23, -2, -22, -4);
  ctx.bezierCurveTo(-21, -6, -23, -10, -20, -11);
  ctx.bezierCurveTo(-17, -12, -15, -8, -12, -10);
  ctx.bezierCurveTo(-10, -13, -10, -18, -7, -19);
  ctx.bezierCurveTo(-4, -20, -5, -14, -2, -15);
  ctx.bezierCurveTo(0, -17, 0, -26, 1.5, -26);
  ctx.bezierCurveTo(3, -26, 3, -17, 5, -15);
  ctx.bezierCurveTo(8, -14, 7, -20, 10, -19);
  ctx.bezierCurveTo(13, -18, 13, -13, 15, -10);
  ctx.bezierCurveTo(18, -8, 20, -12, 23, -11);
  ctx.bezierCurveTo(26, -10, 24, -6, 25, -4);
  ctx.bezierCurveTo(26, -2, 30, -3, 31, -1);
  ctx.bezierCurveTo(32, 1, 28, 1, 26, 3);
  ctx.bezierCurveTo(25, 5, 29, 6, 28, 8);
  ctx.bezierCurveTo(27, 10, 22, 9, 19, 11);
  ctx.bezierCurveTo(17, 13, 19, 16, 17, 17);
  ctx.bezierCurveTo(15, 18, 14, 15, 12, 14);
  ctx.bezierCurveTo(9, 13, 6, 14, 0, 16);
  ctx.closePath();
}

function drawMapleVeins(ctx: CanvasRenderingContext2D, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.75;
  ctx.beginPath();
  ctx.moveTo(0, 16);
  ctx.lineTo(1.5, -23);
  ctx.moveTo(0, 16);
  ctx.lineTo(-7, -17);
  ctx.moveTo(-2, 5);
  ctx.lineTo(-12, -9);
  ctx.moveTo(-4, 9);
  ctx.lineTo(-19, 7);
  ctx.moveTo(-6, 13);
  ctx.lineTo(-14, 15);
  ctx.moveTo(0, 16);
  ctx.lineTo(10, -17);
  ctx.moveTo(2, 5);
  ctx.lineTo(15, -9);
  ctx.moveTo(4, 9);
  ctx.lineTo(22, 7);
  ctx.moveTo(6, 13);
  ctx.lineTo(15, 15);
  ctx.stroke();
}

function createMapleSprites(): HTMLCanvasElement[] {
  if (typeof document === "undefined") return [];
  const sprites: HTMLCanvasElement[] = [];

  // Sprite 0: 绯红日本红枫 (Scarlet Red Maple)
  {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.translate(32, 28);
      ctx.beginPath();
      ctx.moveTo(0, 16);
      ctx.quadraticCurveTo(-1.5, 23, 0, 31);
      ctx.strokeStyle = "#801d12";
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";
      ctx.stroke();

      drawJapaneseMaplePath(ctx);
      const grad = ctx.createRadialGradient(0, 0, 3, 0, -5, 26);
      grad.addColorStop(0, "#d93829");
      grad.addColorStop(0.7, "#a82417");
      grad.addColorStop(1, "#70160c");
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = "rgba(112, 22, 12, 0.6)";
      ctx.lineWidth = 0.8;
      ctx.stroke();
      drawMapleVeins(ctx, "#63140b");
    }
    sprites.push(canvas);
  }

  // Sprite 1: 暖秋金橙枫叶 (Golden Amber Maple)
  {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.translate(32, 28);
      ctx.beginPath();
      ctx.moveTo(0, 16);
      ctx.quadraticCurveTo(-1.5, 23, 0, 31);
      ctx.strokeStyle = "#9c4602";
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";
      ctx.stroke();

      drawJapaneseMaplePath(ctx);
      const grad = ctx.createRadialGradient(0, 0, 3, 0, -5, 26);
      grad.addColorStop(0, "#f59e0b");
      grad.addColorStop(0.6, "#d97706");
      grad.addColorStop(1, "#9a3412");
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = "rgba(154, 52, 18, 0.6)";
      ctx.lineWidth = 0.8;
      ctx.stroke();
      drawMapleVeins(ctx, "#7c2d12");
    }
    sprites.push(canvas);
  }

  // Sprite 2: 金秋银杏金扇叶 (Golden Ginkgo Fan Leaf)
  {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.translate(32, 34);
      // 纤长叶柄
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-2, 12, -1, 24);
      ctx.strokeStyle = "#a16207";
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // 银杏叶扇形轮廓 (带中央典雅缺口)
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-12, -4, -24, -14, -22, -26);
      ctx.bezierCurveTo(-14, -30, -5, -28, -1, -21);
      ctx.lineTo(0, -18);
      ctx.bezierCurveTo(4, -28, 14, -30, 22, -26);
      ctx.bezierCurveTo(24, -14, 12, -4, 0, 0);
      ctx.closePath();

      const grad = ctx.createRadialGradient(0, -16, 2, 0, -16, 25);
      grad.addColorStop(0, "#fef08a");
      grad.addColorStop(0.5, "#eab308");
      grad.addColorStop(1, "#ca8a04");
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = "rgba(161, 98, 7, 0.5)";
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // 辐射微细叶脉
      ctx.strokeStyle = "rgba(161, 98, 7, 0.35)";
      ctx.lineWidth = 0.6;
      for (let a = -0.7; a <= 0.7; a += 0.22) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.sin(a) * 23, -Math.cos(a) * 23);
        ctx.stroke();
      }
    }
    sprites.push(canvas);
  }

  // Sprite 3: 沧桑残破秋叶碎片 (Weathered Autumn Fragment) - 边缘干枯残破感
  {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.translate(32, 32);
      ctx.beginPath();
      ctx.moveTo(-16, -14);
      ctx.lineTo(-6, -18);
      ctx.lineTo(8, -14);
      ctx.lineTo(18, -4);
      ctx.lineTo(14, 8);
      ctx.lineTo(4, 18);
      ctx.lineTo(-8, 14);
      ctx.lineTo(-18, 4);
      ctx.closePath();

      const grad = ctx.createLinearGradient(-16, -16, 16, 16);
      grad.addColorStop(0, "#b45309");
      grad.addColorStop(0.5, "#78350f");
      grad.addColorStop(1, "#451a03");
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = "rgba(69, 26, 3, 0.6)";
      ctx.lineWidth = 0.8;
      ctx.stroke();

      ctx.strokeStyle = "rgba(245, 158, 11, 0.35)";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(-10, -6);
      ctx.lineTo(10, 8);
      ctx.moveTo(-4, -10);
      ctx.lineTo(6, -2);
      ctx.moveTo(0, 4);
      ctx.lineTo(-8, 10);
      ctx.stroke();
    }
    sprites.push(canvas);
  }

  // Sprite 4: 近景柔焦大红枫 (Near Bokeh Autumn Flurry)
  {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.translate(32, 32);
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 26);
      grad.addColorStop(0, "rgba(220, 38, 38, 0.9)");
      grad.addColorStop(0.35, "rgba(234, 88, 12, 0.65)");
      grad.addColorStop(0.7, "rgba(245, 158, 11, 0.25)");
      grad.addColorStop(1, "rgba(245, 158, 11, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();
    }
    sprites.push(canvas);
  }

  return sprites;
}

// ==========================================
// 2. 深夜冬雪高保真精灵图 (冬)
// ==========================================
function createSnowSprites(): HTMLCanvasElement[] {
  if (typeof document === "undefined") return [];

  const sprites: HTMLCanvasElement[] = [];

  // Sprite 0: 六角冰霜晶雪 (Hexagonal Crystal Flake)
  {
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.translate(24, 24);
      // 柔白内晕
      const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, 15);
      halo.addColorStop(0, "rgba(255,255,255,0.92)");
      halo.addColorStop(0.35, "rgba(224,242,254,0.5)");
      halo.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();

      // 六角晶枝
      ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
      ctx.lineWidth = 1.0;
      ctx.lineCap = "round";
      for (let i = 0; i < 6; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI) / 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -16);
        // 主支杈
        ctx.moveTo(0, -10);
        ctx.lineTo(-3.5, -13);
        ctx.moveTo(0, -10);
        ctx.lineTo(3.5, -13);
        // 次支杈
        ctx.moveTo(0, -5.5);
        ctx.lineTo(-2.5, -7.5);
        ctx.moveTo(0, -5.5);
        ctx.lineTo(2.5, -7.5);
        ctx.stroke();
        ctx.restore();
      }
    }
    sprites.push(canvas);
  }

  // Sprite 1: 沧桑零碎残冰片 (Fragmented Ragged Ice Clump)
  {
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.translate(24, 24);
      const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, 16);
      halo.addColorStop(0, "rgba(255,255,255,0.9)");
      halo.addColorStop(0.5, "rgba(215,235,255,0.4)");
      halo.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();

      // 不规则参差碎雪多边形
      ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(3.5, -5.5);
      ctx.lineTo(13, -8);
      ctx.lineTo(6.5, -1);
      ctx.lineTo(14, 4);
      ctx.lineTo(5.5, 5.5);
      ctx.lineTo(8, 14);
      ctx.lineTo(1, 8);
      ctx.lineTo(-5.5, 13);
      ctx.lineTo(-3.5, 4.5);
      ctx.lineTo(-13, 6.5);
      ctx.lineTo(-7.5, -2);
      ctx.lineTo(-14, -6.5);
      ctx.lineTo(-4.5, -4.5);
      ctx.closePath();
      ctx.fill();
    }
    sprites.push(canvas);
  }

  // Sprite 2: 星芒冰花 (Stellar Crystal)
  {
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.translate(24, 24);
      const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, 14);
      halo.addColorStop(0, "rgba(255,255,255,0.95)");
      halo.addColorStop(0.4, "rgba(224,242,254,0.45)");
      halo.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
      ctx.lineWidth = 1.0;
      for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI) / 4);
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(0, 14);
        ctx.moveTo(-14, 0);
        ctx.lineTo(14, 0);
        ctx.stroke();
        ctx.restore();
      }
    }
    sprites.push(canvas);
  }

  // Sprite 3: 柔焦羽雪光斑 (Near Bokeh Snow Flurry)
  {
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.translate(24, 24);
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      grad.addColorStop(0.25, "rgba(240, 248, 255, 0.75)");
      grad.addColorStop(0.65, "rgba(215, 235, 255, 0.22)");
      grad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
    }
    sprites.push(canvas);
  }

  return sprites;
}

// ==========================================
// 3. 樱花精灵图 (春)
// ==========================================
function createSakuraSprites(): HTMLCanvasElement[] {
  if (typeof document === "undefined") return [];
  const sprites: HTMLCanvasElement[] = [];

  // Sprite 0: 娇柔淡粉单瓣
  {
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.translate(24, 24);
      ctx.beginPath();
      ctx.moveTo(0, 12);
      ctx.bezierCurveTo(-10, 6, -10, -8, -4, -14);
      ctx.bezierCurveTo(-1, -11, 1, -11, 4, -14);
      ctx.bezierCurveTo(10, -8, 10, 6, 0, 12);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, 12, 0, -14);
      grad.addColorStop(0, "#ffccd5");
      grad.addColorStop(0.5, "#ffb7c5");
      grad.addColorStop(1, "#ff94a4");
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 148, 164, 0.45)";
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
    sprites.push(canvas);
  }

  // Sprite 1: 优雅微卷深粉樱瓣
  {
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.translate(24, 24);
      ctx.beginPath();
      ctx.moveTo(0, 11);
      ctx.bezierCurveTo(-8, 7, -11, -5, -3, -13);
      ctx.bezierCurveTo(0, -9, 2, -9, 5, -12);
      ctx.bezierCurveTo(8, -5, 6, 6, 0, 11);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, 11, 0, -13);
      grad.addColorStop(0, "#ffa3b1");
      grad.addColorStop(1, "#f43f5e");
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = "rgba(244, 63, 94, 0.4)";
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
    sprites.push(canvas);
  }

  // Sprite 2: 典雅五瓣落樱小花
  {
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.translate(24, 24);
      for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI * 2) / 5);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-5, -6, -4, -13, -1.5, -15);
        ctx.lineTo(0, -13.5);
        ctx.lineTo(1.5, -15);
        ctx.bezierCurveTo(4, -13, 5, -6, 0, 0);
        ctx.closePath();
        const grad = ctx.createRadialGradient(0, 0, 1, 0, -8, 12);
        grad.addColorStop(0, "#ffe4e6");
        grad.addColorStop(0.6, "#fbcfe8");
        grad.addColorStop(1, "#f472b6");
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      }
      // 花蕊
      ctx.beginPath();
      ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = "#f43f5e";
      ctx.fill();
    }
    sprites.push(canvas);
  }

  // Sprite 3: 沧桑零碎落英残瓣
  {
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.translate(24, 24);
      ctx.beginPath();
      ctx.moveTo(-6, -7);
      ctx.lineTo(5, -9);
      ctx.lineTo(8, 2);
      ctx.lineTo(1, 8);
      ctx.lineTo(-7, 3);
      ctx.closePath();
      const grad = ctx.createLinearGradient(-6, -7, 8, 8);
      grad.addColorStop(0, "#fbcfe8");
      grad.addColorStop(1, "#f472b6");
      ctx.fillStyle = grad;
      ctx.fill();
    }
    sprites.push(canvas);
  }

  // Sprite 4: 近景柔焦落英光斑
  {
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.translate(24, 24);
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
      grad.addColorStop(0, "rgba(251, 207, 232, 0.95)");
      grad.addColorStop(0.35, "rgba(244, 114, 182, 0.6)");
      grad.addColorStop(0.7, "rgba(251, 207, 232, 0.2)");
      grad.addColorStop(1, "rgba(251, 207, 232, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
    }
    sprites.push(canvas);
  }

  return sprites;
}

// ==========================================
// 4. 夏夜流萤精灵图 (夏)
// ==========================================
function createSummerSprites(): HTMLCanvasElement[] {
  if (typeof document === "undefined") return [];
  const sprites: HTMLCanvasElement[] = [];

  // Sprite 0: 翠青夜萤 (Emerald Firefly)
  {
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.translate(24, 24);
      const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
      halo.addColorStop(0, "rgba(255, 255, 255, 1.0)");
      halo.addColorStop(0.18, "rgba(168, 255, 120, 0.95)");
      halo.addColorStop(0.48, "rgba(120, 255, 214, 0.45)");
      halo.addColorStop(0.82, "rgba(52, 211, 153, 0.12)");
      halo.addColorStop(1, "rgba(168, 255, 120, 0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
    }
    sprites.push(canvas);
  }

  // Sprite 1: 暖金夏萤 (Golden Firefly)
  {
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.translate(24, 24);
      const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
      halo.addColorStop(0, "rgba(255, 255, 255, 1.0)");
      halo.addColorStop(0.18, "rgba(253, 224, 71, 0.95)");
      halo.addColorStop(0.48, "rgba(245, 158, 11, 0.42)");
      halo.addColorStop(0.82, "rgba(217, 119, 6, 0.12)");
      halo.addColorStop(1, "rgba(245, 158, 11, 0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
    }
    sprites.push(canvas);
  }

  // Sprite 2: 苍蓝冷萤 (Cyan Firefly)
  {
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.translate(24, 24);
      const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
      halo.addColorStop(0, "rgba(255, 255, 255, 1.0)");
      halo.addColorStop(0.18, "rgba(103, 232, 249, 0.95)");
      halo.addColorStop(0.48, "rgba(56, 189, 248, 0.4)");
      halo.addColorStop(0.82, "rgba(14, 165, 233, 0.12)");
      halo.addColorStop(1, "rgba(56, 189, 248, 0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
    }
    sprites.push(canvas);
  }

  // Sprite 3: 柔焦漫射流萤 (Near Bokeh Firefly Flurry)
  {
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.translate(24, 24);
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 22);
      grad.addColorStop(0, "rgba(168, 255, 120, 0.85)");
      grad.addColorStop(0.35, "rgba(120, 255, 214, 0.45)");
      grad.addColorStop(0.7, "rgba(52, 211, 153, 0.15)");
      grad.addColorStop(1, "rgba(52, 211, 153, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
    }
    sprites.push(canvas);
  }

  return sprites;
}

// ==========================================
// 4. 粒子与景深体系定义
// ==========================================
interface SeasonalParticle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  sway: number;
  swaySpeed: number;
  swayAmp: number;
  angle: number;
  rotSpeed: number;
  flip: number;
  flipSpeed: number;
  opacity: number;
  spriteIndex: number;
  layer: number; // 0: 远景(景深细粒), 1: 中景(主晶体), 2: 近景(柔焦大雪)
}

export function SeasonalBackground() {
  const { mounted, enabled, activeSeason } = useSeasonalEffect();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!mounted || !enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let time = 0;

    // 预渲染精灵
    const mapleSprites = createMapleSprites();
    const snowSprites = createSnowSprites();
    const sakuraSprites = createSakuraSprites();
    const summerSprites = createSummerSprites();

    const particles: SeasonalParticle[] = [];

    const handleResize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // 全季节统一的三层景深体系：
    // 52% 远景氛围微尘 (layer 0) - 极细微粒，轻柔点缀，人眼舒适
    // 36% 中景特色实体 (layer 1) - 图元整体小巧精美 (约10~16px)，纯正自上而下飘落，无偏向漂移
    // 12% 近景柔焦掠影 (layer 2) - 柔和微缩 (约18~26px)，低透明度轻抚镜头
    const isWinter = activeSeason === "winter";
    const isAutumn = activeSeason === "autumn";
    const isSpring = activeSeason === "spring";
    const isSummer = activeSeason === "summer";

    const particleCount = isWinter
      ? width < 768 ? 50 : 84
      : isAutumn
      ? width < 768 ? 46 : 78
      : isSpring
      ? width < 768 ? 46 : 78
      : width < 768 ? 40 : 68;

    for (let i = 0; i < particleCount; i++) {
      const randLayer = Math.random();
      const layer = randLayer < 0.52 ? 0 : randLayer < 0.88 ? 1 : 2;

      // 整体飘落范围均衡分布：按步长均匀铺开全屏宽度，消除留白感
      const uniformX = ((i + Math.random() * 0.8) / particleCount) * width;
      const initialY = Math.random() * (height + 60) - 30;

      if (layer === 0) {
        // 【Layer 0 远景】：微小星点微尘 (0.45px ~ 0.85px)，人眼极度舒适
        particles.push({
          x: uniformX,
          y: initialY,
          size: 0.45 + Math.random() * 0.40,
          speedY: 0.18 + Math.random() * 0.18, // 舒缓纯垂直沉降：约 11~22px/秒
          speedX: 0, // 自上而下，杜绝单侧留白
          sway: Math.random() * Math.PI * 2,
          swaySpeed: 0.006 + Math.random() * 0.007,
          swayAmp: 0.8,
          angle: 0,
          rotSpeed: 0,
          flip: 0,
          flipSpeed: 0,
          opacity: 0.18 + Math.random() * 0.20,
          spriteIndex: Math.floor(Math.random() * 4),
          layer: 0,
        });
      } else if (layer === 1) {
        // 【Layer 1 中景】：整体缩小至舒适尺度 (10px ~ 16px)，精巧自然，纯自上而下飘落
        const midSize = isWinter
          ? 0.13 + Math.random() * 0.07 // 约 6px ~ 10px 细碎冰晶
          : isAutumn
          ? 0.17 + Math.random() * 0.08 // 约 11px ~ 16px 枫叶与残叶
          : isSpring
          ? 0.19 + Math.random() * 0.08 // 约 9px ~ 13px 樱花单瓣
          : 0.18 + Math.random() * 0.08; // 约 8px ~ 12px 夏夜星萤

        const midSpeedY = isWinter
          ? 0.38 + Math.random() * 0.24 // 约 23~37px/秒
          : isAutumn
          ? 0.30 + Math.random() * 0.22 // 约 18~31px/秒，秋叶从容垂直下落
          : isSpring
          ? 0.26 + Math.random() * 0.20 // 约 15~28px/秒
          : 0.10 + Math.random() * 0.18; // 约 6~17px/秒，夏萤悠闲微动

        particles.push({
          x: uniformX,
          y: initialY,
          size: midSize,
          speedY: midSpeedY,
          speedX: 0, // 杜绝偏向漂移，确保左右全屏均匀无留白
          sway: Math.random() * Math.PI * 2,
          swaySpeed: 0.008 + Math.random() * 0.009,
          swayAmp: 1.2,
          angle: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.006, // 极其舒缓的微自转
          flip: Math.random() * Math.PI * 2,
          flipSpeed: 0.009 + Math.random() * 0.010, // 悠缓优雅的 3D 翻转
          opacity: 0.58 + Math.random() * 0.22,
          spriteIndex: Math.floor(Math.random() * 4),
          layer: 1,
        });
      } else {
        // 【Layer 2 近景】：柔焦光斑同样收紧尺度 (约18px ~ 26px)，低透明度防遮挡
        const nearSize = isWinter
          ? 0.24 + Math.random() * 0.10 // 约 12px ~ 16px
          : isAutumn
          ? 0.32 + Math.random() * 0.12 // 约 20px ~ 28px
          : isSpring
          ? 0.30 + Math.random() * 0.10 // 约 14px ~ 19px
          : 0.30 + Math.random() * 0.12;

        const nearSpeedY = isWinter
          ? 0.55 + Math.random() * 0.25
          : isAutumn
          ? 0.44 + Math.random() * 0.22
          : isSpring
          ? 0.40 + Math.random() * 0.20
          : 0.16 + Math.random() * 0.20;

        particles.push({
          x: uniformX,
          y: initialY,
          size: nearSize,
          speedY: nearSpeedY,
          speedX: 0, // 纯垂直沉降
          sway: Math.random() * Math.PI * 2,
          swaySpeed: 0.009 + Math.random() * 0.010,
          swayAmp: 1.6,
          angle: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.005,
          flip: Math.random() * Math.PI * 2,
          flipSpeed: 0.008 + Math.random() * 0.008,
          opacity: 0.22 + Math.random() * 0.16, // 轻薄透明
          spriteIndex: isWinter ? 3 : isSummer ? 3 : 4,
          layer: 2,
        });
      }
    }

    let isVisible = true;
    const handleVisibilityChange = () => {
      isVisible = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 主渲染循环
    const render = () => {
      if (isVisible) {
        ctx.clearRect(0, 0, width, height);
        time += 1;

        // 对称轻柔微风气流：左右均等摆动，杜绝单侧漂移导致某一侧留白
        const symmetricBreeze = Math.sin(time * 0.0012) * 0.08;

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          // 物理更新
          p.sway += p.swaySpeed;
          p.angle += p.rotSpeed;
          p.flip += p.flipSpeed;

          if (isSummer) {
            // 夏夜流萤：平缓浮沉与微动
            p.y += Math.sin(time * 0.012 + p.sway) * 0.26 + p.speedY * 0.4;
            p.x += Math.cos(time * 0.009 + p.sway) * 0.32 + symmetricBreeze;

            if (p.y > height + 30) p.y = -20;
            if (p.y < -30) p.y = height + 20;
            if (p.x > width + 30) p.x = -20;
            if (p.x < -30) p.x = width + 20;
          } else {
            // 自上而下纯正下落：垂直下降，左右均匀
            p.y += p.speedY;
            p.x += symmetricBreeze * (p.layer + 1);

            // 循环重置：到底部后重新从顶部全屏宽度[0, width]内均匀落入，消除任何局部留白
            if (p.y > height + 25) {
              p.y = -20 - Math.random() * 25;
              p.x = Math.random() * width;
              p.sway = Math.random() * Math.PI * 2;
            }

            // 左右边界平滑无缝绕回
            if (p.x > width + 25) {
              p.x = -15;
            } else if (p.x < -25) {
              p.x = width + 15;
            }
          }

          // 渲染粒子
          ctx.save();
          // 平滑柔和的横向呼吸摆动幅值 (远景2.5px, 中景5.5px, 近景9px)
          const swayOffset = Math.sin(p.sway) * (p.layer === 0 ? 2.5 : p.layer === 1 ? 5.5 : 9.0);
          const drawX = p.x + swayOffset;
          const drawY = p.y;

          if (p.layer === 0) {
            // 远景细碎微尘：极其细腻柔和的点状微光
            ctx.globalAlpha = p.opacity;
            ctx.fillStyle = isWinter
              ? "#ffffff"
              : isAutumn
              ? p.spriteIndex % 2 === 0 ? "#f59e0b" : "#ea580c"
              : isSpring
              ? p.spriteIndex % 2 === 0 ? "#ffb7c5" : "#ffffff"
              : p.spriteIndex % 2 === 0 ? "#a8ff78" : "#fde047";
            ctx.beginPath();
            ctx.arc(drawX, drawY, p.size, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // 中景实体与近景柔焦：小巧精致 3D 翻动
            ctx.translate(drawX, drawY);
            ctx.rotate(p.angle);
            ctx.scale(p.size, p.size * (0.35 + 0.65 * Math.cos(p.flip)));
            ctx.globalAlpha = p.opacity;

            let sprite: HTMLCanvasElement | undefined;
            if (isWinter) {
              sprite = snowSprites[p.spriteIndex % snowSprites.length];
              if (sprite) ctx.drawImage(sprite, -24, -24);
            } else if (isAutumn) {
              sprite = mapleSprites[p.spriteIndex % mapleSprites.length];
              if (sprite) ctx.drawImage(sprite, -32, -32);
            } else if (isSpring) {
              sprite = sakuraSprites[p.spriteIndex % sakuraSprites.length];
              if (sprite) ctx.drawImage(sprite, -24, -24);
            } else if (isSummer) {
              // 夏夜微光呼吸起伏
              const breath = 0.75 + 0.25 * Math.sin(time * 0.04 + p.sway * 2);
              ctx.globalAlpha = p.opacity * breath;
              sprite = summerSprites[p.spriteIndex % summerSprites.length];
              if (sprite) ctx.drawImage(sprite, -24, -24);
            }
          }

          ctx.restore();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [mounted, enabled, activeSeason]);

  if (!mounted || !enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-[1] select-none"
    />
  );
}
