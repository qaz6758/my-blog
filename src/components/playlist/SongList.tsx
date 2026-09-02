// components/playlist/SongList.tsx
"use client";

import React, { useState } from "react";
import { Play, Pause } from "lucide-react";

const FALLBACK_SONG_COVER =
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80";

export interface Song {
  id: string | number;
  title: string;
  artist: string;
  album?: string;
  cover_url: string;
  audio_url: string;
  duration?: number | string;
  explicit?: boolean;
}

interface SongListProps {
  songs: Song[];
  currentSongId?: string | number;
  isPlaying?: boolean;
  onSelectSong: (song: Song) => void;
}

export function SongList({
  songs,
  currentSongId,
  isPlaying = false,
  onSelectSong,
}: SongListProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Apple Music 标准时长格式化：4:57（不带分钟前导 0）
  const formatDuration = (val?: number | string) => {
    if (!val) return "--:--";
    if (typeof val === "string") {
      return val.replace(/^0(\d:)/, "$1");
    }
    const mins = Math.floor(val / 60);
    const secs = Math.floor(val % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full select-none" onMouseLeave={() => setHoveredIndex(null)}>
      {/* ===================== Apple Music 极简紧凑表头 ===================== */}
      <div className="relative grid grid-cols-12 items-center px-4 py-1.5 text-xs font-normal text-neutral-400 dark:text-[#86868b]">
        <div className="col-span-6 md:col-span-5 flex items-center">
          <span>歌曲</span>
        </div>
        <div className="col-span-3 md:col-span-3">艺人</div>
        <div className="hidden md:block md:col-span-3">专辑</div>
        <div className="col-span-3 md:col-span-1 text-right">时长</div>

        {/* 顶部表头底部分隔线 (对齐下方封面左侧 left-4，悬停第 1 首曲目时智能淡出) */}
        <div
          className={`absolute bottom-0 left-4 right-4 h-[1px] bg-black/[0.06] dark:bg-white/[0.08] pointer-events-none transition-opacity duration-150 ${
            hoveredIndex === 0 || currentSongId === songs[0]?.id ? "opacity-0" : "opacity-100"
          }`}
        />
      </div>

      {/* ===================== 紧凑型歌曲列表 ===================== */}
      <div className="mt-1 space-y-[2px]">
        {songs.map((song, index) => {
          const isCurrent = song.id === currentSongId;
          const trackIndex = index + 1;

          // 当悬停或正在播放当前行时，该行下方的分割线以及该行上方的分割线均自动淡出
          const isDividerHidden =
            hoveredIndex === index ||
            hoveredIndex === index + 1 ||
            isCurrent ||
            (songs[index + 1] && songs[index + 1].id === currentSongId);

          return (
            <div
              key={song.id || index}
              onClick={() => onSelectSong(song)}
              onMouseEnter={() => setHoveredIndex(index)}
              className={`relative group grid grid-cols-12 items-center px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-[13.5px] transition-all duration-200 cursor-pointer ${
                isCurrent
                  ? "bg-[#9E0014] text-white shadow-md shadow-[#9E0014]/25"
                  : "hover:bg-black/[0.035] dark:hover:bg-white/[0.06]"
              }`}
            >
              {/* 1. 歌曲列：封面 + 序号 + 歌名 */}
              <div className="col-span-6 md:col-span-5 flex items-center gap-3 min-w-0 pr-4">
                {/* 紧凑正方形封面 (34x34 微圆角) */}
                <div className="relative h-8 w-8 sm:h-8.5 sm:w-8.5 shrink-0 overflow-hidden rounded-[5px] bg-neutral-900 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
                  <img
                    src={song.cover_url || FALLBACK_SONG_COVER}
                    alt={song.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_SONG_COVER;
                    }}
                    className="h-full w-full object-cover"
                  />

                  {/* 悬停/播放中半透明遮罩与播放图标 */}
                  <div
                    className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${
                      isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    {isCurrent && isPlaying ? (
                      <Pause className="h-3 w-3 fill-white text-white" />
                    ) : (
                      <Play className="h-3 w-3 fill-white text-white ml-0.5" />
                    )}
                  </div>
                </div>

                {/* 歌曲序号 (等宽中粗) */}
                <span
                  className={`w-4 text-center font-mono text-xs font-medium shrink-0 ${
                    isCurrent ? "text-white/90" : "text-neutral-400 dark:text-[#86868b]"
                  }`}
                >
                  {trackIndex}
                </span>

                {/* 歌名与显式标识 */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`truncate font-medium text-[13px] sm:text-[13.5px] ${
                      isCurrent
                        ? "text-white font-semibold"
                        : "text-neutral-900 dark:text-white"
                    }`}
                  >
                    {song.title}
                  </span>

                  {song.explicit && (
                    <span
                      className={`shrink-0 rounded-[2px] px-1 py-0.2 text-[9px] font-bold ${
                        isCurrent
                          ? "bg-white/20 text-white"
                          : "bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                      }`}
                    >
                      E
                    </span>
                  )}
                </div>
              </div>

              {/* 2. 艺人列 */}
              <div
                className={`col-span-3 md:col-span-3 truncate pr-3 text-xs sm:text-[13px] ${
                  isCurrent
                    ? "text-white/90 font-normal"
                    : "text-neutral-500 dark:text-[#a1a1a6]"
                }`}
              >
                {song.artist || "未知歌手"}
              </div>

              {/* 3. 专辑列 */}
              <div
                className={`hidden md:block md:col-span-3 truncate pr-3 text-xs sm:text-[13px] ${
                  isCurrent
                    ? "text-white/80 font-normal"
                    : "text-neutral-500 dark:text-[#a1a1a6]"
                }`}
              >
                {song.album || song.title}
              </div>

              {/* 4. 时长列 (与表头时长 100% 垂直居右对齐，消掉三点图标) */}
              <div className="col-span-3 md:col-span-1 text-right">
                <span
                  className={`font-mono tabular-nums text-xs sm:text-[13px] ${
                    isCurrent ? "text-white font-medium" : "text-neutral-400 dark:text-[#86868b]"
                  }`}
                >
                  {formatDuration(song.duration || "3:45")}
                </span>
              </div>

              {/* 独立底部分隔线 (悬停该行或下一行时双向智能淡出) */}
              {index < songs.length - 1 && (
                <div
                  className={`absolute bottom-0 left-4 right-4 h-[1px] bg-black/[0.04] dark:bg-white/[0.05] pointer-events-none transition-opacity duration-150 ${
                    isDividerHidden ? "opacity-0" : "opacity-100"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}