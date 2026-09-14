// src/components/theme/drivers/desktopThemeDriver.ts
/**
 * [PC 桌面端专属主题引擎]
 *
 * 充分利用桌面端高性能 GPU 算力、独立显卡与精确鼠标指针，
 * 驱动以点击按钮为圆心的“日光波纹扩散” View Transitions 动效。
 */

import { ThemeDriverParams } from "../types";

export function runDesktopThemeTransition({
  nextTheme,
  applyThemeDirect,
  event,
  options,
  onComplete,
}: ThemeDriverParams): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  const hasViewTransitions =
    "startViewTransition" in document &&
    typeof (
      document as Document & {
        startViewTransition?: unknown;
      }
    ).startViewTransition === "function" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 用户主动要求关闭动画，或浏览器不支持 View Transition，直接原子切换
  if (options?.disableAnimation || !hasViewTransitions) {
    applyThemeDirect(nextTheme);
    onComplete?.();
    return;
  }

  // 1. 计算动画圆心 (优先使用外部传入的精确物理坐标，或以按钮中心为准)
  let x = options?.origin?.x;
  let y = options?.origin?.y;

  if (typeof x !== "number" || typeof y !== "number" || (x === 0 && y === 0)) {
    const target = event?.currentTarget || (event?.target as HTMLElement)?.closest?.("button");
    if (target instanceof HTMLElement) {
      const rect = target.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      }
    } else if (event && typeof event.clientX === "number" && (event.clientX > 0 || event.clientY > 0)) {
      x = event.clientX;
      y = event.clientY;
    }
  }

  if (typeof x !== "number" || typeof y !== "number" || (x === 0 && y === 0)) {
    x = window.innerWidth / 2;
    y = window.innerHeight / 2;
  }

  x = Math.max(0, Math.min(window.innerWidth, x));
  y = Math.max(0, Math.min(window.innerHeight, y));

  // 2. 计算覆盖全屏所需的最大几何半径
  const endRadius = Math.ceil(
    Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )
  );

  try {
    const transitionDoc = document as Document & {
      startViewTransition: (callback: () => void) => {
        ready: Promise<void>;
        finished: Promise<void>;
      };
    };

    root.classList.add("view-transition-active");

    const transition = transitionDoc.startViewTransition(() => {
      applyThemeDirect(nextTheme);
    });

    transition.finished
      .finally(() => {
        root.classList.remove("view-transition-active");
        onComplete?.();
      })
      .catch(() => {});

    transition.ready
      .then(() => {
        const animation = document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 420,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            // 严禁在此使用 fill: "both" 或 fill: "forwards"！
            // 在伪元素销毁后挂起 fill 状态会导致 Chromium Blink 合成器野指针崩溃（引发“重新启动 Chrome”）。
            pseudoElement: "::view-transition-new(root)",
          }
        );

        animation.finished
          .then(() => {
            animation.cancel();
          })
          .catch(() => {});
      })
      .catch(() => {
        // 过渡被打断或取消，DOM 已在 callback 中翻转，无需重复应用
      });
  } catch {
    applyThemeDirect(nextTheme);
    onComplete?.();
  }
}
