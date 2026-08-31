// app/playlist/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Disc3, RefreshCw } from "lucide-react";
import { Playlist, PlaylistCategory } from "@/components/playlist/Playlist";
import { Song } from "@/components/playlist/SongList";
import { useMusic } from "@/components/playlist/MusicContext";
import { Footer } from "@/components/layout/Footer";

export default function PlaylistPage() {
  const [playlists, setPlaylists] = useState<PlaylistCategory[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { currentSong, isPlaying, playSong, playAll } = useMusic();

  const loadNotionPlaylists = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/playlist");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setPlaylists(json.data);
      } else {
        setErrorMsg(json.error || "未能获取到歌单数据");
      }
    } catch {
      setErrorMsg("网络请求异常，请检查控制台");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotionPlaylists();
  }, []);

  const handlePlayAll = (playlist: PlaylistCategory) => {
    if (playlist.songs && playlist.songs.length > 0) {
      playAll(playlist.songs);
    }
  };

  const handleSelectSong = (song: Song) => {
    const activePl = playlists.find((p) => p.id === selectedPlaylistId);
    playSong(song, activePl?.songs || []);
  };

  return (
    /* 移除多余的 pb-20，保持紧凑自然 */
    <div className="relative min-h-screen w-full bg-transparent px-4 pt-20 pb-4 transition-colors duration-300 sm:px-8 lg:px-10 xl:px-14">
      <main className="mx-auto w-full max-w-[1800px]">
        {isLoading ? (
          <div className="flex flex-col gap-8 lg:flex-row">
            <div className="h-72 w-full animate-pulse rounded-2xl bg-neutral-200/50 dark:bg-neutral-800/40 lg:w-56 xl:w-64" />
            <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="aspect-square animate-pulse rounded-xl bg-neutral-200/50 dark:bg-neutral-800/40"
                />
              ))}
            </div>
          </div>
        ) : errorMsg ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-500">
              <Disc3 className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-neutral-800 dark:text-neutral-200">
              歌单读取遇到问题
            </h3>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{errorMsg}</p>
            <button
              type="button"
              onClick={loadNotionPlaylists}
              className="mt-6 inline-flex items-center gap-1.5 rounded-xl border border-black/[0.08] bg-white px-4 py-2 text-xs font-medium text-neutral-800 shadow-sm transition hover:bg-neutral-50 dark:border-white/[0.08] dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>重新加载</span>
            </button>
          </div>
        ) : (
          <Playlist
            playlists={playlists}
            selectedPlaylistId={selectedPlaylistId}
            currentSongId={currentSong?.id}
            isPlaying={isPlaying}
            onSelectPlaylist={setSelectedPlaylistId}
            onPlayAll={handlePlayAll}
            onSelectSong={handleSelectSong}
          />
        )}
      </main>

      {/* 紧凑贴合的页脚容器 */}
      <div className="mt-8 sm:mt-12 w-full">
        <Footer />
      </div>
    </div>
  );
}