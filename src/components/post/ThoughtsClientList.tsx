"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Star, ArrowRightCircle, ExternalLink } from "lucide-react";
import { ThoughtMediaItem, formatThoughtDate, getThoughtTimestamp, translateAction } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n/I18nContext";

type OrderedThought = ThoughtMediaItem & { _order: number };
type UserReaction = { liked?: boolean };

function isThoughtMediaItem(value: unknown): value is ThoughtMediaItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.author === "string" &&
    typeof item.action === "string" &&
    typeof item.time === "string" &&
    typeof item.type === "string" &&
    typeof item.year === "string" &&
    typeof item.title === "string" &&
    typeof item.description === "string" &&
    typeof item.likes === "number" &&
    typeof item.upvotes === "number" &&
    typeof item.replies === "number"
  );
}

function parseUserReactions(value: string): Record<string, UserReaction> {
  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

  return Object.fromEntries(
    Object.entries(parsed).flatMap(([id, reaction]) => {
      if (!reaction || typeof reaction !== "object" || Array.isArray(reaction)) return [];
      const liked = (reaction as Record<string, unknown>).liked;
      return typeof liked === "boolean" ? [[id, { liked }]] : [];
    })
  );
}

export function ThoughtsClientList({
  initialItems,
}: {
  initialItems: ThoughtMediaItem[];
}) {
  const { locale } = useI18n();
  const isEn = locale === "en";

  const [items, setItems] = useState<ThoughtMediaItem[]>(() => {
    const seen = new Set<string>();
    const list = (initialItems || []).filter((item) => {
      if (!item?.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
    return list.sort((a, b) => getThoughtTimestamp(b) - getThoughtTimestamp(a));
  });
  const itemIdsKey = items
    .map((item) => item.id)
    .filter(Boolean)
    .join("\0");
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
        const reactions = parseUserReactions(saved);
        requestAnimationFrame(() => setUserReactions(reactions));
      }
    } catch (e) {
      console.warn("读取本地点赞记忆失败", e);
    }
  }, []);

  // 1. 毫秒级后台静默获取最新 Notion 随想录（SWR 实时刷新，免部署）
  useEffect(() => {
    let isCurrent = true;
    const workerUrl =
      process.env.NEXT_PUBLIC_NOTION_WORKER_URL ||
      "https://api.vinceou.site";

    fetch(`${workerUrl}/api/thoughts`)
      .then((res) => res.json())
      .then((result) => {
        if (!isCurrent) return;
        if (
          result?.success &&
          Array.isArray(result.data) &&
          result.data.every(isThoughtMediaItem)
        ) {
          setItems((prev) => {
            const existingMap = new Map<string, ThoughtMediaItem>();
            prev.forEach((item) => existingMap.set(item.id, item));

            // 以最新的 Notion 数据源为唯一真实基准：Notion 中已删除的项即时剔除
            const updatedList: OrderedThought[] = result.data.map((item: ThoughtMediaItem, index: number) => {
              const existing = existingMap.get(item.id);
              const targetDate = item.rawDate || item.time || existing?.rawDate || existing?.time || "";
              const dateInfo = formatThoughtDate(targetDate, locale);
              return {
                ...item,
                // 实时采用最新 Notion 数据，支持修改与删除秒级生效
                description: item.description ?? existing?.description ?? "",
                time: dateInfo.relative || existing?.time || item.time,
                fullTime: dateInfo.full || existing?.fullTime,
                rawDate: targetDate,
                year:
                  item.year ||
                  existing?.year ||
                  (dateInfo.full ? dateInfo.full.slice(0, 4) : ""),
                replies: existing?.replies ?? item.replies ?? 0,
                likes: existing?.likes ?? item.likes ?? 0,
                upvotes: 0,
                _order: index,
              };
            });

            updatedList.sort((a, b) => {
              const diff = getThoughtTimestamp(b) - getThoughtTimestamp(a);
              if (diff !== 0) return diff;
              return (a._order ?? 0) - (b._order ?? 0);
            });
            return updatedList;
          });
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          console.warn("[Thoughts] 后台随想同步失败:", error);
        }
      });
    return () => {
      isCurrent = false;
    };
  }, [locale]);

  // 2. 初始化与文章变动时向 Supabase 批量同步真实点赞数
  useEffect(() => {
    async function fetchLikes() {
      const ids = itemIdsKey ? itemIdsKey.split("\0") : [];
      if (ids.length === 0) return;

      const likesRes = await supabase
        .from("thoughts")
        .select("id, likes")
        .in("id", ids);

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
          likes: cloudLikes[item.id] !== undefined ? cloudLikes[item.id] : (item.likes || 0),
        }))
      );
    }

    fetchLikes();
  }, [itemIdsKey]);

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

    // ④ 云端只通过原子 RPC 写入，避免客户端直接覆盖共享计数
    try {
      const { error: rpcErr } = await supabase.rpc("increment_thought_like", {
        target_id: id,
        delta,
      });
      if (rpcErr) throw rpcErr;
    } catch (err) {
      console.error("云端点赞落盘失败:", err);
      setItems((list) =>
        list.map((item) => (item.id === id ? { ...item, likes: baseLikes } : item))
      );
      setUserReactions((prev) => {
        const updated = { ...prev, [id]: currentReaction };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (storageError) {
          console.warn("恢复本地点赞状态失败", storageError);
        }
        return updated;
      });
    }
  };

  return (
    <div className="w-full">
      {/* 顶部标题：响应多语言切换 */}
      <header className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl font-sans">
            {isEn ? "Thoughts" : "思考"}
          </h1>
        </div>
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 tracking-widest font-sans">
          {isEn ? "Whispers of mind, bound into volumes" : "感君倾耳，辑录成册"}
        </p>
      </header>

      <div className="space-y-6">
        {items.map((item) => {
          const reaction = userReactions[item.id] || {};
          const isNote = item.type.toUpperCase() === "NOTE";
          const targetDate = item.rawDate || item.time;
          const dateInfo = formatThoughtDate(targetDate, locale);

          return (
            <article
              key={item.id}
              className="relative rounded-none p-4 sm:p-5 manga-panel font-sans"
            >
              {/* 头部信息 */}
              <div className="mb-3 flex items-center gap-2 text-xs">
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {item.author}
                </span>
                {item.action && (
                  <span className="text-neutral-500 dark:text-neutral-400">
                    {translateAction(item.action, isEn)}
                  </span>
                )}
                <span
                  className="text-neutral-400 dark:text-neutral-400"
                  title={dateInfo.full || item.fullTime || item.time}
                >
                  {dateInfo.relative || item.time}
                </span>
              </div>

              {/* 2. 主体渲染 */}
              {isNote ? (
                <>
                  <div className="text-[14px] leading-relaxed text-neutral-800 dark:text-neutral-300 whitespace-pre-line text-justify">
                    {item.description}
                  </div>
                  {item.posterUrl && (
                    <div className="mt-3 max-h-80 w-full overflow-hidden rounded-md border border-black/[0.05] dark:border-white/[0.05]">
                      <img
                        src={item.posterUrl}
                        alt={item.title || (isEn ? "Attachment image" : "随笔配图")}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="mb-4 flex gap-3.5 sm:gap-4 mt-2">
                  {item.posterUrl && (
                    <div className="w-[60px] sm:w-[72px] shrink-0 mt-1">
                      {item.sourceUrl ? (
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group/poster relative block aspect-[3/4] w-full overflow-hidden rounded-[4px] bg-neutral-100 dark:bg-neutral-800 border border-black/[0.04] dark:border-white/10 shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer"
                          title={`${item.title} (${isEn ? "Open detail" : "点击查看详情页"})`}
                        >
                          <img
                            src={item.posterUrl}
                            alt={item.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover/poster:scale-105"
                          />
                        </a>
                      ) : (
                        <Link
                          href={`/thoughts/${item.id}`}
                          className="group/poster block aspect-[3/4] w-full overflow-hidden rounded-[4px] bg-neutral-100 dark:bg-neutral-800 border border-black/[0.04] dark:border-white/10 shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer"
                          title={item.title}
                        >
                          <img
                            src={item.posterUrl}
                            alt={item.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover/poster:scale-105"
                          />
                        </Link>
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[14px] sm:text-[15px] font-medium text-neutral-900 dark:text-neutral-100 tracking-tight leading-snug">
                      {item.sourceUrl ? (
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline transition-colors"
                        >
                          {item.title}
                        </a>
                      ) : (
                        <Link href={`/thoughts/${item.id}`} className="hover:underline">
                          {item.title}
                        </Link>
                      )}
                    </h2>
                    
                    {(item.year || item.rating || item.tags) && (
                      <div className="mt-0.5 text-[12px] text-neutral-500 dark:text-neutral-400 flex flex-wrap items-center gap-1.5">
                        {item.year && <span className="font-mono">{item.year}</span>}
                        {item.year && item.rating && <span className="opacity-40 font-mono">/</span>}
                        {item.rating && (
                          <span className="flex items-center gap-0.5 font-mono">
                            {item.rating} 
                            <Star className="h-2.5 w-2.5 fill-current opacity-80 mb-[1px]" />
                          </span>
                        )}
                        {(item.year || item.rating) && item.tags && (
                          <span className="opacity-40 font-mono">/</span>
                        )}
                        {item.tags && (
                          <span className="text-[12px] text-neutral-500 dark:text-neutral-400">
                            {item.tags}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <p className="mt-1.5 text-[13px] sm:text-[14px] leading-relaxed text-neutral-600 dark:text-neutral-400 line-clamp-3 text-justify">
                      {item.description}
                    </p>
                  </div>
                </div>
              )}

              <div className="mb-3 h-[1px] w-full border-t border-dashed border-black/[0.06] dark:border-white/[0.08]" />

              {/* 底部交互栏 */}
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 select-none">
                <div className="flex items-center gap-4">
                  {/* 喜欢按钮 */}
                  <button
                    type="button"
                    onClick={() => toggleLike(item.id)}
                    className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                      reaction.liked
                        ? "text-neutral-900 dark:text-white font-bold"
                        : "hover:text-neutral-900 dark:hover:text-white"
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
                </div>

                {/* 查看入口 */}
                <Link
                  href={`/thoughts/${item.id}`}
                  prefetch={false}
                  className="flex items-center gap-1 hover:text-neutral-900 dark:hover:text-white transition-colors"
                  style={{ transitionDuration: "var(--realm-motion-duration)", transitionTimingFunction: "var(--realm-motion-ease)" }}
                >
                  {isEn ? "View" : "查看"} <ArrowRightCircle className="h-3.5 w-3.5 opacity-80" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="py-24 text-center">
          <p className="text-[15px] font-sans text-neutral-500 dark:text-neutral-400">
            {isEn ? "No thoughts yet" : "暂无随想录"}
          </p>
        </div>
      )}
    </div>
  );
}