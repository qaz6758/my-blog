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
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 🌟 方案 B：CRT 示波器停机与彻底关闭状态
  const [isDismissed, setIsDismissed] = useState(false);
  const [isCrtCollapsing, setIsCrtCollapsing] = useState(false);
  const [pressProgress, setPressProgress] = useState(0);
  const [isPressing, setIsPressing] = useState(false);

  const listRef = useRef<HTMLDivElement | null>(null);
  const pressStartTimeRef = useRef<number | null>(null);
  const pressAnimFrameRef = useRef<number | null>(null);
  const wasLongPressRef = useRef(false);

  // 🌟 1. 核心唤醒机制：只要处于播放状态 (isPlaying) 或切换歌曲时，自动解除关闭状态并唤醒播放器！
  useEffect(() => {
    if (isPlaying) {
      setIsDismissed(false);
      setIsCrtCollapsing(false);
    }
  }, [isPlaying, currentSong?.id]);

  // 2. 点击外部关闭浮层
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        setShowPlaylist(false);
        setShowVolumeCapsule(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 🌟 3. 优化为黄金 1.4 秒精准长按 (PointerCapture 防断触防移位)
  const LONG_PRESS_MS = 1400;

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // 捕获指针事件，即使鼠标微动也 100% 持续追踪
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}

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
        // 达成 1.4 秒长按：触发 CRT 示波器光线压扁湮灭！
        wasLongPressRef.current = true;
        triggerCrtShutdown();
      }
    };

    pressAnimFrameRef.current = requestAnimationFrame(updateLoop);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}

    if (pressAnimFrameRef.current) {
      cancelAnimationFrame(pressAnimFrameRef.current);
      pressAnimFrameRef.current = null;
    }

    if (pressStartTimeRef.current) {
      const elapsed = Date.now() - pressStartTimeRef.current;
      // 若是短按 (< 300ms 且未触发长按)，正常收起为旋转黑胶
      if (!wasLongPressRef.current && elapsed < 300) {
        setShowPlaylist(false);
        setShowVolumeCapsule(false);
        setIsCollapsed(true);
      }
    }

    pressStartTimeRef.current = null;
    setIsPressing(false);
    setPressProgress(0);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}

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

    // 停止播放音乐
    if (isPlaying) {
      onTogglePlay();
    }

    // 启动 CRT 示波器光线压扁湮灭动画
    setIsCrtCollapsing(true);
    setTimeout(() => {
      setIsDismissed(true);
      setIsCrtCollapsing(false);
      setIsCollapsed(false); // 重置折叠状态
    }, 580);
  };

  const progressPercent = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;
  const ringRadius = 12;
  const ringCircumference = 2 * Math.PI * ringRadius;

  if (isDismissed) {
    return null;
  }

  return (
    <>
      {/* ========================================================================= */}
      {/* ===================== Apple 大屏全屏沉浸播放界面 (独立组件) ================= */}
      {/* ========================================================================= */}
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

      {/* ========================================================================= */}
      {/* ===================== 底部浮动播放器 (支持水平形变与 CRT 湮灭) ================= */}
      {/* ========================================================================= */}
      <aside
        style={{
          position: "fixed",
          bottom: "28px",
          left: 0,
          right: 0,
          top: "auto",
          zIndex: 9999,
        }}
        className="flex justify-center px-4 sm:px-6 pointer-events-none select-none antialiased"
      >
        <div ref={listRef} className="relative w-full max-w-[700px] flex justify-start pointer-events-none">
          {/* ===================== 待播清单抽屉（向上弹出） ===================== */}
          <AnimatePresence>
            {showPlaylist && !isCollapsed && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-16 right-0 sm:right-2 w-full sm:w-84 rounded-2xl border border-black/10 dark:border-white/[0.12] bg-white/95 dark:bg-[#1c1c1e]/95 p-4 shadow-[0_25px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_50px_rgba(0,0,0,0.7)] backdrop-blur-3xl text-neutral-900 dark:text-white pointer-events-auto"
              >
                <div className="flex items-center justify-between pb-3 border-b border-black/[0.08] dark:border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    {/* Apple 原生待播清单图标 */}
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-[#FA2D48]">
                      <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h10v2H4v-2zm14-1v6l5-3-5-3z" />
                    </svg>
                    <h3 className="text-xs font-semibold tracking-wide">待播清单</h3>
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
                            <p className="truncate text-xs font-medium">{song.title}</p>
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

          {/* ===================== 🌟 同轴平滑水平形变胶囊 Dock (支持方案 B: CRT 示波器湮灭) ===================== */}
          <motion.div
            initial={false}
            animate={{
              width: isCollapsed ? 62 : "100%",
            }}
            transition={{
              type: "spring",
              stiffness: 360,
              damping: 30,
              mass: 0.8,
            }}
            className={`will-change-transform pointer-events-auto relative flex h-[58px] sm:h-[62px] items-center rounded-full border border-black/10 dark:border-white/[0.15] bg-white/85 dark:bg-[#18181a]/85 shadow-[0_20px_50px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-3xl overflow-hidden ${
              isCrtCollapsing ? "animate-crt-collapse" : ""
            } ${
              isCollapsed
                ? "justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                : "px-3.5 sm:px-5"
            }`}
            onClick={isCollapsed ? () => setIsCollapsed(false) : undefined}
            title={isCollapsed ? `${currentSong.title} — 点击展开播放器` : undefined}
          >
            {/* ---------------- 状态 A：折叠态 (等高 62px 纯正黑胶唱片，无呼吸微光点) ---------------- */}
            {isCollapsed ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.2 }}
                className="relative flex h-full w-full items-center justify-center select-none"
              >
                {/* 黑胶唱片本体 (跟随播放状态优雅旋转) */}
                <div className="relative h-[40px] w-[40px] sm:h-[44px] sm:w-[44px] rounded-full overflow-hidden bg-black p-[2px] ring-1 ring-black/20 dark:ring-white/20 shadow-inner flex items-center justify-center">
                  <img
                    src={currentSong.cover_url}
                    alt={currentSong.title}
                    className={`h-full w-full rounded-full object-cover ${
                      isPlaying ? "animate-spin [animation-duration:6s]" : ""
                    }`}
                  />
                  {/* 黑胶中心轴心金属小孔 */}
                  <div className="absolute inset-0 m-auto h-[8px] w-[8px] rounded-full bg-white dark:bg-[#18181a] border border-black/40 shadow-xs" />
                </div>
              </motion.div>
            ) : (
              /* ---------------- 状态 B：展开态 (高度与父级 100% 对齐，解决进度条错位) ---------------- */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="flex h-full w-full items-center justify-between gap-3 sm:gap-4 min-w-0"
              >
                {/* 1. 左侧：标准 5 键控制组 */}
                <div className="relative z-10 flex h-full items-center gap-2.5 sm:gap-3.5 shrink-0 text-neutral-800 dark:text-white">
                  {/* 随机播放 */}
                  <button
                    type="button"
                    onClick={onToggleShuffle}
                    className={`p-1 transition-colors cursor-pointer ${
                      isShuffle
                        ? "text-[#FA2D48]"
                        : "text-neutral-400 hover:text-neutral-900 dark:text-white/40 dark:hover:text-white"
                    }`}
                    title={isShuffle ? "随机播放：开" : "随机播放：关"}
                  >
                    <Shuffle className="h-3.5 w-3.5" />
                  </button>

                  {/* 上一首 (实心倒三角) */}
                  <button
                    type="button"
                    onClick={onPrev}
                    className="p-1 text-neutral-700 hover:text-neutral-950 active:scale-90 dark:text-white/80 dark:hover:text-white transition-transform cursor-pointer"
                    title="上一首"
                  >
                    <SkipBack className="h-4 w-4 fill-current stroke-none" />
                  </button>

                  {/* 播放 / 暂停 (实心正三角) */}
                  <button
                    type="button"
                    onClick={onTogglePlay}
                    className="p-1 text-neutral-900 hover:text-black dark:text-white hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                    title={isPlaying ? "暂停" : "播放"}
                  >
                    {isPlaying ? (
                      <Pause className="h-4.5 w-4.5 fill-current stroke-none" />
                    ) : (
                      <Play className="ml-0.5 h-4.5 w-4.5 fill-current stroke-none" />
                    )}
                  </button>

                  {/* 下一首 (实心正双三角) */}
                  <button
                    type="button"
                    onClick={onNext}
                    className="p-1 text-neutral-700 hover:text-neutral-950 active:scale-90 dark:text-white/80 dark:hover:text-white transition-transform cursor-pointer"
                    title="下一首"
                  >
                    <SkipForward className="h-4 w-4 fill-current stroke-none" />
                  </button>

                  {/* 循环播放 */}
                  <button
                    type="button"
                    onClick={onToggleRepeat}
                    className={`p-1 transition-colors cursor-pointer ${
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

                {/* 2. 中间：歌曲信息与 Apple 扁平进度条 (h-full 保证进度条精准沉底于胶囊底部) */}
                <div
                  className="relative z-10 flex flex-1 h-full items-center gap-3 min-w-0 px-1.5 group/progress"
                  onMouseEnter={() => setIsHoveringProgress(true)}
                  onMouseLeave={() => setIsHoveringProgress(false)}
                >
                  {/* 封面 (悬浮平滑放大 + 对角双向箭头展开大屏) */}
                  <div
                    onClick={() => setIsExpanded(true)}
                    className="group/cover relative h-7.5 w-7.5 sm:h-8 sm:w-8 rounded-[4.5px] overflow-hidden shrink-0 ring-1 ring-black/10 dark:ring-white/15 shadow-sm cursor-pointer transition-transform duration-200 hover:scale-110"
                    title="展开全屏大屏沉浸界面"
                  >
                    <img
                      src={currentSong.cover_url}
                      alt={currentSong.title}
                      className="h-full w-full object-cover"
                    />

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

                  {/* 歌曲两行信息 */}
                  <div className="flex flex-1 flex-col min-w-0 pr-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate font-semibold text-[13px] text-neutral-900 dark:text-white tracking-tight leading-tight">
                        {currentSong.title}
                      </span>
                      {currentSong.explicit && (
                        <span className="shrink-0 rounded-[2px] bg-neutral-900/10 dark:bg-white/15 px-1 py-0.2 text-[8.5px] font-bold text-neutral-700 dark:text-neutral-300">
                          E
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[11px] text-neutral-500 dark:text-[#98989d] leading-tight mt-0.5">
                      {currentSong.artist} — {currentSong.album || currentSong.title}
                    </p>
                  </div>

                  {/* Apple 原生纯平极细进度底条 */}
                  <div className="absolute bottom-1 sm:bottom-1.5 left-1.5 right-1.5 flex items-center">
                    <div className="relative w-full h-[2.5px] group-hover/progress:h-[3.5px] rounded-full bg-black/10 dark:bg-white/15 overflow-hidden transition-all duration-150">
                      <div
                        className="h-full bg-neutral-900 dark:bg-white transition-all duration-100 rounded-full"
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

                {/* 3. 右侧：清单 + 音量 + 🌟 方案 B 精准 1.4s 长按 CRT 停机 / 短按折叠黑胶 */}
                <div className="relative z-10 flex h-full items-center gap-2 sm:gap-2.5 shrink-0 text-neutral-700 dark:text-white/80">
                  {/* Apple 样式待播清单图标 */}
                  <button
                    type="button"
                    onClick={() => setShowPlaylist((prev) => !prev)}
                    className={`p-1.5 transition-colors cursor-pointer ${
                      showPlaylist ? "text-[#FA2D48]" : "text-neutral-500 hover:text-neutral-900 dark:text-white/60 dark:hover:text-white"
                    }`}
                    title="待播清单"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                      <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h10v2H4v-2zm14-1v6l5-3-5-3z" />
                    </svg>
                  </button>

                  {/* Apple 实心音量喇叭触发按键 */}
                  <button
                    type="button"
                    onClick={() => setShowVolumeCapsule((prev) => !prev)}
                    className="p-1.5 text-neutral-600 hover:text-neutral-950 dark:text-white/70 dark:hover:text-white transition-colors cursor-pointer"
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

                  {/* 🌟 专属向左收起 / 1.4 秒长按 CRT 停机湮灭复合按键 */}
                  <div className="relative flex items-center justify-center shrink-0 w-8 h-8">
                    {/* SVG 环形进度圈 (长按时动态点亮填充) */}
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
                      onPointerDown={handlePointerDown}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerCancel}
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:text-white/50 dark:hover:text-white transition-all cursor-pointer relative z-10 select-none ${
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

                {/* Apple 官方 1:1 右侧贴边紧凑圆润音量胶囊 */}
                <AnimatePresence>
                  {showVolumeCapsule && (
                    <motion.div
                      initial={{ opacity: 0, width: 36, scale: 0.96 }}
                      animate={{ opacity: 1, width: 165, scale: 1 }}
                      exit={{ opacity: 0, width: 36, scale: 0.96 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      onMouseLeave={() => setShowVolumeCapsule(false)}
                      className="absolute right-2 top-2 bottom-2 z-30 flex items-center justify-between gap-2.5 rounded-full border border-black/10 dark:border-white/[0.12] bg-white/95 dark:bg-[#222224]/95 px-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.6)] backdrop-blur-3xl overflow-hidden origin-right"
                    >
                      <div className="relative flex-1 flex items-center">
                        <div className="w-full h-[4.5px] rounded-full bg-black/10 dark:bg-white/20 overflow-hidden">
                          <div
                            className="h-full bg-neutral-900 dark:bg-white rounded-full transition-all duration-75"
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
            )}
          </motion.div>
        </div>
      </aside>
    </>
  );
}