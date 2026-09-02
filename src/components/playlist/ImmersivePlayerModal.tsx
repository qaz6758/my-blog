// components/playlist/ImmersivePlayerModal.tsx
"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Shuffle,
  Repeat,
  Repeat1,
  X,
} from "lucide-react";
import { Song } from "@/components/playlist/SongList";
import { RepeatMode } from "@/components/playlist/MusicContext";
import { NeatFluidBackground } from "@/components/playlist/NeatFluidBackground";

export interface ImmersivePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSong: Song;
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
  formatTime?: (time: number) => string;
}

export function ImmersivePlayerModal({
  isOpen,
  onClose,
  currentSong,
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
}: ImmersivePlayerModalProps) {
  // ESC 键退出大屏沉浸界面
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // 展开时锁定背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Apple 原生时间格式：无前导零 (0:04, 1:26, 12:05)
  const formatAppleTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const progressPercent = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;
  const remainingTime = duration > currentTime ? duration - currentTime : 0;
  const currentVolumePercent = isMuted ? 0 : volume * 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="will-change-transform fixed inset-0 z-[100000] flex flex-col justify-between overflow-hidden select-none antialiased bg-neutral-950 text-white"
          style={{ transform: "translateZ(0)" }}
        >
          {/* ================= 1. Apple 官方同款 WebGL 动态流体流光溢彩背景 (@firecms/neat 驱动) ================= */}
          <NeatFluidBackground coverUrl={currentSong.cover_url} />

          {/* ================= 2. 顶部导航操作栏 (极简纯白无底圈 X 图标) ================= */}
          <div className="relative z-10 flex items-center justify-between px-6 sm:px-12 pt-6 sm:pt-8">
            <button
              type="button"
              onClick={onClose}
              className="text-white/60 hover:text-white transition-opacity p-2 -ml-2 cursor-pointer"
              title="关闭全屏 (Esc)"
            >
              <X className="h-6 w-6 stroke-[2]" />
            </button>
          </div>

          {/* ================= 3. Apple 官方同款 CSS Grid 排版引擎容器 ================= */}
          <article className="relative z-10 flex-1 w-full grid grid-cols-[minmax(0,600px)] justify-center items-center px-6 sm:px-8 py-2">
            <div
              data-testid="lyrics-controls"
              className="w-full grid grid-cols-[minmax(0,100%)] justify-items-center gap-y-5 sm:gap-y-6"
            >
              {/* 巨幅专辑封面 (Apple 官方 600px 网格自适应大尺寸 + 20px 唱片圆角 + 深度投影) */}
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="relative aspect-square w-full max-w-[480px] sm:max-w-[540px] rounded-[18px] sm:rounded-[22px] overflow-hidden shadow-[0_30px_80px_-15px_rgba(0,0,0,0.85)] ring-1 ring-white/15 justify-self-center"
              >
                <img
                  src={currentSong.cover_url}
                  alt={currentSong.title}
                  className="h-full w-full object-cover"
                />
              </motion.div>

              {/* 歌曲信息 (网格轨道 100% 等宽左对齐排版) */}
              <div className="w-full max-w-[480px] sm:max-w-[540px] justify-self-center">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-[23px] font-bold text-white tracking-tight truncate leading-tight">
                    {currentSong.title}
                  </h2>
                  {currentSong.explicit && (
                    <span className="shrink-0 rounded-[3px] bg-white/20 px-1.5 py-0.2 text-[9px] font-bold text-white">
                      E
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm sm:text-[15px] font-medium text-white/65 truncate">
                  {currentSong.artist} — {currentSong.album || currentSong.title}
                </p>
              </div>

              {/* 极简流线进度条 (带纯白圆点滑块 Thumb + 0:04 / -1:26 格式) */}
              <div className="w-full max-w-[480px] sm:max-w-[540px] justify-self-center">
                <div className="relative flex items-center group/prog cursor-pointer">
                  {/* 底槽与已播放进度 (极细 2.5px 粗细) */}
                  <div className="w-full h-[2.5px] sm:h-[3px] rounded-full bg-white/20 overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-75 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  {/* 纯白圆形调节小滑块 (Thumb) */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 -ml-1.5 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.6)] pointer-events-none transition-transform duration-75 group-hover/prog:scale-110"
                    style={{ left: `${progressPercent}%` }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={Math.min(currentTime, duration || 100)}
                    onChange={onSeek}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer h-4"
                  />
                </div>

                {/* Apple 经典 0:04 / -1:26 时间排版 (紧随进度条正下方) */}
                <div className="mt-1.5 flex items-center justify-between text-xs font-normal text-white/50 tracking-normal tabular-nums font-sans">
                  <span>{formatAppleTime(currentTime)}</span>
                  <span>-{formatAppleTime(remainingTime)}</span>
                </div>
              </div>

              {/* 播放控制五键组 (实心双三角 ◀◀ / ▶▶ + 纯白实心正三角/双竖线) */}
              <div className="w-full max-w-[340px] sm:max-w-[360px] flex items-center justify-between text-white justify-self-center pt-1">
                {/* 随机播放 */}
                <button
                  type="button"
                  onClick={onToggleShuffle}
                  className={`p-2 transition-colors cursor-pointer ${
                    isShuffle ? "text-[#FA2D48]" : "text-white/40 hover:text-white"
                  }`}
                  title={isShuffle ? "随机播放：开" : "随机播放：关"}
                >
                  <Shuffle className="h-4.5 w-4.5" />
                </button>

                {/* 上一首 (Apple 官方同款实心双三角 ◀◀) */}
                <button
                  type="button"
                  onClick={onPrev}
                  className="p-2 text-white/80 hover:text-white active:scale-90 transition-transform cursor-pointer"
                  title="上一首"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5.5 w-5.5 sm:h-6 sm:w-6">
                    <path d="M11 18V6l-8.5 6 8.5 6zm9.5 0V6L12 12l8.5 6z" />
                  </svg>
                </button>

                {/* 播放 / 暂停 (纯白实心图标，无任何多余圆圈底色) */}
                <button
                  type="button"
                  onClick={onTogglePlay}
                  className="p-2 text-white hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                  title={isPlaying ? "暂停" : "播放"}
                >
                  {isPlaying ? (
                    <Pause className="h-8 w-8 sm:h-9 sm:w-9 fill-current stroke-none" />
                  ) : (
                    <Play className="ml-1 h-8 w-8 sm:h-9 sm:w-9 fill-current stroke-none" />
                  )}
                </button>

                {/* 下一首 (Apple 官方同款实心双三角 ▶▶) */}
                <button
                  type="button"
                  onClick={onNext}
                  className="p-2 text-white/80 hover:text-white active:scale-90 transition-transform cursor-pointer"
                  title="下一首"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5.5 w-5.5 sm:h-6 sm:w-6">
                    <path d="M3.5 6v12l8.5-6-8.5-6zm9.5 0v12l8.5-6-8.5-6z" />
                  </svg>
                </button>

                {/* 循环播放 */}
                <button
                  type="button"
                  onClick={onToggleRepeat}
                  className={`p-2 transition-colors cursor-pointer ${
                    repeatMode !== "off" ? "text-[#FA2D48]" : "text-white/40 hover:text-white"
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
                    <Repeat1 className="h-4.5 w-4.5" />
                  ) : (
                    <Repeat className="h-4.5 w-4.5" />
                  )}
                </button>
              </div>

              {/* 底部音量调节条 (粗细 1:1 匹配上方进度条，带纯白圆点滑块，与中轴严格等宽) */}
              <div className="w-full max-w-[480px] sm:max-w-[540px] flex items-center gap-3 text-white/60 justify-self-center pt-1">
                {/* 左侧极简小喇叭 */}
                <button
                  type="button"
                  onClick={onToggleMute}
                  className="hover:text-white transition-colors cursor-pointer shrink-0"
                  title={isMuted ? "取消静音" : "静音"}
                >
                  {isMuted || volume === 0 ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 sm:h-4 sm:w-4">
                      <path d="M11 5L6 9H2v6h4l5 4V5z" />
                      <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 sm:h-4 sm:w-4">
                      <path d="M11 5L6 9H2v6h4l5 4V5z" />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                    </svg>
                  )}
                </button>

                {/* 音量滑轨 (粗细与上方进度条 100% 一致：h-[2.5px] sm:h-[3px] + 纯白滑块) */}
                <div className="relative flex-1 flex items-center group/vol">
                  <div className="w-full h-[2.5px] sm:h-[3px] rounded-full bg-white/20 overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-75 rounded-full"
                      style={{ width: `${currentVolumePercent}%` }}
                    />
                  </div>
                  {/* 纯白圆形调节小滑块 (Thumb) */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 -ml-1.5 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.6)] pointer-events-none transition-transform duration-75 group-hover/vol:scale-110"
                    style={{ left: `${currentVolumePercent}%` }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={isMuted ? 0 : volume}
                    onChange={onVolumeChange}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer h-5"
                  />
                </div>
              </div>
            </div>
          </article>

          {/* 4. 底部留白平衡 */}
          <div className="h-4 sm:h-8" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
