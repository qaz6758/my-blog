"use client";

import React, { memo } from "react";

interface SignatureLogoProps {
  className?: string;
}

/*
 * ============================================================
 * SignatureLogo
 *
 * 设计原则：
 *
 * 1. Logo 本身不包含 Link
 * 2. 点击行为交给外层 Navbar / Link
 * 3. 不依赖 pathname
 * 4. 不依赖主题状态
 * 5. 不依赖 Discord / Music 状态
 * 6. 不使用 useEffect
 * 7. 不使用 state
 *
 * 这样父组件即使重新渲染，
 * Logo 也不会因为状态变化重新播放。
 * ============================================================
 */

function SignatureLogoComponent({
  className = "w-32 h-auto text-neutral-900 dark:text-neutral-100",
}: SignatureLogoProps) {
  return (
    <svg
      viewBox="0 0 240 85"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label="theyole"
      role="img"
    >
      <style>
        {`
          .signature-main {
            stroke-dasharray: 1000;
            stroke-dashoffset: 1000;
            animation:
              signature-main-write
              1.8s
              cubic-bezier(0.65, 0, 0.35, 1)
              forwards;
          }

          .signature-line {
            stroke-dasharray: 100;
            stroke-dashoffset: 100;
            animation:
              signature-line-write
              0.45s
              cubic-bezier(0.65, 0, 0.35, 1)
              1.55s
              forwards;
          }

          @keyframes signature-main-write {
            from {
              stroke-dashoffset: 1000;
            }

            to {
              stroke-dashoffset: 0;
            }
          }

          @keyframes signature-line-write {
            from {
              stroke-dashoffset: 100;
            }

            to {
              stroke-dashoffset: 0;
            }
          }

          @media (max-width: 640px), (prefers-reduced-motion: reduce) {
            .signature-main,
            .signature-line {
              animation: none !important;
              stroke-dashoffset: 0 !important;
            }
          }
        `}
      </style>

      {/* ======================================================
          主签名
         ====================================================== */}

      <path
        className="signature-main"
        d="
          M 26 48
          C 30 42 36 24 37 18
          C 37 32 36 46 38 52
          C 40 55 44 54 47 46
          C 51 34 55 16 56 14
          C 56 26 52 44 53 52
          C 55 57 60 40 68 40
          C 74 40 76 46 76 52
          C 76 55 80 53 84 46
          C 88 38 84 32 78 35
          C 72 38 75 52 83 52
          C 90 52 94 44 98 40
          C 102 46 102 52 108 52
          C 114 52 118 40 118 38
          C 118 48 114 68 110 74
          C 106 80 96 78 98 70
          C 100 62 110 52 122 46
          C 128 43 134 36 130 34
          C 124 32 120 44 126 51
          C 131 56 138 48 144 40
          C 150 30 156 14 157 12
          C 157 24 152 46 154 52
          C 156 56 160 52 166 45
          C 172 37 166 32 161 35
          C 155 39 158 52 168 52
          C 180 52 198 47 212 45
        "
      />

      {/* ======================================================
          上方划线
         ====================================================== */}

      <path
        className="signature-line"
        d="
          M 20 28
          C 32 27 44 26 50 25
        "
      />
    </svg>
  );
}

/*
 * memo：
 *
 * SignatureLogo 自己没有任何会变化的 state。
 * 当 className 没变化时，父组件普通重新渲染不会重新执行
 * Logo 组件本身。
 *
 * 更重要的是：
 * Navbar 不再给它 pathname key，
 * 因此不会因为路由变化而强制卸载 / 重新挂载。
 */

export const SignatureLogo = memo(SignatureLogoComponent);