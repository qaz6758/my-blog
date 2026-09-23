// src/components/theme/drivers/themeTransitionDriver.ts
/**
 * [统一主题过渡引擎]
 *
 * 合并原 PC 桌面端与移动端两套 driver 为单一入口，
 * 通过 isMobile 标志处理平台差异：
 *   - fallback 坐标：移动端 → 右上角按钮位置，桌面端 → 屏幕中心
 *   - 半径计算：移动端使用 screen.height + 15% 裕量弥补底部工具栏
 */

import { ThemeDriverParams } from "../types";

export function runThemeTransition(
  {
    nextTheme,
    applyThemeDirect,
    event,
    options,
    onComplete,
  }: ThemeDriverParams,
  isMobile: boolean
): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  // 用户主动关闭动效 / prefers-reduced-motion，直接原子切换
  if (options?.disableAnimation) {
    applyThemeDirect(nextTheme);
    onComplete?.();
    return;
  }

  const hasViewTransitions =
    "startViewTransition" in document &&
    typeof (
      document as Document & { startViewTransition?: unknown }
    ).startViewTransition === "function" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!hasViewTransitions) {
    applyThemeDirect(nextTheme);
    onComplete?.();
    return;
  }

  try {
    const transitionDoc = document as Document & {
      startViewTransition: (callback: () => void) => {
        ready: Promise<void>;
        finished: Promise<void>;
      };
    };

    // 1. 精确获取动画圆心坐标
    let x = options?.origin?.x;
    let y = options?.origin?.y;

    if (
      typeof x !== "number" ||
      typeof y !== "number" ||
      (x === 0 && y === 0)
    ) {
      const target =
        event?.currentTarget ||
        (event?.target as HTMLElement)?.closest?.("button");
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

    // 平台差异：移动端 fallback 到右上角按钮位置，桌面端 fallback 到屏幕中心
    if (
      typeof x !== "number" ||
      typeof y !== "number" ||
      (x === 0 && y === 0)
    ) {
      if (isMobile) {
        x = window.innerWidth - 44;
        y = 28;
      } else {
        x = window.innerWidth / 2;
        y = window.innerHeight / 2;
      }
    }

    x = Math.max(0, Math.min(window.innerWidth, x));
    y = Math.max(0, Math.min(window.innerHeight, y));

    // 2. 计算覆盖全屏所需的最大几何半径
    // 移动端：使用真实物理屏幕尺寸 + 15% 裕量，弥补底部工具栏/滚动条导致的视口高度偏小
    let endRadius: number;
    if (isMobile) {
      const maxW = Math.max(
        window.innerWidth,
        (typeof screen !== "undefined" && screen.width) || 0
      );
      const maxH = Math.max(
        window.innerHeight,
        (typeof screen !== "undefined" && screen.height) || 0,
        root.clientHeight || 0
      );
      endRadius = Math.ceil(
        Math.hypot(Math.max(x, maxW - x), Math.max(y, maxH - y)) * 1.15
      );
    } else {
      endRadius = Math.ceil(
        Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y)
        )
      );
    }

    // 3. 生成跟随波纹同步扩散的柔光圈（柔化剪切硬边，消除机械生硬感）
    const halo = document.createElement("div");
    halo.setAttribute("aria-hidden", "true");
    halo.style.position = "fixed";
    halo.style.left = `${x - 24}px`;
    halo.style.top = `${y - 24}px`;
    halo.style.width = "48px";
    halo.style.height = "48px";
    halo.style.borderRadius = "50%";
    halo.style.pointerEvents = "none";
    halo.style.zIndex = "999999";
    halo.style.boxShadow =
      nextTheme === "dark"
        ? "0 0 28px 10px rgba(0, 0, 0, 0.45), inset 0 0 16px rgba(0, 0, 0, 0.25)"
        : "0 0 32px 10px rgba(212, 163, 89, 0.4), inset 0 0 16px rgba(255, 240, 210, 0.4)";
    halo.style.border =
      nextTheme === "dark"
        ? "1.5px solid rgba(255, 255, 255, 0.15)"
        : "1.5px solid rgba(185, 28, 28, 0.25)";

    document.body.appendChild(halo);

    const scaleTo = (endRadius * 2) / 48;
    try {
      halo.animate(
        [
          { transform: "scale(0)", opacity: 0.95 },
          {
            transform: `scale(${scaleTo * 0.75})`,
            opacity: 0.55,
            offset: 0.75,
          },
          { transform: `scale(${scaleTo})`, opacity: 0 },
        ],
        {
          duration: 400,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "forwards",
        }
      );
    } catch {}

    // 4. 注入 CSS 自定义属性并锚定旧主题类名（杜绝底部次像素或瓦片渲染间隙漏底闪黑块）
    const isCurrentlyDark = root.classList.contains("dark");
    const anchorClass = isCurrentlyDark
      ? "transition-from-dark"
      : "transition-from-light";

    root.style.setProperty("--theme-ripple-x", `${x}px`);
    root.style.setProperty("--theme-ripple-y", `${y}px`);
    root.style.setProperty("--theme-ripple-r", `${endRadius}px`);
    root.style.setProperty("--theme-ripple-duration", "400ms");

    root.classList.add("view-transition-active", anchorClass);

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      if (halo.parentNode) {
        halo.parentNode.removeChild(halo);
      }
      root.classList.remove(
        "view-transition-active",
        "transition-from-dark",
        "transition-from-light"
      );
      root.style.removeProperty("--theme-ripple-x");
      root.style.removeProperty("--theme-ripple-y");
      root.style.removeProperty("--theme-ripple-r");
      root.style.removeProperty("--theme-ripple-duration");
      onComplete?.();
    };

    const watchdog = setTimeout(cleanup, 500);

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
  } catch {
    applyThemeDirect(nextTheme);
    onComplete?.();
  }
}
