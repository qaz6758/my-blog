// src/components/theme/drivers/themeTransitionDriver.ts
/**
 * [Paul Stamatiou (paulstamatiou.com) 同款羽化涟漪主题过渡引擎]
 *
 * 核心设计原则：
 * 1. 全端统一：手机端与 PC 桌面端 100% 保持一致，坚决不降级。
 * 2. 5px 高斯模糊羽化：基于矢量 SVG feGaussianBlur 滤镜，形成具有温润物理质感的有机光环扩展。
 * 3. 稳健防崩：支持原生 View Transitions API。在不支持的旧浏览器中无缝原子切换，零卡顿、零残留。
 */

import { ThemeDriverParams } from "../types";

type ViewTransition = {
  ready: Promise<void>;
  finished: Promise<void>;
};

type ViewTransitionDocument = Document & {
  startViewTransition: (callback: () => void) => ViewTransition;
};

function supportsViewTransitions(
  doc: Document
): doc is ViewTransitionDocument {
  return typeof Reflect.get(doc, "startViewTransition") === "function";
}

export function runThemeTransition(params: ThemeDriverParams): void {
  if (typeof document === "undefined") return;

  const { nextTheme, applyThemeDirect, event, options, onComplete } = params;

  // 用户主动关闭动效 / 系统 prefers-reduced-motion，直接原子切换
  if (
    options?.disableAnimation ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    applyThemeDirect(nextTheme);
    onComplete?.();
    return;
  }

  // 若浏览器不支持 View Transitions，原子切换并安全回调
  if (!supportsViewTransitions(document)) {
    applyThemeDirect(nextTheme);
    onComplete?.();
    return;
  }

  try {
    // 1. 精确解析动画扩散圆心坐标 (按钮中心、触控点或鼠标点击处)
    let x = options?.origin?.x;
    let y = options?.origin?.y;

    if (
      typeof x !== "number" ||
      typeof y !== "number" ||
      (x === 0 && y === 0)
    ) {
      const target =
        event?.currentTarget ||
        (event?.target instanceof Element
          ? event.target.closest("button")
          : null);
      if (target instanceof HTMLElement) {
        const rect = target.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          x = rect.left + rect.width / 2;
          y = rect.top + rect.height / 2;
        }
      } else if (event?.nativeEvent) {
        const { clientX, clientY } = event.nativeEvent;
        if (clientX > 0 || clientY > 0) {
          x = clientX;
          y = clientY;
        }
      }
    }

    // 兜底定位：若无有效坐标，定位至导航栏右上角切换按钮常规区
    if (
      typeof x !== "number" ||
      typeof y !== "number" ||
      (x === 0 && y === 0)
    ) {
      x = window.innerWidth - 44;
      y = 36;
    }

    x = Math.max(0, Math.min(window.innerWidth, x));
    y = Math.max(0, Math.min(window.innerHeight, y));

    // 2. 计算视口尺寸与遮罩最终跨度（Paul Stamatiou 官方算法：s = max(vw, vh)，finalMaskSize = s * 10）
    // 确保羽化边缘在动画中后段（~80%）就已经完全平滑越过屏幕所有边角，最后 20% 处于 100% 实心内部，彻底消灭触边卡顿与瞬断
    const s = Math.max(window.innerWidth, window.innerHeight);
    const maxDistToCorner = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
    const finalMaskSize = Math.max(s * 10, Math.ceil(maxDistToCorner * 8.5));

    // 3. Paul Stamatiou 5px 高斯模糊矢量 Mask Data URI
    const blurredMaskUrl = `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="-66 -66 132 132"><defs><filter id="blur"><feGaussianBlur stdDeviation="5"/></filter></defs><circle cx="0" cy="0" r="33" fill="black" filter="url(%23blur)"/></svg>')`;

    // 4. 动态注入专属 View Transition 关键帧与羽化遮罩样式表
    const styleId = "theme-transition-styles";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = `
      ::view-transition-group(root) {
        animation-duration: 800ms;
        animation-timing-function: linear(
          0 0%, 0.2342 12.49%, 0.4374 24.99%,
          0.6093 37.49%, 0.6835 43.74%,
          0.7499 49.99%, 0.8086 56.25%,
          0.8593 62.5%, 0.9023 68.75%, 0.9375 75%,
          0.9648 81.25%, 0.9844 87.5%,
          0.9961 93.75%, 1 100%
        );
      }

      ::view-transition-new(root) {
        animation: themeReveal 800ms ease-in-out forwards;
        transform-origin: ${x}px ${y}px;
        -webkit-mask: ${blurredMaskUrl} 0 0 / 100% 100% no-repeat;
        mask: ${blurredMaskUrl} 0 0 / 100% 100% no-repeat;
        -webkit-mask-position: ${x}px ${y}px;
        mask-position: ${x}px ${y}px;
      }

      ::view-transition-old(root) {
        animation: none;
        z-index: -1;
      }

      @keyframes themeReveal {
        0% {
          -webkit-mask-position: ${x}px ${y}px;
          mask-position: ${x}px ${y}px;
          -webkit-mask-size: 0px 0px;
          mask-size: 0px 0px;
        }
        100% {
          -webkit-mask-position: ${x - finalMaskSize / 2}px ${y - finalMaskSize / 2}px;
          mask-position: ${x - finalMaskSize / 2}px ${y - finalMaskSize / 2}px;
          -webkit-mask-size: ${finalMaskSize}px ${finalMaskSize}px;
          mask-size: ${finalMaskSize}px ${finalMaskSize}px;
        }
      }
    `;

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      const el = document.getElementById(styleId);
      if (el) {
        el.remove();
      }
      onComplete?.();
    };

    // 1000ms 强制超时看门狗，确保无论动画完成或被系统打断都绝不残留样式
    const watchdog = setTimeout(cleanup, 1000);

    const transition = document.startViewTransition(() => {
      applyThemeDirect(nextTheme);
    });

    transition.finished
      .then(() => {
        clearTimeout(watchdog);
        // 双重 rAF：确保浏览器彻底提交真实 DOM 并完成伪元素离屏渲染，无感平滑移除临时样式
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            cleanup();
          });
        });
      })
      .catch(() => {
        clearTimeout(watchdog);
        cleanup();
      });
  } catch {
    applyThemeDirect(nextTheme);
    onComplete?.();
  }
}
