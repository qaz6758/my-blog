// src/components/post/RetroThoughtsView.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageSquare } from "lucide-react";
import { TypewriterTitle } from "@/components/common/TypewriterTitle";
import type { ThoughtMediaItem } from "@/lib/data";

export function RetroThoughtsView({ thoughts }: { thoughts: ThoughtMediaItem[] }) {
  const [likesMap, setLikesMap] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    thoughts.forEach((t) => {
      map[t.id] = t.likes || 0;
    });
    return map;
  });

  const [userLiked, setUserLiked] = useState<Record<string, boolean>>({});

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUserLiked((prev) => {
      const already = Boolean(prev[id]);
      const nextLiked = !already;
      setLikesMap((l) => ({
        ...l,
        [id]: (l[id] || 0) + (nextLiked ? 1 : -1),
      }));
      return { ...prev, [id]: nextLiked };
    });
  };

  return (
        <div className="flex flex-col w-full flex-1 min-h-0 pt-0">
          <div className="flex items-center justify-center pb-1 mb-2.5 sm:mb-3 border-b-2 border-[#d0d7de] dark:border-white select-none">
            <h2 className="font-bold tracking-[0.12em] font-['W95FA',sans-serif] leading-none text-[19px] sm:text-[22px] text-[#24292f] dark:text-white">
              <TypewriterTitle text="Thoughts" />
            </h2>
          </div>

      <div className="flex flex-col flex-1">
        {thoughts && thoughts.length > 0 ? (
          <div className="flex flex-col gap-3.5 sm:gap-4 flex-1">
            {thoughts.map((thought) => {
              const href = thought.sourceUrl || `/thoughts/${thought.id}`;
              const isExternal = Boolean(
                thought.sourceUrl && /^https?:\/\//.test(thought.sourceUrl)
              );
              const isLiked = userLiked[thought.id];
              const likesCount = likesMap[thought.id] ?? thought.likes ?? 0;

              const textContent = (
                <p
                  data-thought-text
                  className="thought-text text-[13.5px] sm:text-[14.5px] leading-relaxed whitespace-pre-line font-sans cursor-pointer"
                >
                  {thought.description || thought.title}
                </p>
              );

              return (
                <article
                  key={thought.id}
                  data-home-content-card
                  className="rounded-[4px] border-2 border-[#d0d7de] dark:border-white bg-transparent p-3 sm:p-3.5 shadow-[0_1px_2px_rgba(27,31,36,0.08)] dark:shadow-none transition-colors flex flex-col gap-2.5"
                >
                  {/* 头部元信息：日期与标签 */}
                  <div
                    data-thought-meta
                    className="flex items-center justify-between pb-1.5 border-b-2 border-[#d0d7de] dark:border-white text-[11px] sm:text-[12px] font-['W95FA',sans-serif]"
                  >
                    <span className="font-mono">{thought.time}</span>
                    {thought.tags && (
                      <span className="px-1.5 py-0.5 rounded-[2px] border border-[#d0d7de] dark:border-white/30 text-[10px]">
                        #{thought.tags}
                      </span>
                    )}
                  </div>

                    {/* 正文内容：点击直接跳转详情，鼠标悬停变高光绿色 #33FF33 */}
                    {isExternal ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-thought-link
                        className="block group cursor-pointer"
                      >
                        {textContent}
                      </a>
                    ) : (
                      <Link href={href} data-thought-link className="block group cursor-pointer">
                        {textContent}
                      </Link>
                    )}

                    {/* 配图 */}
                    {thought.posterUrl && (
                      <div className="mt-1">
                        {isExternal ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative block max-w-[280px] h-[160px] rounded-[3px] overflow-hidden border border-[#d0d7de] dark:border-[#333] cursor-pointer"
                          >
                            <Image
                              src={thought.posterUrl}
                              alt="Thought media"
                              fill
                              sizes="280px"
                              className="object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </a>
                        ) : (
                          <Link
                            href={href}
                            className="relative block max-w-[280px] h-[160px] rounded-[3px] overflow-hidden border border-[#d0d7de] dark:border-[#333] cursor-pointer"
                          >
                            <Image
                              src={thought.posterUrl}
                              alt="Thought media"
                              fill
                              sizes="280px"
                              className="object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </Link>
                        )}
                      </div>
                    )}

                    {/* 底部点赞与互动 */}
                    <div data-thought-meta className="flex items-center gap-4 pt-0.5 text-[11px] sm:text-[12px]">
                      <button
                        type="button"
                        onClick={(e) => handleLike(thought.id, e)}
                        className={`inline-flex items-center gap-1 transition-colors cursor-pointer ${
                          isLiked ? "text-red-500" : "hover:text-red-500"
                        }`}
                      >
                        <Heart className={`h-3.5 w-3.5 ${isLiked ? "fill-current" : ""}`} />
                        <span>{likesCount}</span>
                      </button>
                      {thought.replies > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>{thought.replies}</span>
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-neutral-400 font-['W95FA',sans-serif]">
            No thoughts shared yet.
          </div>
        )}
      </div>
    </div>
  );
}
