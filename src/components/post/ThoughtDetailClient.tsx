// components/thoughts/ThoughtDetailClient.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Heart, HeartCrack, MessageSquare, Star } from "lucide-react";
import { ThoughtMediaItem } from "@/lib/notion";
import { LazyCommentSection } from "@/components/post/LazyCommentSection";
import { supabase } from "@/lib/supabase";

export function ThoughtDetailClient({ item }: { item: ThoughtMediaItem }) {
  // 1. 独立管理互动状态
  const [likes, setLikes] = useState(item.likes || 0);
  const [upvotes, setUpvotes] = useState(item.upvotes || 0);
  const [commentCount, setCommentCount] = useState(0);
  const [reaction, setReaction] = useState<{ liked?: boolean; upvoted?: boolean }>({});

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
      <article className="relative rounded-none border border-black/[0.05] bg-[#fafafa] p-5 sm:p-6 shadow-sm dark:border-white/[0.05] dark:bg-[#18181a]">
        <div className="mb-4 flex items-center gap-2 text-[13px]">
          <span className="font-semibold text-neutral-900 dark:text-[#f4f4f5]">
            {item.author}
          </span>
          {item.action && (
            <span className="text-neutral-500 dark:text-[#a1a1aa]">
              {item.action}
            </span>
          )}
          <span className="text-neutral-400 dark:text-[#71717a]">
            {item.time}
          </span>
        </div>

        {isNote ? (
          <div className="mb-5 text-[14.5px] leading-8 text-neutral-800 dark:text-[#d4d4d8] whitespace-pre-line text-justify">
            {item.description}
            {item.posterUrl && (
              <div className="mt-4 max-h-96 w-full overflow-hidden rounded-none border border-black/[0.05] dark:border-white/[0.05]">
                <img
                  src={item.posterUrl}
                  alt={item.title || "随笔配图"}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="mb-5 text-[14.5px] leading-8 text-neutral-800 dark:text-[#d4d4d8] whitespace-pre-line text-justify">
              {item.description.split("\n\n")[0]}
            </div>

            <div className="mb-5 rounded-none border border-black/[0.05] bg-black/[0.02] p-4 dark:border-white/[0.05] dark:bg-white/[0.02] sm:flex sm:flex-row-reverse sm:gap-5 sm:p-5">
              {item.posterUrl && (
                <div className="mb-4 sm:mb-0 w-20 shrink-0 sm:w-28 self-start">
                  <div className="aspect-[2/3] w-full overflow-hidden rounded-none bg-neutral-200 dark:bg-neutral-800">
                    <img
                      src={item.posterUrl}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-mono tracking-wider text-neutral-500 dark:text-[#a1a1aa] uppercase">
                  {item.type} {item.year ? `· ${item.year}` : ""}
                </div>
                <h2 className="mt-1 text-base font-bold text-neutral-900 dark:text-[#f4f4f5] tracking-tight sm:text-lg">
                  {item.title}
                </h2>
                <p className="mt-2 text-[14px] leading-7 text-neutral-700 dark:text-[#a1a1aa] line-clamp-3 text-justify">
                  {item.description.split("\n\n").slice(1).join("\n\n")}
                </p>
                
                {(item.rating || item.tags || item.sourceUrl) && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-neutral-500 dark:text-[#71717a]">
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
          </>
        )}

        {/* 顶部互动栏（支持点击 + 与 Supabase 评论数联动） */}
        <div className="flex items-center gap-5 text-xs text-neutral-500 dark:text-[#71717a] select-none">
          <button
            type="button"
            onClick={() => toggleReaction("liked")}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
              reaction.liked
                ? "text-rose-500"
                : "hover:text-neutral-900 dark:hover:text-[#f4f4f5]"
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${reaction.liked ? "fill-current" : ""}`} />
            <span>{likes}</span>
          </button>

          <button
            type="button"
            onClick={() => toggleReaction("upvoted")}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
              reaction.upvoted
                ? "text-neutral-900 dark:text-[#f4f4f5]"
                : "hover:text-neutral-900 dark:hover:text-[#f4f4f5]"
            }`}
          >
            <HeartCrack className={`h-3.5 w-3.5 ${reaction.upvoted ? "fill-current" : ""}`} />
            <span>{upvotes}</span>
          </button>

          <div className="flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{commentCount}</span>
          </div>
        </div>
      </article>

      <div className="my-10 h-[1px] w-full border-t border-dashed border-black/[0.08] dark:border-white/[0.08]" />

      {/* 评论区：发布新评论时同步递增计数 */}
      <LazyCommentSection
        thoughtId={item.id}
        onCommentAdded={() => setCommentCount((prev) => prev + 1)}
      />
    </>
  );
}