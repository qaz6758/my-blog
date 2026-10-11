// src/components/post/RetroThoughtsView.tsx
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { TypewriterTitle } from "@/components/common/TypewriterTitle";
import { formatEnglishThoughtDate, formatThoughtType, type ThoughtMediaItem } from "@/lib/data";

export function RetroThoughtsView({ thoughts }: { thoughts: ThoughtMediaItem[] }) {
  return (
    <div className="flex flex-col w-full flex-1 min-h-0 pt-0">
      {/* 顶部标题栏与贯穿全宽的横线（保持全宽，不随卡片收缩） */}
      <div className="flex items-center justify-center pb-1 mb-2.5 sm:mb-3 border-b-2 border-[#d0d7de] dark:border-white select-none w-full">
        <h2
          data-card-title
          className="font-bold tracking-[0.12em] font-['W95FA',sans-serif] leading-none text-[19px] sm:text-[22px] text-[#1f2328] dark:text-white cursor-default select-none"
        >
          <TypewriterTitle text="Thoughts" />
        </h2>
      </div>

      {/* 随想录卡片流：独立限制为黄金阅读宽度并居中 */}
      <div className="flex flex-col flex-1 w-full max-w-[620px] mx-auto">
        {thoughts && thoughts.length > 0 ? (
          <div className="flex flex-col gap-3.5 sm:gap-4 flex-1">
            {thoughts.map((thought) => {
              const href = thought.sourceUrl || `/thoughts/${thought.id}`;
              const isExternal = Boolean(
                thought.sourceUrl && /^https?:\/\//.test(thought.sourceUrl)
              );

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
                  className="rounded-[6px] border-2 border-[#d0d7de] dark:border-white bg-transparent p-3 sm:p-3.5 shadow-[0_1px_2px_rgba(27,31,36,0.08)] dark:shadow-none transition-colors flex flex-col gap-2"
                >
                  {/* 头部元信息：类型标识与英文日期 (完全对齐图一格式与排版) */}
                  <div
                    data-thought-meta
                    className="flex items-center justify-between text-[13px] sm:text-[13.5px] font-bold text-[#1f2328] dark:text-white"
                  >
                    <span className="font-sans font-bold">
                      {formatThoughtType(thought.type)} @ {formatEnglishThoughtDate(thought.rawDate || thought.fullTime || thought.time)}
                    </span>
                    {thought.tags && (
                      <span className="font-normal text-[11px] font-mono text-[#656d76] dark:text-[#a1a1aa]">
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
                          className="relative block max-w-[280px] h-[160px] rounded-[6px] overflow-hidden border border-[#d0d7de] dark:border-[#333] cursor-pointer"
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
                          className="relative block max-w-[280px] h-[160px] rounded-[6px] overflow-hidden border border-[#d0d7de] dark:border-[#333] cursor-pointer"
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
