// components/layout/StatusCapsule.tsx
"use client";

import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Laptop, Circle, Music2 } from "lucide-react";
import { useLiveStatus } from "@/hooks/useLiveStatus";

// 根据软件名称自动匹配对应的图标 (Iconify / SimpleIcons 稳定 CDN)
function getAppIconFallback(appName: string): string | null {
  if (!appName) return null;
  const name = appName.toLowerCase();
  
  if (name.includes("edge")) return "https://api.iconify.design/logos:microsoft-edge.svg";
  if (name.includes("chrome") || name.includes("google")) return "https://api.iconify.design/logos:chrome.svg";
  if (name.includes("wechat") || name.includes("微信")) return "https://cdn.simpleicons.org/wechat/07C160";
  if (name.includes("code") || name.includes("visual studio")) return "https://api.iconify.design/logos:visual-studio-code.svg";
  if (name.includes("figma")) return "https://api.iconify.design/logos:figma.svg";
  if (name.includes("obsidian")) return "https://api.iconify.design/logos:obsidian-icon.svg";
  if (name.includes("discord")) return "https://api.iconify.design/logos:discord-icon.svg";
  if (name.includes("spotify")) return "https://api.iconify.design/logos:spotify-icon.svg";
  if (name.includes("notion")) return "https://api.iconify.design/logos:notion-icon.svg";
  if (name.includes("github")) return "https://api.iconify.design/logos:github-icon.svg";
  if (name.includes("telegram")) return "https://api.iconify.design/logos:telegram.svg";
  if (name.includes("cursor")) return "https://cdn.simpleicons.org/cursor/000000";
  if (name.includes("qq")) return "https://cdn.simpleicons.org/tencentqq/12B7F5";
  
  return null;
}

interface StatusCapsuleProps {
  nickname?: string;
  variant?: "capsule" | "card";
}

export function StatusCapsule({
  nickname = "Theyole",
  variant = "capsule",
}: StatusCapsuleProps) {
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

  const isMusic = liveStatus.activity === "music" && liveStatus.music !== null;
  const hasApp = liveStatus.app !== null;

  const musicTitle = liveStatus.music?.title?.trim() || "未知歌曲";
  const musicArtist = liveStatus.music?.artist?.trim() || "未知歌手";
  const musicCover = liveStatus.music?.cover || null;
  const musicIsPlaying = liveStatus.music?.isPlaying ?? false;

  const displayTitle = isMusic
    ? musicTitle
    : liveStatus.app?.title || "Desktop";

  const displayApp = isMusic
    ? "MoeKoe Music"
    : liveStatus.app?.name || "Offline";

  const isOnline = isMusic || hasApp;

  const musicCurrentTime = liveStatus.music?.currentTime || 0;
  const musicDuration = liveStatus.music?.duration || 0;

  const [localProgress, setLocalProgress] = useState(0);

  // 实时跳动进度条逻辑
  React.useEffect(() => {
    if (!isMusic || musicDuration === 0) return;

    // 每次拿到新的 API 数据时，先同步当前时间
    // 假设如果数值很大（比如大于20000），则是毫秒级；否则是秒级
    const isMs = musicDuration > 20000;
    
    // 如果有 lastSeenAt，为了追求极致精确，可以把服务器更新以来的时间差加上去
    let exactCurrentTime = musicCurrentTime;
    if (musicIsPlaying && liveStatus.lastSeenAt) {
      const timeDiffMs = Date.now() - new Date(liveStatus.lastSeenAt).getTime();
      if (timeDiffMs > 0 && timeDiffMs < 30000) { // 限制在合理范围内
        exactCurrentTime += isMs ? timeDiffMs : Math.floor(timeDiffMs / 1000);
      }
    }
    
    setLocalProgress(exactCurrentTime);

    if (!musicIsPlaying) return;

    const interval = setInterval(() => {
      setLocalProgress((prev) => {
        const step = isMs ? 1000 : 1;
        const next = prev + step;
        return next > musicDuration ? musicDuration : next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [musicCurrentTime, musicDuration, musicIsPlaying, isMusic, liveStatus.lastSeenAt]);

  const formatTime = (val: number) => {
    if (!val || val < 0) return "0:00";
    const isMs = musicDuration > 20000;
    const totalSeconds = isMs ? Math.floor(val / 1000) : Math.floor(val);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const progressPercent = musicDuration > 0 ? Math.min(100, (localProgress / musicDuration) * 100) : 0;

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
              isOnline ? "bg-emerald-500" : "bg-neutral-400"
            }`}
          />
          {isOnline ? "Online" : "Offline"}
        </span>
      </div>

      {/* 昵称 */}
      <div className="mt-1 text-base font-semibold text-neutral-900 dark:text-neutral-100">
        {nickname}
      </div>

      {/* 音乐卡片 (横向布局) */}
      {isMusic && (
        <div className="mt-3 flex flex-col rounded-xl border border-neutral-200/50 bg-neutral-100/50 p-3 dark:border-neutral-700/50 dark:bg-neutral-800/40">
          <div className="flex gap-3">
            <div className="h-[52px] w-[52px] shrink-0 overflow-hidden rounded-md bg-neutral-200 shadow-sm dark:bg-neutral-800">
              {musicCover ? (
                <img
                  src={musicCover}
                  alt={`${musicTitle} cover`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Music2 className="h-6 w-6 text-emerald-500" />
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <div className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {musicTitle}
              </div>
              <div className="mt-0.5 truncate text-[11px] text-neutral-500 dark:text-neutral-400">
                {musicArtist}
              </div>
              <div className="mt-0.5 text-[10px] text-neutral-400 dark:text-neutral-500">
                MoeKoe Music · {musicIsPlaying ? "Playing" : "Paused"}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="flex h-3 items-end gap-[2px]">
              <span className={`w-[3px] rounded-sm bg-neutral-400 dark:bg-neutral-500 ${musicIsPlaying ? "h-2 animate-pulse" : "h-1"}`} />
              <span className={`w-[3px] rounded-sm bg-neutral-400 dark:bg-neutral-500 ${musicIsPlaying ? "h-3 animate-pulse [animation-delay:120ms]" : "h-1"}`} />
              <span className={`w-[3px] rounded-sm bg-neutral-400 dark:bg-neutral-500 ${musicIsPlaying ? "h-1.5 animate-pulse [animation-delay:240ms]" : "h-1"}`} />
            </div>

            <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
              <div 
                className="absolute left-0 top-0 h-full rounded-full bg-neutral-500 transition-all duration-1000 ease-linear dark:bg-neutral-400"
                style={{ width: `${progressPercent}%` }} 
              />
            </div>

            <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
              {formatTime(localProgress)} / {formatTime(musicDuration)}
            </span>
          </div>
        </div>
      )}

      {/* App 使用状态 (始终在底部) */}
      {!isMusic && !hasApp && (
        <div className="mt-3 text-xs text-neutral-500">No active status</div>
      )}
      
      {hasApp && liveStatus.app?.name && (
        <div className="mt-2.5 flex items-center gap-2.5 rounded-lg bg-neutral-100/70 p-2 dark:bg-neutral-800/40">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10">
            {liveStatus.app.icon || getAppIconFallback(liveStatus.app.name) ? (
              <img
                src={liveStatus.app.icon || getAppIconFallback(liveStatus.app.name)!}
                alt="app"
                className="h-4 w-4 object-contain"
                onError={(e) => {
                  const fallback = getAppIconFallback(liveStatus.app?.name || "");
                  if (fallback && e.currentTarget.src !== fallback) {
                    e.currentTarget.src = fallback;
                  } else {
                    e.currentTarget.style.display = "none";
                  }
                }}
              />
            ) : (
              <Laptop className="h-3 w-3 text-neutral-500" />
            )}
          </div>
          <span className="truncate text-xs text-neutral-600 dark:text-neutral-300">
            Now using <span className="font-semibold text-neutral-900 dark:text-white">{liveStatus.app.name}</span>
          </span>
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
          ) : hasApp && (liveStatus.app!.icon || getAppIconFallback(liveStatus.app!.name)) ? (
            <img
              src={liveStatus.app!.icon || getAppIconFallback(liveStatus.app!.name)!}
              alt="status"
              className="h-full w-full object-cover"
              onError={(e) => {
                const fallback = getAppIconFallback(liveStatus.app?.name || "");
                if (fallback && e.currentTarget.src !== fallback) {
                  e.currentTarget.src = fallback;
                } else {
                  e.currentTarget.style.display = "none";
                }
              }}
            />
          ) : hasApp ? (
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
              : hasApp
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
                    isOnline ? "bg-emerald-500" : "bg-neutral-400"
                  }`}
                />
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>

            <div className="mt-1 text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {nickname}
            </div>

            {/* 音乐卡片 (横向布局) */}
            {isMusic && (
              <div className="mt-3.5 flex flex-col rounded-xl border border-neutral-200/50 bg-neutral-100/50 p-3 dark:border-neutral-700/50 dark:bg-neutral-800/40">
                <div className="flex gap-3">
                  <div className="h-[52px] w-[52px] shrink-0 overflow-hidden rounded-md bg-neutral-200 shadow-sm dark:bg-neutral-800">
                    {musicCover ? (
                      <img
                        src={musicCover}
                        alt={`${musicTitle} cover`}
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Music2 className="h-6 w-6 text-emerald-500" />
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-center">
                    <div className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {musicTitle}
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-neutral-500 dark:text-neutral-400">
                      {musicArtist}
                    </div>
                    <div className="mt-0.5 text-[10px] text-neutral-400 dark:text-neutral-500">
                      MoeKoe Music · {musicIsPlaying ? "Playing" : "Paused"}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <div className="flex h-3 items-end gap-[2px]">
                    <span className={`w-[3px] rounded-sm bg-neutral-400 dark:bg-neutral-500 ${musicIsPlaying ? "h-2 animate-pulse" : "h-1"}`} />
                    <span className={`w-[3px] rounded-sm bg-neutral-400 dark:bg-neutral-500 ${musicIsPlaying ? "h-3 animate-pulse [animation-delay:120ms]" : "h-1"}`} />
                    <span className={`w-[3px] rounded-sm bg-neutral-400 dark:bg-neutral-500 ${musicIsPlaying ? "h-1.5 animate-pulse [animation-delay:240ms]" : "h-1"}`} />
                  </div>

                  <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                    <div 
                      className="absolute left-0 top-0 h-full rounded-full bg-neutral-500 transition-all duration-1000 ease-linear dark:bg-neutral-400"
                      style={{ width: `${progressPercent}%` }} 
                    />
                  </div>

                  <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                    {formatTime(localProgress)} / {formatTime(musicDuration)}
                  </span>
                </div>
              </div>
            )}

            {/* App 使用状态 (始终在底部) */}
            {!isMusic && !hasApp && (
              <div className="mt-3.5 text-xs text-neutral-500">No active status</div>
            )}
            
            {hasApp && liveStatus.app?.name && (
              <div className="mt-2.5 flex items-center gap-2.5 rounded-lg bg-neutral-100/70 p-2 dark:bg-neutral-800/40">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10">
                  {liveStatus.app.icon || getAppIconFallback(liveStatus.app.name) ? (
                    <img
                      src={liveStatus.app.icon || getAppIconFallback(liveStatus.app.name)!}
                      alt="app"
                      className="h-4 w-4 object-contain"
                      onError={(e) => {
                        const fallback = getAppIconFallback(liveStatus.app?.name || "");
                        if (fallback && e.currentTarget.src !== fallback) {
                          e.currentTarget.src = fallback;
                        } else {
                          e.currentTarget.style.display = "none";
                        }
                      }}
                    />
                  ) : (
                    <Laptop className="h-3 w-3 text-neutral-500" />
                  )}
                </div>
                <span className="truncate text-xs text-neutral-600 dark:text-neutral-300">
                  Now using <span className="font-semibold text-neutral-900 dark:text-white">{liveStatus.app.name}</span>
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}