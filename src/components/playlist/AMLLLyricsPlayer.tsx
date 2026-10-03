// components/playlist/AMLLLyricsPlayer.tsx
"use client";

import React from "react";
import dynamic from "next/dynamic";
import { LyricResult } from "@/lib/lyrics";

// 动态客户端加载 AMLLInner，隔离 Node.js SSR 阶段缺少 window 的问题
const DynamicAMLLInner = dynamic(
  () =>
    import("@/components/playlist/AMLLLyricPlayerInner").then(
      (mod) => mod.AMLLLyricPlayerInner
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center h-full text-white/50 space-y-4 py-20">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-white/60 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-white/60 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-white/60 animate-bounce" />
        </div>
        <p className="text-sm font-medium tracking-wide text-white/60">
          正在载入 Apple Music 物理歌词引擎...
        </p>
      </div>
    ),
  }
);

interface AMLLLyricsPlayerProps {
  lyricsData: LyricResult;
  duration: number;
  onSeekTime?: (time: number) => void;
  className?: string;
}

export function AMLLLyricsPlayer({
  lyricsData,
  duration,
  onSeekTime,
  className = "",
}: AMLLLyricsPlayerProps) {
  return (
    <DynamicAMLLInner
      lyricsData={lyricsData}
      duration={duration}
      onSeekTime={onSeekTime}
      className={className}
    />
  );
}
