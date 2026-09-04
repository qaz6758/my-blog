// components/playlist/Playlist.tsx
"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, ArrowLeft } from "lucide-react";
import { Song, SongList } from "@/components/playlist/SongList";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80";

export interface PlaylistCategory {
  id: string;
  title: string;
  description: string;
  cover: string;
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
  // ===================== 移动端手势/物理返回键拦截 =====================
  useEffect(() => {
    if (!selectedPlaylistId) return;

    window.history.pushState({ playlistDetailOpen: true }, "");

    const handlePopState = () => {
      onSelectPlaylist(null);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [selectedPlaylistId, onSelectPlaylist]);

  const handleSelectPlaylist = (id: string | null) => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    onSelectPlaylist(id);
  };

  const handleBackToList = () => {
    if (window.history.state?.playlistDetailOpen) {
      window.history.back();
    } else {
      handleSelectPlaylist(null);
    }
  };

  const activePlaylist = playlists.find((p) => p.id === selectedPlaylistId);

  return (
    <div className="w-full relative">
      <AnimatePresence mode="popLayout" initial={false}>
        {!selectedPlaylistId ? (
          /* ===================== 1. 宽屏画廊网格 ===================== */
          <motion.div
            key="playlist-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-full"
          >

            {/* Apple Music 标准 220px-240px 质感歌单网格 (单屏可轻松容纳 2 整行) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-5 sm:gap-6 lg:gap-7 justify-start">
              {playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  onClick={() => handleSelectPlaylist(playlist.id)}
                  className="group flex cursor-pointer flex-col w-full max-w-[240px]"
                >
                  {/* 歌单封面卡片 (Apple 官方标准 rounded-[5px] 微倒角 + ring-1 锐利细边框) */}
                  <div className="relative aspect-square w-full max-w-[240px] overflow-hidden rounded-[5px] bg-neutral-900 ring-1 ring-black/10 dark:ring-white/10 shadow-sm transition-all duration-300 group-hover:scale-[1.015] group-hover:shadow-md">
                    {(() => {
                      const rawCover =
                        playlist.cover ||
                        (playlist as any).cover_url ||
                        (playlist as any).coverUrl ||
                        "";
                      return (
                        <img
                          src={rawCover || FALLBACK_COVER}
                          alt={playlist.title}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (
                              rawCover &&
                              rawCover.includes("music.126.net") &&
                              !target.src.includes("wsrv.nl")
                            ) {
                              target.src = `https://wsrv.nl/?url=${encodeURIComponent(rawCover)}&w=480&h=480&fit=cover`;
                              return;
                            }
                            target.src = FALLBACK_COVER;
                          }}
                          className="h-full w-full object-cover transition-transform duration-500"
                        />
                      );
                    })()}

                    {/* Apple Music 同款精致右下角悬浮播放标 (不遮挡画面中心) */}
                    <div className="absolute inset-0 flex items-end justify-end p-2.5 bg-black/15 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-950 shadow-[0_4px_12px_rgba(0,0,0,0.35)] transition-transform duration-200 group-hover:scale-100 scale-90 active:scale-95">
                        <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
                      </div>
                    </div>
                  </div>

                  {/* 标题与描述信息 (Apple 标准 mt-2 紧凑间距 + 纯白/纯灰克制色调) */}
                  <div className="mt-2 max-w-[240px]">
                    <h2 className="truncate text-[13.5px] sm:text-[14px] font-semibold tracking-tight text-neutral-900 dark:text-white transition-opacity group-hover:opacity-75">
                      {playlist.title}
                    </h2>
                    <p className="mt-0.5 truncate text-[12px] text-neutral-500 dark:text-[#86868b] font-normal">
                      {playlist.tag ? `${playlist.tag} · ` : ""}{playlist.songs?.length || 0} 首歌曲
                    </p>
                  </div>
                </div>
              ))}
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
                {/* Apple Music 原生 Hero 头部排版 (高度与封面等高对齐，紧凑衔接下方曲目) */}
                <div className="mb-5 sm:mb-7 flex flex-col md:flex-row items-stretch gap-8 sm:gap-10 pt-1 pb-2">
                  {/* 左侧封面 (Apple Music 同款 rounded-[6px] 锐利微倒角 + ring-1 边框) */}
                  <div className="relative aspect-square w-48 sm:w-56 md:w-60 lg:w-64 shrink-0 overflow-hidden rounded-[6px] sm:rounded-[8px] bg-neutral-900 shadow-[0_12px_32px_rgba(0,0,0,0.18)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.55)] ring-1 ring-black/10 dark:ring-white/10">
                    {(() => {
                      const rawHeroCover =
                        activePlaylist.cover ||
                        (activePlaylist as any).cover_url ||
                        (activePlaylist as any).coverUrl ||
                        "";
                      return (
                        <img
                          src={rawHeroCover || FALLBACK_COVER}
                          alt={activePlaylist.title}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (
                              rawHeroCover &&
                              rawHeroCover.includes("music.126.net") &&
                              !target.src.includes("wsrv.nl")
                            ) {
                              target.src = `https://wsrv.nl/?url=${encodeURIComponent(rawHeroCover)}&w=640&h=640&fit=cover`;
                              return;
                            }
                            target.src = FALLBACK_COVER;
                          }}
                          className="h-full w-full object-cover"
                        />
                      );
                    })()}
                  </div>

                  {/* 右侧信息排版 (与左侧封面等高，上下两端对齐，中间留白舒展) */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    {/* 上部区块：28px 加粗纯白大标 + Apple 专属品红副标 */}
                    <div className="pt-2 sm:pt-4">
                      <h1 className="text-[26px] sm:text-[28px] md:text-[30px] font-bold tracking-tight text-neutral-900 dark:text-white leading-[1.15]">
                        {activePlaylist.title}
                      </h1>
                      <div className="mt-1 text-[17px] sm:text-[19px] font-semibold text-[#FA2D48] leading-[1.2]">
                        {activePlaylist.tag || "Apple Music"}
                      </div>
                      <p className="mt-1 text-xs text-neutral-400 dark:text-[#86868b] font-normal">
                        精选集 · {activePlaylist.songs?.length || 0} 首歌曲
                      </p>
                    </div>

                    {/* 下部区块：简介描述 + Apple 原生高质感纯白实体胶囊按钮 */}
                    <div className="mt-5 md:mt-0">
                      <p className="text-[12.5px] sm:text-[13px] leading-[1.65] text-neutral-500 dark:text-[#8e8e93] max-w-[540px]">
                        {activePlaylist.description || activePlaylist.curatorNote || `这张歌单为你持续聚焦精选好歌与经典佳作，点开聆听，即刻把心仪旋律加入你的个人资料库。`}
                      </p>

                      <div className="mt-4 sm:mt-5 flex items-center">
                        <button
                          type="button"
                          onClick={() => onPlayAll(activePlaylist)}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 px-6 py-2.5 text-[13.5px] font-bold shadow-[0_4px_14px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_rgba(255,255,255,0.2)] hover:opacity-90 transition-opacity duration-150 cursor-pointer select-none leading-none"
                        >
                          <Play className="h-3.5 w-3.5 fill-current shrink-0" />
                          <span className="leading-none flex items-center">试听</span>
                        </button>
                      </div>
                    </div>
                  </div>
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