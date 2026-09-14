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

  // 场景 A：移动端现代浏览器支持 View Transitions (如 Chromium 内核、Via 浏览器等)
  if (hasViewTransitions) {
    try {
      const transitionDoc = document as Document & {
        startViewTransition: (callback: () => void) => {
          ready: Promise<void>;
          finished: Promise<void>;
        };
      };

      // 1. 计算动画圆心 (优先使用外部传入的精确物理坐标，或以触控按钮中心为准，严禁 (0,0) 左上角异常)
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

      // 终极安全保底：若依然未获取到有效物理坐标，默认取顶部导航栏右侧按钮中心，绝不从左上角 (0, 0) 触发
      if (typeof x !== "number" || typeof y !== "number" || (x === 0 && y === 0)) {
        x = window.innerWidth - 48;
        y = 36;
      }

      x = Math.max(0, Math.min(window.innerWidth, x));
      y = Math.max(0, Math.min(window.innerHeight, y));

      // 2. 精准几何半径：刚好覆盖全屏四个顶点的最大距离
      const endRadius = Math.ceil(
        Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y)
        )
      );

      // 3. 注入 CSS 自定义属性并锚定旧主题类名（杜绝底部次像素或瓦片渲染间隙漏底闪黑块）
      const isCurrentlyDark = root.classList.contains("dark");
      const anchorClass = isCurrentlyDark ? "transition-from-dark" : "transition-from-light";

      root.style.setProperty("--theme-ripple-x", `${x}px`);
      root.style.setProperty("--theme-ripple-y", `${y}px`);
      root.style.setProperty("--theme-ripple-r", `${endRadius}px`);
      root.style.setProperty("--theme-ripple-duration", "320ms");

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

      // 4. 移动端防卡死看门狗 (解法 2：400ms 超时强制恢复，彻底杜绝半路卡死)
      const watchdog = setTimeout(cleanup, 400);

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
      // 出现异常时降级至场景 B
    }
  }

  // 场景 B：移动端 Safari / 旧版 WebView / 降级环境：使用高性能纯硬件加速“水墨帷幕” (解法 2 硬件级平滑兜底)
  runMobileVeilTransition(nextTheme, applyThemeDirect, onComplete);
}

/**
 * 移动端硬件加速水墨帷幕 (Mobile Veil)
 * 创建一个临时的全屏轻量遮罩层，在 0ms 完成底层 DOM 切换后柔和消散，
 * 达到视觉上绝对无闪烁、无对比度翻转断层的满帧丝滑效果。
 */
function runMobileVeilTransition(
  nextTheme: "light" | "dark",
  applyThemeDirect: (theme: "light" | "dark") => void,
  onComplete?: () => void
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

  let cleaned = false;
  const cleanUp = () => {
    if (cleaned) return;
    cleaned = true;
    veil.removeEventListener("transitionend", cleanUp);
    if (veil.parentNode) {
      veil.parentNode.removeChild(veil);
    }
    onComplete?.();
  };

  // 触发硬件加速淡出消散
  requestAnimationFrame(() => {
    veil.style.opacity = "0";
    veil.addEventListener("transitionend", cleanUp);
    // 兜底超时移除
    setTimeout(cleanUp, 300);
  });
}
