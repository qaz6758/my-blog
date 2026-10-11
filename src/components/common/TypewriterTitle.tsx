// src/components/common/TypewriterTitle.tsx
"use client";

import React, { useState, useEffect } from "react";

interface TypewriterTitleProps {
  text?: string;
  speed?: number;
  className?: string;
}

/**
 * 赛博复古纯黑白打字机标题组件
 * 支持光标闪烁，字距与像素字体完美配合
 */
export function TypewriterTitle({
  text = "Blog",
  speed = 120,
  className = "",
}: TypewriterTitleProps) {
  const [displayed, setDisplayed] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setDisplayed(text);
      return;
    }

    let index = 0;
    setDisplayed("");

    const interval = setInterval(() => {
      index++;
      setDisplayed(text.slice(0, index));
      if (index >= text.length) {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <span
      className={`relative inline-flex items-center font-['W95FA',monospace] tracking-[0.12em] select-none ${className}`}
      aria-label={text}
    >
      {/* 1. 幽灵占位层：100% 撑开最终完整文本与光标的尺寸，确保整体绝对居中且尺寸零波动 */}
      <span
        aria-hidden="true"
        className="invisible opacity-0 select-none pointer-events-none whitespace-nowrap"
      >
        <span>{text}</span>
        <span className="inline-block w-[2.5px] ml-1" />
      </span>

      {/* 2. 真实打字输出层：绝对定位紧贴占位框左侧，字符从左向右稳定键入，不引发任何外部位移 */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 flex items-center whitespace-nowrap"
      >
        <span>{displayed}</span>
        <span
          className={`inline-block w-[2.5px] h-[0.85em] ml-1 bg-current align-baseline transition-opacity duration-75 ${
            showCursor ? "opacity-100" : "opacity-0"
          }`}
        />
      </span>
    </span>
  );
}
