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

import { ThemeDriverParams } from "../types";

export function runMobileThemeTransition({
  nextTheme,
  applyThemeDirect,
  event,
  options,
  onComplete,
}: ThemeDriverParams): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  // 用户主动要求关闭动效，直接原子切换
  if (options?.disableAnimation) {
    applyThemeDirect(nextTheme);
    onComplete?.();
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

  // 场景 A：移动端现代浏览器支持 View Transitions (Via 浏览器 / Android WebView / Chromium)
  if (hasViewTransitions) {
    try {
      const transitionDoc = document as Document & {
        startViewTransition: (callback: () => void) => {
          ready: Promise<void>;
          finished: Promise<void>;
        };
      };

      // 1. 精确获取触控位置坐标（防止 (0,0) 异常漂移）
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
        } else if (
          event &&
          typeof (event as any).clientX === "number" &&
          ((event as any).clientX > 0 || (event as any).clientY > 0)
        ) {
          x = (event as any).clientX;
          y = (event as any).clientY;
        }
      }

      if (typeof x !== "number" || typeof y !== "number" || (x === 0 && y === 0)) {
        x = window.innerWidth - 44;
        y = 28;
      }

      x = Math.max(0, Math.min(window.innerWidth, x));
      y = Math.max(0, Math.min(window.innerHeight, y));

      // 2. 真实物理屏幕对角线计算 + 15% 几何裕量
      // 彻底解决手机端底部底栏 (Toolbar) 导致视口高度偏小、扩散圆半径未触底就提前截断的黑块问题！
      const maxW = Math.max(window.innerWidth, (typeof screen !== "undefined" && screen.width) || 0);
      const maxH = Math.max(
        window.innerHeight,
        (typeof screen !== "undefined" && screen.height) || 0,
        root.clientHeight || 0
      );

      const endRadius = Math.ceil(
        Math.hypot(
          Math.max(x, maxW - x),
          Math.max(y, maxH - y)
        ) * 1.15
      );

      // 3. 注入 CSS 自定义属性并锚定旧主题类名（杜绝底部次像素或瓦片渲染间隙漏底闪黑块）
      const isCurrentlyDark = root.classList.contains("dark");
      const anchorClass = isCurrentlyDark ? "transition-from-dark" : "transition-from-light";

      root.style.setProperty("--theme-ripple-x", `${x}px`);
      root.style.setProperty("--theme-ripple-y", `${y}px`);
      root.style.setProperty("--theme-ripple-r", `${endRadius}px`);
      root.style.setProperty("--theme-ripple-duration", "350ms");

      root.classList.add("view-transition-active", anchorClass);

      let cleaned = false;
      const cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        root.classList.remove("view-transition-active", "transition-from-dark", "transition-from-light");
        root.style.removeProperty("--theme-ripple-x");
        root.style.removeProperty("--theme-ripple-y");
        root.style.removeProperty("--theme-ripple-r");
        root.style.removeProperty("--theme-ripple-duration");
        onComplete?.();
      };

      // 400ms 安全看门狗超时强制解锁
      const watchdog = setTimeout(cleanup, 450);

      const transition = transitionDoc.startViewTransition(() => {
        applyThemeDirect(nextTheme);
      });

      transition.finished
        .then(() => {
          clearTimeout(watchdog);
          cleanup();
        })
        .catch(() => {
          clearTimeout(watchdog);
          cleanup();
        });

      return;
    } catch {
      // 出现不可抗力异常降级
    }
  }

  // 场景 B：旧版环境极简硬件兜底
  applyThemeDirect(nextTheme);
  onComplete?.();
}
