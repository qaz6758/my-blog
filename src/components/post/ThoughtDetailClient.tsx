// components/thoughts/ThoughtDetailClient.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { Heart, HeartCrack, MessageSquare, Star } from "lucide-react";
import { ThoughtMediaItem, formatThoughtDate } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n/I18nContext";

const CommentSection = dynamic(
  () =>
    import("@/components/post/CommentSection").then((m) => m.CommentSection),
  {
    ssr: false,
    loading: () => null,
  }
);

export function ThoughtDetailClient({ item }: { item: ThoughtMediaItem }) {
  const { locale, convertText } = useI18n();

  // 1. 独立管理互动状态
  const [likes, setLikes] = useState(item.likes || 0);
  const [upvotes, setUpvotes] = useState(item.upvotes || 0);
  const [commentCount, setCommentCount] = useState(0);
  const [reaction, setReaction] = useState<{ liked?: boolean; upvoted?: boolean }>({});
  const [displayTime, setDisplayTime] = useState(item.time);

  const displayTitle = useMemo(() => {
    if (!item.title) return "";
    return locale === "zh-TW" ? convertText(item.title) : item.title;
  }, [item.title, locale, convertText]);

  const displayDesc = useMemo(() => {
    if (!item.description) return "";
    return locale === "zh-TW" ? convertText(item.description) : item.description;
  }, [item.description, locale, convertText]);

  // 客户端挂载时动态计算相对时间，与列表页算法严格统一
  useEffect(() => {
    if (item.rawDate || item.time) {
      const info = formatThoughtDate(item.rawDate || item.time);
      if (info.relative) {
        setDisplayTime(info.relative);
      }
    }
  }, [item.rawDate, item.time]);

  const isNote = item.type.toUpperCase() === "NOTE";

  // 2. 初始化时向 Supabase 获取该文章的真实评论总数
  useEffect(() => {
    async function fetchCommentCount() {
      const { count } = await supabase
        .from("thought_comments")
        .select("*", { count: "exact", head: true })
        .eq("thought_id", item.id);
      if (count !== null) setCommentCount(count);
    }
    fetchCommentCount();
  }, [item.id]);

  // 3. 点击点赞 / 心碎的实时响应
  const toggleReaction = (type: "liked" | "upvoted") => {
    const willBeActive = !reaction[type];
    setReaction((prev) => ({ ...prev, [type]: willBeActive }));

    if (type === "liked") {
      setLikes((prev) => (willBeActive ? prev + 1 : prev - 1));
    } else {
      setUpvotes((prev) => (willBeActive ? prev + 1 : prev - 1));
    }
  };

  return (
    <>
      {/* 独立内容块 */}
      {/* 独立内容块 */}
      <article className="relative rounded-none p-4 sm:p-5 shadow-sm manga-panel font-serif transition-all">
        <div className="mb-3 flex items-center gap-2 text-xs">
          <span className="font-semibold text-neutral-900 dark:text-[#eae5dc]">
            {item.author}
          </span>
          {item.action && (
            <span className="text-neutral-500 dark:text-[#9d9589]">
              {item.action}
            </span>
          )}
          <span
            className="text-neutral-400 dark:text-[#777168]"
            title={item.fullTime || item.time}
          >
            {displayTime}
          </span>
        </div>

        {/* 主体渲染 */}
        {isNote ? (
          <>
            <div className="text-[14px] leading-relaxed text-neutral-800 dark:text-[#d6d0c7] whitespace-pre-line text-justify">
              {displayDesc}
            </div>
            {item.posterUrl && (
              <div className="mt-3 max-h-80 w-full overflow-hidden rounded-md border border-black/[0.05] dark:border-white/[0.05]">
                <img
                  src={item.posterUrl}
                  alt={displayTitle || "随笔配图"}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </>
        ) : (
          <div className="mb-4 rounded-lg border border-black/[0.05] bg-black/[0.02] p-3 sm:p-3.5 dark:border-white/[0.05] dark:bg-white/[0.02] flex flex-row-reverse gap-3.5 sm:gap-4">
            {item.posterUrl && (
              <div className="w-16 sm:w-20 shrink-0 self-start">
                <div className="aspect-[3/4] w-full overflow-hidden rounded-md bg-neutral-200 dark:bg-neutral-800 border border-black/[0.04] dark:border-white/10">
                  <img
                    src={item.posterUrl}
                    alt={displayTitle}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-mono tracking-wider text-neutral-500 dark:text-[#9d9589] uppercase">
                {item.type} {item.year ? `· ${item.year}` : ""}
              </div>
              <h2 className="mt-0.5 text-[15px] font-bold text-neutral-900 dark:text-[#eae5dc] tracking-tight">
                {displayTitle}
              </h2>
              <p className="mt-1 text-[13px] leading-relaxed text-neutral-700 dark:text-[#9d9589] whitespace-pre-line text-justify">
                {displayDesc}
              </p>
              
              {(item.rating || item.tags || item.sourceUrl) && (
                <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-neutral-500 dark:text-[#777168]">
                  {item.rating && (
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      {item.rating}
                    </span>
                  )}
                  {item.tags && <span>· {item.tags}</span>}
                  {item.sourceUrl && (
                    <span className="truncate">· {item.sourceUrl}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mb-3 h-[1px] w-full border-t border-dashed border-black/[0.06] dark:border-white/[0.08]" />

        {/* 顶部互动栏（支持点击 + 与 Supabase 评论数联动） */}
        <div className="flex items-center gap-5 text-xs text-neutral-500 dark:text-[#777168] select-none">
          <button
            type="button"
            onClick={() => toggleReaction("liked")}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
              reaction.liked
                ? "text-[#b91c1c] dark:text-white"
                : "hover:text-[#b91c1c] dark:hover:text-white"
            }`}
            style={{ transitionDuration: "var(--realm-motion-duration)", transitionTimingFunction: "var(--realm-motion-ease)" }}
          >
            <Heart className={`h-3.5 w-3.5 ${reaction.liked ? "fill-current" : ""}`} />
            <span>{likes}</span>
          </button>

          <button
            type="button"
            onClick={() => toggleReaction("upvoted")}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
              reaction.upvoted
                ? "text-neutral-900 dark:text-white"
                : "hover:text-neutral-900 dark:hover:text-white"
            }`}
            style={{ transitionDuration: "var(--realm-motion-duration)", transitionTimingFunction: "var(--realm-motion-ease)" }}
          >
            <HeartCrack className={`h-3.5 w-3.5 ${reaction.upvoted ? "fill-current" : ""}`} />
            <span>{upvotes}</span>
          </button>

          <div className="flex items-center gap-1.5 opacity-80">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{commentCount}</span>
          </div>
        </div>
      </article>

      <div className="my-10 h-[1px] w-full border-t border-dashed border-black/[0.08] dark:border-white/[0.08]" />

      {/* 评论区：发布新评论时同步递增计数 */}
      <CommentSection
        thoughtId={item.id}
        onCommentAdded={() => setCommentCount((prev) => prev + 1)}
      />
    </>
  );
}