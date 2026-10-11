// components/playlist/MusicContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useEffectEvent,
  useCallback,
  useMemo,
} from "react";
import { Song } from "@/components/playlist/SongList";




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
  nextSong?: () => void;
  prevSong?: () => void;
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

  // ⚡ 核心无感切歌管线：直接调度原生音频驱动，避免定时器与 React DOM 冲突
  const performSeamlessSwitch = useCallback(
    (targetSong: Song, newPlaylist?: Song[]) => {
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
    },
    [isMuted, volume]
  );

  const togglePlay = useCallback(() => {
    if (!currentSong) return;
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.volume = isMuted ? 0 : volume;
      audio.play().catch(console.warn);
    } else {
      audio.pause();
    }
  }, [currentSong, isMuted, volume]);

  const playSong = useCallback((song: Song, playlist?: Song[]) => {
    if (currentSong?.id === song.id) {
      togglePlay();
      return;
    }
    performSeamlessSwitch(song, playlist);
  }, [currentSong, performSeamlessSwitch, togglePlay]);

  const playAll = useCallback((songs: Song[]) => {
    if (!songs || songs.length === 0) return;
    performSeamlessSwitch(songs[0], songs);
  }, [performSeamlessSwitch]);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev);
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === "off") return "all";
      if (prev === "all") return "one";
      return "off";
    });
  }, []);

  const handleNext = useCallback(() => {
    if (!playlistSongs.length || !currentSong) return;
    if (repeatMode === "one" && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.warn);
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
  }, [playlistSongs, currentSong, repeatMode, isShuffle, performSeamlessSwitch]);

  const handlePrev = useCallback(() => {
    if (!playlistSongs.length || !currentSong) return;
    const currentIndex = playlistSongs.findIndex((s) => s.id === currentSong.id);
    const prevIndex = (currentIndex - 1 + playlistSongs.length) % playlistSongs.length;
    performSeamlessSwitch(playlistSongs[prevIndex]);
  }, [playlistSongs, currentSong, performSeamlessSwitch]);

  const handleMediaSessionPlay = useEffectEvent(() => {
    audioRef.current?.play();
    setIsPlaying(true);
  });
  const handleMediaSessionPause = useEffectEvent(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  });
  const handleMediaSessionPrev = useEffectEvent(handlePrev);
  const handleMediaSessionNext = useEffectEvent(handleNext);

  // 媒体会话联动（支持键盘快捷键、锁屏与系统控制中心原生切歌）
  useEffect(() => {
    if (!currentSong || typeof window === "undefined" || !("mediaSession" in navigator)) return;
    const mediaSession = navigator.mediaSession;
    mediaSession.metadata = new MediaMetadata({
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

    mediaSession.setActionHandler("play", handleMediaSessionPlay);
    mediaSession.setActionHandler("pause", handleMediaSessionPause);
    mediaSession.setActionHandler("previoustrack", handleMediaSessionPrev);
    mediaSession.setActionHandler("nexttrack", handleMediaSessionNext);

    return () => {
      mediaSession.setActionHandler("play", null);
      mediaSession.setActionHandler("pause", null);
      mediaSession.setActionHandler("previoustrack", null);
      mediaSession.setActionHandler("nexttrack", null);
    };
  }, [currentSong]);

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

  const handleAdjustVolume = (delta: number) => {
    if (!audioRef.current) return;
    const base = isMuted ? 0 : volume;
    const nextVal = Math.max(0, Math.min(1, Math.round((base + delta) * 100) / 100));
    setVolume(nextVal);
    audioRef.current.volume = nextVal;
    setIsMuted(nextVal === 0);
  };

  const closePlayer = useCallback(() => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setCurrentSong(null);
  }, []);

  const formatTime = (time: number) => {
    if (!Number.isFinite(time) || time < 0) return "00:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const musicContextValue = useMemo<MusicContextType>(
    () => ({
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
      nextSong: handleNext,
      prevSong: handlePrev,
    }),
    [
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
      handleNext,
      handlePrev,
    ]
  );

  return (
    <MusicContext.Provider
      value={musicContextValue}
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
            const neteaseId = match ? match[1] : currentSong.netease_id;
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