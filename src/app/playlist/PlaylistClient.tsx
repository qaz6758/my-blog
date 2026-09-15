// app/playlist/PlaylistClient.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Disc3, RefreshCw } from "lucide-react";
import { Playlist, PlaylistCategory } from "@/components/playlist/Playlist";
import { Song } from "@/components/playlist/SongList";
import { useMusic } from "@/components/playlist/MusicContext";
import { PlaylistSkeleton } from "@/components/playlist/PlaylistSkeleton";

interface PlaylistClientProps {
  initialPlaylists?: PlaylistCategory[];
  initialPlaylistId?: string | null;
}

export default function PlaylistClient({
  initialPlaylists = [],
  initialPlaylistId = null,
}: PlaylistClientProps) {
  const [playlists, setPlaylists] = useState<PlaylistCategory[]>(initialPlaylists);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(() => {
    if (initialPlaylistId) return initialPlaylistId;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("id") || params.get("playlist") || null;
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(initialPlaylists.length === 0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { currentSong, isPlaying, playSong, playAll } = useMusic();

  const handleSelectPlaylist = (id: string | null) => {
    setSelectedPlaylistId(id);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (id) {
        url.searchParams.set("id", id);
      } else {
        url.searchParams.delete("id");
        url.searchParams.delete("playlist");
      }
      window.history.pushState({ playlistId: id }, "", url.pathname + (url.search ? url.search : ""));
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setSelectedPlaylistId(params.get("id") || params.get("playlist") || null);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const loadNotionPlaylists = async () => {
    if (playlists.length === 0) setIsLoading(true);
    setErrorMsg(null);
    try {
      const workerUrl =
        process.env.NEXT_PUBLIC_NOTION_WORKER_URL ||
        "https://notion-api.dedeboki123.workers.dev";
      const targetUrl = `${workerUrl.replace(/\/$/, "")}/api/playlists`;

      let res = await fetch(targetUrl, { cache: "no-store" }).catch(() => null);
      if (!res || !res.ok) {
        res = await fetch("/api/playlist", { cache: "no-store" }).catch(() => null);
      }

      if (res && res.ok) {
        const json = await res.json();
        if (json?.success && Array.isArray(json?.data) && json.data.length > 0) {
          setPlaylists((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(json.data)) {
              return prev;
            }
            return json.data;
          });
          return;
        }
      }

      if (playlists.length === 0) {
        setErrorMsg("未能获取到歌单数据");
      }
    } catch {
      if (playlists.length === 0) {
        setErrorMsg("网络请求异常，请稍后重试");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 页面加载后立即在后台静默获取最新的实时歌单数据（SWR 机制，确保删歌/加歌秒级呈现）
    loadNotionPlaylists();
  }, []);

  const handlePlayAll = (playlist: PlaylistCategory) => {
    if (playlist.songs && playlist.songs.length > 0) {
      playAll(playlist.songs);
    }
  };

  const handleSelectSong = (song: Song) => {
    const activePl = playlists.find((p) => p.id === selectedPlaylistId) || playlists[0];
    playSong(song, activePl?.songs || []);
  };

  if (isLoading && playlists.length === 0) {
    return <PlaylistSkeleton />;
  }

  if (errorMsg && playlists.length === 0) {
    return (
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
    );
  }

  return (
    <Playlist
      playlists={playlists}
      selectedPlaylistId={selectedPlaylistId}
      currentSongId={currentSong?.id}
      isPlaying={isPlaying}
      onSelectPlaylist={handleSelectPlaylist}
      onPlayAll={handlePlayAll}
      onSelectSong={handleSelectSong}
    />
  );
}
