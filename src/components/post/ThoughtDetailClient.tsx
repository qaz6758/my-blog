// components/thoughts/ThoughtDetailClient.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TypewriterTitle } from "@/components/common/TypewriterTitle";
import { ThoughtMediaItem, formatThoughtDate, formatEnglishThoughtDate, formatThoughtType } from "@/lib/data";

export function ThoughtDetailClient({ item }: { item: ThoughtMediaItem }) {
  const [thoughtItem, setThoughtItem] = useState<ThoughtMediaItem>(item);

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

  return (
    <div className="flex flex-col w-full flex-1 min-h-0 pt-0">
      {/* 1. 顶部标题栏与贯穿全宽的横线 */}
      <div className="flex items-center justify-center pb-1 mb-2.5 sm:mb-3 border-b-2 border-[#d0d7de] dark:border-white select-none w-full">
        <h2 className="font-bold tracking-[0.12em] font-['W95FA',sans-serif] leading-none text-[19px] sm:text-[22px] text-[#1f2328] dark:text-white">
          <TypewriterTitle text="Thoughts" />
        </h2>
      </div>

      <div className="flex flex-col flex-1 w-full max-w-[620px] mx-auto">
        {/* 2. 复古返回按钮 */}
        <div className="mb-3">
          <Link
            href="/thoughts"
            className="inline-flex items-center gap-1.5 text-xs font-['W95FA',sans-serif] text-[#656d76] hover:text-[#0969da] dark:text-neutral-400 dark:hover:text-[#d0d7de] transition-colors select-none"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> cd..
          </Link>
        </div>

        {/* 3. 1:1 像素级复刻图一的同款方框卡片 */}
        <article
          data-home-content-card
          className="rounded-[6px] border-2 border-[#d0d7de] dark:border-white bg-transparent p-3 sm:p-3.5 shadow-[0_1px_2px_rgba(27,31,36,0.08)] dark:shadow-none transition-colors flex flex-col gap-2.5 font-sans"
        >
          {/* 头部元信息：类型标识与英文日期 (完全对齐图一格式与排版) */}
          <div className="flex items-center justify-between text-[13px] sm:text-[13.5px] font-bold text-[#1f2328] dark:text-white">
            <span className="font-sans font-bold">
              {formatThoughtType(thoughtItem.type)} @ {formatEnglishThoughtDate(thoughtItem.rawDate || thoughtItem.fullTime || thoughtItem.time || displayTime)}
            </span>
            {thoughtItem.tags && (
              <span className="font-normal text-[11px] font-mono text-[#656d76] dark:text-[#a1a1aa]">
                #{thoughtItem.tags}
              </span>
            )}
          </div>

          {/* 正文内容 */}
          <p className="text-[13.5px] sm:text-[14.5px] leading-relaxed whitespace-pre-line font-sans text-[#1f2328] dark:text-neutral-200">
            {displayDesc || displayTitle}
          </p>

          {/* 配图（如果有） */}
          {thoughtItem.posterUrl && (
            <div className="mt-1">
              <div className="relative block max-w-[280px] h-[160px] rounded-[6px] overflow-hidden border border-[#d0d7de] dark:border-white/40">
                <img
                  src={thoughtItem.posterUrl}
                  alt="Thought media"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}