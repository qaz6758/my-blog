"use client";

import React, { memo } from "react";

interface SignatureLogoProps {
  className?: string;
}

/*
 * ============================================================
 * SignatureLogo: "VinceOu"
 *
 * 核心动效与视觉规范：
 * 1. 【原图精准提纯】：完美保留书法飞白笔触，剥离一切杂质（头盔底图与副标题）；
 * 2. 【毛笔书写式平滑展开 & 完整呈现】：
 *    - 运笔过程：自左端落笔，带有 25° 自然前倾角与软毛羽化过渡区，如狼毫在宣纸上自左向右流水写就；
 *    - 入场结束：书写完成后遮罩全面覆盖整个画布范围，整幅完整的 "VinceOu" 飞白字印毫无截断地完整、清晰常驻呈现；
 * 3. 【日夜双模】：基于 currentColor 原生驱动，日间呈现浓墨深色，夜间呈现清冽白墨。
 * ============================================================
 */

function SignatureLogoComponent({
  className = "h-9 w-auto text-neutral-900 dark:text-neutral-100 sm:h-[42px]",
}: SignatureLogoProps) {
  return (
    <div
      className="inline-flex items-center select-none"
      title="Vince Ou"
    >
      <svg
        viewBox="0 0 402 229"
        className={className}
        fill="currentColor"
        aria-label="Vince Ou"
        role="img"
        shapeRendering="geometricPrecision"
      >
        <defs>
          {/* 1. 原图书法高精字形蒙版 (保留全部干笔飞白毛刷细节) */}
          <mask
            id="vince-ou-brush-mask"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="402"
            height="229"
          >
            <image
              href="/signature-logo.png"
              width="402"
              height="229"
              preserveAspectRatio="xMidYMid meet"
            />
          </mask>

          {/* 2. 毛笔书写羽化渐变前锋 */}
          <linearGradient id="brush-leading-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="35%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="65%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="85%" stopColor="#ffffff" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* 
            3. 毛笔书写行笔遮罩：
            - 左侧：无限延展的纯白矩形（已书写区域永久 100% 保留，绝不消失）
            - 右侧：25° 倾斜的羽化前锋（模拟正在落墨运笔的柔软毛刷尖端）
            - 终点：完全越过画布右侧，使得整幅 Logo 100% 完整永久呈现
          */}
          <mask
            id="brush-writing-reveal-mask"
            maskUnits="userSpaceOnUse"
            x="-800"
            y="0"
            width="1600"
            height="229"
          >
            <g className="brush-stroke-motion">
              {/* 已经写过的地方：保持 100% 白色（完全可见） */}
              <rect x="-800" y="0" width="800" height="229" fill="#ffffff" />
              {/* 前端运笔笔锋：倾斜与自然墨晕过渡 */}
              <polygon
                points="0,0 100,0 40,229 -60,229"
                fill="url(#brush-leading-gradient)"
              />
            </g>
          </mask>
        </defs>

        <style>
          {`
            /* 
              毛笔运笔舒展动画：
              - 起点 (-120px)：笔尖在画面左外侧待命，画布全空；
              - 运笔过程 (0 -> 1.15s)：从左至右行云流水写出 Vince 与 Ou；
              - 终点 (+520px)：笔锋完成收笔，整个Logo全部落在已写区域内，完整、清晰、恒久呈现。
            */
            .brush-stroke-motion {
              transform: translateX(-120px);
              animation: brushWriteMove 1.15s cubic-bezier(0.2, 0.8, 0.25, 1) forwards;
            }

            @keyframes brushWriteMove {
              0% {
                transform: translateX(-120px);
              }
              100% {
                transform: translateX(520px);
              }
            }

            @media (prefers-reduced-motion: reduce) {
              .brush-stroke-motion {
                animation: none !important;
                transform: translateX(520px) !important;
              }
            }
          `}
        </style>

        {/* 核心字印层：套用毛笔书写遮罩与书法字形遮罩 */}
        <g mask="url(#brush-writing-reveal-mask)">
          <rect
            x="0"
            y="0"
            width="402"
            height="229"
            fill="currentColor"
            mask="url(#vince-ou-brush-mask)"
          />
        </g>
      </svg>
    </div>
  );
}

export const SignatureLogo = memo(SignatureLogoComponent);