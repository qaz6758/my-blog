// components/playlist/MusicContext.tsx
"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Song } from "@/components/playlist/SongList";
// ⚡ 懒加载桥接 — 播放器 JS 在用户点击播放前完全不下载
import { LazyMusicPlayer } from "@/components/playlist/LazyMusicPlayer";

interface MusicContextType {
  currentSong: Song | null;
  playlistSongs: Song[];
  isPlaying: boolean;
  playSong: (song: Song, playlist?: Song[]) => void;
  playAll: (songs: Song[]) => void;
  togglePlay: () => void;
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

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    if (isPlaying) {
      audio.play().catch((err) => {
        console.warn("音频播放异常:", err);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSong]);

  const playSong = (song: Song, playlist?: Song[]) => {
    if (playlist && playlist.length > 0) {
      setPlaylistSongs(playlist);
    }
    if (currentSong?.id === song.id) {
      setIsPlaying((prev) => !prev);
    } else {
      setCurrentSong(song);
      setIsPlaying(true);
    }
  };

  const playAll = (songs: Song[]) => {
    if (!songs || songs.length === 0) return;
    setPlaylistSongs(songs);
    setCurrentSong(songs[0]);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (!currentSong) return;
    setIsPlaying((prev) => !prev);
  };

  const handleNext = () => {
    if (!playlistSongs.length || !currentSong) return;
    const currentIndex = playlistSongs.findIndex((s) => s.id === currentSong.id);
    const nextIndex = (currentIndex + 1) % playlistSongs.length;
    setCurrentSong(playlistSongs[nextIndex]);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    if (!playlistSongs.length || !currentSong) return;
    const currentIndex = playlistSongs.findIndex((s) => s.id === currentSong.id);
    const prevIndex = (currentIndex - 1 + playlistSongs.length) % playlistSongs.length;
    setCurrentSong(playlistSongs[prevIndex]);
    setIsPlaying(true);
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
        playSong,
        playAll,
        togglePlay,
        closePlayer,
      }}
    >
      {children}

      {/* 原生音频驱动 */}
      {currentSong && (
        <audio
          ref={audioRef}
          src={currentSong.audio_url}
          preload="metadata"
          onTimeUpdate={() =>
            audioRef.current && setCurrentTime(audioRef.current.currentTime)
          }
          onLoadedMetadata={() =>
            audioRef.current && setDuration(audioRef.current.duration || 0)
          }
          onEnded={handleNext}
          onError={() => {
            console.warn("音频解析失败，播放下一首");
            handleNext();
          }}
        />
      )}

      {/* 全局底部持久化浮动播放器 */}
      <AnimatePresence>
        {currentSong && (
          <LazyMusicPlayer
            currentSong={currentSong}
            playlistSongs={playlistSongs}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            isMuted={isMuted}
            onTogglePlay={togglePlay}
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
      </AnimatePresence>
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error("useMusic 必须在 MusicProvider 内使用");
  }
  return context;
}