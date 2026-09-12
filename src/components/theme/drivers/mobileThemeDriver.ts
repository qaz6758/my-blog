// src/components/theme/drivers/mobileThemeDriver.ts
/**
 * [移动端专属主题引擎]
 *
 * 针对移动端触屏、高 DPI 视口、移动端 WebView（Via / 微信 / Quark / Chrome）及 GPU 显存约束量身定制。
 *
 * 核心设计：
 * 1. 彻底规避移动端全屏快照上的 clip-path 瓦片光栅化耗尽（彻底根除“一块一块的黑块”）。
 * 2. 彻底规避全局 DOM 树 color 过渡样式重算（彻底根除“异常卡顿”与掉帧）。
 * 3. 采用 100% GPU 合成层驱动的“水墨漫染 (Ink Diffusion)”淡入淡出动效，
 *    视觉柔和、极具侘寂美感，同时保证满帧 (60fps/120fps) 丝滑切换！
 */

import { flushSync } from "react-dom";
import { ThemeDriverParams } from "../types";

export function runMobileThemeTransition({
  nextTheme,
  applyThemeDirect,
  options,
}: ThemeDriverParams): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  // 用户主动要求关闭动效，直接原子切换
  if (options?.disableAnimation) {
    applyThemeDirect(nextTheme);
    return;
  }

  const hasViewTransitions =
    "startViewTransition" in document &&
    typeof (
      document as Document & {
        startViewTransition?: unknown;
      }
    ).startViewTransition === "function" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 场景 A：移动端现代浏览器支持 View Transitions (如 Chromium 内核、Via 浏览器等)
  if (hasViewTransitions) {
    try {
      const transitionDoc = document as Document & {
        startViewTransition: (callback: () => void) => {
          ready: Promise<void>;
          finished: Promise<void>;
        };
      };

      root.classList.add("view-transition-active");

      const transition = transitionDoc.startViewTransition(() => {
        flushSync(() => {
          applyThemeDirect(nextTheme);
        });
      });

      transition.finished
        .finally(() => {
          root.classList.remove("view-transition-active");
        })
        .catch(() => {});

      transition.ready
        .then(() => {
          /*
           * 移动端黄金动效：纯 GPU 合成层透明度与微尺度缓动 (Alpha + Scale Cross-Dissolve)
           * 绝不使用 clip-path，显存开销接近 0，永不丢瓦片，绝无黑块。
           */
          const animation = document.documentElement.animate(
            {
              opacity: [0, 1],
              transform: ["scale(1.008)", "scale(1)"],
            },
            {
              duration: 260,
              easing: "cubic-bezier(0.25, 1, 0.5, 1)",
              fill: "both",
              pseudoElement: "::view-transition-new(root)",
            }
          );

          animation.finished.catch(() => {});
        })
        .catch(() => {
          applyThemeDirect(nextTheme);
        });

      return;
    } catch {
      // 出现异常时降级至场景 B
    }
  }

  // 场景 B：移动端 Safari / 旧版 WebView / 降级环境：使用高性能纯硬件加速“水墨帷幕”
  runMobileVeilTransition(nextTheme, applyThemeDirect);
}

/**
 * 移动端硬件加速水墨帷幕 (Mobile Veil)
 * 创建一个临时的全屏轻量遮罩层，在 0ms 完成底层 DOM 切换后柔和消散，
 * 达到视觉上绝对无闪烁、无对比度翻转断层的满帧丝滑效果。
 */
function runMobileVeilTransition(
  nextTheme: "light" | "dark",
  applyThemeDirect: (theme: "light" | "dark") => void
): void {
  const veil = document.createElement("div");
  const targetBg = nextTheme === "dark" ? "#111213" : "#ede7dc";

  veil.style.position = "fixed";
  veil.style.inset = "0";
  veil.style.zIndex = "999999";
  veil.style.pointerEvents = "none";
  veil.style.backgroundColor = targetBg;
  veil.style.opacity = "0.75";
  veil.style.transition = "opacity 240ms cubic-bezier(0.25, 1, 0.5, 1)";
  veil.style.willChange = "opacity";

  document.body.appendChild(veil);

  // 底层 DOM 瞬时翻转，文本与背景对比度保持 100% 恒定
  applyThemeDirect(nextTheme);

  // 触发硬件加速淡出消散
  requestAnimationFrame(() => {
    veil.style.opacity = "0";

    const cleanUp = () => {
      veil.removeEventListener("transitionend", cleanUp);
      if (veil.parentNode) {
        veil.parentNode.removeChild(veil);
      }
    };

    veil.addEventListener("transitionend", cleanUp);
    // 兜底超时移除
    setTimeout(cleanUp, 300);
  });
}
