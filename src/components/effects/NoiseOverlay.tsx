"use client";

import React from "react";

export function NoiseOverlay() {
  return (
    <>
      {/* 
        1. 全局胶片噪点层 (Film Grain Texture)
        放置在极高的层级 (z-[100])，覆盖文字、卡片、图片，
        用极低的透明度让所有元素统一融入“纸张/胶片”质感中。
      */}
      <div
        className="pointer-events-none fixed inset-0 z-[100] h-full w-full opacity-[0.035] dark:opacity-[0.05] mix-blend-difference dark:mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* 
        2. 全局环境微暗角 (Vignette)
        放置在底层 (z-0)，在不影响阅读的前提下，给整个网页增添微弱的向心力和摄影镜头感。
        结合你原本的 BackgroundImage 使用，效果极佳。
      */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-colors duration-1000
        bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.02)_100%)] 
        dark:bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]"
      />
    </>
  );
}
