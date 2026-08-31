"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, HeartCrack, MessageSquare, Star, ArrowRightCircle } from "lucide-react";
import { ThoughtMediaItem } from "@/lib/notion";
import { supabase } from "@/lib/supabase";

export function ThoughtsClientList({
  initialItems,
}: {
  initialItems: ThoughtMediaItem[];
}) {
  const [items, setItems] = useState<ThoughtMediaItem[]>(initialItems);
  const [userReactions, setUserReactions] = useState<
    Record<string, { liked?: boolean; upvoted?: boolean }>
  >({});

  // 1. 初始化时向 Supabase 批量同步所有帖子的真实评论总数
  useEffect(() => {
    async function fetchAllCommentCounts() {
      const ids = initialItems.map((item) => item.id);
      if (ids.length === 0) return;

      const { data, error } = await supabase
        .from("thought_comments")
        .select("thought_id")
        .in("thought_id", ids);

      if (data && !error) {
        // 统计每篇帖子的评论数
        const counts: Record<string, number> = {};
        data.forEach((row: { thought_id: string }) => {
          counts[row.thought_id] = (counts[row.thought_id] || 0) + 1;
        });

        // 批量更新列表里的回复数
        setItems((prev) =>
          prev.map((item) => ({
            ...item,
            replies: counts[item.id] || 0,
          }))
        );
      }
    }

    fetchAllCommentCounts();
  }, [initialItems]);

  // 2. 点赞 / 心碎交互
  const toggleReaction = (id: string, type: "liked" | "upvoted") => {
    const currentReaction = userReactions[id] || {};
    const willBeActive = !currentReaction[type];

    setUserReactions((prev) => ({
      ...prev,
      [id]: { ...prev[id], [type]: willBeActive },
    }));

    setItems((list) =>
      list.map((item) => {
        if (item.id !== id) return item;
        if (type === "liked") {
          return { ...item, likes: willBeActive ? item.likes + 1 : item.likes - 1 };
        }
        return { ...item, upvotes: willBeActive ? item.upvotes + 1 : item.upvotes - 1 };
      })
    );
  };

  return (
    <div className="space-y-8">
      {items.map((item) => {
        const reaction = userReactions[item.id] || {};
        const isNote = item.type.toUpperCase() === "NOTE";

        return (
          <article
            key={item.id}
            className="relative rounded-none p-5 sm:p-6 shadow-sm torn-paper"
          >
            {/* 头部信息 */}
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

            {/* 2. 主体渲染 */}
            {isNote ? (
              <>
                <div className="text-[14.5px] leading-8 text-neutral-800 dark:text-[#d4d4d8] whitespace-pre-line text-justify">
                  {item.description}
                </div>
                {item.posterUrl && (
                  <div className="mt-4 max-h-96 w-full overflow-hidden rounded-none border border-black/[0.05] dark:border-white/[0.05]">
                    <img
                      src={item.posterUrl}
                      alt={item.title || "随笔配图"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </>
            ) : (
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
                  <p className="mt-2 text-[14px] leading-7 text-neutral-700 dark:text-[#a1a1aa] line-clamp-4 text-justify">
                    {item.description}
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
            )}

            <div className="mb-3.5 h-[1px] w-full border-t border-dashed border-black/[0.06] dark:border-white/[0.08]" />

            {/* 底部交互栏 */}
            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-[#71717a] select-none">
              <div className="flex items-center gap-5">
                {/* 喜欢 */}
                <button
                  type="button"
                  onClick={() => toggleReaction(item.id, "liked")}
                  className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                    reaction.liked
                      ? "text-rose-500"
                      : "hover:text-neutral-900 dark:hover:text-[#f4f4f5]"
                  }`}
                >
                  <Heart
                    className={`h-3.5 w-3.5 ${
                      reaction.liked ? "fill-current" : ""
                    }`}
                  />
                  <span>{item.likes}</span>
                </button>

                {/* 心碎 */}
                <button
                  type="button"
                  onClick={() => toggleReaction(item.id, "upvoted")}
                  className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                    reaction.upvoted
                      ? "text-neutral-900 dark:text-[#f4f4f5]"
                      : "hover:text-neutral-900 dark:hover:text-[#f4f4f5]"
                  }`}
                >
                  <HeartCrack
                    className={`h-3.5 w-3.5 ${
                      reaction.upvoted ? "fill-current" : ""
                    }`}
                  />
                  <span>{item.upvotes}</span>
                </button>

                {/* 实时评论数 */}
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>{item.replies}</span>
                </div>
              </div>

              {/* 查看入口 */}
              <Link
                href={`/thoughts/${item.id}`}
                className="flex items-center gap-1 hover:text-neutral-900 dark:hover:text-[#f4f4f5] transition-colors"
              >
                查看 <ArrowRightCircle className="h-3.5 w-3.5 opacity-80" />
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}