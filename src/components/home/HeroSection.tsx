// src/components/home/HeroSection.tsx
"use client";

import React, { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { Music2, Laptop, Star, ArrowUpRight } from "lucide-react";
import { siteConfig } from "@/config/site";
import { useLiveStatus } from "@/hooks/useLiveStatus";
import { SiteVisitCounter } from "@/components/home/SiteVisitCounter";
import { RetroMusicWidget } from "@/components/home/RetroMusicWidget";
import { ContentCard } from "@/components/common/ContentCard";
import { Emote } from "@/components/common/Emote";
import type { NotionPostItem, ThoughtMediaItem } from "@/lib/data";
import type { Song } from "@/components/playlist/SongList";

/* ============================================================
 * 全局时钟同步器（秒级推演音乐播放进度）
 * ============================================================ */
let clockSnapshot = Date.now();
let clockInterval: ReturnType<typeof setInterval> | null = null;
const clockListeners = new Set<() => void>();

function subscribeToClock(listener: () => void) {
  clockListeners.add(listener);
  if (clockListeners.size === 1) {
    clockInterval = setInterval(() => {
      clockSnapshot = Date.now();
      clockListeners.forEach((callback) => callback());
    }, 1000);
  }

  return () => {
    clockListeners.delete(listener);
    if (clockListeners.size === 0 && clockInterval) {
      clearInterval(clockInterval);
      clockInterval = null;
    }
  };
}

const subscribeToNothing = () => () => {};
const getClockSnapshot = () => clockSnapshot;
const getServerClockSnapshot = () => 0;
const passthroughImageLoader = ({ src }: { src: string }) => src;

/* ============================================================
 * 常见软件 Logo 自动匹配
 * ============================================================ */
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

function isBrowserApp(appName: string): boolean {
  return /\b(?:chrome|google chrome|edge|microsoft edge|firefox|mozilla firefox|brave|vivaldi|opera|arc)\b/i.test(appName);
}

function getBrowserPageTitle(title: string | null, appName: string): string {
  if (!title) return "正在浏览网页";

  const escapedAppName = appName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const knownBrowserNames = "Google Chrome|Microsoft Edge|Mozilla Firefox|Chrome|Edge|Firefox|Brave|Vivaldi|Opera|Arc";
  const suffixPattern = new RegExp(`\\s*[-–—|]\\s*(?:${escapedAppName}|${knownBrowserNames})(?:\\s.*)?$`, "i");

  const pageTitle = title
    .replace(suffixPattern, "")
    .replace(/\s*(?:和另外\s*\d+\s*个页面|and\s+\d+\s+other\s+tabs).*$/i, "")
    .replace(/\s*[-–—|]\s*(?:个人|Personal|Profile(?:\s+\d+)?)$/i, "")
    .trim();

  return pageTitle || "正在浏览网页";
}

/* ============================================================
 * 数字徽章 (88x31 复古像素互联网收藏，致敬 Dane)
 * ============================================================ */
function RetroWebBadges() {
  const badges = [
    { label: "NEXT.JS 16", sub: "FULLSTACK", bg: "bg-slate-900 text-white", border: "border-slate-700" },
    { label: "CLOUDFLARE", sub: "WORKERS", bg: "bg-[#F38020] text-black", border: "border-[#d86d14]" },
    { label: "TYPESCRIPT", sub: "STRICT", bg: "bg-[#3178C6] text-white", border: "border-[#235a96]" },
    { label: "NEOVIM", sub: "VIM INSIDE", bg: "bg-[#18392b] text-emerald-300", border: "border-emerald-700" },
    { label: "CYBER CAT", sub: "MEOW 100%", bg: "bg-[#6b21a8] text-purple-200", border: "border-purple-600" },
    { label: "LO-FI AUDIO", sub: "24/7 BEATS", bg: "bg-[#78350f] text-amber-200", border: "border-amber-600" },
  ];

  return (
    <ContentCard title="Web Badges">
      <div className="grid grid-cols-3 gap-1.5 select-none">
        {badges.map((b) => (
          <div
            key={b.label}
            className={`h-[28px] px-1 py-0.5 rounded-[2px] border text-[9px] font-['W95FA',monospace] font-bold flex flex-col justify-center items-center leading-tight shadow-[inset_1px_1px_0px_rgba(255,255,255,0.2),inset_-1px_-1px_0px_rgba(0,0,0,0.35)] hover:brightness-110 cursor-default transition-all ${b.bg} ${b.border}`}
          >
            <span className="tracking-wider">{b.label}</span>
            <span className="text-[7.5px] opacity-75 font-normal tracking-tight">{b.sub}</span>
          </div>
        ))}
      </div>
    </ContentCard>
  );
}

function formatHomeDate(value: string) {
  const date = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.replace(/-/g, ".") : value;
}

function RecentPosts({ posts }: { posts: NotionPostItem[] }) {
  const latestPost = posts[0];

  return (
    <ContentCard
      title="Recent Posts"
    >
      {latestPost ? (
        <Link href={`/posts/${latestPost.slug || latestPost.id}`} data-post-link className="group flex items-start gap-2.5">
          {latestPost.cover_image && (
            <div className="relative mt-0.5 h-10 w-14 shrink-0 overflow-hidden rounded-[3px] border border-[#d0d7de] bg-[#e7ebf0] dark:border-white/40 dark:bg-transparent">
              <Image src={latestPost.cover_image} alt="" fill sizes="56px" className="object-cover transition-transform group-hover:scale-105" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p data-post-title className="post-title line-clamp-1 text-[12px] font-normal leading-relaxed">
              {latestPost.title}
            </p>
            {latestPost.summary && (
              <p data-post-meta className="mt-0.5 line-clamp-1 text-[11px] leading-relaxed">
                {latestPost.summary}
              </p>
            )}
          </div>
          <ArrowUpRight className="mt-1 h-3 w-3 shrink-0 text-[#8c959f] opacity-0 transition-opacity group-hover:opacity-100 dark:text-white" />
        </Link>
      ) : (
        <p data-post-meta className="py-1 text-[12px]">No posts published yet.</p>
      )}
    </ContentCard>
  );
}

function RecentThoughts({ thoughts }: { thoughts: ThoughtMediaItem[] }) {
  return (
    <ContentCard
      title="Recent Activity"
    >
      {thoughts.length > 0 ? (
        <div>
          {thoughts.slice(0, 1).map((thought) => {
            const isNote = thought.type.toUpperCase() === "NOTE";
            const href = thought.sourceUrl || `/thoughts/${thought.id}`;
            const content = isNote ? (
              <div className="flex min-w-0 items-start gap-2.5">
                <div className="min-w-0 flex-1">
                  <p data-thought-text className="thought-text line-clamp-2 whitespace-pre-line text-[12px] leading-relaxed">
                    {thought.description || thought.title}
                  </p>
                  {thought.posterUrl && (
                    <div className="relative mt-1.5 h-12 w-20 overflow-hidden rounded-[3px] border border-[#d0d7de] dark:border-[#394554]">
                      <Image src={thought.posterUrl} alt={thought.title || "动态配图"} fill sizes="80px" className="object-cover" />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex gap-2.5">
                {thought.posterUrl && (
                  <div className="relative aspect-[3/4] w-9 shrink-0 overflow-hidden rounded-[3px] border border-[#d0d7de] bg-[#e7ebf0] dark:border-white/40 dark:bg-transparent">
                    <Image src={thought.posterUrl} alt={thought.title} fill sizes="36px" className="object-cover" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-[#6e7781] dark:text-[#a1a1aa]">
                    {thought.author} {thought.action}
                  </p>
                  <h3 className="mt-0.5 line-clamp-2 text-[12px] font-bold leading-relaxed text-[#24292f] dark:text-white">
                    {thought.title}
                  </h3>
                  {(thought.year || thought.rating || thought.tags) && (
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 font-mono text-[9px] text-[#6e7781] dark:text-[#a1a1aa]">
                      {thought.year && <span>{thought.year}</span>}
                      {thought.rating && (
                        <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                          {thought.rating}<Star className="h-2.5 w-2.5 fill-current" />
                        </span>
                      )}
                      {thought.tags && <span className="truncate">{thought.tags}</span>}
                    </div>
                  )}
                  {thought.description && (
                    <p className="mt-1 line-clamp-1 text-[11px] leading-relaxed text-[#57606a] dark:text-[#a1a1aa]">
                      {thought.description}
                    </p>
                  )}
                </div>
              </div>
            );

            return (
              <article key={thought.id}>
                {thought.sourceUrl ? (
                  <a href={href} target="_blank" rel="noopener noreferrer" data-thought-link className="block group cursor-pointer">{content}</a>
                ) : (
                  <Link href={href} data-thought-link className="block group cursor-pointer">{content}</Link>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <p className="py-1 text-[12px] text-[#6e7781] dark:text-[#a1a1aa]">还没有新的动态。</p>
      )}
    </ContentCard>
  );
}

/* ============================================================
 * 主页核心组件 (严格对标图二真实高宽比：舒展大气，填充视口，无过大空白)
 * ============================================================ */
export function HeroSection({
  posts,
  thoughts,
  initialSongs = [],
}: {
  posts: NotionPostItem[];
  thoughts: ThoughtMediaItem[];
  initialSongs?: Song[];
}) {
  const { name } = siteConfig;
  const liveStatus = useLiveStatus();

  const isMusic = liveStatus.activity === "music" && liveStatus.music !== null;
  const hasApp = liveStatus.app !== null && Boolean(liveStatus.app.name);
  const appName = liveStatus.app?.name || "";
  const isBrowserActivity = hasApp && isBrowserApp(appName);
  const appIcon = liveStatus.app?.icon || getAppIconFallback(appName);
  const appTitle = isBrowserActivity
    ? getBrowserPageTitle(liveStatus.app?.title ?? null, appName)
    : appName;
  const isOnline = liveStatus.activity !== "offline";

  // 音乐相关数据
  const musicTitle = liveStatus.music?.title?.trim() || "未知歌曲";
  const musicArtist = liveStatus.music?.artist?.trim() || "未知歌手";
  const musicCover = liveStatus.music?.cover || null;
  const musicIsPlaying = liveStatus.music?.isPlaying ?? false;
  const [coverError, setCoverError] = useState(false);

  // 秒级归一化与进度计算
  const rawDuration = liveStatus.music?.duration || 0;
  const rawCurrentTime = liveStatus.music?.currentTime || 0;
  const isMs = rawDuration > 1000 || rawCurrentTime > 1000;
  const durationSec = isMs ? Math.floor(rawDuration / 1000) : Math.floor(rawDuration);
  const currentSec = isMs ? Math.floor(rawCurrentTime / 1000) : Math.floor(rawCurrentTime);

  const clockNow = useSyncExternalStore(
    isMusic && musicIsPlaying ? subscribeToClock : subscribeToNothing,
    getClockSnapshot,
    getServerClockSnapshot
  );

  const timeDiffMs = liveStatus.lastSeenAt ? clockNow - new Date(liveStatus.lastSeenAt).getTime() : 0;
  const elapsedSec = musicIsPlaying && timeDiffMs > 0 && timeDiffMs < 120_000 ? Math.floor(timeDiffMs / 1000) : 0;
  const localCurrentSec = durationSec > 0 ? Math.min(durationSec, currentSec + elapsedSec) : currentSec + elapsedSec;
  const progressPercent = durationSec > 0 ? Math.min(100, Math.max(0, (localCurrentSec / durationSec) * 100)) : 0;

  const formatSeconds = (sec: number) => {
    if (!sec || sec < 0) return "0:00";
    const total = Math.floor(sec);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // 站点上线天数计算
  const launchTimestamp = new Date(siteConfig.launchDate).getTime();
  const uptimeDays = Math.max(1, Math.floor((clockNow - launchTimestamp) / (1000 * 60 * 60 * 24)));

  // 格式化最后活动时间
  const formatLastSeen = (isoStr: string | null) => {
    if (!isoStr) return "刚刚";
    try {
      const d = new Date(isoStr);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    } catch {
      return "刚刚";
    }
  };

  return (
    <div className="w-full">
      {/* ===================== 核心双栏网格 ===================== */}
      <div className="mt-1 flex w-full flex-col items-stretch gap-2.5 md:flex-row md:gap-2">

            {/* ===================== 左栏 (宽度 300px，状态与元信息) ===================== */}
            <div className="flex w-full shrink-0 flex-col gap-2.5 md:w-[35%] md:flex-[0_0_35%]">

              {/* 卡片 A: 当前状态 ( Dane 细方框独立卡片) */}
              <div data-home-content-card className="flex min-h-[64px] items-center justify-between rounded-[4px] border-2 border-[#d0d7de] bg-transparent px-4 py-3 shadow-[0_1px_2px_rgba(27,31,36,0.08)] dark:border-white dark:shadow-none">
                {/* 状态文字排版 */}
                <div className="home-element-enter home-element-enter--4 home-status-display flex items-baseline select-none leading-none pt-[3px] font-['W95FA',sans-serif]">
                  <span className="text-[20px] font-normal text-[#1f2937] dark:text-white mr-1 leading-none align-baseline">
                    I&apos;m
                  </span>
                  <div className="inline-flex items-baseline leading-none align-baseline">
                    <span
                      className={`text-[26px] sm:text-[28px] font-bold leading-none align-baseline tracking-normal ${
                        isOnline
                          ? "text-emerald-500 dark:text-[#90ee90]"
                          : "text-[#e11d48] dark:text-[#ffb6c1]"
                      }`}
                    >
                      {isOnline ? "ONLINE" : "OFFLINE"}
                    </span>
                    <span
                      className={`text-[26px] sm:text-[28px] font-bold leading-none align-baseline ml-[2px] -skew-x-[15deg] inline-block ${
                        isOnline
                          ? "text-emerald-500 dark:text-[#90ee90]"
                          : "text-[#e11d48] dark:text-[#ffb6c1]"
                      }`}
                    >
                      !
                    </span>
                  </div>
                </div>

                {/* 状态匹配微表情 */}
                {isOnline ? (
                  <Emote src="/emotes/xqcjam.webp" alt="xqcJAM" className="home-element-enter home-element-enter--5 h-8 w-auto" />
                ) : (
                  <Emote src="/emotes/xqcdespair.webp" alt="xqcDespair" className="home-element-enter home-element-enter--5 h-8 w-auto" />
                )}
              </div>

              {/* 卡片 B: Status / Now Playing (对标 Dane 同款动态标题) */}
              <ContentCard
                title={isMusic ? "Now Playing" : "Status"}
              >
                {isMusic ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative h-[60px] w-[60px] shrink-0 rounded-[4px] overflow-hidden border border-[#d0d7de] dark:border-white/40 bg-slate-100 dark:bg-transparent">
                        {musicCover && !coverError ? (
                          <Image
                            src={musicCover}
                            alt={musicTitle}
                            fill
                            sizes="60px"
                            unoptimized
                            loader={passthroughImageLoader}
                            onError={() => setCoverError(true)}
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex w-full h-full items-center justify-center">
                            <Music2 className="h-4 w-4 text-slate-400" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-sans text-[13px] font-bold text-[#24292f] dark:text-white leading-tight">
                          {musicTitle}
                        </div>
                        <div className="truncate font-sans text-[12px] text-[#57606a] dark:text-[#a1a1aa] mt-0.5">
                          {musicArtist}
                        </div>
                      </div>
                    </div>
                    {/* 细进度条 (时长拆分至进度条两侧，清晰整数像素排版) */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-mono font-medium text-[#57606a] dark:text-[#a1a1aa] shrink-0 tabular-nums leading-none select-none">
                        {formatSeconds(localCurrentSec)}
                      </span>
                      <div className="relative h-[2.5px] flex-1 overflow-hidden bg-[#e1e4e8] dark:bg-[#394554] rounded-full">
                        <div
                          className="absolute left-0 top-0 h-full bg-[#24292f] dark:bg-[#3fb950] transition-all duration-1000 ease-linear"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono font-medium text-[#57606a] dark:text-[#a1a1aa] shrink-0 tabular-nums leading-none select-none">
                        {formatSeconds(durationSec)}
                      </span>
                    </div>
                  </div>
                ) : hasApp ? (
                  <div className="flex items-center gap-2.5">
                    <div className="relative h-[60px] w-[60px] shrink-0 rounded-[4px] p-1.5 overflow-hidden border border-[#d0d7de] dark:border-white/40 bg-white dark:bg-transparent flex items-center justify-center">
                      {appIcon ? (
                        <Image
                          src={appIcon}
                          alt={appName}
                          fill
                          sizes="60px"
                          unoptimized
                          loader={passthroughImageLoader}
                          className="object-contain"
                          onError={(e) => {
                            const fallback = getAppIconFallback(appName);
                            if (fallback && e.currentTarget.src !== fallback) {
                              e.currentTarget.src = fallback;
                            } else {
                              e.currentTarget.style.display = "none";
                            }
                          }}
                        />
                      ) : (
                        <Laptop className="h-4 w-4 text-slate-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-sans text-[13px] font-bold text-[#24292f] dark:text-white leading-tight">
                        {appTitle}
                      </div>
                      {!isBrowserActivity && (
                        <div className="truncate font-sans text-[11px] text-[#57606a] dark:text-[#a1a1aa] mt-0.5">
                          {liveStatus.app?.title || "全神贯注操作中"}
                        </div>
                      )}
                    </div>
                  </div>
                ) : isOnline ? (
                  <div className="flex items-center gap-2.5">
                    <div className="relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-[4px] border border-[#d0d7de] bg-white dark:border-white/40 dark:bg-transparent">
                      <Image
                        src="/emotes/xqcstare.webp"
                        alt="xQc 发呆表情"
                        fill
                        sizes="60px"
                        className="object-contain p-0.5"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-sans text-[13px] font-bold text-[#24292f] dark:text-white">
                        在线，暂无活动信息
                      </div>
                      <div className="font-sans text-[12px] text-[#57606a] dark:text-[#a1a1aa] mt-0.5 truncate">
                        状态心跳正常
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <div className="relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-[4px] border border-[#d0d7de] bg-white dark:border-white/40 dark:bg-transparent">
                      <Image
                        src="/emotes/xqcstare.webp"
                        alt="xQc 发呆表情"
                        fill
                        sizes="60px"
                        className="object-contain p-0.5"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-sans text-[13px] font-bold text-[#24292f] dark:text-white">
                        暂时离线
                      </div>
                      <div className="font-sans text-[12px] text-[#57606a] dark:text-[#a1a1aa] mt-0.5 truncate">
                        {liveStatus.lastSeenAt ? `最后在线 ${formatLastSeen(liveStatus.lastSeenAt)}` : "暂无最近在线记录"}
                      </div>
                    </div>
                  </div>
                )}
              </ContentCard>

              {/* 卡片 C: Site Stats */}
              <ContentCard title="Site Stats">
                <div className="flex flex-col gap-1.5 font-['W95FA',monospace] text-xs">
                  <div className="site-stat-row flex items-center justify-between">
                    <span className="site-stat-label">Uptime:</span>
                    <div className="flex items-center gap-1">
                      <span
                        suppressHydrationWarning
                        className="site-stat-value font-bold tabular-nums text-[13px]"
                      >
                        {uptimeDays} days
                      </span>
                      <Emote src="/emotes/xqcl.webp" alt="xqcL" className="h-4 w-auto" />
                    </div>
                  </div>

                  <div className="site-stat-row flex items-center justify-between">
                    <span className="site-stat-label">Launch Date:</span>
                    <span className="site-stat-value">
                      {siteConfig.launchDate}
                    </span>
                  </div>

                </div>
              </ContentCard>

              <ContentCard title="Site Visits">
                <div className="flex h-[74px] items-center justify-center">
                  <SiteVisitCounter />
                </div>
              </ContentCard>

              {/* 卡片 D: 社交链接 */}
              <ContentCard title="Links">
                <div className="flex items-center justify-between text-[#24292f] dark:text-white px-1 py-0.5">
                  <a
                    href="https://github.com/qaz6758"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub"
                    className="hover:text-[#33FF33] dark:hover:text-[#33FF33] text-[#24292f] dark:text-white transition-colors flex items-center gap-1.5 font-mono text-xs font-bold"
                  >
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                    <span className="hidden sm:inline">GitHub</span>
                  </a>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Twitter"
                    className="hover:text-[#33FF33] dark:hover:text-[#33FF33] text-[#24292f] dark:text-white transition-colors flex items-center gap-1.5 font-mono text-xs font-bold"
                  >
                    <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <span className="hidden sm:inline">Twitter</span>
                  </a>
                  <a
                    href="https://space.bilibili.com/520681544"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Bilibili"
                    className="hover:text-[#33FF33] dark:hover:text-[#33FF33] text-[#24292f] dark:text-white transition-colors flex items-center gap-1.5 font-mono text-xs font-bold"
                  >
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                      <path d="M17.813 4.653h.854c1.51 0 2.769 1.233 2.825 2.743l.008.19v10.514c0 1.51-1.233 2.769-2.743 2.825l-.19.008H5.433c-1.51 0-2.769-1.233-2.825-2.743l-.008-.19V7.586c0-1.51 1.233-2.769 2.743-2.825l.19-.008h.854L4.76 2.767a.846.846 0 0 1 .15-.992.839.839 0 0 1 1.134.02l2.95 2.858h6.012l2.95-2.858a.839.839 0 0 1 1.134-.02.846.846 0 0 1 .15.992l-1.427 1.886ZM5.433 6.347a1.144 1.144 0 0 0-1.138 1.054l-.006.185v10.514c0 .618.496 1.122 1.109 1.138l.185.006h13.134c.618 0 1.122-.496 1.138-1.109l.006-.185V7.586c0-.618-.496-1.122-1.109-1.138l-.185-.006H5.433Zm3.18 4.793c.69 0 1.25.56 1.25 1.25s-.56 1.25-1.25 1.25-1.25-.56-1.25-1.25.56-1.25 1.25-1.25Zm6.774 0c.69 0 1.25.56 1.25 1.25s-.56 1.25-1.25 1.25-1.25-.56-1.25-1.25.56-1.25 1.25-1.25Z" />
                    </svg>
                    <span className="hidden sm:inline">Bilibili</span>
                  </a>
                  <a
                    href="https://t.me"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Telegram"
                    className="hover:text-[#33FF33] dark:hover:text-[#33FF33] text-[#24292f] dark:text-white transition-colors flex items-center gap-1.5 font-mono text-xs font-bold"
                  >
                    <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.37.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                    </svg>
                    <span className="hidden sm:inline">Telegram</span>
                  </a>
                </div>
              </ContentCard>

              <RetroWebBadges />

            </div>

            {/* ===================== 右栏 (主体叙述与徽章，与左栏高度完美平齐) ===================== */}
            <div className="flex min-w-0 flex-1 flex-col gap-2.5">

              {/* 卡片 E: About Me (对标 Dane 图一同款 14px / line-height 1.6 / 列表 1.3 排印) */}
              <ContentCard title="About Me">
                <div className="text-[13.5px] sm:text-[14px] text-[#24292f] dark:text-white font-['W95FA',sans-serif]">
                  <p className="mb-3 leading-[1.6]">
                    嗨，我是 Vince Ou！一名全栈摸索者与自由折腾者。
                  </p>

                  <div className="pt-0.5">
                    <p className="font-bold text-[#24292f] dark:text-white mb-2 select-none font-['W95FA',sans-serif]">
                      关于我的一些快速事实:
                    </p>
                    <ul className="list-disc pl-5">
                      <li className="mb-1 leading-[1.3]">
                        来自南方小城 <Emote src="/emotes/city.webp" alt="city" />，在城市角落写代码、听歌 <Emote src="/emotes/clouds.webp" alt="clouds" />。
                      </li>
                      <li className="mb-1 leading-[1.3]">
                        全栈摸索中 <Emote src="/emotes/nerdge.webp" alt="nerdge" />，主要折腾 <span className="font-semibold text-[#9179E4]">Next.js</span>、<span className="font-semibold text-[#3178C6]">TypeScript</span> 和 <span className="font-semibold text-[#ea580c] dark:text-[#fb923c]">Cloudflare</span>。
                      </li>
                      <li className="mb-1 leading-[1.3]">
                        沉迷 <span className="font-semibold text-[#d97706] dark:text-[#facc15]">music</span> 和开源折腾 <Emote src="/emotes/yap.webp" alt="yap" />。
                      </li>
                      <li className="mb-1 leading-[1.3]">
                        猫 <Emote src="/emotes/cat.webp" alt="cat" />&狗 <Emote src="/emotes/dog.webp" alt="dog" />爱好者，但我并没有养<Emote src="/emotes/loser.webp" alt="loser" />。
                      </li>
                    </ul>
                  </div>
                </div>
              </ContentCard>

              <RecentPosts posts={posts} />
              <RecentThoughts thoughts={thoughts} />
              <RetroMusicWidget initialSongs={initialSongs} />

            </div>
          </div>
    </div>
  );
}