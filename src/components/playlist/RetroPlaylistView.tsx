// src/components/playlist/RetroPlaylistView.tsx
"use client";

import React, { useState } from "react";
import { Play, Pause } from "lucide-react";
import { TypewriterTitle } from "@/components/common/TypewriterTitle";
import { useMusic } from "@/components/playlist/MusicContext";
import type { Song, PlaylistCategory } from "@/components/playlist/SongList";
import { getProxyImageUrl } from "@/lib/image-proxy";

const FALLBACK_SONG_COVER =
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80";

function formatDuration(val?: number | string) {
  if (!val) return "--:--";
  if (typeof val === "string") {
    if (val.includes(":")) {
      return val.replace(/^0(\d:)/, "$1");
    }
    const num = Number(val);
    if (!isNaN(num)) {
      const mins = Math.floor(num / 60);
      const secs = Math.floor(num % 60);
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }
    return val;
  }
  const mins = Math.floor(val / 60);
  const secs = Math.floor(val % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function RetroPlaylistView({ playlists }: { playlists: PlaylistCategory[] }) {
  const [selectedId, setSelectedId] = useState<string>(() => playlists[0]?.id || "");
  const { currentSong, isPlaying, playSong, togglePlay } = useMusic();

  const currentCategory = playlists.find((p) => p.id === selectedId) || playlists[0];

  return (
<div className="flex flex-col w-full flex-1 min-h-0 pt-0">
  <div className="flex items-center justify-center pb-1 mb-2.5 sm:mb-3 border-b-2 border-[#d0d7de] dark:border-white select-none">
    <h2 className="font-bold tracking-[0.12em] font-['W95FA',sans-serif] leading-none text-[19px] sm:text-[22px] text-[#24292f] dark:text-white">
      <TypewriterTitle text="Playlist" />
    </h2>
  </div>

      {currentCategory ? (
        <div className="flex flex-col flex-1 pt-1">
            {/* 歌单分类选择：放置在歌曲列表第一首歌曲正上方 */}
            {playlists.length > 1 && (
              <div className="flex flex-wrap gap-2 font-['W95FA',sans-serif] text-xs pb-3 pt-0.5 select-none">
                {playlists.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    className={`px-2.5 py-1 rounded-[3px] border transition-all cursor-pointer ${
                      selectedId === p.id
                        ? "bg-neutral-900 text-white dark:bg-white dark:text-black border-neutral-900 dark:border-white font-bold"
                        : "border-[#d0d7de] dark:border-[#333] bg-transparent text-neutral-600 dark:text-[#a1a1aa] hover:border-[#33FF33] hover:text-[#33FF33] dark:hover:border-[#33FF33] dark:hover:text-[#33FF33]"
                    }`}
                  >
                    {p.title} ({p.songs?.length || 0})
                  </button>
                ))}
              </div>
            )}

            {/* 歌曲列表：去除条目间分割横线，序号改为高清歌曲封面 */}
            {currentCategory.songs && currentCategory.songs.length > 0 ? (
              <div className="flex flex-col gap-2 sm:gap-2.5 flex-1">
                {currentCategory.songs.map((song: Song, index: number) => {
                  const isCurrent = currentSong?.id === song.id;
                  const isCurrentlyPlaying = isCurrent && isPlaying;

                  // 歌曲封面地址获取与 NetEase 120px 优选代理处理
                  const rawCover =
                    song.cover_url ||
                    song.cover ||
                    (song as { picUrl?: string }).picUrl ||
                    (song as { coverUrl?: string }).coverUrl;
                  let initialCover = rawCover || FALLBACK_SONG_COVER;
                  const isNetease = initialCover.includes("music.126.net");
                  if (isNetease) {
                    if (initialCover.includes("param=")) {
                      initialCover = initialCover.replace(/param=\d+y\d+/g, "param=120y120");
                    } else {
                      initialCover = `${initialCover}${initialCover.includes("?") ? "&" : "?"}param=120y120`;
                    }
                  }
                  initialCover = getProxyImageUrl(initialCover);

                  return (
                    <div
                      key={song.id || index}
                      onClick={() => {
                        if (isCurrent) {
                          togglePlay();
                        } else {
                          playSong(song);
                        }
                      }}
                      className={`group p-2 flex items-center justify-between gap-3 cursor-pointer rounded-[4px] transition-colors select-none ${
                        isCurrent
                          ? "bg-neutral-200/50 dark:bg-white/[0.06]"
                          : "hover:bg-neutral-100/70 dark:hover:bg-white/[0.03]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* 序号替换为歌曲封面，悬停或播放时展现控制按钮 */}
                        <div className="relative h-11 w-11 sm:h-12 sm:w-12 shrink-0 rounded-[4px] overflow-hidden border border-[#d0d7de] dark:border-[#333] bg-neutral-200 dark:bg-neutral-800">
                          <img
                            src={initialCover}
                            alt={song.title}
                            loading={index < 20 ? "eager" : "lazy"}
                            decoding="async"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (target.dataset.errorCount === "2") {
                                target.src =
                                  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
                                return;
                              }
                              target.dataset.errorCount = "1";
                              target.src = FALLBACK_SONG_COVER;
                            }}
                            className="h-full w-full object-cover transition-opacity duration-150"
                          />

                          {/* 播放/暂停控制遮罩 */}
                          <div
                            className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-150 ${
                              isCurrentlyPlaying
                                ? "opacity-100"
                                : isCurrent
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100"
                            }`}
                          >
                            {isCurrentlyPlaying ? (
                              <Pause className="h-4 w-4 fill-white text-white drop-shadow-sm" />
                            ) : (
                              <Play className="h-4 w-4 fill-white text-white ml-0.5 drop-shadow-sm" />
                            )}
                          </div>
                        </div>

                        {/* 歌曲名与艺术家 */}
                        <div className="min-w-0 flex-1 flex flex-col justify-center">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <p
                              data-song-title={!isCurrent ? "" : undefined}
                              data-song-playing={isCurrent ? "" : undefined}
                              className={`text-[13.5px] sm:text-[14.5px] font-bold truncate transition-colors leading-snug ${
                                isCurrent
                                  ? "!text-[#33FF33]"
                                  : "text-neutral-900 dark:text-white"
                              }`}
                            >
                              {song.title}
                            </p>
                            {isCurrent && (
                              <span data-song-playing className="text-[11px] font-mono !text-[#33FF33] shrink-0">
                                {isCurrentlyPlaying ? "[播放中]" : "[已暂停]"}
                              </span>
                            )}
                          </div>
                          <p
                            data-song-meta
                            className="text-[11.5px] sm:text-[12px] text-neutral-500 dark:text-[#a1a1aa] truncate mt-0.5 font-sans leading-tight"
                          >
                            {song.artist || "Unknown Artist"}
                          </p>
                        </div>
                      </div>

                      {/* 时长显示：高清大字体与高对比度 */}
                      <div
                        data-song-meta={!isCurrent ? "" : undefined}
                        data-song-playing={isCurrent ? "" : undefined}
                        className={`text-[12px] sm:text-[13px] font-mono shrink-0 tabular-nums ${
                          isCurrent
                            ? "!text-[#33FF33] font-semibold"
                            : "text-neutral-500 dark:text-[#a1a1aa]"
                        }`}
                      >
                        {formatDuration(song.duration)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-neutral-400 font-['W95FA',sans-serif]">
                No tracks in this playlist.
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-neutral-400 font-['W95FA',sans-serif]">
            No playlists loaded.
          </div>
        )}
      </div>
  );
}
