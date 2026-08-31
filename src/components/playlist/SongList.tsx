// components/playlist/SongList.tsx
"use client";

import React from "react";
import { Play, Pause, MoreHorizontal } from "lucide-react";

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
  const formatDuration = (val?: number | string) => {
    if (!val) return "--:--";
    if (typeof val === "string") return val;
    const mins = Math.floor(val / 60);
    const secs = Math.floor(val % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full select-none">
      {/* ===================== 表头 ===================== */}
      <div className="grid grid-cols-12 items-center px-3 py-2 text-xs font-normal text-neutral-500 dark:text-neutral-400 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="col-span-6 md:col-span-4">Song</div>
        <div className="col-span-3 md:col-span-3">Artist</div>
        <div className="hidden md:block md:col-span-3">Album</div>
        <div className="col-span-3 md:col-span-2 text-right pr-6">Time</div>
      </div>

      {/* ===================== 歌曲行列表 ===================== */}
      <div className="mt-1 space-y-0.5">
        {songs.map((song, index) => {
          const isCurrent = song.id === currentSongId;

          return (
            <div
              key={song.id || index}
              onClick={() => onSelectSong(song)}
              /* 采用 Apple Music 专用的 4px 微圆角 */
              className={`group grid grid-cols-12 items-center px-3 py-2 rounded-[10px] text-xs transition-colors cursor-pointer ${
                isCurrent
                  ? "bg-[#D60017] text-white"
                  : "text-neutral-900 dark:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
              }`}
            >
              {/* 1. Song 列 */}
              <div className="col-span-6 md:col-span-4 flex items-center gap-3 min-w-0 pr-2">
                {/* 封面（同步改为 4px 微圆角） */}
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-[4px] bg-neutral-900 shadow-sm">
                  <img
                    src={song.cover_url}
                    alt={song.title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />

                  {/* 播放/暂停遮罩 */}
                  <div
                    className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${
                      isCurrent
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    {isCurrent && isPlaying ? (
                      <Pause className="h-4 w-4 fill-white text-white" />
                    ) : (
                      <Play className="h-4 w-4 fill-white text-white ml-0.5" />
                    )}
                  </div>
                </div>

                {/* 歌名与标识 */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`truncate font-medium ${
                      isCurrent
                        ? "text-white font-semibold"
                        : "text-neutral-900 dark:text-white"
                    }`}
                  >
                    {song.title}
                  </span>

                  {song.explicit && (
                    <span
                      className={`shrink-0 rounded-[2px] px-1 py-0.2 text-[9px] font-bold uppercase leading-tight ${
                        isCurrent
                          ? "bg-white/25 text-white"
                          : "bg-black/10 text-neutral-600 dark:bg-white/20 dark:text-neutral-300"
                      }`}
                    >
                      E
                    </span>
                  )}
                </div>
              </div>

              {/* 2. Artist 列 */}
              <div
                className={`col-span-3 md:col-span-3 truncate pr-2 ${
                  isCurrent
                    ? "text-white/90"
                    : "text-neutral-500 dark:text-neutral-400"
                }`}
              >
                {song.artist || "未知歌手"}
              </div>

              {/* 3. Album 列 */}
              <div
                className={`hidden md:block md:col-span-3 truncate pr-2 ${
                  isCurrent
                    ? "text-white/80"
                    : "text-neutral-500 dark:text-neutral-400"
                }`}
              >
                {song.album || song.title}
              </div>

              {/* 4. Time 列 + 操作菜单 */}
              <div className="col-span-3 md:col-span-2 flex items-center justify-end gap-2 text-right">
                <span
                  className={`font-mono tabular-nums text-[11px] ${
                    isCurrent
                      ? "text-white/90"
                      : "text-neutral-400 dark:text-neutral-400"
                  }`}
                >
                  {formatDuration(song.duration || "03:45")}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className={`rounded-[4px] p-1 transition-colors ${
                    isCurrent
                      ? "text-white hover:bg-white/20"
                      : "text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                  }`}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}