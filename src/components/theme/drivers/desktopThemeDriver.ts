// src/components/theme/drivers/desktopThemeDriver.ts
/**
 * [PC 桌面端专属主题引擎]
 *
 * 充分利用桌面端高性能 GPU 算力、独立显卡与精确鼠标指针，
 * 驱动以点击按钮为圆心的“日光波纹扩散” View Transitions 动效。
 */

import { flushSync } from "react-dom";
import { ThemeDriverParams } from "../types";

export function runDesktopThemeTransition({
  nextTheme,
  applyThemeDirect,
  event,
  options,
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
    return;
  }

  // 1. 计算动画圆心 (以按钮中心或点击坐标为准)
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;

  const target = event?.currentTarget;
  if (target instanceof HTMLElement) {
    const rect = target.getBoundingClientRect();
    x = rect.left + rect.width / 2;
    y = rect.top + rect.height / 2;
  } else if (event && typeof event.clientX === "number") {
    x = event.clientX;
    y = event.clientY;
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
        const animation = document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 420,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
            fill: "both",
            pseudoElement: "::view-transition-new(root)",
          }
        );

        animation.finished.catch(() => {});
      })
      .catch(() => {
        applyThemeDirect(nextTheme);
      });
  } catch {
    applyThemeDirect(nextTheme);
  }
}
