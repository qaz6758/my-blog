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
    <div className="w-full select-none antialiased" onMouseLeave={() => setHoveredIndex(null)}>
      {/* ===================== 表头：与下方数据列 100% 垂直像素级对齐 ===================== */}
      <div className="relative flex items-center px-3 sm:px-4 py-2.5 text-xs font-normal text-neutral-400 dark:text-[#86868b]  border-black/[0.08] dark:border-white/[0.08]">
        {/* 歌曲列 (包含与下方序号、封面对应占位，使“歌曲”精准对齐歌名) */}
        <div className="w-[45%] sm:w-[42%] md:w-[40%] flex items-center gap-3 pr-3">
          <span className="w-5 text-center font-mono shrink-0">#</span>
          <span className="w-8 shrink-0 text-center"></span>
          <span>歌曲</span>
        </div>
        {/* 艺人列 */}
        <div className="w-[30%] sm:w-[28%] md:w-[28%] pl-2 pr-3">艺人</div>
        {/* 专辑列 */}
        <div className="hidden md:block md:w-[24%] pl-2 pr-3">专辑</div>
        {/* 时长列 */}
        <div className="flex-1 text-right pr-2">时长</div>
      </div>

      {/* ===================== Apple Music 原生曲目列表 ===================== */}
      <div className="w-full">
        {songs.map((song, index) => {
          const isCurrent = song.id === currentSongId;
          const trackIndex = index + 1;

          return (
            <div
              key={song.id || index}
              className="relative"
              style={{
                contentVisibility: "auto",
                containIntrinsicSize: "0 48px",
              }}
            >
              <div
                onClick={() => onSelectSong(song)}
                onMouseEnter={() => setHoveredIndex(index)}
                className={`relative z-10 group flex items-center px-3 sm:px-4 py-2.5 rounded-xl text-[13.5px] leading-none transition-colors duration-150 cursor-pointer ${
                  isCurrent
                    ? "bg-[#9A0014] dark:bg-[#920013] text-white shadow-md shadow-[#9A0014]/25"
                    : "text-neutral-900 dark:text-neutral-200 hover:bg-black/[0.035] dark:hover:bg-white/[0.05]"
                }`}
              >
                {/* 1. 歌曲列 (序号 + 封面 + 歌名) */}
                <div className="w-[45%] sm:w-[42%] md:w-[40%] flex items-center gap-3 min-w-0 pr-3">
                  {/* 序号 (统一使用 tabular-nums 保证数字与中文绝对对齐) */}
                  <span
                    className={`w-5 text-center tabular-nums text-xs font-medium shrink-0 ${
                      isCurrent ? "text-white/90" : "text-neutral-400 dark:text-[#86868b]"
                    }`}
                  >
                    {trackIndex}
                  </span>

                  {/* 封面 (32x32 Apple 标准微倒角) */}
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-[5px] bg-neutral-800/40 dark:bg-white/[0.06] ring-1 ring-black/10 dark:ring-white/10">
                    {(() => {
                      const rawCover =
                        song.cover_url ||
                        (song as any).cover ||
                        (song as any).picUrl ||
                        (song as any).coverUrl ||
                        "";

                      let initialCover = rawCover || FALLBACK_SONG_COVER;
                      const isNetease = initialCover.includes("music.126.net");

                      // 如果已知用户环境网易云直连不稳定，直接直出全球代理链接，彻底消除等待与黑块
                      if (isNetease) {
                        if (typeof window !== "undefined" && (window as any).__netease_direct_failed) {
                          initialCover = `https://wsrv.nl/?url=${encodeURIComponent(rawCover)}&w=120&h=120&fit=cover`;
                        } else if (initialCover.includes("param=")) {
                          initialCover = initialCover.replace(/param=\d+y\d+/g, "param=120y120");
                        } else {
                          initialCover = `${initialCover}${initialCover.includes("?") ? "&" : "?"}param=120y120`;
                        }
                      }

                      return (
                        <img
                          src={initialCover}
                          alt={song.title}
                          loading={index < 25 ? "eager" : "lazy"}
                          decoding="async"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (isNetease) {
                              if (typeof window !== "undefined") {
                                (window as any).__netease_direct_failed = true;
                              }
                              if (!target.src.includes("wsrv.nl")) {
                                target.src = `https://wsrv.nl/?url=${encodeURIComponent(rawCover)}&w=120&h=120&fit=cover`;
                                return;
                              }
                            }
                            target.src = FALLBACK_SONG_COVER;
                          }}
                          className="h-full w-full object-cover transition-opacity duration-150"
                        />
                      );
                    })()}

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

                  {/* 歌名 */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`truncate font-medium text-[13.5px] ${
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
                            ? "bg-white/25 text-white"
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
                  className={`w-[30%] sm:w-[28%] md:w-[28%] truncate pl-2 pr-3 text-xs sm:text-[13px] ${
                    isCurrent
                      ? "text-white/90 font-normal"
                      : "text-neutral-500 dark:text-[#a1a1a6]"
                  }`}
                >
                  {song.artist || "未知歌手"}
                </div>

                {/* 3. 专辑列 */}
                <div
                  className={`hidden md:block md:w-[24%] truncate pl-2 pr-3 text-xs sm:text-[13px] ${
                    isCurrent
                      ? "text-white/80 font-normal"
                      : "text-neutral-500 dark:text-[#a1a1a6]"
                  }`}
                >
                  {song.album || song.title}
                </div>

                {/* 4. 时长列 */}
                <div className="flex-1 text-right pr-2">
                  <span
                    className={`tabular-nums text-xs sm:text-[13px] ${
                      isCurrent
                        ? "text-white font-medium"
                        : "text-neutral-400 dark:text-[#86868b]"
                    }`}
                  >
                    {formatDuration(song.duration || "3:45")}
                  </span>
                </div>
              </div>

              {/* 纯平直贯通底部分隔线 (与表头完全融合对齐，无弯角) */}
              {index < songs.length - 1 && !isCurrent && hoveredIndex !== index && (
                <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-black/[0.04] dark:bg-white/[0.05] pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}