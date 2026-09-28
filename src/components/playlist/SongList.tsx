// components/playlist/SongList.tsx
"use client";

import React, { useState } from "react";
import { Play, Pause } from "lucide-react";
import { getProxyImageUrl } from "@/lib/image-proxy";

const FALLBACK_SONG_COVER =
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80";

export interface Song {
  id: string | number;
  title: string;
  artist: string;
  album?: string;
  cover_url: string;
  cover?: string;
  picUrl?: string;
  coverUrl?: string;
  audio_url: string;
  netease_id?: string | number;
  duration?: number | string;
  explicit?: boolean;
}

export function getSongCover(song: Song): string {
  return song.cover_url || song.cover || song.picUrl || song.coverUrl || "";
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
      <div className="relative flex items-center px-3 sm:px-4 py-2.5 text-xs font-normal text-neutral-400 dark:text-neutral-400">
        {/* 歌曲列 (包含与下方序号、封面对应占位，使“歌曲”精准对齐歌名) */}
        <div className="flex-1 sm:flex-none sm:w-[42%] md:w-[40%] flex items-center gap-3 pr-3">
          <span>歌曲</span>
        </div>
        {/* 艺人列 (移动端隐藏，合并到歌曲名下方) */}
        <div className="hidden sm:block sm:w-[28%] md:w-[28%] pl-2 pr-3">艺人</div>
        {/* 专辑列 */}
        <div className="hidden md:block md:w-[24%] pl-2 pr-3">专辑</div>
        {/* 时长列 */}
        <div className="flex-1 text-right pr-2">时长</div>

        {/* 表头底部分隔线：左右起点与内容严格垂直对齐，杜绝向外凸出 */}
        <div className="absolute bottom-0 left-3 right-3 sm:left-4 sm:right-4 h-[1px] bg-black/[0.06] dark:bg-white/[0.08] pointer-events-none" />
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
                className={`relative z-10 group flex items-center px-3 sm:px-4 py-2.5 text-[13.5px] leading-none transition-colors duration-150 cursor-pointer ${
                  isCurrent
                    ? "bg-transparent shadow-none"
                    : "text-neutral-900 dark:text-neutral-200"
                }`}
              >
                {/* 1. 歌曲列 (序号 + 封面 + 歌名/艺人) */}
                <div className="flex-1 sm:flex-none sm:w-[42%] md:w-[40%] flex items-center gap-3 min-w-0 pr-3">

                  {/* 封面 (32x32 Apple 标准微倒角) */}
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-[5px] bg-neutral-800/40 dark:bg-white/[0.06] ring-1 ring-black/10 dark:ring-white/10">
                    {(() => {
                      const rawCover = getSongCover(song);

                      let initialCover = rawCover || FALLBACK_SONG_COVER;
                      const isNetease = initialCover.includes("music.126.net");

                      // 网易云音乐封面：添加 120px 紧凑参数，并经由 Worker 优选节点永久边缘缓存
                      if (isNetease) {
                        if (initialCover.includes("param=")) {
                          initialCover = initialCover.replace(/param=\d+y\d+/g, "param=120y120");
                        } else {
                          initialCover = `${initialCover}${initialCover.includes("?") ? "&" : "?"}param=120y120`;
                        }
                        initialCover = getProxyImageUrl(initialCover);
                      } else {
                        initialCover = getProxyImageUrl(initialCover);
                      }

                      return (
                        <img
                          src={initialCover}
                          alt={song.title}
                          loading={index < 25 ? "eager" : "lazy"}
                          decoding="async"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (target.dataset.errorCount === "2") {
                              target.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
                              return;
                            }
                            if (target.dataset.errorCount === "1") {
                              target.dataset.errorCount = "2";
                              target.src = FALLBACK_SONG_COVER;
                              return;
                            }
                            target.dataset.errorCount = "1";
                            if (isNetease && rawCover) {
                              const wsrvFallback = `https://wsrv.nl/?url=${encodeURIComponent(rawCover)}&w=120&h=120&fit=cover`;
                              target.src = getProxyImageUrl(wsrvFallback);
                            } else {
                              target.src = FALLBACK_SONG_COVER;
                            }
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

                  {/* 标题与手机端次级艺名 */}
                  <div className="flex flex-col min-w-0 justify-center">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`truncate font-medium text-[13.5px] ${
                          isCurrent
                            ? "text-neutral-900 dark:text-white font-bold"
                            : "text-neutral-900 dark:text-white"
                        }`}
                      >
                        {song.title}
                      </span>

                      {song.explicit && (
                        <span
                          className={`shrink-0 rounded-[2px] px-1 py-0.2 text-[9px] font-bold ${
                            isCurrent
                              ? "bg-black/10 text-neutral-700 dark:bg-white/15 dark:text-neutral-200"
                              : "bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                          }`}
                        >
                          E
                        </span>
                      )}
                    </div>
                    
                    {/* 仅在手机端显示于歌名下方的艺人 */}
                    <span className={`sm:hidden truncate text-[11px] mt-0.5 ${
                      isCurrent 
                        ? "text-neutral-700 dark:text-neutral-300 font-medium" 
                        : "text-neutral-500 dark:text-neutral-400"
                    }`}>
                      {song.artist || "未知歌手"}
                    </span>
                  </div>
                </div>

                {/* 2. 艺人列 (移动端隐藏) */}
                <div
                  className={`hidden sm:block sm:w-[28%] md:w-[28%] truncate pl-2 pr-3 text-xs sm:text-[13px] ${
                    isCurrent
                      ? "text-neutral-700 dark:text-neutral-300 font-semibold"
                      : "text-neutral-500 dark:text-neutral-400"
                  }`}
                >
                  {song.artist || "未知歌手"}
                </div>

                {/* 3. 专辑列 */}
                <div
                  className={`hidden md:block md:w-[24%] truncate pl-2 pr-3 text-xs sm:text-[13px] ${
                    isCurrent
                      ? "text-neutral-700 dark:text-neutral-300 font-semibold"
                      : "text-neutral-500 dark:text-neutral-400"
                  }`}
                >
                  {song.album || song.title}
                </div>

                {/* 4. 时长列 */}
                <div className="flex-1 text-right pr-2">
                  <span
                    className={`tabular-nums text-xs sm:text-[13px] ${
                      isCurrent
                        ? "text-neutral-700 dark:text-neutral-300 font-bold"
                        : "text-neutral-400 dark:text-neutral-400"
                    }`}
                  >
                    {formatDuration(song.duration || "3:45")}
                  </span>
                </div>
              </div>

              {/* 纯平直贯通底部分隔线 (常驻显示，层次分明) */}
              {index < songs.length - 1 && (
                <div className="absolute bottom-0 left-3 right-3 sm:left-4 sm:right-4 h-[1px] bg-black/[0.06] dark:bg-white/[0.08] pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}