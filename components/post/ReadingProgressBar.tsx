"use client";

import { useEffect, useState } from "react";

export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const calculateProgress = () => {
      const { scrollTop, scrollHeight, clientHeight } =
        document.documentElement;
      const totalHeight = scrollHeight - clientHeight;

      if (totalHeight > 0) {
        // 钳位在 0 ~ 100 之间，防止 iOS 橡皮筋回弹溢出
        const currentProgress = (scrollTop / totalHeight) * 100;
        setProgress(Math.min(100, Math.max(0, currentProgress)));
      }
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        // 借助 rAF 保证与屏幕刷新率同步，避免高频卡顿
        window.requestAnimationFrame(calculateProgress);
        ticking = true;
      }
    };

    // 1. 挂载时立即计算一次（适配刷新和锚点加载）
    calculateProgress();

    // 2. 监听滚动与窗口大小调整
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", calculateProgress);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", calculateProgress);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed left-0 right-0 top-0 z-50 h-[2px] w-full pointer-events-none bg-transparent"
    >
      <div
        className="h-full bg-neutral-900/80 dark:bg-white/80 transition-transform duration-75 ease-out origin-left will-change-transform"
        style={{ transform: `scaleX(${progress / 100})` }}
      />
    </div>
  );
}