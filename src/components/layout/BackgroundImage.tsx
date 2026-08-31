
"use client";

import React, { useEffect, useRef, useState } from "react";

export function BackgroundImage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;

    if (img?.complete) {
      setIsLoaded(true);
    }
  }, []);

  return (
    <div
      aria-hidden="true"
      className="
        pointer-events-none
        fixed
        inset-0
        -z-10
        hidden
        overflow-hidden
        bg-[#111111]
        dark:block
      "
    >
      {/* =====================================================
          夜间模式基础底色

          与全站 Dark Theme 保持一致：

          页面：
          #111111

          卡片：
          #181818

          次级：
          #1c1c1c

          图片尚未完成加载时，
          使用中性的黑灰色作为底色。

          不再使用：
          #070b14
          #0d1322
          #251525

          避免出现蓝黑 / 紫黑。
          ===================================================== */}

      <div
        className="
          absolute
          inset-0
          bg-[#111111]
        "
      />

      {/* =====================================================
          夜间背景图

          只在 Dark Mode 下显示。

          图片加载完成后淡入。
          ===================================================== */}

      <img
        ref={imgRef}
        src="/home-bg.webp"
        alt=""
        decoding="async"
        fetchPriority="high"
        onLoad={() => setIsLoaded(true)}
        className={`
          absolute
          inset-0
          h-full
          w-full
          object-cover
          object-center
          brightness-75
          transition-opacity
          duration-1000
          ease-out
          ${isLoaded ? "opacity-100" : "opacity-0"}
        `}
      />

      {/* =====================================================
          图片上的黑灰遮罩

          保留背景图片的视觉效果，
          同时让整个首页更接近统一的黑灰体系。

          不使用蓝色 / 紫色。
          ===================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          bg-black/10
        "
      />
    </div>
  );
}

