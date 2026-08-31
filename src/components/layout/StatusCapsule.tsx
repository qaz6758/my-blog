// components/layout/StatusCapsule.tsx
"use client";

import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Laptop, Circle, Music2 } from "lucide-react";
import { useLanyard } from "@/hooks/useLanyard";
import { useLiveStatus } from "@/hooks/useLiveStatus";

interface StatusCapsuleProps {
  nickname?: string;
  variant?: "capsule" | "card";
}

export function StatusCapsule({
  nickname = "Theyole",
  variant = "capsule",
}: StatusCapsuleProps) {
  const discordStatus = useLanyard();
  const liveStatus = useLiveStatus();

  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setIsHovered(false);
      timerRef.current = null;
    }, 150);
  };

  const isMusic =
    liveStatus.activity === "music" && liveStatus.music !== null;

  const musicTitle = liveStatus.music?.title?.trim() || "未知歌曲";
  const musicArtist = liveStatus.music?.artist?.trim() || "未知歌手";
  const musicCover = liveStatus.music?.cover || null;
  const musicIsPlaying = liveStatus.music?.isPlaying ?? false;

  const displayTitle = isMusic
    ? musicTitle
    : discordStatus.details ||
      (discordStatus.isOnline ? "空闲中" : "离线");

  const displayApp = isMusic
    ? "MoeKoe Music"
    : discordStatus.isOnline
      ? discordStatus.appName
      : "Offline";

  const isOnline = isMusic || discordStatus.isOnline;

  // 纯卡片内容渲染函数
  const renderCardContent = () => (
    <div className="w-full select-none rounded-2xl border border-neutral-200/80 bg-neutral-50/80 p-3.5 dark:border-neutral-800 dark:bg-neutral-900/60">
      {/* 顶部状态 */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          LIVE DESK
        </span>

        <span className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300">
          <span
            className={`h-2 w-2 rounded-full ${
              isOnline ? "animate-pulse bg-emerald-500" : "bg-neutral-400"
            }`}
          />
          {isOnline ? "在线" : "离线"}
        </span>
      </div>

      {/* 昵称 */}
      <div className="mt-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
        {nickname}
      </div>

      {/* 音乐卡片 */}
      {isMusic ? (
        <div className="mt-3 overflow-hidden rounded-xl bg-white/80 dark:bg-neutral-800/50">
          <div className="aspect-video w-full overflow-hidden bg-neutral-200 dark:bg-neutral-800">
            {musicCover ? (
              <img
                src={musicCover}
                alt={`${musicTitle} cover`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Music2 className="h-10 w-10 text-emerald-500" />
              </div>
            )}
          </div>

          <div className="p-2.5">
            <div className="text-[10px] font-medium uppercase tracking-wider text-emerald-500">
              {musicIsPlaying ? "正在收听" : "已暂停"}
            </div>

            <div className="mt-1 truncate text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              {musicTitle}
            </div>

            <div className="mt-0.5 truncate text-[11px] text-neutral-400 dark:text-neutral-500">
              {musicArtist}
            </div>

            <div className="mt-2.5 flex items-end gap-[3px]">
              <span
                className={`h-2 w-[3px] rounded-full bg-emerald-500/70 ${
                  musicIsPlaying ? "animate-pulse" : ""
                }`}
              />
              <span
                className={`h-3.5 w-[3px] rounded-full bg-emerald-500/80 ${
                  musicIsPlaying ? "animate-pulse [animation-delay:120ms]" : ""
                }`}
              />
              <span
                className={`h-2.5 w-[3px] rounded-full bg-emerald-500/70 ${
                  musicIsPlaying ? "animate-pulse [animation-delay:240ms]" : ""
                }`}
              />
              <span
                className={`h-4 w-[3px] rounded-full bg-emerald-500/80 ${
                  musicIsPlaying ? "animate-pulse [animation-delay:360ms]" : ""
                }`}
              />
              <span
                className={`h-3 w-[3px] rounded-full bg-emerald-500/70 ${
                  musicIsPlaying ? "animate-pulse [animation-delay:480ms]" : ""
                }`}
              />

              <span className="ml-1.5 text-[10px] text-neutral-400 dark:text-neutral-500">
                MoeKoe Music
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* 非音乐状态卡片 */
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-white/80 p-2.5 dark:bg-neutral-800/50">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-black/5 bg-white shadow-xs dark:border-white/10 dark:bg-neutral-900">
            {discordStatus.largeImage ? (
              <img
                src={discordStatus.largeImage}
                alt="status"
                className="h-full w-full object-cover"
              />
            ) : discordStatus.isOnline ? (
              <Laptop className="h-4 w-4 text-neutral-500" />
            ) : (
              <Circle
                size={10}
                fill="currentColor"
                className="text-neutral-400"
              />
            )}
          </div>

          <div className="min-w-0 flex-1 leading-none">
            <div className="text-[10px] text-neutral-400 dark:text-neutral-500">
              {discordStatus.isOnline ? "正在使用" : "状态"}
            </div>

            <div className="mt-1 truncate text-xs font-semibold text-neutral-800 dark:text-neutral-100">
              {discordStatus.isOnline ? discordStatus.appName : "Offline"}
            </div>

            <div className="mt-1 truncate text-[10px] text-neutral-400 dark:text-neutral-500">
              {discordStatus.isOnline ? discordStatus.details : "Offline"}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // 如果是移动端侧边栏卡片模式，直接静态渲染
  if (variant === "card") {
    return renderCardContent();
  }

  // 默认胶囊模式（移除 hidden sm:block，全端自适应展示）
  return (
    <div
      className="relative shrink-0 select-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 顶部胶囊 */}
      <div
        onClick={() => setIsHovered((prev) => !prev)}
        className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#e7ded4] bg-white/60 px-2 py-1 sm:px-2.5 sm:py-1.5 backdrop-blur-md transition-all duration-200 hover:bg-white/80 dark:border-neutral-800 dark:bg-neutral-900/60 dark:hover:bg-neutral-900/80"
      >
        <div className="flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center overflow-hidden rounded-md border border-black/[0.04] bg-white shadow-xs dark:border-white/10 dark:bg-neutral-800">
          {isMusic && musicCover ? (
            <img
              src={musicCover}
              alt="music cover"
              className="h-full w-full object-cover"
            />
          ) : isMusic ? (
            <Music2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-pulse text-emerald-500" />
          ) : discordStatus.largeImage ? (
            <img
              src={discordStatus.largeImage}
              alt="status"
              className="h-full w-full object-cover"
            />
          ) : discordStatus.isOnline ? (
            <Laptop className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-neutral-600 dark:text-neutral-400" />
          ) : (
            <Circle
              size={8}
              fill="currentColor"
              className="text-neutral-400"
            />
          )}
        </div>

        <div className="flex min-w-0 max-w-[100px] sm:max-w-[140px] md:max-w-[180px] flex-col text-left leading-none">
          <span className="truncate text-[10px] sm:text-[11px] text-neutral-400 dark:text-neutral-500">
            {isMusic
              ? `${musicIsPlaying ? "正在收听" : "已暂停"} · ${musicTitle}`
              : discordStatus.isOnline
                ? `使用中 · ${displayTitle}`
                : "离线"}
          </span>

          <span className="mt-0.5 sm:mt-1 truncate text-[11px] sm:text-xs font-medium text-neutral-800 dark:text-neutral-200">
            {displayApp}
          </span>
        </div>
      </div>

      {/* 悬浮/点击展开卡片 */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.985 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 top-full z-50 mt-2 w-[260px] sm:w-[280px] rounded-2xl border border-neutral-200/80 bg-white/95 p-3.5 sm:p-4 shadow-xl backdrop-blur-xl dark:border-neutral-800 dark:bg-[#18181b]/95 dark:shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                LIVE DESK
              </span>

              <span className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300">
                <span
                  className={`h-2 w-2 rounded-full ${
                    isOnline ? "animate-pulse bg-emerald-500" : "bg-neutral-400"
                  }`}
                />
                {isOnline ? "在线" : "离线"}
              </span>
            </div>

            <div className="mt-1 text-base font-medium text-neutral-900 dark:text-neutral-100">
              {nickname}
            </div>

            {isMusic ? (
              <div className="mt-3.5 overflow-hidden rounded-xl bg-neutral-100/70 dark:bg-neutral-800/50">
                <div className="aspect-square w-full overflow-hidden bg-neutral-200 dark:bg-neutral-800">
                  {musicCover ? (
                    <img
                      src={musicCover}
                      alt={`${musicTitle} cover`}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Music2 className="h-12 w-12 text-emerald-500" />
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-emerald-500">
                    {musicIsPlaying ? "正在收听" : "已暂停"}
                  </div>

                  <div className="mt-1.5 truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {musicTitle}
                  </div>

                  <div className="mt-1 truncate text-xs text-neutral-400 dark:text-neutral-500">
                    {musicArtist}
                  </div>

                  <div className="mt-3 flex items-end gap-[3px]">
                    <span
                      className={`h-2 w-[3px] rounded-full bg-emerald-500/70 ${
                        musicIsPlaying ? "animate-pulse" : ""
                      }`}
                    />
                    <span
                      className={`h-3.5 w-[3px] rounded-full bg-emerald-500/80 ${
                        musicIsPlaying ? "animate-pulse [animation-delay:120ms]" : ""
                      }`}
                    />
                    <span
                      className={`h-2.5 w-[3px] rounded-full bg-emerald-500/70 ${
                        musicIsPlaying ? "animate-pulse [animation-delay:240ms]" : ""
                      }`}
                    />
                    <span
                      className={`h-4 w-[3px] rounded-full bg-emerald-500/80 ${
                        musicIsPlaying ? "animate-pulse [animation-delay:360ms]" : ""
                      }`}
                    />
                    <span
                      className={`h-3 w-[3px] rounded-full bg-emerald-500/70 ${
                        musicIsPlaying ? "animate-pulse [animation-delay:480ms]" : ""
                      }`}
                    />

                    <span className="ml-1.5 text-[10px] text-neutral-400 dark:text-neutral-500">
                      MoeKoe Music
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-3.5 flex items-center gap-3 rounded-xl bg-neutral-100/70 p-2.5 dark:bg-neutral-800/50">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-black/5 bg-white shadow-xs dark:border-white/10 dark:bg-neutral-900">
                  {discordStatus.largeImage ? (
                    <img
                      src={discordStatus.largeImage}
                      alt="status"
                      className="h-full w-full object-cover"
                    />
                  ) : discordStatus.isOnline ? (
                    <Laptop className="h-5 w-5 text-neutral-500" />
                  ) : (
                    <Circle
                      size={12}
                      fill="currentColor"
                      className="text-neutral-400"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1 leading-none">
                  <div className="text-[10px] text-neutral-400 dark:text-neutral-500">
                    {discordStatus.isOnline ? "正在使用" : "状态"}
                  </div>

                  <div className="mt-1 truncate text-xs font-semibold text-neutral-800 dark:text-neutral-100">
                    {discordStatus.isOnline ? discordStatus.appName : "Offline"}
                  </div>

                  <div className="mt-1 truncate text-[10px] text-neutral-400 dark:text-neutral-500">
                    {discordStatus.isOnline ? discordStatus.details : "Offline"}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}