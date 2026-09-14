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
  options,
  onComplete,
}: ThemeDriverParams): void {
  if (typeof document === "undefined") return;

  // 用户主动要求关闭动效，直接原子切换
  if (options?.disableAnimation) {
    applyThemeDirect(nextTheme);
    onComplete?.();
    return;
  }

  const targetBg = nextTheme === "dark" ? "#111213" : "#ede7dc";

  // 创建纯 GPU 合成层水墨幕布（覆盖视口全域，优先适配 100dvh 动态视口高度，0% 瓦片丢失风险）
  const veil = document.createElement("div");
  veil.setAttribute("aria-hidden", "true");
  veil.style.position = "fixed";
  veil.style.inset = "0";
  veil.style.width = "100vw";
  veil.style.height = "100dvh";
  veil.style.zIndex = "999999";
  veil.style.pointerEvents = "none";
  veil.style.backgroundColor = targetBg;
  veil.style.opacity = "0";
  veil.style.willChange = "opacity";

  document.body.appendChild(veil);

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    if (veil.parentNode) {
      veil.parentNode.removeChild(veil);
    }
    onComplete?.();
  };

  // 兜底看门狗（420ms 强制清理，绝不锁死）
  const watchdog = setTimeout(cleanup, 420);

  // 阶段 1：水墨轻泛（140ms），以温润曲线平滑晕染全屏
  requestAnimationFrame(() => {
    veil.style.transition = "opacity 140ms cubic-bezier(0.2, 0.8, 0.25, 1)";
    veil.style.opacity = "0.98";

    setTimeout(() => {
      if (cleaned) return;

      // 阶段 2：在水墨幕布掩映下，瞬间原子切换底层 DOM（零 FOUC、零视觉跳跃）
      applyThemeDirect(nextTheme);

      // 阶段 3：水墨轻盈消散（180ms），如晨雾散去显露新景
      requestAnimationFrame(() => {
        veil.style.transition = "opacity 180ms cubic-bezier(0.25, 1, 0.5, 1)";
        veil.style.opacity = "0";

        setTimeout(() => {
          clearTimeout(watchdog);
          cleanup();
        }, 190);
      });
    }, 145);
  });
}
