"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, MessageSquare, Star, ArrowRightCircle } from "lucide-react";
import { ThoughtMediaItem, formatThoughtDate, getThoughtTimestamp } from "@/lib/data";
import { supabase } from "@/lib/supabase";

export function ThoughtsClientList({
  initialItems,
}: {
  initialItems: ThoughtMediaItem[];
}) {
  const [items, setItems] = useState<ThoughtMediaItem[]>(() => {
    const seen = new Set<string>();
    const list = (initialItems || []).filter((item) => {
      if (!item?.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
    return list.sort((a, b) => getThoughtTimestamp(b) - getThoughtTimestamp(a));
  });
  const STORAGE_KEY = "ow_thoughts_reactions_v1";

  // 初始状态必须是干净的空对象（首屏与服务器 100% 对齐，彻底消灭水合警告）
  const [userReactions, setUserReactions] = useState<
    Record<string, { liked?: boolean }>
  >({});

  // 客户端注水完成后：恢复红心高亮状态
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setUserReactions(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("读取本地点赞记忆失败", e);
    }
  }, []);

  // 1. 毫秒级后台静默获取最新 Notion 随想录（SWR 实时刷新，免部署）
  useEffect(() => {
    const workerUrl =
      process.env.NEXT_PUBLIC_NOTION_WORKER_URL ||
      "https://notion-api.dedeboki123.workers.dev";

    fetch(`${workerUrl}/api/thoughts`)
      .then((res) => res.json())
      .then((result) => {
        if (result?.success && Array.isArray(result.data) && result.data.length > 0) {
          setItems((prev) => {
            const map = new Map<string, ThoughtMediaItem>();
            prev.forEach((item) => map.set(item.id, item));
            result.data.forEach((item: ThoughtMediaItem, index: number) => {
              const existing = map.get(item.id);
              const targetDate = existing?.rawDate || item.rawDate || item.time;
              const dateInfo = formatThoughtDate(targetDate);
              map.set(item.id, {
                ...item,
                // 🔥 核心保护：如果已有排版内容更丰富完整，坚决保留长段落排版，杜绝闪烁降级！
                description:
                  existing?.description &&
                  existing.description.length > item.description.length
                    ? existing.description
                    : item.description || existing?.description || "",
                time: dateInfo.relative || existing?.time || item.time,
                fullTime: dateInfo.full || existing?.fullTime,
                rawDate: existing?.rawDate || item.rawDate || item.time,
                year:
                  item.year ||
                  existing?.year ||
                  (dateInfo.full ? dateInfo.full.slice(0, 4) : ""),
                replies: existing?.replies ?? item.replies ?? 0,
                likes: existing?.likes ?? item.likes ?? 0,
                upvotes: 0,
                _order: index,
              } as any);
            });

            const mergedList = Array.from(map.values());
            mergedList.sort((a: any, b: any) => {
              const diff = getThoughtTimestamp(b) - getThoughtTimestamp(a);
              if (diff !== 0) return diff;
              return (a._order ?? 0) - (b._order ?? 0);
            });
            return mergedList;
          });
        }
      })
      .catch(() => {});
  }, []);

  // 2. 初始化与文章变动时向 Supabase 批量同步真实评论数与真实点赞数
  useEffect(() => {
    async function fetchCountsAndLikes() {
      const ids = items.map((item) => item.id).filter(Boolean);
      if (ids.length === 0) return;

      const [commentsRes, likesRes] = await Promise.all([
        supabase
          .from("thought_comments")
          .select("thought_id")
          .in("thought_id", ids),
        supabase
          .from("thoughts")
          .select("id, likes")
          .in("id", ids),
      ]);

      const counts: Record<string, number> = {};
      if (commentsRes.data && !commentsRes.error) {
        commentsRes.data.forEach((row: { thought_id: string }) => {
          counts[row.thought_id] = (counts[row.thought_id] || 0) + 1;
        });
      }

      const cloudLikes: Record<string, number> = {};
      if (likesRes.data && !likesRes.error) {
        likesRes.data.forEach((row: { id: string; likes: number }) => {
          if (row?.id && typeof row.likes === "number") {
            cloudLikes[row.id] = row.likes;
          }
        });
      }

      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          replies: counts[item.id] !== undefined ? counts[item.id] : (item.replies || 0),
          likes: cloudLikes[item.id] !== undefined ? cloudLikes[item.id] : (item.likes || 0),
        }))
      );
    }

    fetchCountsAndLikes();
  }, [items.length]);

  // 3. Supabase Realtime 实时双向同步（跨设备、跨端点赞秒级广播）
  useEffect(() => {
    const channel = supabase
      .channel("public-thoughts-likes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "thoughts" },
        (payload) => {
          const updated = payload.new as { id: string; likes?: number };
          if (updated?.id && typeof updated.likes === "number") {
            setItems((prev) =>
              prev.map((it) =>
                it.id === updated.id ? { ...it, likes: updated.likes! } : it
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 4. 点赞交互 (函数式更新 + 本地防刷防重 + Supabase 实时读写同步)
  const toggleLike = async (id: string) => {
    const currentReaction = userReactions[id] || {};
    const willBeActive = !currentReaction.liked;

    // ① 函数式安全更新：防闭包丢失，红心 100% 毫秒级响应！
    setUserReactions((prev) => {
      const updated = {
        ...prev,
        [id]: { liked: willBeActive },
      };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.warn("写入本地失败", e);
        }
      }
      return updated;
    });

    // ② 计算新点赞数（增量同步）
    const delta = willBeActive ? 1 : -1;
    const currentItem = items.find((t) => t.id === id);
    const baseLikes = currentItem?.likes || 0;
    const newLikes = Math.max(0, baseLikes + delta);

    // ③ 乐观更新列表展示
    setItems((list) =>
      list.map((item) => (item.id === id ? { ...item, likes: newLikes } : item))
    );

    // ④ 云端落盘：优先原子 RPC，失败降级为直接 UPDATE
    try {
      const { error: rpcErr } = await supabase.rpc("increment_thought_like", {
        target_id: id,
        delta,
      });
      if (rpcErr) {
        await supabase
          .from("thoughts")
          .update({ likes: newLikes })
          .eq("id", id);
      }
    } catch (err) {
      console.error("云端点赞落盘失败:", err);
    }
  };

  return (
    <div className="space-y-6">
      {items.map((item) => {
        const reaction = userReactions[item.id] || {};
        const isNote = item.type.toUpperCase() === "NOTE";

        return (
          <article
            key={item.id}
            className="relative rounded-none p-4 sm:p-5 shadow-sm manga-panel font-serif transition-all"
          >
            {/* 头部信息 */}
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
                {item.time}
              </span>
            </div>

            {/* 2. 主体渲染 */}
            {isNote ? (
              <>
                <div className="text-[14px] leading-relaxed text-neutral-800 dark:text-[#d6d0c7] whitespace-pre-line text-justify">
                  {item.description}
                </div>
                {item.posterUrl && (
                  <div className="mt-3 max-h-80 w-full overflow-hidden rounded-md border border-black/[0.05] dark:border-white/[0.05]">
                    <img
                      src={item.posterUrl}
                      alt={item.title || "随笔配图"}
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
                        alt={item.title}
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
                    {item.title}
                  </h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-neutral-700 dark:text-[#9d9589] line-clamp-3 text-justify">
                    {item.description}
                  </p>
                  {(item.rating || item.tags || item.sourceUrl) && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-neutral-500 dark:text-[#71717a]">
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

            {/* 底部交互栏 */}
            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-[#777168] select-none">
              <div className="flex items-center gap-4">
              {/* 喜欢按钮 */}
              <button
                type="button"
                onClick={() => toggleLike(item.id)}
                className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                  reaction.liked
                    ? "text-[#b91c1c] dark:text-white"
                    : "hover:text-[#b91c1c] dark:hover:text-white"
                }`}
                style={{ transitionDuration: "var(--realm-motion-duration)", transitionTimingFunction: "var(--realm-motion-ease)" }}
              >
                <Heart
                  className={`h-3.5 w-3.5 ${
                    reaction.liked ? "fill-current" : ""
                  }`}
                />
                {/* 保证只要红心亮起，数字保底绝对是真实累计数！ */}
                <span>{Math.max(item.likes || 0, reaction.liked ? 1 : 0)}</span>
              </button>

              {/* 实时评论数 */}
              <div className="flex items-center gap-1.5 opacity-80">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{item.replies}</span>
              </div>
            </div>

              {/* 查看入口 */}
              <Link
                href={`/thoughts/${item.id}`}
                prefetch={false}
                className="flex items-center gap-1 hover:text-[#b91c1c] dark:hover:text-white transition-colors"
                style={{ transitionDuration: "var(--realm-motion-duration)", transitionTimingFunction: "var(--realm-motion-ease)" }}
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