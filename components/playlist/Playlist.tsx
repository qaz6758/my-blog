// components/playlist/Playlist.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
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
  const [selectedTag, setSelectedTag] = useState<string>("ALL");

  // ===================== 1. 移动端系统手势/物理返回键拦截 =====================
  useEffect(() => {
    if (!selectedPlaylistId) return;

    // 进入详情时推入一条历史记录
    window.history.pushState({ playlistDetailOpen: true }, "");

    const handlePopState = () => {
      // 触发侧滑手势或返回键时，仅退回歌单列表
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

  const allTags = useMemo(() => {
    const tags = Array.from(new Set(playlists.map((p) => p.tag).filter(Boolean)));
    return ["ALL", ...tags];
  }, [playlists]);

  const filteredPlaylists = useMemo(() => {
    if (selectedTag === "ALL") return playlists;
    return playlists.filter((p) => p.tag === selectedTag);
  }, [playlists, selectedTag]);

  const activePlaylist = playlists.find((p) => p.id === selectedPlaylistId);

  return (
    <div className="flex w-full flex-col lg:flex-row lg:gap-8 xl:gap-12">
      {/* ===================== 左侧栏区域 ===================== */}
      <div className="w-full shrink-0 lg:w-60 xl:w-64">
        {/* 仅手机端显示：置顶于“歌单与音乐”上方的返回按钮 */}
        {selectedPlaylistId && (
          <button
            type="button"
            onClick={handleBackToList}
            className="lg:hidden group mb-3.5 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
            <span>返回歌单列表</span>
          </button>
        )}

        <aside className="mb-6 w-full lg:mb-0 lg:fixed lg:top-20 lg:w-60 xl:w-64 lg:h-[calc(100vh-7.5rem)] lg:min-h-[560px] z-30">
          <div className="flex h-full flex-col justify-between rounded-3xl border border-black/[0.06] bg-white/70 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl transition-colors dark:border-white/[0.08] dark:bg-[#232324]/85 dark:shadow-[0_16px_40px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-2xl">
                歌单与音乐
              </h1>
              <p className="mt-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                挑选日常反复循环的主题歌单，点击分类探索对应曲目。
              </p>

              <hr className="my-4 border-black/[0.06] dark:border-white/[0.08]" />

              <div>
                <div className="mb-2 px-1 text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
                  分类浏览
                </div>

                <nav className="flex flex-wrap gap-1 lg:flex-col">
                  {allTags.map((tag) => {
                    const isActive = selectedTag === tag;
                    const count =
                      tag === "ALL"
                        ? playlists.length
                        : playlists.filter((p) => p.tag === tag).length;

                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setSelectedTag(tag);
                          if (selectedPlaylistId) handleBackToList();
                        }}
                        className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all cursor-pointer ${
                          isActive
                            ? "bg-rose-500 text-white shadow-md shadow-rose-500/25"
                            : "text-neutral-600 hover:bg-black/[0.04] dark:text-neutral-300 dark:hover:bg-white/[0.06]"
                        }`}
                      >
                        <span className="truncate">
                          {tag === "ALL" ? "全部歌单" : tag}
                        </span>
                        <span
                          className={`ml-2 text-[10px] tabular-nums ${
                            isActive ? "text-rose-100 font-semibold" : "text-neutral-400"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            <div className="border-t border-black/[0.04] pt-3 text-[11px] text-neutral-400 dark:border-white/[0.06]">
              共收录 {playlists.length} 个主题歌单
            </div>
          </div>
        </aside>
      </div>

      {/* ===================== 右侧内容区 ===================== */}
      <section className="min-w-0 flex-1">
        <AnimatePresence mode="wait" initial={false}>
          {!selectedPlaylistId ? (
            /* 1. 歌单画廊网格 */
            <motion.div
              key="playlist-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
            >
              <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 sm:gap-x-5 sm:gap-y-7">
                {filteredPlaylists.map((playlist) => (
                  <div
                    key={playlist.id}
                    onClick={() => onSelectPlaylist(playlist.id)}
                    className="group flex cursor-pointer flex-col"
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-neutral-900 shadow-md transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl">
                      <img
                        src={playlist.cover || FALLBACK_COVER}
                        alt={playlist.title}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = FALLBACK_COVER;
                        }}
                        className="h-full w-full object-cover transition-transform duration-500"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 backdrop-blur-[1px] transition-opacity duration-200 group-hover:opacity-100">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-neutral-950 shadow-2xl transition-transform active:scale-90">
                          <Play className="ml-0.5 h-4 w-4 fill-current" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5">
                      <h3 className="truncate text-xs font-medium text-neutral-900 transition-colors group-hover:text-rose-500 dark:text-neutral-100 dark:group-hover:text-rose-400 sm:text-sm">
                        {playlist.title}
                      </h3>
                      <p className="mt-0.5 truncate text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">
                        {playlist.tag || playlist.description || "歌单"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            /* 2. 歌单歌曲详情 */
            <motion.div
              key="playlist-detail"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
            >
              {/* 仅桌面端显示的返回按钮（保持电脑端原有排版） */}
              <button
                type="button"
                onClick={handleBackToList}
                className="group mb-5 hidden items-center gap-1.5 text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white cursor-pointer lg:inline-flex"
              >
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                <span>返回歌单列表</span>
              </button>

              {activePlaylist && (
                <div>
                  {/* Banner 卡片：仅在桌面端显示 (lg:flex)，移动端直接隐藏 (hidden) */}
                  <div className="hidden lg:flex flex-col gap-5 rounded-3xl border border-black/[0.06] bg-neutral-50/50 p-5 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#232324] sm:flex-row sm:items-center sm:p-6">
                    <img
                      src={activePlaylist.cover || FALLBACK_COVER}
                      alt={activePlaylist.title}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_COVER;
                      }}
                      className="h-28 w-28 shrink-0 rounded-2xl object-cover shadow-lg ring-1 ring-black/5 dark:ring-white/10 sm:h-36 sm:w-36"
                    />

                    <div className="flex-1">
                      <span className="rounded-md bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-600 dark:bg-rose-400/10 dark:text-rose-400">
                        {activePlaylist.tag}
                      </span>
                      <h1 className="mt-2 text-xl font-bold text-neutral-900 dark:text-white sm:text-2xl lg:text-3xl">
                        {activePlaylist.title}
                      </h1>
                      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        {activePlaylist.description} · 共 {activePlaylist.songs.length} 首歌曲
                      </p>

                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => onPlayAll(activePlaylist)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 px-4 py-2 text-xs font-medium text-white shadow-md shadow-rose-500/20 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>播放全部</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 曲目列表 */}
                  <div className="mt-2 lg:mt-6">
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
      </section>
    </div>
  );
}