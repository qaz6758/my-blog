// components/playlist/MusicContext.tsx
"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import { Song } from "@/components/playlist/SongList";
// ⚡ 懒加载桥接 — 播放器 JS 在用户点击播放前完全不下载
import { LazyMusicPlayer } from "@/components/playlist/LazyMusicPlayer";

export type RepeatMode = "off" | "all" | "one";

interface MusicContextType {
  currentSong: Song | null;
  playlistSongs: Song[];
  isPlaying: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  playSong: (song: Song, playlist?: Song[]) => void;
  playAll: (songs: Song[]) => void;
  togglePlay: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  closePlayer: () => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [playlistSongs, setPlaylistSongs] = useState<Song[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("all");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadAudioRef = useRef<HTMLAudioElement | null>(null);

  // 空闲时自动静默预加载播放器组件，消除用户点击时的 chunk 下载等待
  useEffect(() => {
    if (typeof window !== "undefined") {
      const preload = () => {
        import("@/components/playlist/MusicPlayer");
      };
      if ("requestIdleCallback" in window) {
        (window as any).requestIdleCallback(preload);
      } else {
        setTimeout(preload, 1000);
      }
    }
  }, []);

  // ⚡ 核心黑科技：下一首无感智能预加载 (Gapless Next Song Preloader)
  // 当歌曲播放进行中，后台静默拉取下一首音频，完成 DNS 握手与首部缓冲，切歌 0 延迟！
  useEffect(() => {
    if (!currentSong || playlistSongs.length <= 1) return;
    const currentIndex = playlistSongs.findIndex((s) => s.id === currentSong.id);
    const nextIndex = (currentIndex + 1) % playlistSongs.length;
    const nextSong = playlistSongs[nextIndex];
    if (!nextSong || !nextSong.audio_url || nextSong.audio_url === currentSong.audio_url) return;

    const timer = setTimeout(() => {
      if (typeof window !== "undefined" && typeof Audio !== "undefined") {
        if (!preloadAudioRef.current) {
          preloadAudioRef.current = new Audio();
        }
        preloadAudioRef.current.src = nextSong.audio_url;
        preloadAudioRef.current.preload = "auto";
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [currentSong, playlistSongs]);

  // 媒体会话联动（支持键盘快捷键、锁屏与系统控制中心原生切歌）
  useEffect(() => {
    if (!currentSong || typeof window === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.title,
      artist: currentSong.artist,
      album: currentSong.album || "Playlist",
      artwork: currentSong.cover_url
        ? [
            { src: currentSong.cover_url, sizes: "128x128", type: "image/jpeg" },
            { src: currentSong.cover_url, sizes: "256x256", type: "image/jpeg" },
            { src: currentSong.cover_url, sizes: "512x512", type: "image/jpeg" },
          ]
        : [],
    });

    navigator.mediaSession.setActionHandler("play", () => {
      audioRef.current?.play();
      setIsPlaying(true);
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      audioRef.current?.pause();
      setIsPlaying(false);
    });
    navigator.mediaSession.setActionHandler("previoustrack", handlePrev);
    navigator.mediaSession.setActionHandler("nexttrack", handleNext);
  }, [currentSong]);

  // ⚡ 核心无感切歌管线：直接调度原生音频驱动，避免定时器与 React DOM 冲突
  const performSeamlessSwitch = (targetSong: Song, newPlaylist?: Song[]) => {
    if (newPlaylist && newPlaylist.length > 0) {
      setPlaylistSongs(newPlaylist);
    }
    const audio = audioRef.current;
    setCurrentSong(targetSong);
    setCurrentTime(0);

    if (audio) {
      const targetVol = isMuted ? 0 : volume;
      audio.volume = targetVol;
      if (audio.src !== targetSong.audio_url) {
        audio.src = targetSong.audio_url;
        audio.load();
      }
      audio.currentTime = 0;
      audio.play().catch((err) => {
        console.warn("[Audio Play] 播放启动拦截:", err);
      });
    }
  };

  const playSong = (song: Song, playlist?: Song[]) => {
    if (currentSong?.id === song.id) {
      togglePlay();
      return;
    }
    performSeamlessSwitch(song, playlist);
  };

  const playAll = (songs: Song[]) => {
    if (!songs || songs.length === 0) return;
    performSeamlessSwitch(songs[0], songs);
  };

  const togglePlay = () => {
    if (!currentSong) return;
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.volume = isMuted ? 0 : volume;
      audio.play().catch(console.warn);
    } else {
      audio.pause();
    }
  };

  const toggleShuffle = () => {
    setIsShuffle((prev) => !prev);
  };

  const toggleRepeat = () => {
    setRepeatMode((prev) => {
      if (prev === "off") return "all";
      if (prev === "all") return "one";
      return "off";
    });
  };

  const handleNext = () => {
    if (!playlistSongs.length || !currentSong) return;
    if (repeatMode === "one" && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      return;
    }
    if (isShuffle && playlistSongs.length > 1) {
      let randomIndex = Math.floor(Math.random() * playlistSongs.length);
      while (playlistSongs[randomIndex].id === currentSong.id) {
        randomIndex = Math.floor(Math.random() * playlistSongs.length);
      }
      performSeamlessSwitch(playlistSongs[randomIndex]);
      return;
    }
    const currentIndex = playlistSongs.findIndex((s) => s.id === currentSong.id);
    const nextIndex = (currentIndex + 1) % playlistSongs.length;
    performSeamlessSwitch(playlistSongs[nextIndex]);
  };

  const handlePrev = () => {
    if (!playlistSongs.length || !currentSong) return;
    if (currentTime > 3 && audioRef.current) {
      audioRef.current.currentTime = 0;
      return;
    }
    const currentIndex = playlistSongs.findIndex((s) => s.id === currentSong.id);
    const prevIndex = (currentIndex - 1 + playlistSongs.length) % playlistSongs.length;
    performSeamlessSwitch(playlistSongs[prevIndex]);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = target;
      setCurrentTime(target);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setVolume(value);
    if (audioRef.current) audioRef.current.volume = value;
    setIsMuted(value === 0);
  };

  const handleToggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      const val = volume || 0.85;
      audioRef.current.volume = val;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const closePlayer = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setCurrentSong(null);
  };

  const formatTime = (time: number) => {
    if (!Number.isFinite(time) || time < 0) return "00:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <MusicContext.Provider
      value={{
        currentSong,
        playlistSongs,
        isPlaying,
        isShuffle,
        repeatMode,
        playSong,
        playAll,
        togglePlay,
        toggleShuffle,
        toggleRepeat,
        closePlayer,
      }}
    >
      {children}

      {/* 原生持久化音频驱动（始终常驻，由 audioRef 直接控制，避免 React 属性 diff 打断播放管线） */}
      <audio
        ref={audioRef}
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() =>
          audioRef.current && setCurrentTime(audioRef.current.currentTime)
        }
        onLoadedMetadata={() =>
          audioRef.current && setDuration(audioRef.current.duration || 0)
        }
        onEnded={handleNext}
        onError={(e) => {
          if (!currentSong) return;
          console.warn(`[Audio Error] 歌曲《${currentSong.title}》音频加载失败:`, e);
          const audio = audioRef.current;
          if (audio && currentSong) {
            const match = (currentSong.audio_url || "").match(/(\d+)\.mp3/);
            const neteaseId = match ? match[1] : (currentSong as any).netease_id;
            const fallbackStream = neteaseId ? `/api/music/stream?id=${neteaseId}` : null;
            if (fallbackStream && !audio.src.includes("/api/music/stream")) {
              console.log(`[Audio Fallback] 正在无缝切换到备用音频流: ${fallbackStream}`);
              audio.src = fallbackStream;
              audio.load();
              audio.play().catch(() => setIsPlaying(false));
              return;
            }
          }
          setIsPlaying(false);
        }}
      />

      {/* 全局底部持久化浮动播放器（用户未播放时零 JS 负担） */}
      {currentSong && (
        <LazyMusicPlayer
          currentSong={currentSong}
          playlistSongs={playlistSongs}
          isPlaying={isPlaying}
          isShuffle={isShuffle}
          repeatMode={repeatMode}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          isMuted={isMuted}
          onTogglePlay={togglePlay}
          onToggleShuffle={toggleShuffle}
          onToggleRepeat={toggleRepeat}
          onPrev={handlePrev}
          onNext={handleNext}
          onSeek={handleSeek}
          onVolumeChange={handleVolumeChange}
          onToggleMute={handleToggleMute}
          onSelectSong={(song) => playSong(song)}
          onClose={closePlayer}
          formatTime={formatTime}
        />
      )}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error("useMusic must be used within a MusicProvider");
  }
  return context;
}