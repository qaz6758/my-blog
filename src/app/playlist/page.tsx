// app/playlist/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Disc3, RefreshCw } from "lucide-react";
import { Playlist, PlaylistCategory } from "@/components/playlist/Playlist";
import { Song } from "@/components/playlist/SongList";
import { useMusic } from "@/components/playlist/MusicContext";
import PlaylistLoading from "./loading";

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

  if (isLoading) {
    return <PlaylistLoading />;
  }

  return (
    /* 移除多余的 pb-20，保持紧凑自然 */
    <div className="relative min-h-screen w-full bg-transparent px-4 pt-20 pb-4 transition-colors duration-300 sm:px-8 lg:px-10 xl:px-14">
      <main className="mx-auto w-full max-w-[1800px]">
        {errorMsg ? (
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
    </div>
  );
}