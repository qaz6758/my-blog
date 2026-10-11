// src/components/post/RetroPostsView.tsx
"use client";

import React from "react";
import Link from "next/link";
import { TypewriterTitle } from "@/components/common/TypewriterTitle";
import type { NotionPostItem } from "@/lib/data";

function formatPostDate(iso: string) {
  if (!iso) return "近期";
  const d = iso.slice(0, 10);
  return d.replace(/-/g, ".");
}

export function RetroPostsView({ posts }: { posts: NotionPostItem[] }) {
  return (
      <div className="flex flex-col w-full flex-1 min-h-0 pt-0">
        <div className="flex items-center justify-center pb-1 mb-4 sm:mb-5 border-b-2 border-[#d0d7de] dark:border-white select-none">
          <h2 className="font-bold tracking-[0.12em] font-['W95FA',sans-serif] leading-none text-[19px] sm:text-[22px] text-[#24292f] dark:text-white">
            <TypewriterTitle text="Blog" />
          </h2>
        </div>

      <div className="flex flex-col flex-1">
        {/* 极简文章流：去除条目间横线，优化自然留白间距 */}
        {posts && posts.length > 0 ? (
          <div className="flex flex-col gap-4 sm:gap-5">
            {posts.map((post) => {
              const dateStr = formatPostDate(post.published_at || post.created_at);
              const postUrl = `/posts/${post.slug || post.id}`;

              return (
                <Link
                  key={post.id}
                  href={postUrl}
                  data-post-link
                  className="group flex flex-col gap-1.5 transition-colors px-1 cursor-pointer"
                >
                  
                  <div className="flex items-baseline flex-wrap gap-1.5">
                    <h3
                      data-post-title
                      className="post-title text-[15px] sm:text-[16px] font-sans font-medium leading-snug"
                    >
                      {post.title}
                    </h3>
                    {post.is_pinned && (
                      <span
                        data-post-meta
                        className="text-[12px] sm:text-[13px] font-normal text-neutral-500 dark:text-[#a1a1aa] select-none"
                      >
                        置顶
                      </span>
                    )}
                  </div>

                  {post.summary && (
                    <p
                      data-post-meta
                      className="text-[12px] text-neutral-500 dark:text-[#a1a1aa] line-clamp-2 leading-relaxed"
                    >
                      {post.summary}
                    </p>
                  )}

                  <div
                    data-thought-meta
                    className="flex items-center justify-between text-[11px] sm:text-[12px] font-['W95FA',sans-serif] text-neutral-500 dark:text-[#a1a1aa]"
                  >
                    <span>{dateStr} & {post.read_time && <span>{post.read_time} min </span>}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-neutral-400 font-['W95FA',sans-serif]">
            No posts published yet.
          </div>
        )}
      </div>
    </div>
  );
}
