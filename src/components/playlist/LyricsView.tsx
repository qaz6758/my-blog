// components/playlist/LyricsView.tsx
"use client";

import React from "react";
import { Music, Radio } from "lucide-react";
import { LyricResult } from "@/lib/lyrics";
import { AMLLLyricsPlayer } from "@/components/playlist/AMLLLyricsPlayer";

interface LyricsViewProps {
  lyricsData: LyricResult | null;
  isLoading: boolean;
  duration: number;
  onSeekTime?: (time: number) => void;
  className?: string;
}

export function LyricsView({
  lyricsData,
  isLoading,
  duration,
  onSeekTime,
  className = "",
}: LyricsViewProps) {
  const lines = lyricsData?.lines || [];

  // 1. 加载中骨架
  if (isLoading) {
    return (
      <div
        className={`flex flex-col items-center justify-center text-white/50 space-y-4 py-20 ${className}`}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-white/60 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-white/60 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-white/60 animate-bounce" />
        </div>
        <p className="text-sm font-medium tracking-wide text-white/60">
          正在获取歌词...
        </p>
      </div>
    );
  }

  // 2. 纯音乐模式
  if (lyricsData?.isInstrumental) {
    return (
      <div
        className={`flex flex-col items-center justify-center text-white/70 py-20 text-center px-4 ${className}`}
      >
        <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center mb-4 ring-1 ring-white/20">
          <Music className="h-8 w-8 text-white/80 animate-pulse" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
          纯音乐，请欣赏
        </h3>
        <p className="text-xs sm:text-sm text-white/50 max-w-xs">
          此歌曲为器乐曲或无填词作品，尽情沉浸在旋律之中吧
        </p>
      </div>
    );
  }

  // 3. 暂无歌词
  if (!lyricsData || !lines.length) {
    return (
      <div
        className={`flex flex-col items-center justify-center text-white/50 py-20 text-center px-4 ${className}`}
      >
        <Radio className="h-10 w-10 text-white/40 mb-3" />
        <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-white/80 mb-1">
          暂无歌词
        </h3>
        <p className="text-xs text-white/40">
          暂未收录该歌曲的时间轴歌词
        </p>
      </div>
    );
  }

  // 4. 接入开源 AMLL (Apple Music Like Lyrics) 真实物理弹簧与景深引擎
  return (
    <AMLLLyricsPlayer
      lyricsData={lyricsData}
      duration={duration}
      onSeekTime={onSeekTime}
      className={className}
    />
  );
}
