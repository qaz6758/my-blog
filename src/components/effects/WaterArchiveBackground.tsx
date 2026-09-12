// src/components/effects/WaterArchiveBackground.tsx
"use client";

import React from "react";

export function WaterArchiveBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none dark:block hidden"
      aria-hidden="true"
    >
      {/* 1. 中心柔和水晕漫射光 (Soft Caustic Water Diffusion) */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 55% at 50% 25%, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.012) 50%, transparent 80%),
            radial-gradient(circle 600px at 80% 70%, rgba(255, 255, 255, 0.018) 0%, transparent 70%),
            radial-gradient(circle 500px at 20% 80%, rgba(255, 255, 255, 0.012) 0%, transparent 60%),
            #111213
          `,
        }}
      />

      {/* 2. 幽微水波等高线层：极其低调、边缘柔焦羽化，如同水底暗涌 */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.028] blur-[1px]"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="waterMaskGrad" cx="50%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <mask id="waterSoftMask">
            <rect width="100%" height="100%" fill="url(#waterMaskGrad)" />
          </mask>
        </defs>

        <g mask="url(#waterSoftMask)" stroke="#ffffff" fill="none" strokeWidth="0.8">
          {/* 左侧水波同心涌动 */}
          <path d="M-150,750 C120,700 280,550 360,320 C420,150 380,-50 360,-150" opacity="0.4" />
          <path d="M-130,780 C150,730 320,580 400,340 C460,160 420,-40 400,-140" opacity="0.5" />
          <path d="M-110,810 C180,760 360,610 440,360 C500,170 460,-30 440,-130" opacity="0.6" />
          <path d="M-90,840 C210,790 400,640 480,380 C540,180 500,-20 480,-120" opacity="0.7" />
          <path d="M-70,870 C240,820 440,670 520,400 C580,190 540,-10 520,-110" opacity="0.6" />
          <path d="M-50,900 C270,850 480,700 560,420 C620,200 580,0 560,-100" opacity="0.5" />

          {/* 右侧波光 */}
          <path d="M820,-100 C800,150 940,380 1150,540 C1300,650 1550,720 1650,750" opacity="0.4" />
          <path d="M860,-90 C840,170 980,410 1190,570 C1340,680 1580,750 1680,780" opacity="0.5" />
          <path d="M900,-80 C880,190 1020,440 1230,600 C1380,710 1610,780 1710,810" opacity="0.6" />
          <path d="M940,-70 C920,210 1060,470 1270,630 C1420,740 1640,810 1740,840" opacity="0.7" />
          <path d="M980,-60 C960,230 1100,500 1310,660 C1460,770 1670,840 1770,870" opacity="0.6" />

          {/* 中心幽微水面大波纹 */}
          <ellipse cx="680" cy="380" rx="380" ry="220" opacity="0.35" strokeDasharray="4,8" />
          <ellipse cx="690" cy="370" rx="460" ry="270" opacity="0.25" />
        </g>
      </svg>

      {/* 3. 极细微粒噪点 */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 12% 18%, #ffffff 1px, transparent 1px),
            radial-gradient(circle at 82% 38%, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: "180px 180px, 240px 240px",
        }}
      />
    </div>
  );
}
