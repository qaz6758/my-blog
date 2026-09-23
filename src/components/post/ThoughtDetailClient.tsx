// components/thoughts/ThoughtDetailClient.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { Heart, MessageSquare, Star } from "lucide-react";
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

const STORAGE_KEY = "ow_thoughts_reactions_v1";

export function ThoughtDetailClient({ item }: { item: ThoughtMediaItem }) {
  const { locale, convertText } = useI18n();

  // 1. 独立管理互动状态与 SWR 最新数据
  const [thoughtItem, setThoughtItem] = useState<ThoughtMediaItem>(item);
  const [likes, setLikes] = useState(item.likes || 0);
  const [commentCount, setCommentCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [displayTime, setDisplayTime] = useState(item.time);

  // SWR：毫秒级后台静默获取 Notion 最新随想录改动，支持免重新部署即时生效
  useEffect(() => {
    const workerUrl =
      process.env.NEXT_PUBLIC_NOTION_WORKER_URL ||
      "https://notion-api.dedeboki123.workers.dev";
    fetch(`${workerUrl}/api/thoughts/${item.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Fetch failed");
        return res.json();
      })
      .then((data) => {
        if (data?.success && data.data) {
          setThoughtItem((prev) => ({
            ...prev,
            ...data.data,
          }));
        }
      })
      .catch(() => {});
  }, [item.id]);

  const displayTitle = useMemo(() => {
    if (!thoughtItem.title) return "";
    return locale === "zh-TW" ? convertText(thoughtItem.title) : thoughtItem.title;
  }, [thoughtItem.title, locale, convertText]);

  const displayDesc = useMemo(() => {
    if (!thoughtItem.description) return "";
    return locale === "zh-TW" ? convertText(thoughtItem.description) : thoughtItem.description;
  }, [thoughtItem.description, locale, convertText]);

  // 客户端挂载时动态计算相对时间，与列表页算法严格统一
  useEffect(() => {
    if (thoughtItem.rawDate || thoughtItem.time) {
      const info = formatThoughtDate(thoughtItem.rawDate || thoughtItem.time);
      if (info.relative) {
        setDisplayTime(info.relative);
      }
    }
  }, [thoughtItem.rawDate, thoughtItem.time]);

  // 恢复本地红心高亮状态
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed[item.id]?.liked) {
          setIsLiked(true);
        }
      }
    } catch (e) {
      console.warn("读取本地点赞记忆失败", e);
    }
  }, [item.id]);

  const isNote = item.type.toUpperCase() === "NOTE";

  // 2. 初始化时向 Supabase 获取该文章的真实评论总数与真实点赞数
  useEffect(() => {
    async function fetchCommentCountAndLikes() {
      const [commentRes, likesRes] = await Promise.all([
        supabase
          .from("thought_comments")
          .select("*", { count: "exact", head: true })
          .eq("thought_id", item.id),
        supabase
          .from("thoughts")
          .select("likes")
          .eq("id", item.id)
          .maybeSingle(),
      ]);

      if (commentRes.count !== null) setCommentCount(commentRes.count);
      if (likesRes.data && typeof likesRes.data.likes === "number") {
        setLikes(likesRes.data.likes);
      }
    }
    fetchCommentCountAndLikes();
  }, [item.id]);

  // 3. Supabase Realtime 实时监听当前随想录点赞变动
  useEffect(() => {
    const channel = supabase
      .channel(`thought-detail-${item.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "thoughts",
          filter: `id=eq.${item.id}`,
        },
        (payload) => {
          const updated = payload.new as { likes?: number };
          if (typeof updated?.likes === "number") {
            setLikes(updated.likes);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [item.id]);

  // 4. 点赞交互 (函数式更新 + 本地防刷防重 + Supabase 实时读写同步)
  const toggleLike = async () => {
    const willBeLiked = !isLiked;
    setIsLiked(willBeLiked);

    if (typeof window !== "undefined") {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        saved[item.id] = { ...(saved[item.id] || {}), liked: willBeLiked };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      } catch (e) {
        console.warn("写入本地点赞记忆失败", e);
      }
    }

    const delta = willBeLiked ? 1 : -1;
    const newLikes = Math.max(0, likes + delta);
    setLikes(newLikes);

    try {
      const { error: rpcErr } = await supabase.rpc("increment_thought_like", {
        target_id: item.id,
        delta,
      });
      if (rpcErr) {
        await supabase
          .from("thoughts")
          .update({ likes: newLikes })
          .eq("id", item.id);
      }
    } catch (err) {
      console.error("云端点赞落盘失败:", err);
    }
  };

  return (
    <>
      {/* 独立内容块 */}
      {/* 独立内容块 */}
      <article className="relative rounded-none p-4 sm:p-5 shadow-sm manga-panel font-serif transition-all">
        <div className="mb-3 flex items-center gap-2 text-xs">
          <span className="font-semibold text-neutral-900 dark:text-[#eae5dc]">
            {thoughtItem.author}
          </span>
          {thoughtItem.action && (
            <span className="text-neutral-500 dark:text-[#9d9589]">
              {thoughtItem.action}
            </span>
          )}
          <span
            className="text-neutral-400 dark:text-[#777168]"
            title={thoughtItem.fullTime || thoughtItem.time}
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
            {thoughtItem.posterUrl && (
              <div className="mt-3 max-h-80 w-full overflow-hidden rounded-md border border-black/[0.05] dark:border-white/[0.05]">
                <img
                  src={thoughtItem.posterUrl}
                  alt={displayTitle || "随笔配图"}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </>
        ) : (
          <div className="mb-4 rounded-lg border border-black/[0.05] bg-black/[0.02] p-3 sm:p-3.5 dark:border-white/[0.05] dark:bg-white/[0.02] flex flex-row-reverse gap-3.5 sm:gap-4">
            {thoughtItem.posterUrl && (
              <div className="w-16 sm:w-20 shrink-0 self-start">
                <div className="aspect-[3/4] w-full overflow-hidden rounded-md bg-neutral-200 dark:bg-neutral-800 border border-black/[0.04] dark:border-white/10">
                  <img
                    src={thoughtItem.posterUrl}
                    alt={displayTitle}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-mono tracking-wider text-neutral-500 dark:text-[#9d9589] uppercase">
                {thoughtItem.type} {thoughtItem.year ? `· ${thoughtItem.year}` : ""}
              </div>
              <h2 className="mt-0.5 text-[15px] font-bold text-neutral-900 dark:text-[#eae5dc] tracking-tight">
                {displayTitle}
              </h2>
              <p className="mt-1 text-[13px] leading-relaxed text-neutral-700 dark:text-[#9d9589] whitespace-pre-line text-justify">
                {displayDesc}
              </p>
              
              {(thoughtItem.rating || thoughtItem.tags || thoughtItem.sourceUrl) && (
                <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-neutral-500 dark:text-[#777168]">
                  {thoughtItem.rating && (
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      {thoughtItem.rating}
                    </span>
                  )}
                  {thoughtItem.tags && <span>· {thoughtItem.tags}</span>}
                  {thoughtItem.sourceUrl && (
                    <span className="truncate">· {thoughtItem.sourceUrl}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mb-3 h-[1px] w-full border-t border-dashed border-black/[0.06] dark:border-white/[0.08]" />

        {/* 顶部互动栏（支持点击 + 与 Supabase 评论数与点赞数联动） */}
        <div className="flex items-center gap-5 text-xs text-neutral-500 dark:text-[#777168] select-none">
          <button
            type="button"
            onClick={toggleLike}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
              isLiked
                ? "text-[#b91c1c] dark:text-white"
                : "hover:text-[#b91c1c] dark:hover:text-white"
            }`}
            style={{ transitionDuration: "var(--realm-motion-duration)", transitionTimingFunction: "var(--realm-motion-ease)" }}
          >
            <Heart className={`h-3.5 w-3.5 ${isLiked ? "fill-current" : ""}`} />
            <span>{Math.max(likes, isLiked ? 1 : 0)}</span>
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