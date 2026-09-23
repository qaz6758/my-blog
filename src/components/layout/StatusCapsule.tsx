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
  if (name.includes("moekoe")) return "https://music.moekoe.cn/logo.png";
  
  return null;
}

interface StatusCapsuleProps {
  nickname?: string;
  variant?: "capsule" | "card";
  hideWhenOffline?: boolean;
  disablePopover?: boolean;
  inlineApp?: boolean;
}

export function StatusCapsule({
  nickname = "Vince Ou",
  variant = "capsule",
  hideWhenOffline = true,
  disablePopover = false,
  inlineApp = false,
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
  const [coverError, setCoverError] = useState(false);

  React.useEffect(() => {
    setCoverError(false);
  }, [musicCover]);

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

  // 离线状态（没有任何正在收听的音乐或运行中的应用）且开启离线隐藏时，静默不渲染
  if (hideWhenOffline && !isOnline) {
    return null;
  }

  // 纯卡片内容渲染函数 (侧边栏模式)
  const renderCardContent = () => (
    <div className="w-full select-none p-3.5 manga-panel">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-400">
          LIVE DESK
        </span>
        <span className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
          <span
            className={`h-1.5 w-1.5 rounded-none ${
              isOnline ? "bg-neutral-800 dark:bg-white" : "bg-neutral-300 dark:bg-neutral-700"
            }`}
          />
          {isOnline ? "ON" : "OFF"}
        </span>
      </div>

      <div className="mt-1.5 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
        {nickname}
      </div>

      {/* 音乐卡片 (横向版画风格) */}
      {isMusic && (
        <div className="mt-4 flex flex-col border border-black/[0.06] dark:border-white/[0.08] p-2.5">
          <div className="flex gap-3">
            <div className="h-11 w-11 shrink-0 overflow-hidden border border-black/[0.04] dark:border-white/10 grayscale-[20%]">
              {musicCover && !coverError ? (
                <img
                  src={musicCover}
                  alt={`${musicTitle} cover`}
                  referrerPolicy="no-referrer"
                  onError={() => setCoverError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-black/[0.02] dark:bg-white/[0.02]">
                  <Music2 className="h-4 w-4 text-neutral-400" />
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <div className="truncate text-xs font-bold text-neutral-900 dark:text-neutral-100">
                {musicTitle}
              </div>
              <div className="mt-0.5 truncate text-[10px] font-serif text-neutral-500 dark:text-neutral-400">
                {musicArtist}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="flex h-2.5 items-end gap-[2px]">
              <span className={`w-[2px] bg-neutral-800 dark:bg-white ${musicIsPlaying ? "h-1.5 animate-pulse" : "h-0.5"}`} />
              <span className={`w-[2px] bg-neutral-800 dark:bg-white ${musicIsPlaying ? "h-2.5 animate-pulse [animation-delay:120ms]" : "h-0.5"}`} />
              <span className={`w-[2px] bg-neutral-800 dark:bg-white ${musicIsPlaying ? "h-1 animate-pulse [animation-delay:240ms]" : "h-0.5"}`} />
            </div>

            <div className="relative h-[2px] flex-1 overflow-hidden bg-black/5 dark:bg-white/10">
              <div 
                className="absolute left-0 top-0 h-full bg-neutral-900 dark:bg-white transition-all duration-1000 ease-linear"
                style={{ width: `${progressPercent}%` }} 
              />
            </div>

            <span className="text-[9px] font-mono text-neutral-400 dark:text-neutral-400">
              {formatTime(localProgress)} / {formatTime(musicDuration)}
            </span>
          </div>
        </div>
      )}

      {/* App 使用状态 */}
      {!isMusic && !hasApp && (
        <div className="mt-3 text-[10px] font-mono text-neutral-400 dark:text-neutral-400">No active status</div>
      )}
      
      {hasApp && liveStatus.app?.name && (
        <div className="mt-3 flex items-center gap-2 border border-black/[0.04] dark:border-white/[0.05] p-1.5 grayscale-[50%] opacity-80">
          <div className="flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden opacity-80">
            {liveStatus.app.icon || getAppIconFallback(liveStatus.app.name) ? (
              <img
                src={liveStatus.app.icon || getAppIconFallback(liveStatus.app.name)!}
                alt="app"
                className="h-3 w-3 object-contain"
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
          <span className="truncate text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
            {liveStatus.app.name}
          </span>
        </div>
      )}
    </div>
  );

  if (variant === "card") {
    return renderCardContent();
  }

  // 默认胶囊模式 (极轻量刻痕，去 SaaS 化)
  return (
    <div
      className="relative shrink-0 select-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 顶部印章 / 刻痕 */}
      <div
        onClick={() => !disablePopover && setIsHovered((prev) => !prev)}
        className={`group flex cursor-pointer items-center px-1 py-1 transition-colors ${inlineApp ? 'w-full justify-between pr-4' : ''}`}
      >
        <div className="flex items-center gap-1.5">
          <div 
            className="flex h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 items-center justify-center overflow-hidden grayscale-0 opacity-100 dark:grayscale dark:opacity-60 transition-all group-hover:grayscale-0 group-hover:opacity-100"
            style={{ transitionDuration: "var(--realm-motion-duration)", transitionTimingFunction: "var(--realm-motion-ease)" }}
          >
            {isMusic && musicCover && !coverError ? (
              <img
                src={musicCover}
                alt="music cover"
                referrerPolicy="no-referrer"
                onError={() => setCoverError(true)}
                className="h-full w-full object-cover rounded-[1px]"
              />
            ) : isMusic ? (
              <Music2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-pulse text-neutral-900 dark:text-white" />
            ) : hasApp && (liveStatus.app!.icon || getAppIconFallback(liveStatus.app!.name)) ? (
              <img
                src={liveStatus.app!.icon || getAppIconFallback(liveStatus.app!.name)!}
                alt="status"
                className="h-full w-full object-cover rounded-[1px]"
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
              <Laptop className="h-3 w-3 text-neutral-700 dark:text-neutral-400" />
            ) : (
              <Circle
                size={6}
                fill="currentColor"
                className="text-neutral-700 dark:text-neutral-600"
              />
            )}
          </div>

          <div className="flex min-w-0 max-w-[140px] sm:max-w-[160px] flex-col text-left leading-none">
            <span 
              className="truncate text-[10px] sm:text-[11px] font-mono font-medium text-neutral-800 dark:text-neutral-400 dark:font-normal group-hover:text-black dark:group-hover:text-white transition-colors"
              style={{ transitionDuration: "var(--realm-motion-duration)" }}
            >
              {isMusic
                ? musicTitle
                : hasApp
                  ? liveStatus.app?.name
                  : "Offline"}
            </span>
          </div>
        </div>

        {/* 附加 App 信息 (当既有音乐又有 App 时，排在右侧) */}
        {inlineApp && isMusic && hasApp && liveStatus.app?.name && (
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 items-center justify-center overflow-hidden grayscale-0 opacity-100 dark:grayscale dark:opacity-60 transition-all group-hover:grayscale-0 group-hover:opacity-100">
              {liveStatus.app.icon || getAppIconFallback(liveStatus.app.name) ? (
                <img
                  src={liveStatus.app.icon || getAppIconFallback(liveStatus.app.name)!}
                  alt="app"
                  className="h-full w-full object-contain"
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
                <Laptop className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-neutral-700 dark:text-neutral-400" />
              )}
            </div>
            <div className="flex min-w-0 max-w-[140px] sm:max-w-[160px] flex-col text-right leading-none">
              <span className="truncate text-[10px] sm:text-[11px] font-mono font-medium text-neutral-800 dark:text-neutral-400 dark:font-normal group-hover:text-black dark:group-hover:text-white transition-colors">
                {liveStatus.app.name}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 悬浮/点击展开卡片 (纸墨版) */}
      {!disablePopover && (
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute left-0 top-full z-50 mt-1.5 w-[220px] sm:w-[240px] manga-panel p-3.5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3 border-b border-black/[0.04] dark:border-white/[0.04] pb-2">
                <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-400">
                  LIVE DESK
                </span>
                <span className="flex items-center gap-1 text-[9px] font-mono text-neutral-500 dark:text-neutral-400">
                  <span
                    className={`h-1 w-1 rounded-none ${
                      isOnline ? "bg-neutral-800 dark:bg-white" : "bg-neutral-300 dark:bg-neutral-700"
                    }`}
                  />
                  {isOnline ? "ON" : "OFF"}
                </span>
              </div>

              {/* 音乐卡片 (横向版画风格) */}
              {isMusic && (
                <div className="flex flex-col">
                  <div className="flex gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden border border-black/[0.04] dark:border-white/10 grayscale-[10%]">
                      {musicCover ? (
                        <img
                          src={musicCover}
                          alt={`${musicTitle} cover`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-black/[0.02] dark:bg-white/[0.02]">
                          <Music2 className="h-3.5 w-3.5 text-neutral-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                      <div className="truncate text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        {musicTitle}
                      </div>
                      <div className="mt-0.5 truncate text-[10px] font-serif text-neutral-500 dark:text-neutral-400">
                        {musicArtist}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="flex h-2 items-end gap-[2px]">
                      <span className={`w-[2px] bg-neutral-800 dark:bg-white ${musicIsPlaying ? "h-1.5 animate-pulse" : "h-0.5"}`} />
                      <span className={`w-[2px] bg-neutral-800 dark:bg-white ${musicIsPlaying ? "h-2 animate-pulse [animation-delay:120ms]" : "h-0.5"}`} />
                      <span className={`w-[2px] bg-neutral-800 dark:bg-white ${musicIsPlaying ? "h-1 animate-pulse [animation-delay:240ms]" : "h-0.5"}`} />
                    </div>

                    <div className="relative h-[2px] flex-1 overflow-hidden bg-black/5 dark:bg-white/10">
                      <div 
                        className="absolute left-0 top-0 h-full bg-neutral-900 dark:bg-white transition-all duration-1000 ease-linear"
                        style={{ width: `${progressPercent}%` }} 
                      />
                    </div>

                    <span className="text-[9px] font-mono text-neutral-400 dark:text-neutral-400">
                      {formatTime(localProgress)}
                    </span>
                  </div>
                </div>
              )}

              {!isMusic && !hasApp && (
                <div className="text-[10px] font-mono text-neutral-400 dark:text-neutral-400">No active status</div>
              )}
              
              {hasApp && liveStatus.app?.name && (
                <div className="flex items-center gap-2 grayscale-[30%] opacity-90 mt-1">
                  <div className="flex h-3.5 w-3.5 shrink-0 items-center justify-center overflow-hidden">
                    {liveStatus.app.icon || getAppIconFallback(liveStatus.app.name) ? (
                      <img
                        src={liveStatus.app.icon || getAppIconFallback(liveStatus.app.name)!}
                        alt="app"
                        className="h-full w-full object-contain"
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
                      <Laptop className="h-3 w-3 text-neutral-400" />
                    )}
                  </div>
                  <span className="truncate text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                    {liveStatus.app.name}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}