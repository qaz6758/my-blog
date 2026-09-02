// components/playlist/MusicPlayer.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  X,
} from "lucide-react";
import { Song } from "@/components/playlist/SongList";
import { RepeatMode } from "@/components/playlist/MusicContext";
import { ImmersivePlayerModal } from "@/components/playlist/ImmersivePlayerModal";

interface MusicPlayerProps {
  currentSong: Song;
  playlistSongs?: Song[];
  isPlaying: boolean;
  isShuffle?: boolean;
  repeatMode?: RepeatMode;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  onTogglePlay: () => void;
  onToggleShuffle?: () => void;
  onToggleRepeat?: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleMute: () => void;
  onSelectSong?: (song: Song) => void;
  onClose?: () => void;
  formatTime: (time: number) => string;
}

export function MusicPlayer({
  currentSong,
  playlistSongs = [],
  isPlaying,
  isShuffle = false,
  repeatMode = "all",
  currentTime,
  duration,
  volume,
  isMuted,
  onTogglePlay,
  onToggleShuffle,
  onToggleRepeat,
  onPrev,
  onNext,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onSelectSong,
  formatTime,
}: MusicPlayerProps) {
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showVolumeCapsule, setShowVolumeCapsule] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // CRT 示波器关机动画状态
  const [isDismissed, setIsDismissed] = useState(false);
  const [isCrtCollapsing, setIsCrtCollapsing] = useState(false);
  const [pressProgress, setPressProgress] = useState(0);
  const [isPressing, setIsPressing] = useState(false);

  const listRef = useRef<HTMLDivElement | null>(null);
  const pressStartTimeRef = useRef<number | null>(null);
  const pressAnimFrameRef = useRef<number | null>(null);
  const wasLongPressRef = useRef(false);
  const volumeHoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 音量鼠标离开时立即优雅收起
  const handleVolumeMouseLeave = () => {
    setShowVolumeCapsule(false);
  };

  // 播放新歌时自动唤醒展示
  useEffect(() => {
    if (isPlaying) {
      setIsDismissed(false);
      setIsCrtCollapsing(false);
    }
  }, [isPlaying, currentSong?.id]);

  // 点击外部收起弹层
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        setShowPlaylist(false);
        setShowVolumeCapsule(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 长按收起按钮触发彻底关闭
  const LONG_PRESS_MS = 1200;

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    pressStartTimeRef.current = Date.now();
    wasLongPressRef.current = false;
    setIsPressing(true);

    const updateLoop = () => {
      if (!pressStartTimeRef.current) return;
      const elapsed = Date.now() - pressStartTimeRef.current;
      const progress = Math.min(elapsed / LONG_PRESS_MS, 1);
      setPressProgress(progress);

      if (progress < 1) {
        pressAnimFrameRef.current = requestAnimationFrame(updateLoop);
      } else {
        wasLongPressRef.current = true;
        triggerCrtShutdown();
      }
    };

    pressAnimFrameRef.current = requestAnimationFrame(updateLoop);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (pressAnimFrameRef.current) {
      cancelAnimationFrame(pressAnimFrameRef.current);
      pressAnimFrameRef.current = null;
    }

    if (pressStartTimeRef.current) {
      const elapsed = Date.now() - pressStartTimeRef.current;
      if (!wasLongPressRef.current && elapsed < 400) {
        setShowPlaylist(false);
        setShowVolumeCapsule(false);
        setTimeout(() => {
          setIsCollapsed(true);
        }, 16);
      }
    }

    pressStartTimeRef.current = null;
    setIsPressing(false);
    setPressProgress(0);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (pressAnimFrameRef.current) {
      cancelAnimationFrame(pressAnimFrameRef.current);
      pressAnimFrameRef.current = null;
    }

    pressStartTimeRef.current = null;
    setIsPressing(false);
    setPressProgress(0);
  };

  const triggerCrtShutdown = () => {
    if (pressAnimFrameRef.current) {
      cancelAnimationFrame(pressAnimFrameRef.current);
      pressAnimFrameRef.current = null;
    }

    pressStartTimeRef.current = null;
    setIsPressing(false);
    setPressProgress(0);

    if (isPlaying) {
      onTogglePlay();
    }

    setIsCrtCollapsing(true);

    setTimeout(() => {
      setIsDismissed(true);
      setIsCrtCollapsing(false);
      setIsCollapsed(false);
    }, 550);
  };

  const progressPercent =
    duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  const ringRadius = 13;
  const ringCircumference = 2 * Math.PI * ringRadius;

  if (isDismissed) {
    return null;
  }

  return (
    <>
      {/* Apple 大屏全屏沉浸播放界面 */}
      <ImmersivePlayerModal
        isOpen={isExpanded}
        onClose={() => setIsExpanded(false)}
        currentSong={currentSong}
        isPlaying={isPlaying}
        isShuffle={isShuffle}
        repeatMode={repeatMode}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        onTogglePlay={onTogglePlay}
        onToggleShuffle={onToggleShuffle}
        onToggleRepeat={onToggleRepeat}
        onPrev={onPrev}
        onNext={onNext}
        onSeek={onSeek}
        onVolumeChange={onVolumeChange}
        onToggleMute={onToggleMute}
        formatTime={formatTime}
      />

      {/* 底部浮动播放器 */}
      <aside
        style={{
          position: "fixed",
          bottom: "24px",
          left: 0,
          right: 0,
          top: "auto",
          zIndex: 9999,
        }}
        className="flex justify-center px-3 sm:px-6 pointer-events-none select-none antialiased"
      >
        <div
          ref={listRef}
          className="relative w-full max-w-[700px] flex justify-start pointer-events-none"
        >
          {/* 待播清单弹层 */}
          <AnimatePresence>
            {showPlaylist && !isCollapsed && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-16 left-0 right-0 sm:left-auto sm:right-2 sm:w-84 rounded-2xl border border-black/10 dark:border-white/[0.12] bg-white/95 dark:bg-[#1c1c1e]/95 p-4 shadow-[0_25px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_50px_rgba(0,0,0,0.7)] backdrop-blur-3xl text-neutral-900 dark:text-white pointer-events-auto"
              >
                <div className="flex items-center justify-between pb-3 border-b border-black/[0.08] dark:border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-4 w-4 text-[#FA2D48]"
                    >
                      <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h10v2H4v-2zm14-1v6l5-3-5-3z" />
                    </svg>
                    <h3 className="text-xs font-semibold tracking-wide">
                      待播清单
                    </h3>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      ({playlistSongs.length})
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPlaylist(false)}
                    className="rounded-lg p-1 text-neutral-400 hover:text-neutral-900 hover:bg-black/5 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-2 max-h-60 overflow-y-auto space-y-1 pr-1">
                  {playlistSongs.map((song, idx) => {
                    const isCurrent = song.id === currentSong.id;
                    return (
                      <button
                        key={song.id || idx}
                        type="button"
                        onClick={() => onSelectSong?.(song)}
                        className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left transition-colors cursor-pointer ${
                          isCurrent
                            ? "bg-black/5 dark:bg-white/10 text-neutral-950 dark:text-white font-medium"
                            : "text-neutral-700 dark:text-neutral-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-neutral-950 dark:hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <img
                            src={song.cover_url}
                            alt={song.title}
                            className="h-7 w-7 rounded-[4px] object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium">
                              {song.title}
                            </p>
                            <p className="truncate text-[10px] text-neutral-400">
                              {song.artist}
                            </p>
                          </div>
                        </div>

                        {isCurrent && (
                          <span className="flex h-1.5 w-1.5 rounded-full bg-[#FA2D48] shadow-[0_0_8px_rgba(250,45,72,0.9)] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 播放器胶囊主体 (丝滑物理弹簧容器) */}
          <motion.div
            initial={false}
            animate={{
              width: isCollapsed ? 56 : "100%",
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 27,
              mass: 0.7,
            }}
            style={{ willChange: "width, transform" }}
            className={`pointer-events-auto relative flex h-[54px] sm:h-[60px] items-center rounded-full border border-black/10 dark:border-white/[0.15] bg-white/90 dark:bg-[#18181a]/90 shadow-[0_15px_40px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-3xl overflow-hidden ${
              isCrtCollapsing ? "animate-crt-collapse" : ""
            } ${
              isCollapsed
                ? "cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                : ""
            }`}
            onClick={(e) => {
              if (isCollapsed) {
                e.stopPropagation();
                setIsCollapsed(false);
              }
            }}
            title={isCollapsed ? `${currentSong.title} — 点击展开播放器` : undefined}
          >
            {/* ============================================================== */}
            {/* 图层 1：收起态 精致旋转黑胶唱片 (绝对居中平滑淡入淡出) */}
            {/* ============================================================== */}
            <motion.div
              initial={false}
              animate={{
                opacity: isCollapsed ? 1 : 0,
                scale: isCollapsed ? 1 : 0.72,
                pointerEvents: isCollapsed ? "auto" : "none",
              }}
              transition={{
                opacity: { duration: isCollapsed ? 0.24 : 0.12, delay: isCollapsed ? 0.04 : 0 },
                scale: { duration: 0.26, ease: [0.16, 1, 0.3, 1] },
              }}
              className="absolute inset-0 flex items-center justify-center select-none cursor-pointer z-20"
              onClick={(e) => {
                e.stopPropagation();
                setIsCollapsed(false);
              }}
            >
              <div className="relative h-[44px] w-[44px] sm:h-[48px] sm:w-[48px] rounded-full overflow-hidden bg-black p-[2px] ring-1 ring-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.5)] flex items-center justify-center">
                <img
                  src={currentSong.cover_url}
                  alt={currentSong.title}
                  className={`h-full w-full rounded-full object-cover ${
                    isPlaying ? "animate-spin [animation-duration:6s]" : ""
                  }`}
                />
                <div className="absolute inset-0 m-auto h-[10px] w-[10px] rounded-full bg-white/90 border border-black/40 shadow-xs" />
                <div className="absolute inset-0 m-auto h-[4px] w-[4px] rounded-full bg-neutral-900" />
              </div>
            </motion.div>

            {/* ============================================================== */}
            {/* 图层 2：展开态 完整控制器 (保持自然宽度，滑动揭示) */}
            {/* ============================================================== */}
            <motion.div
              initial={false}
              animate={{
                opacity: isCollapsed ? 0 : 1,
                scale: isCollapsed ? 0.94 : 1,
                pointerEvents: isCollapsed ? "none" : "auto",
              }}
              transition={{
                opacity: { duration: isCollapsed ? 0.14 : 0.28, delay: isCollapsed ? 0 : 0.05 },
                scale: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
              }}
              className="relative flex h-full w-full min-w-[320px] sm:min-w-[620px] items-center justify-between gap-2 sm:gap-4 px-2.5 sm:px-4 z-10"
            >
              {/* 移动端左侧：封面与歌曲信息 */}
              <div className="flex sm:hidden flex-1 items-center gap-2.5 min-w-0 pr-1">
                <div
                  onClick={() => setIsExpanded(true)}
                  className="group/cover relative h-8 w-8 rounded-[4.5px] overflow-hidden shrink-0 ring-1 ring-black/10 dark:ring-white/15 shadow-sm cursor-pointer active:scale-95 transition-transform"
                  title="点击展开全屏大屏沉浸界面"
                >
                  <img
                    src={currentSong.cover_url}
                    alt={currentSong.title}
                    className="h-full w-full object-cover"
                  />
                  {/* 双箭头对向角全屏展开指示图标 */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[0.5px] opacity-0 group-hover/cover:opacity-100 transition-opacity duration-200">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3 w-3 text-white drop-shadow-sm"
                    >
                      <polyline points="9 3 3 3 3 9" />
                      <polyline points="15 21 21 21 21 15" />
                      <line x1="3" y1="3" x2="10" y2="10" />
                      <line x1="21" y1="21" x2="14" y2="14" />
                    </svg>
                  </div>
                </div>

                <div className="flex flex-1 flex-col min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="truncate font-semibold text-[13px] text-neutral-900 dark:text-white tracking-tight leading-none">
                      {currentSong.title}
                    </span>
                    {currentSong.explicit && (
                      <span className="shrink-0 rounded-[2px] bg-neutral-900/10 dark:bg-white/15 px-1 py-0.2 text-[8px] font-bold text-neutral-700 dark:text-neutral-300">
                        E
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-none">
                    {currentSong.artist}
                  </p>
                </div>
              </div>

              {/* PC 端左侧控制组 */}
              <div className="hidden sm:flex relative z-10 h-full items-center gap-2.5 shrink-0 text-neutral-800 dark:text-white">
                <button
                  type="button"
                  onClick={onToggleShuffle}
                  className={`p-1.5 transition-colors cursor-pointer rounded-full hover:bg-black/5 dark:hover:bg-white/10 ${
                    isShuffle
                      ? "text-[#FA2D48]"
                      : "text-neutral-400 hover:text-neutral-900 dark:text-white/40 dark:hover:text-white"
                  }`}
                  title={isShuffle ? "随机播放：开" : "随机播放：关"}
                >
                  <Shuffle className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={onPrev}
                  className="p-1.5 text-neutral-700 hover:text-neutral-950 active:scale-90 dark:text-white/80 dark:hover:text-white transition-transform cursor-pointer rounded-full hover:bg-black/5 dark:hover:bg-white/10"
                  title="上一首"
                >
                  <SkipBack className="h-4 w-4 fill-current stroke-none" />
                </button>

                <button
                  type="button"
                  onClick={onTogglePlay}
                  className="p-2 text-neutral-900 hover:text-black dark:text-white hover:scale-105 active:scale-95 transition-transform cursor-pointer rounded-full bg-black/5 dark:bg-white/10"
                  title={isPlaying ? "暂停" : "播放"}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4 fill-current stroke-none" />
                  ) : (
                    <Play className="ml-0.5 h-4 w-4 fill-current stroke-none" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={onNext}
                  className="p-1.5 text-neutral-700 hover:text-neutral-950 active:scale-90 dark:text-white/80 dark:hover:text-white transition-transform cursor-pointer rounded-full hover:bg-black/5 dark:hover:bg-white/10"
                  title="下一首"
                >
                  <SkipForward className="h-4 w-4 fill-current stroke-none" />
                </button>

                <button
                  type="button"
                  onClick={onToggleRepeat}
                  className={`p-1.5 transition-colors cursor-pointer rounded-full hover:bg-black/5 dark:hover:bg-white/10 ${
                    repeatMode !== "off"
                      ? "text-[#FA2D48]"
                      : "text-neutral-400 hover:text-neutral-900 dark:text-white/40 dark:hover:text-white"
                  }`}
                  title={
                    repeatMode === "one"
                      ? "单曲循环"
                      : repeatMode === "all"
                      ? "列表循环"
                      : "顺序播放"
                  }
                >
                  {repeatMode === "one" ? (
                    <Repeat1 className="h-3.5 w-3.5" />
                  ) : (
                    <Repeat className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              {/* PC 端中间：歌曲与长进度条 */}
              <div className="hidden sm:flex relative z-10 flex-1 h-full items-center gap-3 min-w-0 px-2 group/progress">
                <div
                  onClick={() => setIsExpanded(true)}
                  className="group/cover relative h-8 w-8 rounded-[4.5px] overflow-hidden shrink-0 ring-1 ring-black/10 dark:ring-white/15 shadow-sm cursor-pointer transition-transform duration-200 hover:scale-110"
                  title="展开全屏大屏沉浸界面"
                >
                  <img
                    src={currentSong.cover_url}
                    alt={currentSong.title}
                    className="h-full w-full object-cover"
                  />
                  {/* 双箭头对向角全屏展开指示图标 */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[0.5px] opacity-0 group-hover/cover:opacity-100 transition-opacity duration-200">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3 w-3 text-white drop-shadow-sm"
                    >
                      <polyline points="9 3 3 3 3 9" />
                      <polyline points="15 21 21 21 21 15" />
                      <line x1="3" y1="3" x2="10" y2="10" />
                      <line x1="21" y1="21" x2="14" y2="14" />
                    </svg>
                  </div>
                </div>

                <div className="flex flex-1 flex-col min-w-0 pr-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate font-semibold text-[13px] text-neutral-900 dark:text-white tracking-tight leading-tight">
                      {currentSong.title}
                    </span>
                    {currentSong.explicit && (
                      <span className="shrink-0 rounded-[2px] bg-neutral-900/10 dark:bg-white/15 px-1 py-0.2 text-[8px] font-bold text-neutral-700 dark:text-neutral-300">
                        E
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight mt-0.5">
                    {currentSong.artist} — {currentSong.album || currentSong.title}
                  </p>
                </div>

                {/* 进度条 */}
                <div className="absolute bottom-1 left-2 right-2 flex items-center">
                  <div className="relative w-full h-[2.5px] group-hover/progress:h-[4px] rounded-full bg-black/10 dark:bg-white/15 overflow-hidden transition-all duration-150">
                    <div
                      className="h-full bg-neutral-900 dark:bg-white rounded-full transition-all duration-75"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={Math.min(currentTime, duration || 100)}
                    onChange={onSeek}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer h-3"
                    title={`${formatTime(currentTime)} / ${formatTime(duration)}`}
                  />
                </div>
              </div>

              {/* 移动端右侧：轻量化播放控制组 */}
              <div className="flex sm:hidden relative z-10 items-center gap-1 shrink-0 text-neutral-800 dark:text-white">
                <button
                  type="button"
                  onClick={onPrev}
                  className="p-1 text-neutral-700 dark:text-white/80 active:scale-90 transition-transform cursor-pointer"
                  title="上一首"
                >
                  <SkipBack className="h-4 w-4 fill-current stroke-none" />
                </button>

                <button
                  type="button"
                  onClick={onTogglePlay}
                  className="p-1.5 text-neutral-900 dark:text-white active:scale-95 transition-transform cursor-pointer rounded-full bg-black/5 dark:bg-white/10"
                  title={isPlaying ? "暂停" : "播放"}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4 fill-current stroke-none" />
                  ) : (
                    <Play className="ml-0.5 h-4 w-4 fill-current stroke-none" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={onNext}
                  className="p-1 text-neutral-700 dark:text-white/80 active:scale-90 transition-transform cursor-pointer"
                  title="下一首"
                >
                  <SkipForward className="h-4 w-4 fill-current stroke-none" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowPlaylist((prev) => !prev)}
                  className={`p-1 transition-colors cursor-pointer ${
                    showPlaylist
                      ? "text-[#FA2D48]"
                      : "text-neutral-500 dark:text-white/60"
                  }`}
                  title="待播清单"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h10v2H4v-2zm14-1v6l5-3-5-3z" />
                  </svg>
                </button>

                {/* 移动端收起/关闭按钮 */}
                <div className="relative flex items-center justify-center shrink-0 w-7 h-7 ml-0.5">
                  <svg className="absolute inset-0 h-7 w-7 -rotate-90 pointer-events-none">
                    <circle
                      cx="14"
                      cy="14"
                      r={ringRadius}
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-black/10 dark:text-white/15"
                      fill="transparent"
                    />
                    <circle
                      cx="14"
                      cy="14"
                      r={ringRadius}
                      stroke="currentColor"
                      strokeWidth="2.2"
                      className="text-neutral-900 dark:text-white"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringCircumference * (1 - pressProgress)}
                      fill="transparent"
                      strokeLinecap="round"
                    />
                  </svg>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerCancel}
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-neutral-400 dark:text-white/50 transition-all cursor-pointer relative z-10 select-none ${
                      isPressing ? "scale-90 text-neutral-950 dark:text-white" : ""
                    }`}
                    title="轻按收起为黑胶 / 长按彻底关闭"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3.5 w-3.5 pointer-events-none"
                    >
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* PC 端右侧控制组 */}
              <div className="hidden sm:flex relative z-10 h-full items-center gap-1.5 shrink-0 text-neutral-700 dark:text-white/80">
                <button
                  type="button"
                  onClick={() => setShowPlaylist((prev) => !prev)}
                  className={`p-1.5 rounded-full transition-colors cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 ${
                    showPlaylist
                      ? "text-[#FA2D48]"
                      : "text-neutral-500 hover:text-neutral-900 dark:text-white/60 dark:hover:text-white"
                  }`}
                  title="待播清单"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h10v2H4v-2zm14-1v6l5-3-5-3z" />
                  </svg>
                </button>

                {/* 音量触发按键 (支持点击与鼠标悬停实时唤出) */}
                <button
                  type="button"
                  onClick={() => setShowVolumeCapsule((prev) => !prev)}
                  onMouseEnter={() => setShowVolumeCapsule(true)}
                  className="p-1.5 rounded-full text-neutral-600 hover:text-neutral-900 dark:text-white/70 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title="调节音量"
                >
                  {isMuted || volume === 0 ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5">
                      <path d="M11 5L6 9H2v6h4l5 4V5z" />
                      <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5">
                      <path d="M11 5L6 9H2v6h4l5 4V5z" />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                    </svg>
                  )}
                </button>

                {/* PC 端收起/关闭按钮 */}
                <div className="relative flex items-center justify-center shrink-0 w-8 h-8 ml-0.5">
                  <svg className="absolute inset-0 h-8 w-8 -rotate-90 pointer-events-none">
                    <circle
                      cx="16"
                      cy="16"
                      r={ringRadius}
                      stroke="currentColor"
                      strokeWidth="2.2"
                      className="text-black/10 dark:text-white/15"
                      fill="transparent"
                    />
                    <circle
                      cx="16"
                      cy="16"
                      r={ringRadius}
                      stroke="currentColor"
                      strokeWidth="2.4"
                      className="text-neutral-900 dark:text-white"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringCircumference * (1 - pressProgress)}
                      fill="transparent"
                      strokeLinecap="round"
                    />
                  </svg>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerCancel}
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-neutral-400 dark:text-white/50 hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer relative z-10 select-none ${
                      isPressing ? "scale-90 text-neutral-950 dark:text-white" : ""
                    }`}
                    title="轻按收起为黑胶 / 长按彻底关闭"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3.5 w-3.5 pointer-events-none"
                    >
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* 移动端底部微型进度指示条 */}
              <div className="sm:hidden absolute bottom-0 left-0 right-0 h-[2px] bg-black/5 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-neutral-900 dark:bg-white rounded-full transition-all duration-75"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </motion.div>

            {/* 音量控制胶囊弹层 (支持实时鼠标状态监听自动收起) */}
            <AnimatePresence>
              {showVolumeCapsule && !isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 36, scale: 0.96 }}
                  animate={{ opacity: 1, width: 165, scale: 1 }}
                  exit={{ opacity: 0, width: 36, scale: 0.96 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  onMouseLeave={handleVolumeMouseLeave}
                  className="absolute right-2 top-2 bottom-2 z-30 flex items-center justify-between gap-2.5 rounded-full border border-black/10 dark:border-white/[0.12] bg-white/95 dark:bg-[#222224]/95 px-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.6)] backdrop-blur-3xl overflow-hidden origin-right"
                >
                  <div className="relative flex-1 flex items-center">
                    <div className="w-full h-[4.5px] rounded-full bg-black/10 dark:bg-white/20 overflow-hidden">
                      <div
                        className="h-full bg-neutral-900 dark:bg-white rounded-full"
                        style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                      />
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={isMuted ? 0 : volume}
                      onChange={onVolumeChange}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer h-6"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={onToggleMute}
                    className="text-neutral-700 hover:text-neutral-950 dark:text-white dark:hover:text-white/80 transition-colors p-0.5 cursor-pointer shrink-0"
                    title={isMuted || volume === 0 ? "取消静音" : "静音"}
                  >
                    {isMuted || volume === 0 ? (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                        <path d="M11 5L6 9H2v6h4l5 4V5z" />
                        <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                        <path d="M11 5L6 9H2v6h4l5 4V5z" />
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                      </svg>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </aside>
    </>
  );
}