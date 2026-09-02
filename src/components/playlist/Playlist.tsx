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

  const handleBackToList = () => {
    if (window.history.state?.playlistDetailOpen) {
      window.history.back();
    } else {
      onSelectPlaylist(null);
    }
  };

  const activePlaylist = playlists.find((p) => p.id === selectedPlaylistId);

  return (
    <div className="w-full">
      <AnimatePresence mode="wait" initial={false}>
        {!selectedPlaylistId ? (
          /* ===================== 1. 宽屏画廊网格 ===================== */
          <motion.div
            key="playlist-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >

            {/* 宽屏自适应铺满画廊网格 */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 sm:gap-x-8 sm:gap-y-12">
              {playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  onClick={() => onSelectPlaylist(playlist.id)}
                  className="group flex cursor-pointer flex-col"
                >
                  {/* 歌单封面卡片 */}
                  <div className="relative aspect-square w-full overflow-hidden rounded-2xl sm:rounded-3xl bg-neutral-100 dark:bg-[#111] border border-black/[0.06] dark:border-white/[0.08] shadow-md transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-2xl">
                    <img
                      src={playlist.cover || FALLBACK_COVER}
                      alt={playlist.title}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_COVER;
                      }}
                      className="h-full w-full object-cover transition-transform duration-500"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-neutral-950 shadow-2xl transition-transform active:scale-90">
                        <Play className="ml-0.5 h-5 w-5 fill-current" />
                      </div>
                    </div>
                  </div>

                  {/* 标题与描述信息 */}
                  <div className="mt-4">
                    <h2 className="truncate text-base sm:text-[17px] font-semibold tracking-tight text-neutral-900 transition-colors group-hover:text-rose-500 dark:text-neutral-100 dark:group-hover:text-rose-400">
                      {playlist.title}
                    </h2>
                    <p className="mt-1.5 truncate text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-normal">
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
                  {/* 左侧封面 */}
                  <div className="relative aspect-square w-48 sm:w-56 md:w-60 lg:w-64 shrink-0 overflow-hidden rounded-2xl bg-neutral-900 shadow-[0_12px_32px_rgba(0,0,0,0.18)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.55)] border border-black/5 dark:border-white/10">
                    <img
                      src={activePlaylist.cover || FALLBACK_COVER}
                      alt={activePlaylist.title}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_COVER;
                      }}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* 右侧信息排版 (与左侧封面等高，上下两端对齐，中间留白舒展) */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    {/* 上部区块：大标题 + 红色副标题 (适度向下微调下移) */}
                    <div className="pt-4 sm:pt-10">
                      <h1 className="text-[24px] sm:text-[27px] font-bold tracking-[-0.02em] text-neutral-900 dark:text-white leading-[1.2]">
                        {activePlaylist.title}
                      </h1>
                      <div className="mt-[6px] text-[19px] sm:text-[21px] font-normal text-[#FA2D48] leading-[1.2]">
                        {activePlaylist.tag || "Apple Music"}
                      </div>
                    </div>

                    {/* 下部区块：简介描述 + 试听胶囊按钮 (与封面底部对齐) */}
                    <div className="mt-6 md:mt-0">
                      <p className="text-[12.5px] sm:text-[13px] leading-[1.65] text-neutral-500 dark:text-[#8e8e93] max-w-[540px]">
                        {activePlaylist.description || activePlaylist.curatorNote || `这张歌单为你持续聚焦精选好歌与经典佳作，点开聆听，即刻把心仪旋律加入你的个人资料库。`}
                      </p>

                      <div className="mt-4 sm:mt-5 flex items-center">
                        <button
                          type="button"
                          onClick={() => onPlayAll(activePlaylist)}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-black text-white dark:bg-white dark:text-black px-6 py-2.5 text-[13.5px] font-bold shadow-sm hover:opacity-90 transition-transform active:scale-95 cursor-pointer select-none leading-none"
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