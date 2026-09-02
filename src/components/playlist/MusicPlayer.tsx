// components/playlist/MusicPlayer.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ListMusic,
  X,
} from "lucide-react";
import { Song } from "@/components/playlist/SongList";

interface MusicPlayerProps {
  currentSong: Song;
  playlistSongs?: Song[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  onTogglePlay: () => void;
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
  currentTime,
  duration,
  volume,
  isMuted,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onSelectSong,
  onClose,
  formatTime,
}: MusicPlayerProps) {
  const [showPlaylist, setShowPlaylist] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        setShowPlaylist(false);
      }
    };
    if (showPlaylist) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPlaylist]);

  return (
    <aside
      style={{
        position: "fixed",
        bottom: "16px",
        left: 0,
        right: 0,
        top: "auto",
        zIndex: 9999,
      }}
      className="flex justify-center px-3 sm:px-4 pointer-events-none select-none"
    >
      <div ref={listRef} className="relative w-full max-w-3xl pointer-events-auto">
        {/* ===================== 待播清单抽屉（向上弹出） ===================== */}
        <AnimatePresence>
          {showPlaylist && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-16 right-0 sm:right-2 w-full sm:w-80 md:w-88 rounded-3xl border border-black/[0.08] bg-white/95 p-4 shadow-[0_20px_45px_rgba(0,0,0,0.12)] backdrop-blur-3xl text-neutral-900 transition-colors dark:border-white/[0.1] dark:bg-[#0c0c0c]/95 dark:text-white dark:shadow-[0_25px_50px_rgba(0,0,0,0.6)]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <ListMusic className="h-4 w-4 text-rose-500" />
                  <h3 className="text-xs font-semibold tracking-wide">待播清单</h3>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    ({playlistSongs.length})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPlaylist(false)}
                  className="rounded-lg p-1 text-neutral-400 hover:text-neutral-800 hover:bg-black/5 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
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
                          ? "bg-rose-500/10 text-rose-600 dark:bg-white/10 dark:text-rose-400"
                          : "text-neutral-600 hover:bg-black/[0.04] hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <img
                          src={song.cover_url}
                          alt={song.title}
                          className="h-7 w-7 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium">{song.title}</p>
                          <p className="truncate text-[10px] text-neutral-400">
                            {song.artist}
                          </p>
                        </div>
                      </div>
                      {isCurrent && (
                        <span className="flex h-1.5 w-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===================== Apple 晶透胶囊 Dock ===================== */}
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="will-change-transform flex h-12 sm:h-13 w-full items-center justify-between gap-2 sm:gap-4 rounded-full border border-black/[0.08] bg-white/85 px-3 sm:px-5 shadow-[0_16px_40px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-3xl transition-colors dark:border-white/[0.12] dark:bg-[#0c0c0c]/85 dark:shadow-[0_20px_45px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.15)]"
        >
          {/* 左侧控制按钮 */}
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 text-neutral-700 dark:text-white/80">
            <button
              type="button"
              onClick={onPrev}
              className="rounded-full p-1.5 hover:bg-black/5 active:scale-90 dark:hover:bg-white/10 cursor-pointer"
              title="上一首"
            >
              <SkipBack className="h-3.5 w-3.5 fill-current" />
            </button>
            <button
              type="button"
              onClick={onTogglePlay}
              className="rounded-full p-1.5 text-neutral-900 hover:bg-black/5 active:scale-90 dark:text-white dark:hover:bg-white/10 cursor-pointer"
              title={isPlaying ? "暂停" : "播放"}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="ml-0.5 h-4 w-4 fill-current" />
              )}
            </button>
            <button
              type="button"
              onClick={onNext}
              className="rounded-full p-1.5 hover:bg-black/5 active:scale-90 dark:hover:bg-white/10 cursor-pointer"
              title="下一首"
            >
              <SkipForward className="h-3.5 w-3.5 fill-current" />
            </button>
          </div>

          {/* 歌曲信息与进度条 */}
          <div className="flex flex-1 items-center gap-2 min-w-0 px-1">
            <img
              src={currentSong.cover_url}
              alt={currentSong.title}
              className="h-7 w-7 rounded-md object-cover shrink-0 ring-1 ring-black/5 dark:ring-white/10"
            />
            <div className="flex flex-1 flex-col min-w-0">
              <div className="flex items-center justify-between text-[11px] mb-0.5">
                <div className="truncate font-medium text-neutral-900 dark:text-white/90 pr-1">
                  {currentSong.title}
                  <span className="text-neutral-400 dark:text-white/40 text-[10px] ml-1.5 font-normal">
                    · {currentSong.artist}
                  </span>
                </div>
                <span className="font-mono text-[9px] text-neutral-400 dark:text-white/40 tabular-nums shrink-0">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={Math.min(currentTime, duration || 100)}
                onChange={onSeek}
                className="h-[3px] w-full cursor-pointer appearance-none rounded-full bg-black/10 outline-none dark:bg-white/15 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-neutral-800 dark:[&::-webkit-slider-thumb]:bg-white"
              />
            </div>
          </div>

          {/* 右侧清单、音量与关闭按键 */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 text-neutral-600 dark:text-white/70">
            <button
              type="button"
              onClick={() => setShowPlaylist((prev) => !prev)}
              className={`rounded-full p-1.5 active:scale-90 cursor-pointer ${
                showPlaylist
                  ? "bg-black/10 text-rose-600 dark:bg-white/20 dark:text-rose-400"
                  : "hover:bg-black/5 dark:hover:bg-white/10"
              }`}
              title="查看待播清单"
            >
              <ListMusic className="h-3.5 w-3.5" />
            </button>

            <div className="hidden md:flex items-center gap-1.5">
              <button
                type="button"
                onClick={onToggleMute}
                className="rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                title={isMuted ? "取消静音" : "静音"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-3.5 w-3.5" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={onVolumeChange}
                className="h-[3px] w-14 cursor-pointer appearance-none rounded-full bg-black/10 outline-none dark:bg-white/15 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-neutral-800 dark:[&::-webkit-slider-thumb]:bg-white"
              />
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1 text-neutral-400 hover:text-neutral-900 hover:bg-black/5 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="关闭播放器"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </aside>
  );
}