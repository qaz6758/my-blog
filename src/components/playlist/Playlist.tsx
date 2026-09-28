// components/playlist/Playlist.tsx
"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, ArrowLeft } from "lucide-react";
import { Song, SongList } from "@/components/playlist/SongList";
import { PlaylistSkeleton } from "@/components/playlist/PlaylistSkeleton";
import { getProxyImageUrl } from "@/lib/image-proxy";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80";

export interface PlaylistCategory {
  id: string;
  title: string;
  description: string;
  cover: string;
  cover_url?: string;
  coverUrl?: string;
  tag: string;
  curatorNote: string;
  songs: Song[];
}

interface PlaylistProps {
  playlists: PlaylistCategory[];
  selectedPlaylistId: string | null;
  currentSongId?: string | number;
  isPlaying: boolean;
  onSelectPlaylist: (playlistId: string | null) => void;
  onPlayAll: (playlist: PlaylistCategory) => void;
  onSelectSong: (song: Song) => void;
}

export function Playlist({
  playlists,
  selectedPlaylistId,
  currentSongId,
  isPlaying,
  onSelectPlaylist,
  onPlayAll,
  onSelectSong,
}: PlaylistProps) {
  const handleSelectPlaylist = (id: string | null) => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    onSelectPlaylist(id);
  };

  const handleBackToList = () => {
    handleSelectPlaylist(null);
  };

  const activePlaylist = playlists.find((p) => p.id === selectedPlaylistId);

  if (selectedPlaylistId && !activePlaylist) {
    return (
      <div className="w-full">
        <div className="mb-6">
          <button
            type="button"
            onClick={handleBackToList}
            className="inline-flex items-center gap-2 font-mono text-xs sm:text-sm text-neutral-400 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white transition-colors cursor-pointer select-none"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>cd .. / 返回歌单</span>
          </button>
        </div>
        <PlaylistSkeleton />
      </div>
    );
  }

  return (
    <div className="w-full relative">
      <AnimatePresence mode="wait" initial={false}>
        {!selectedPlaylistId ? (
          /* ===================== 1. 宽屏画廊网格 ===================== */
          <motion.div
            key="playlist-grid"
            data-playlist-grid=""
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-full"
          >

            {/* 增加呼吸感：比照片墙稍微多一点留白，适当增加列数以控制单张封面的极限大小，拉开间距 */}
            {/* 增加呼吸感：比照片墙稍微多一点留白，适当增加列数以控制单张封面的极限大小，拉开间距 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 sm:gap-8 md:gap-10 lg:gap-12">
              <AnimatePresence>
                {playlists.map((playlist) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    transition={{
                      opacity: { duration: 0.25 },
                      layout: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                    }}
                    key={playlist.id}
                    onClick={() => handleSelectPlaylist(playlist.id)}
                    className="group flex cursor-pointer flex-col w-full"
                  >
                    {/* 歌单封面卡片 (纸墨世界风格：无圆角，无阴影，静谧刻痕) */}
                    <div className="relative aspect-square w-full overflow-hidden rounded-none bg-neutral-100 dark:bg-neutral-900 ring-1 ring-black/5 dark:ring-white/5 transition-all group-hover:scale-[1.015]" style={{ transitionDuration: "var(--realm-motion-duration)" }}>
                      {(() => {
                        const rawCover = playlist.cover || playlist.cover_url || playlist.coverUrl || "";
                        return (
                          <img
                            src={getProxyImageUrl(rawCover) || FALLBACK_COVER}
                            alt={playlist.title}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (target.dataset.errorCount === "2") {
                                target.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
                                return;
                              }
                              if (target.dataset.errorCount === "1") {
                                target.dataset.errorCount = "2";
                                target.src = FALLBACK_COVER;
                                return;
                              }
                              target.dataset.errorCount = "1";
                              if (
                                rawCover &&
                                rawCover.includes("music.126.net")
                              ) {
                                target.src = getProxyImageUrl(`https://wsrv.nl/?url=${encodeURIComponent(rawCover)}&w=480&h=480&fit=cover`);
                              } else {
                                target.src = FALLBACK_COVER;
                              }
                            }}
                            className="h-full w-full object-cover transition-transform"
                            style={{ transitionDuration: "var(--realm-motion-duration)" }}
                          />
                        );
                      })()}

                      {/* 悬浮播放标 (静谧克制版) */}
                      <div className="absolute inset-0 flex items-end justify-end p-2.5 bg-black/10 opacity-0 transition-opacity group-hover:opacity-100" style={{ transitionDuration: "var(--realm-motion-duration)" }}>
                        <div className="flex h-9 w-9 items-center justify-center rounded-none bg-white/90 text-neutral-950 dark:bg-neutral-900/90 dark:text-white transition-transform scale-95 group-hover:scale-100 active:scale-90" style={{ transitionDuration: "var(--realm-motion-duration)" }}>
                          <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
                        </div>
                      </div>
                    </div>

                    {/* 标题与描述信息 */}
                    <div className="mt-3 w-full">
                      <h2 className="truncate text-[13.5px] sm:text-[14px] font-medium tracking-tight text-neutral-900 dark:text-neutral-200 transition-opacity group-hover:opacity-75" style={{ transitionDuration: "var(--realm-motion-duration)" }}>
                        {playlist.title}
                      </h2>
                      <p className="mt-0.5 truncate text-[12px] text-neutral-500 dark:text-neutral-400 font-normal">
                        {playlist.tag ? `${playlist.tag} · ` : ""}{playlist.songs?.length || 0} 首歌曲
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          /* ===================== 2. Apple Music 原生风格歌单详情页 ===================== */
          <motion.div
            key="playlist-detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-full"
          >
            {/* 返回导航 */}
            <div className="mb-6">
              <button
                type="button"
                onClick={handleBackToList}
                className="inline-flex items-center gap-2 font-mono text-xs sm:text-sm text-neutral-400 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white transition-colors cursor-pointer select-none"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>cd .. / 返回歌单</span>
              </button>
            </div>

            {activePlaylist && (
              <div>
                {/* Hero 头部排版 (手机端左右并排，PC 端完全保持原样) */}
                <div className="mb-4 md:mb-7 flex flex-row items-start md:items-stretch gap-4 sm:gap-6 md:gap-10 pt-1 pb-2">
                  {/* 左侧封面：移动端小尺寸，PC 端保持大尺寸 */}
                  <div className="relative aspect-square w-32 sm:w-44 md:w-60 lg:w-64 shrink-0 overflow-hidden rounded-none bg-neutral-100 dark:bg-neutral-900 border-2 border-black dark:border-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,1)]">
                    {(() => {
                      const rawHeroCover =
                        activePlaylist.cover ||
                        activePlaylist.cover_url ||
                        activePlaylist.coverUrl ||
                        "";
                      return (
                        <img
                          src={getProxyImageUrl(rawHeroCover) || FALLBACK_COVER}
                          alt={activePlaylist.title}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (target.dataset.errorCount === "2") {
                              target.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
                              return;
                            }
                            if (target.dataset.errorCount === "1") {
                              target.dataset.errorCount = "2";
                              target.src = FALLBACK_COVER;
                              return;
                            }
                            target.dataset.errorCount = "1";
                            if (
                              rawHeroCover &&
                              rawHeroCover.includes("music.126.net")
                            ) {
                              target.src = getProxyImageUrl(`https://wsrv.nl/?url=${encodeURIComponent(rawHeroCover)}&w=640&h=640&fit=cover`);
                            } else {
                              target.src = FALLBACK_COVER;
                            }
                          }}
                          className="h-full w-full object-cover"
                        />
                      );
                    })()}
                  </div>

                  {/* 右侧信息排版 */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 md:py-1">
                    {/* 上部区块 */}
                    <div className="pt-0 md:pt-4">
                      <h1 className="text-[20px] sm:text-[24px] md:text-[30px] font-bold tracking-tight text-neutral-900 dark:text-neutral-100 leading-[1.15]">
                        {activePlaylist.title}
                      </h1>
                      <div className="mt-1 md:mt-2 text-[14px] sm:text-[16px] md:text-[19px] font-medium text-neutral-900 dark:text-neutral-300 leading-[1.2]">
                        {activePlaylist.tag || "Tape"}
                      </div>
                      <p className="mt-1 md:mt-2 text-[11px] sm:text-xs text-neutral-400 dark:text-neutral-400 font-mono">
                        {activePlaylist.songs?.length || 0} 首歌曲
                      </p>
                    </div>

                    {/* 下部区块：简介描述 + PC端播放按钮 */}
                    <div className="mt-2.5 md:mt-0">
                      <p className="text-[12px] md:text-[13px] leading-[1.6] md:leading-[1.65] text-neutral-500 dark:text-neutral-400 max-w-[540px]">
                        {activePlaylist.description || activePlaylist.curatorNote || `戴上耳机，把日常频率调轻一点。`}
                      </p>

                      {/* PC 端专属播放按钮 (仅在 md 及以上屏幕显示，位置完全不变) */}
                      <div className="hidden md:flex mt-5 items-center">
                        <button
                          type="button"
                          onClick={() => onPlayAll(activePlaylist)}
                          className="inline-flex items-center justify-center gap-2 rounded-none border-2 border-black dark:border-white bg-transparent text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,1)] active:shadow-[2px_2px_0_0_rgba(0,0,0,1)] dark:active:shadow-[2px_2px_0_0_rgba(255,255,255,1)] active:translate-x-[2px] active:translate-y-[2px] px-8 py-2.5 text-[14px] font-bold uppercase tracking-widest transition-all cursor-pointer select-none leading-none"
                          style={{ transitionDuration: "var(--realm-motion-duration)" }}
                        >
                          <Play className="h-3.5 w-3.5 fill-current shrink-0" />
                          <span className="leading-none flex items-center tracking-widest">PLAY</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 手机端专属播放按钮：位于封面下方整行靠左 (仅在 md 以下小屏显示) */}
                <div className="flex md:hidden mb-5 items-center">
                  <button
                    type="button"
                    onClick={() => onPlayAll(activePlaylist)}
                    className="inline-flex items-center justify-center gap-2 rounded-none border-2 border-black dark:border-white bg-transparent text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,1)] active:shadow-[2px_2px_0_0_rgba(0,0,0,1)] dark:active:shadow-[2px_2px_0_0_rgba(255,255,255,1)] active:translate-x-[2px] active:translate-y-[2px] px-6 py-2 text-[13px] font-bold uppercase tracking-widest transition-all cursor-pointer select-none leading-none"
                    style={{ transitionDuration: "var(--realm-motion-duration)" }}
                  >
                    <Play className="h-3.5 w-3.5 fill-current shrink-0" />
                    <span className="leading-none flex items-center tracking-widest">PLAY</span>
                  </button>
                </div>

                {/* 曲目列表表格 */}
                <div className="w-full">
                  <SongList
                    songs={activePlaylist.songs}
                    currentSongId={currentSongId}
                    isPlaying={isPlaying}
                    onSelectSong={onSelectSong}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}