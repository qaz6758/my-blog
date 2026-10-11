// src/components/home/RetroMusicWidget.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ArrowUpRight,
  Disc3,
  Music2,
} from "lucide-react";
import { ContentCard } from "@/components/common/ContentCard";
import { useMusic } from "@/components/playlist/MusicContext";
import type { Song } from "@/components/playlist/SongList";

export function RetroMusicWidget({
  initialSongs = [],
}: {
  initialSongs?: Song[];
}) {
  const {
    currentSong,
    isPlaying,
    playlistSongs,
    togglePlay,
    playSong,
    nextSong,
    prevSong,
  } = useMusic();

  const [availableSongs, setAvailableSongs] = useState<Song[]>(initialSongs);
  const [randomSong, setRandomSong] = useState<Song | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [coverError, setCoverError] = useState(false);

  const isSeekingRef = useRef(false);

  // 客户端挂载后安全随机挑选一首曲目，并标记挂载完成
  useEffect(() => {
    setIsMounted(true);
    if (!currentSong) {
      const list = playlistSongs.length > 0 ? playlistSongs : availableSongs;
      if (list.length > 0) {
        const randIdx = Math.floor(Math.random() * list.length);
        setRandomSong(list[randIdx]);
      }
    }
  }, [playlistSongs, availableSongs, currentSong]);

  // 若服务端初值为空且全局歌单未载入，兜底异步抓取
  useEffect(() => {
    if (playlistSongs && playlistSongs.length > 0) {
      setAvailableSongs(playlistSongs);
      return;
    }

    if (availableSongs.length > 0) return;

    let isSubscribed = true;
    fetch("/api/playlist")
      .then((res) => res.json())
      .then((json) => {
        if (!isSubscribed) return;
        if (json?.success && Array.isArray(json?.data) && json.data.length > 0) {
          const allSongs: Song[] = [];
          json.data.forEach((cat: { songs?: Song[] }) => {
            if (Array.isArray(cat.songs)) {
              allSongs.push(...cat.songs);
            }
          });
          if (allSongs.length > 0) {
            setAvailableSongs(allSongs);
            if (!currentSong && !randomSong) {
              const randIdx = Math.floor(Math.random() * allSongs.length);
              setRandomSong(allSongs[randIdx]);
            }
          }
        }
      })
      .catch(() => {});

    return () => {
      isSubscribed = false;
    };
  }, [playlistSongs, currentSong, randomSong, availableSongs.length]);

  // 原生标准事件驱动监听，同步音频进度与时间
  useEffect(() => {
    const audio = document.querySelector("audio");
    if (!audio) return;

    const syncAudioState = () => {
      if (isSeekingRef.current) return;
      const cur = audio.currentTime || 0;
      const dur = audio.duration || 0;
      setCurrentTimeSec(cur);
      setDurationSec(dur);

      if (dur > 0) {
        setAudioProgress(Math.min(100, Math.max(0, (cur / dur) * 100)));
      } else {
        setAudioProgress(0);
      }
    };

    syncAudioState();

    audio.addEventListener("timeupdate", syncAudioState);
    audio.addEventListener("durationchange", syncAudioState);
    audio.addEventListener("loadedmetadata", syncAudioState);
    audio.addEventListener("play", syncAudioState);
    audio.addEventListener("pause", syncAudioState);

    return () => {
      audio.removeEventListener("timeupdate", syncAudioState);
      audio.removeEventListener("durationchange", syncAudioState);
      audio.removeEventListener("loadedmetadata", syncAudioState);
      audio.removeEventListener("play", syncAudioState);
      audio.removeEventListener("pause", syncAudioState);
    };
  }, [currentSong]);

  // 当前展示曲目：若正在播放则以正在播放为准；若已挂载则展示随机挑选的曲目；挂载前为 null 纯黑占位，彻底杜绝首曲闪现
  const songList = playlistSongs.length > 0 ? playlistSongs : availableSongs;
  const activeSong: Song | null = currentSong || (isMounted ? randomSong : null);

  const currentSongIndex = activeSong ? songList.findIndex((s) => s.id === activeSong.id) : -1;

  // 时间格式化 (mm:ss)
  const formatTime = useCallback((timeInSeconds: number) => {
    if (!Number.isFinite(timeInSeconds) || timeInSeconds < 0) return "00:00";
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }, []);

  // 播放 / 暂停处理
  const handleTogglePlay = () => {
    if (currentSong) {
      togglePlay();
    } else if (activeSong) {
      playSong(activeSong, songList);
    } else if (songList.length > 0) {
      const target = randomSong || songList[0];
      playSong(target, songList);
    }
  };

  // 上一首
  const handlePrev = () => {
    if (currentSong && prevSong) {
      prevSong();
    } else if (songList.length > 0) {
      const idx = currentSongIndex >= 0 ? currentSongIndex : 0;
      const prevIdx = (idx - 1 + songList.length) % songList.length;
      playSong(songList[prevIdx], songList);
    }
  };

  // 下一首
  const handleNext = () => {
    if (currentSong && nextSong) {
      nextSong();
    } else if (songList.length > 0) {
      const idx = currentSongIndex >= 0 ? currentSongIndex : 0;
      const nextIdx = (idx + 1) % songList.length;
      playSong(songList[nextIdx], songList);
    }
  };

  // 点击进度条跳转
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = document.querySelector("audio");
    if (!audio) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));

    if (audio.duration && Number.isFinite(audio.duration)) {
      audio.currentTime = pct * audio.duration;
      setAudioProgress(pct * 100);
      setCurrentTimeSec(pct * audio.duration);
    }
  };

  return (
    <ContentCard
      title="Music"
    >
      {/* 1. 主展示区：规整稳定封面 + 歌曲标题与歌手 + 优雅圆角操作键组 */}
      <div className="flex items-center justify-between gap-3">
        {/* 封面与信息 */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* 54x54 规整专辑封面（日间模式纯白方块占位，夜间模式纯黑方块占位，获取后才显示封面） */}
          <div className="relative h-[54px] w-[54px] shrink-0 rounded-[3px] overflow-hidden border border-[#d0d7de] dark:border-white/40 bg-white dark:bg-transparent">
            {activeSong?.cover_url && !coverError ? (
              <Image
                src={activeSong.cover_url}
                alt={activeSong.title || "Cover"}
                fill
                priority
                sizes="54px"
                onError={() => setCoverError(true)}
                className="object-cover"
              />
            ) : null}
          </div>

          {/* 标题与歌手（未获取前以不折行空格占位，杜绝首曲文字跳动与高度位移） */}
          <div className="min-w-0 flex-1">
            <h3 className="text-[14px] sm:text-[15px] font-bold text-[#24292f] dark:text-white truncate leading-tight">
              {activeSong?.title || "\u00A0"}
            </h3>
            <p className="text-[12px] text-[#57606a] dark:text-[#a1a1aa] truncate mt-1 leading-tight">
              {activeSong?.artist || "\u00A0"}
            </p>
          </div>
        </div>

        {/* 精致操作按键组（去除笨重米白方块，升级为极简圆润质感控件；彻底去除音量按钮） */}
        <div className="flex items-center gap-2 shrink-0 select-none">
          {/* 上一首 */}
          <button
            type="button"
            onClick={handlePrev}
            className="text-neutral-500 hover:text-[#24292f] dark:text-white dark:hover:text-[#33FF33] transition-colors cursor-pointer p-1 active:scale-95"
            title="Previous Track"
          >
            <SkipBack className="h-4 w-4 fill-current" />
          </button>

          {/* 核心播放 / 暂停按钮（高质感圆形实体按键） */}
          <button
            type="button"
            onClick={handleTogglePlay}
            className="h-8 w-8 rounded-full bg-[#24292f] text-white dark:bg-white dark:text-[#141414] hover:scale-105 active:scale-95 shadow-sm flex items-center justify-center cursor-pointer transition-all"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-3.5 w-3.5 fill-current" />
            ) : (
              <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
            )}
          </button>

          {/* 下一首 */}
          <button
            type="button"
            onClick={handleNext}
            className="text-neutral-500 hover:text-[#24292f] dark:text-white dark:hover:text-[#33FF33] transition-colors cursor-pointer p-1 active:scale-95"
            title="Next Track"
          >
            <SkipForward className="h-4 w-4 fill-current" />
          </button>
        </div>
      </div>

      {/* 2. 调谐进度条与两侧时间读数 */}
      <div className="flex flex-col gap-1 w-full pt-2">
        {/* 点击触发热区与细线轨道 */}
        <div
          onClick={handleProgressClick}
          className="relative w-full h-[6px] flex items-center cursor-pointer group select-none"
          title="Click to seek"
        >
          {/* 进度轨道底色 */}
          <div className="relative h-[2.5px] flex-1 overflow-hidden bg-[#e1e4e8] dark:bg-[#394554] rounded-full">
            {/* 播放进度填色 */}
            <div
              className="absolute left-0 top-0 h-full bg-[#24292f] dark:bg-[#3fb950] transition-all duration-1000 ease-linear"
              style={{ width: `${audioProgress}%` }}
            >
             
            </div>
          </div>
        </div>

        {/* 进度条两侧时间读数 */}
        <div className="flex items-center justify-between text-[11px] font-mono text-[#57606a] dark:text-[#a1a1aa] tabular-nums leading-none">
          <span>{formatTime(currentTimeSec)}</span>
          <span>{formatTime(durationSec)}</span>
        </div>
      </div>
    </ContentCard>
  );
}