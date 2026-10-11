// components/thoughts/ThoughtDetailClient.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Star, ArrowLeft } from "lucide-react";
import { TypewriterTitle } from "@/components/common/TypewriterTitle"; 
import { ThoughtMediaItem, formatThoughtDate, translateAction } from "@/lib/data";
import { supabase } from "@/lib/supabase";
const STORAGE_KEY = "ow_thoughts_reactions_v1";

export function ThoughtDetailClient({ item }: { item: ThoughtMediaItem }) {
  // 1. 独立管理互动状态与 SWR 最新数据
  const [thoughtItem, setThoughtItem] = useState<ThoughtMediaItem>(item);
  const [likes, setLikes] = useState(item.likes || 0);
  const [isLiked, setIsLiked] = useState(false);

  // SWR：毫秒级后台静默获取 Notion 最新随想录改动，支持免重新部署即时生效
  useEffect(() => {
    const workerUrl =
      process.env.NEXT_PUBLIC_NOTION_WORKER_URL ||
      "https://api.vinceou.site";
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

  const displayTitle = thoughtItem.title || "";
  const displayDesc = thoughtItem.description || "";
  const displayTime = formatThoughtDate(thoughtItem.rawDate || thoughtItem.time).relative || thoughtItem.time;

  // 恢复本地红心高亮状态
  useEffect(() => {
    let frame = 0;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const reaction = (parsed as Record<string, unknown>)[item.id];
          if (
            reaction &&
            typeof reaction === "object" &&
            !Array.isArray(reaction) &&
            (reaction as Record<string, unknown>).liked === true
          ) {
            frame = requestAnimationFrame(() => setIsLiked(true));
          }
        }
      }
    } catch (e) {
      console.warn("读取本地点赞记忆失败", e);
    }
    return () => cancelAnimationFrame(frame);
  }, [item.id]);

  const isNote = item.type.toUpperCase() === "NOTE";

  // 2. 初始化时向 Supabase 获取该文章的真实点赞数
  useEffect(() => {
    async function fetchLikes() {
      const { data } = await supabase
        .from("thoughts")
        .select("likes")
        .eq("id", item.id)
        .maybeSingle();

      if (data && typeof data.likes === "number") {
        setLikes(data.likes);
      }
    }
    fetchLikes();
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
      if (rpcErr) throw rpcErr;
    } catch (err) {
      console.error("云端点赞落盘失败:", err);
      setIsLiked(!willBeLiked);
      setLikes(likes);
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        saved[item.id] = { ...(saved[item.id] || {}), liked: !willBeLiked };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      } catch (storageError) {
        console.warn("恢复本地点赞状态失败", storageError);
      }
    }
  };

  return (
<div className="flex flex-col w-full flex-1 min-h-0 pt-0">
  <div className="flex items-center justify-center pb-1 mb-2.5 sm:mb-3 border-b-2 border-[#d0d7de] dark:border-white select-none">
    <h2 className="font-bold tracking-[0.12em] font-['W95FA',sans-serif] leading-none text-[19px] sm:text-[22px] text-[#24292f] dark:text-white">
      <TypewriterTitle text="Thoughts" />
    </h2>
  </div>

      {/* 2. 复古返回按钮 */}
      <div className="mb-3">
        <Link
          href="/thoughts"
          className="inline-flex items-center gap-1.5 text-xs font-['W95FA',sans-serif] text-neutral-500 hover:text-[#d0d7de] dark:text-neutral-400 dark:hover:text-[#d0d7de] transition-colors select-none"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> cd..
        </Link>
      </div>

      {/* 3. 1:1 像素级复刻图一的同款方框卡片 */}
      <article
        data-home-content-card
        className="rounded-[4px] border-2 border-[#d0d7de] dark:border-white bg-transparent p-3 sm:p-3.5 shadow-[0_1px_2px_rgba(27,31,36,0.08)] dark:shadow-none transition-colors flex flex-col gap-2.5 font-sans"
      >
        {/* 头部元信息：纯粹的日期与标签（完全对齐图一） */}
        <div className="flex items-center justify-between pb-1.5 border-b-2 border-[#d0d7de] dark:border-white text-[11px] sm:text-[12px] font-['W95FA',sans-serif]">
          <span className="font-mono text-neutral-600 dark:text-neutral-300">
            {thoughtItem.fullTime || thoughtItem.time || displayTime}
          </span>
          {thoughtItem.tags && (
            <span className="px-1.5 py-0.5 rounded-[2px] border border-[#d0d7de] dark:border-white/30 text-[10px]">
              #{thoughtItem.tags}
            </span>
          )}
        </div>

        {/* 正文内容（文字大小、行高、对齐 100% 对齐图一） */}
        <p className="text-[13.5px] sm:text-[14.5px] leading-relaxed whitespace-pre-line font-sans text-neutral-800 dark:text-neutral-200">
          {displayDesc || displayTitle}
        </p>

        {/* 配图（如果有） */}
        {thoughtItem.posterUrl && (
          <div className="mt-1">
            <div className="relative block max-w-[280px] h-[160px] rounded-[3px] overflow-hidden border border-[#d0d7de] dark:border-white/40">
              <img
                src={thoughtItem.posterUrl}
                alt="Thought media"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        )}

        {/* 底部点赞与互动（完全对齐图一样式） */}
        <div className="flex items-center gap-4 pt-0.5 text-[11px] sm:text-[12px] select-none">
          <button
            type="button"
            onClick={toggleLike}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
              isLiked
                ? "text-[#ff4d4f] font-bold"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${isLiked ? "fill-current text-[#ff4d4f]" : ""}`} />
            <span className="font-mono">{Math.max(likes, isLiked ? 1 : 0)}</span>
          </button>
        </div>
      </article>
    </div>
  );
}