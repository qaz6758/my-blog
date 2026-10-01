// components/playlist/MusicPlayer.tsx
"use client";

import React, { useState, useRef, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
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
  ListMusic
} from "lucide-react";
import { getSongCover, Song } from "@/components/playlist/SongList";
import { RepeatMode } from "@/components/playlist/MusicContext";
import { ImmersivePlayerModal } from "@/components/playlist/ImmersivePlayerModal";
import { preloadSongCoverColors } from "@/components/playlist/NeatFluidBackground";
import { getProxyImageUrl } from "@/lib/image-proxy";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80";

const subscribeToClient = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function resolveMusicCover(url?: string, size = 120) {
  if (!url) return FALLBACK_COVER;
  let res = url;
  if (res.includes("music.126.net")) {
    res = res.includes("param=")
      ? res.replace(/param=\d+y\d+/g, `param=${size}y${size}`)
      : `${res}${res.includes("?") ? "&" : "?"}param=${size}y${size}`;
  }
  return getProxyImageUrl(res);
}

function handleMusicCoverError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  originalUrl?: string,
  size = 120
) {
  const target = e.currentTarget;
  
  if (target.dataset.errorCount === "2") {
    target.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    return;
  }
  
  if (target.dataset.errorCount === "1") {
    target.dataset.errorCount = "2";
    target.src = FALLBACK_COVER;
    return;
  }
  
  target.dataset.errorCount = "1";
  if (
    originalUrl &&
    originalUrl.includes("music.126.net") &&
    !target.src.includes("wsrv.nl")
  ) {
    target.src = getProxyImageUrl(`https://wsrv.nl/?url=${encodeURIComponent(originalUrl)}&w=${size}&h=${size}&fit=cover`);
    return;
  }
  target.src = FALLBACK_COVER;
}

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
  onAdjustVolume?: (delta: number) => void;
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
  onAdjustVolume,
  onToggleMute,
  onSelectSong,
  onClose,
  formatTime,
}: MusicPlayerProps) {
  const mounted = useSyncExternalStore(
    subscribeToClient,
    getClientSnapshot,
    getServerSnapshot
  );
  
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [volumeToast, setVolumeToast] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // 预提取并缓存当前播放歌曲的流体背景主色调
  useEffect(() => {
    if (!currentSong) return;
    const raw = getSongCover(currentSong);
    const cover = getProxyImageUrl(raw);
    if (cover) {
      preloadSongCoverColors(cover);
    }
  }, [currentSong]);

  // CRT 示波器关机动画状态
  const [isDismissed, setIsDismissed] = useState(false);
  const [isCrtCollapsing, setIsCrtCollapsing] = useState(false);

  const listRef = useRef<HTMLDivElement | null>(null);
  const volumeToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerVolumeToast = (text: string) => {
    setVolumeToast(text);
    if (volumeToastTimerRef.current) clearTimeout(volumeToastTimerRef.current);
    volumeToastTimerRef.current = setTimeout(() => {
      setVolumeToast(null);
    }, 1000);
  };

  // 播放新歌时自动唤醒展示
  useEffect(() => {
    if (isPlaying) {
      const frame = requestAnimationFrame(() => {
        setIsDismissed(false);
        setIsCrtCollapsing(false);
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [isPlaying, currentSong?.id]);

  // 点击外部收起播放列表
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        listRef.current &&
        (!(e.target instanceof Node) || !listRef.current.contains(e.target))
      ) {
        setShowPlaylist(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const triggerCrtShutdown = () => {
    if (isPlaying) {
      onTogglePlay();
    }
    setIsCrtCollapsing(true);
    setTimeout(() => {
      setIsDismissed(true);
      setIsCrtCollapsing(false);
      onClose?.();
    }, 550);
  };

  const progressPercent =
    duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  if (!mounted || isDismissed) {
    return null;
  }

  return createPortal(
    <>
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
        onAdjustVolume={onAdjustVolume}
        onToggleMute={onToggleMute}
        formatTime={formatTime}
      />

      <aside
        className="fixed bottom-0 left-0 sm:left-0 w-full sm:w-[360px] z-[9999] pointer-events-none select-none antialiased"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div
          ref={listRef}
          className="relative w-full flex flex-col items-start pointer-events-none"
        >
          {/* 待播清单弹层 (极致纯 CSS 硬件加速抽屉) */}
          <div className="absolute bottom-full left-0 w-full overflow-hidden pointer-events-none z-10 flex flex-col justify-end">
            <div
              className={`w-full border-r border-t border-black/10 dark:border-white/[0.08] bg-white dark:bg-black p-4 text-neutral-900 dark:text-white pointer-events-auto transition-transform duration-300 ${
                showPlaylist ? "translate-y-0" : "translate-y-full"
              }`}
              style={{ 
                borderRadius: 0, 
                willChange: "transform",
                transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)"
              }}
            >
              <div className="flex items-center pb-3 border-b border-black/[0.08] dark:border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <ListMusic className="h-4 w-4 text-neutral-900 dark:text-white" />
                  <h3 className="text-xs font-semibold tracking-wide">
                    待播清单
                  </h3>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    ({playlistSongs.length})
                  </span>
                </div>
              </div>

              <div className="mt-2 max-h-60 overflow-y-auto space-y-1 pr-1">
                {playlistSongs.map((song, idx) => {
                  const isCurrent = song.id === currentSong.id;
                  return (
                    <button
                        key={song.id || idx}
                        type="button"
                        onClick={() => onSelectSong?.(song)}
                        className={`flex w-full items-center justify-between px-2.5 py-1.5 text-left transition-colors cursor-pointer ${
                          isCurrent
                            ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-medium shadow-sm"
                            : "text-neutral-700 dark:text-neutral-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-neutral-950 dark:hover:text-white"
                        }`}
                        style={{ borderRadius: 0 }}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          {(() => {
                            const raw = getSongCover(song);
                            return (
                              <img
                                src={resolveMusicCover(raw, 120)}
                                alt={song.title}
                                referrerPolicy="no-referrer"
                                onError={(e) => handleMusicCoverError(e, raw, 120)}
                                className="h-7 w-7 object-cover shrink-0 shadow-none"
                                style={{ borderRadius: 0 }}
                              />
                            );
                          })()}
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium">
                              {song.title}
                            </p>
                            <p
                              className={`truncate text-[10px] ${
                                isCurrent ? "text-white/80" : "text-neutral-400"
                              }`}
                            >
                              {song.artist}
                            </p>
                          </div>
                        </div>
                      </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 紧凑型直角长条播放器主体 */}
          <motion.div
            initial={false}
            className={`pointer-events-auto relative z-20 flex items-stretch h-[80px] sm:h-[96px] w-full border-t sm:border-t sm:border-r border-black/10 dark:border-white/10 bg-white/95 dark:bg-black/95 shadow-[0_-5px_30px_rgba(0,0,0,0.1)] backdrop-blur-2xl transition-all ${
              isCrtCollapsing ? "animate-crt-collapse" : ""
            }`}
            style={{ borderRadius: 0, willChange: "transform" }}
          >
            {/* Square Cover (Left) */}
            <div
              onClick={() => setIsExpanded(true)}
              className="group/cover relative h-full w-[80px] sm:w-[96px] shrink-0 bg-neutral-900 cursor-pointer overflow-hidden border-r border-black/10 dark:border-white/10"
              title="点击展开全屏大屏沉浸界面"
              style={{ borderRadius: 0 }}
            >
              {(() => {
                const raw = getSongCover(currentSong);
                return (
                  <img
                    src={resolveMusicCover(raw, 120)}
                    alt={currentSong.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => handleMusicCoverError(e, raw, 120)}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover/cover:scale-110"
                    style={{ borderRadius: 0 }}
                  />
                );
              })()}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] opacity-0 group-hover/cover:opacity-100 transition-opacity duration-200">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-white"><polyline points="9 3 3 3 3 9" /><polyline points="15 21 21 21 21 15" /><line x1="3" y1="3" x2="10" y2="10" /><line x1="21" y1="21" x2="14" y2="14" /></svg>
              </div>
            </div>

            {/* Right Content */}
            <div className="flex flex-col flex-1 min-w-0 px-3.5 sm:px-4 py-3 sm:py-3.5 relative">
               {/* Top: Info & Actions */}
               <div className="flex justify-between items-start w-full">
                  <div className="flex flex-col overflow-hidden pr-12 sm:pr-14">
                     <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`truncate text-[13px] sm:text-[14px] tracking-tight leading-none ${isPlaying ? "text-neutral-950 dark:text-white font-bold" : "text-neutral-900 dark:text-neutral-200 font-semibold"}`}>
                          {currentSong.title}
                        </span>
                        {isPlaying && (
                          <div className="flex items-end gap-[2px] h-2.5 shrink-0 ml-0.5" title="正在播放">
                            <span className="w-[2px] rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse h-2" />
                            <span className="w-[2px] rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse h-2.5 [animation-delay:150ms]" />
                            <span className="w-[2px] rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse h-1.5 [animation-delay:300ms]" />
                          </div>
                        )}
                        {currentSong.explicit && (
                          <span className="shrink-0 rounded-[2px] bg-neutral-900/10 dark:bg-white/15 px-1 py-[1px] text-[8px] font-bold text-neutral-700 dark:text-neutral-300">
                            E
                          </span>
                        )}
                     </div>
                     <span className="text-[11px] sm:text-[12px] text-neutral-500 dark:text-neutral-400 truncate leading-none mt-1.5">
                       {volumeToast ? <span className="font-mono">音量: {volumeToast}</span> : currentSong.artist}
                     </span>
                  </div>

                  {/* Close & List Actions (Absolute Top Right) */}
                  <div className="absolute top-1 right-1.5 sm:top-1.5 sm:right-2 flex items-center gap-0.5 sm:gap-1 z-10">
                     <button 
                       onClick={() => setShowPlaylist(p => !p)} 
                       className={`p-1 transition-colors cursor-pointer ${showPlaylist ? "text-neutral-950 dark:text-white" : "text-neutral-400 hover:text-black dark:text-white/50 dark:hover:text-white"}`}
                       title="待播清单"
                     >
                       <ListMusic className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                     </button>
                     <button 
                       onClick={triggerCrtShutdown} 
                       className="p-1 text-neutral-400 hover:text-red-500 dark:text-white/50 dark:hover:text-red-400 transition-colors cursor-pointer"
                       title="关闭播放器"
                     >
                       <X className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                     </button>
                  </div>
               </div>

               {/* Bottom: Left-aligned Controls & Mac Timestamp */}
               <div className="mt-auto flex items-center justify-between w-full">
                  <div className="flex items-center gap-3 sm:gap-3.5">
                    {/* Shuffle */}
                    <button onClick={onToggleShuffle} className={`transition-all cursor-pointer active:scale-95 ${isShuffle ? "text-neutral-900 dark:text-white drop-shadow-md" : "text-neutral-400 hover:text-neutral-800 dark:text-white/40 dark:hover:text-white/90"}`} title="随机播放">
                      <Shuffle className="h-3.5 w-3.5 sm:h-3.5 sm:w-3.5" />
                    </button>

                    {/* Prev */}
                    <button onClick={onPrev} className="text-neutral-800 hover:text-black dark:text-white/90 dark:hover:text-white active:scale-90 transition-transform cursor-pointer" title="上一首">
                      <SkipBack className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current stroke-none" />
                    </button>

                    {/* Play/Pause (Mac Tactile Pill) */}
                    <button 
                      onClick={onTogglePlay} 
                      className="flex items-center justify-center h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-black/[0.06] hover:bg-black/[0.12] dark:bg-white/10 dark:hover:bg-white/20 text-neutral-900 dark:text-white transition-all cursor-pointer active:scale-90 shadow-2xs"
                      title={isPlaying ? "暂停" : "播放"}
                    >
                      {isPlaying ? <Pause className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current stroke-none" /> : <Play className="ml-[1px] h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current stroke-none" />}
                    </button>

                    {/* Next */}
                    <button onClick={onNext} className="text-neutral-800 hover:text-black dark:text-white/90 dark:hover:text-white active:scale-90 transition-transform cursor-pointer" title="下一首">
                      <SkipForward className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current stroke-none" />
                    </button>

                    {/* Repeat */}
                    <button onClick={onToggleRepeat} className={`transition-all cursor-pointer active:scale-95 ${repeatMode !== "off" ? "text-neutral-900 dark:text-white drop-shadow-md" : "text-neutral-400 hover:text-neutral-800 dark:text-white/40 dark:hover:text-white/90"}`} title="循环模式">
                      {repeatMode === "one" ? <Repeat1 className="h-3.5 w-3.5 sm:h-3.5 sm:w-3.5" /> : <Repeat className="h-3.5 w-3.5 sm:h-3.5 sm:w-3.5" />}
                    </button>
                  </div>

                  {/* Mac Timestamp (右侧等宽时间戳) */}
                  <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 tabular-nums select-none tracking-tight">
                    {formatTime(currentTime)}
                  </span>
               </div>
               
               {/* Absolute Bottom Progress Line */}
               <div className="absolute bottom-0 left-0 right-0 h-[2px] sm:h-[3px] bg-black/10 dark:bg-white/10 group/progress cursor-pointer overflow-hidden">
                  <div className="h-full bg-neutral-900 dark:bg-white transition-all duration-75" style={{ width: `${progressPercent}%` }} />
                  <input type="range" min={0} max={duration || 100} value={Math.min(currentTime, duration || 100)} onChange={onSeek} className="absolute inset-0 w-full opacity-0 -top-2 h-4 cursor-pointer" title={`${formatTime(currentTime)} / ${formatTime(duration)}`} />
               </div>
            </div>
          </motion.div>
        </div>
      </aside>
    </>,
    document.body
  );
}