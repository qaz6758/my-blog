// components/playlist/ImmersivePlayerModal.tsx
"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Shuffle,
  Repeat,
  Repeat1,
  X,
  Quote,
} from "lucide-react";
import { getSongCover, Song } from "@/components/playlist/SongList";
import { RepeatMode } from "@/components/playlist/MusicContext";
import { NeatFluidBackground } from "@/components/playlist/NeatFluidBackground";
import { getProxyImageUrl } from "@/lib/image-proxy";
import { fetchSongLyrics, LyricResult } from "@/lib/lyrics";
import { LyricsView } from "@/components/playlist/LyricsView";

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
  onSeekTime?: (time: number) => void;
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAdjustVolume?: (delta: number) => void;
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
  onSeekTime,
  onVolumeChange,
  onAdjustVolume,
  onToggleMute,
}: ImmersivePlayerModalProps) {
  const [showLyrics, setShowLyrics] = useState(true);
  const [lyricsData, setLyricsData] = useState<LyricResult | null>(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);

  // 歌曲切换时优先尝试逐词歌词，缺失时回退到已有的逐行歌词。
  useEffect(() => {
    if (!currentSong || !isOpen) return;
    let canceled = false;
    setIsLoadingLyrics(true);

    fetchSongLyrics(currentSong)
      .then((data) => {
        if (!canceled) {
          setLyricsData(data);
          setIsLoadingLyrics(false);
        }
      })
      .catch((err) => {
        if (!canceled) {
          console.warn("[Lyrics] fetch error:", err);
          setIsLoadingLyrics(false);
        }
      });

    return () => {
      canceled = true;
    };
  }, [currentSong?.id, currentSong?.audio_url, isOpen]);

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

  const rawCover = getSongCover(currentSong);
  const activeCover =
    getProxyImageUrl(rawCover) ||
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80";

  // 控制器组件模块
  const renderControls = () => (
    <div className="w-full flex flex-col items-center gap-y-3.5 sm:gap-y-4">
      {/* 极简流线进度条 (带纯白圆点滑块 Thumb + 0:04 / -1:26 格式，两端严格对齐) */}
      <div className="w-full">
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
      <div className="w-full flex items-center justify-between text-white pt-1">
        {/* 随机播放 */}
        <button
          type="button"
          onClick={onToggleShuffle}
          className={`p-2 -ml-2 transition-colors cursor-pointer ${
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

        {/* 播放 / 暂停 (纯白实心图标) */}
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
          className={`p-2 -mr-2 transition-colors cursor-pointer ${
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

      {/* 底部音量调节条 */}
      <div className="w-full flex items-center gap-3 text-white/60 pt-0.5">
        {/* 左侧小喇叭 */}
        <button
          type="button"
          onClick={onToggleMute}
          className="hover:text-white transition-colors cursor-pointer shrink-0 p-1 -ml-1"
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

        {/* 音量滑轨 */}
        <div className="relative flex-1 flex items-center group/vol">
          <div className="w-full h-[2.5px] sm:h-[3px] rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-75 rounded-full"
              style={{ width: `${currentVolumePercent}%` }}
            />
          </div>
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

        {/* 右侧大喇叭 */}
        <button
          type="button"
          onClick={() => onAdjustVolume?.(1)}
          className="hover:text-white transition-colors cursor-pointer shrink-0 p-1 -mr-1"
          title="最大音量"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 sm:h-4 sm:w-4">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
        </button>
      </div>
    </div>
  );

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
          <NeatFluidBackground coverUrl={activeCover} />

          {/* ================= 2. 顶部导航操作栏 (极简纯白无底圈 X 图标 + 歌词切换按钮) ================= */}
          <div className="relative z-10 flex items-center justify-between px-8 sm:px-12 md:px-16 lg:px-20 pt-[max(1.5rem,env(safe-area-inset-top))] md:pt-10 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="text-white/70 hover:text-white transition-opacity p-2 -ml-2 cursor-pointer"
              title="关闭全屏 (Esc)"
            >
              <X className="h-6 w-6 stroke-[2]" />
            </button>

            {/* Apple Music 经典歌词切换图标按钮 */}
            <button
              type="button"
              onClick={() => setShowLyrics((prev) => !prev)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all cursor-pointer backdrop-blur-xl ${
                showLyrics
                  ? "bg-white/20 text-white ring-1 ring-white/30 shadow-lg shadow-black/20"
                  : "bg-white/5 hover:bg-white/10 text-white/50 hover:text-white ring-1 ring-white/10"
              }`}
              title={showLyrics ? "隐藏歌词" : "显示歌词"}
            >
              <Quote className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold tracking-wide">歌词</span>
            </button>
          </div>

          {/* ================= 3. Apple 官方同款排版引擎容器 (浩瀚双栏呼吸感) ================= */}
          <article className="relative z-10 flex-1 w-full flex items-center justify-center px-4 sm:px-8 py-2 overflow-hidden">
            {/* 3.1 开启歌词模式时的双栏布局 (桌面端黄金比例分割，右侧歌词宽广舒展) */}
            {showLyrics ? (
              <div className="w-full max-w-[1780px] mx-auto h-full flex flex-col md:flex-row items-center justify-between gap-8 md:gap-14 lg:gap-20 xl:gap-28 px-4 sm:px-8 md:px-12 lg:px-20">
                {/* 桌面端左栏：大尺寸黑胶封面与控制器 */}
                <div className="hidden md:flex w-full max-w-[360px] md:max-w-[400px] lg:max-w-[460px] xl:max-w-[500px] flex-col items-center gap-y-6 lg:gap-y-8 shrink-0">
                  {/* 巨幅专辑封面 (大屏上权威大气的尺寸 + 深度柔和的环境投影) */}
                  <motion.div
                    initial={{ scale: 0.94, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="relative aspect-square w-full rounded-[24px] lg:rounded-[32px] overflow-hidden shadow-[0_32px_90px_-20px_rgba(0,0,0,0.85)] ring-1 ring-white/15"
                  >
                    <img
                      src={activeCover}
                      alt={currentSong.title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  </motion.div>

                  {/* 歌曲信息与控制器整体容器，带宽松呼吸间距 */}
                  <div className="w-full flex flex-col gap-y-5 lg:gap-y-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl lg:text-2xl xl:text-[28px] font-bold text-white tracking-tight truncate leading-tight">
                          {currentSong.title}
                        </h2>
                        {currentSong.explicit && (
                          <span className="shrink-0 rounded-[3px] bg-white/20 px-1.5 py-0.2 text-[9px] font-bold text-white">
                            E
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm lg:text-base font-medium text-white/60 truncate">
                        {currentSong.artist} — {currentSong.album || currentSong.title}
                      </p>
                    </div>

                    {/* 控制器 */}
                    {renderControls()}
                  </div>
                </div>

                {/* 歌词主视窗 (撑满右半边视野，告别右侧真空) */}
                <div className="w-full flex-1 h-[72vh] md:h-[80vh] lg:h-[86vh] flex flex-col min-w-0 pr-0 md:pr-4 lg:pr-8">
                  {/* 移动端歌词头部极简信息条 */}
                  <div className="md:hidden flex items-center gap-3 pb-3 border-b border-white/10 px-2 shrink-0">
                    <img
                      src={activeCover}
                      alt={currentSong.title}
                      className="h-10 w-10 rounded-lg object-cover ring-1 ring-white/10 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">{currentSong.title}</p>
                      <p className="truncate text-xs text-white/60">{currentSong.artist}</p>
                    </div>
                  </div>

                  <LyricsView
                    lyricsData={lyricsData}
                    isLoading={isLoadingLyrics}
                    duration={duration}
                    onSeekTime={onSeekTime}
                    className="flex-1 min-h-0"
                  />

                  {/* 移动端底部控制器 */}
                  <div className="md:hidden w-full pt-2 px-2 shrink-0">
                    {renderControls()}
                  </div>
                </div>
              </div>
            ) : (
              /* 3.2 未开启歌词时的经典单轴大封面居中布局 */
              <div
                data-testid="lyrics-controls"
                className="w-full max-w-[270px] sm:max-w-[440px] md:max-w-[480px] flex flex-col items-center gap-y-3.5 sm:gap-y-5 md:gap-y-6 mx-auto"
              >
                {/* 巨幅专辑封面 */}
                <motion.div
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.92, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="relative aspect-square w-full rounded-[16px] sm:rounded-[22px] overflow-hidden shadow-[0_20px_50px_-10px_rgba(0,0,0,0.85)] sm:shadow-[0_30px_80px_-15px_rgba(0,0,0,0.85)] ring-1 ring-white/15"
                >
                  <img
                    src={activeCover}
                    alt={currentSong.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.dataset.errorCount === "1") {
                        target.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
                        return;
                      }
                      target.dataset.errorCount = "1";
                      target.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80";
                    }}
                    className="h-full w-full object-cover"
                  />
                </motion.div>

                {/* 歌曲信息 */}
                <div className="w-full">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl md:text-[23px] font-bold text-white tracking-tight truncate leading-tight">
                      {currentSong.title}
                    </h2>
                    {currentSong.explicit && (
                      <span className="shrink-0 rounded-[3px] bg-white/20 px-1.5 py-0.2 text-[9px] font-bold text-white">
                        E
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm md:text-[15px] font-medium text-white/65 truncate">
                    {currentSong.artist} — {currentSong.album || currentSong.title}
                  </p>
                </div>

                {/* 控制器 */}
                {renderControls()}
              </div>
            )}
          </article>

          {/* 4. 底部留白平衡 (适配 safe-area) */}
          <div className="h-[max(1rem,env(safe-area-inset-bottom))] sm:h-8" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
