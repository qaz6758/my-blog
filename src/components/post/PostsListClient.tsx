// src/components/post/PostsListClient.tsx
"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { calculateReadTime } from "@/lib/utils";

export interface PostItem {
  id: string | number;
  slug?: string | null;
  title: string;
  created_at: string;
  published_at?: string | null;
  content?: string | null;
  summary?: string | null;
  category?: string | null;
  tags?: string[] | string | null;
  is_pinned?: boolean | null;
}

interface PostsListClientProps {
  initialPosts: PostItem[];
  initialCategory?: string;
  initialTag?: string;
}

function getYear(dateString: string) {
  const year = new Date(dateString).getFullYear();
  return Number.isFinite(year) ? year : new Date().getFullYear();
}

function getReadTime(post: PostItem): number | null {
  const raw = post.content || post.summary || "";
  if (!raw.trim()) {
    return null;
  }
  return calculateReadTime(raw);
}

function formatPostDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  return months[date.getMonth()] + " " + date.getDate();
}

export function PostsListClient({ initialPosts = [] }: PostsListClientProps) {
  const posts = initialPosts;

  const { years, postsByYear } = useMemo(() => {
    const groups: Record<string, PostItem[]> = {};

    const sortedPosts = [...posts].sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      const da = new Date(a.published_at || a.created_at).getTime();
      const db = new Date(b.published_at || b.created_at).getTime();
      return db - da;
    });

    sortedPosts.forEach((post) => {
      const date = post.published_at || post.created_at;
      const year = String(getYear(date));
      if (!groups[year]) {
        groups[year] = [];
      }
      groups[year].push(post);
    });

    const sortedYears = Object.keys(groups).sort(
      (a, b) => Number(b) - Number(a)
    );

    return {
      years: sortedYears,
      postsByYear: groups,
    };
  }, [posts]);

  return (
    <div className="w-full text-left">
      {/* 顶部多维媒体矩阵 (Anthony Fu antfu.me 标志性设计：主标题 + 弱化子频道横向展开) */}
      <div className="mb-10 sm:mb-14 flex flex-wrap items-baseline gap-3 sm:gap-4 select-none">
        <h1 className="text-[32px] sm:text-[38px] font-bold tracking-[-0.03em] text-neutral-900 dark:text-[#ece7df] font-sans">
          Blog
        </h1>
        <Link
          href="/thoughts"
          className="text-[20px] sm:text-[24px] font-medium tracking-tight text-neutral-400/40 hover:text-neutral-700 dark:text-[#777168]/40 dark:hover:text-[#ece7df] transition-colors font-sans"
        >
          Thinking
        </Link>
        <Link
          href="/playlist"
          className="text-[20px] sm:text-[24px] font-medium tracking-tight text-neutral-400/40 hover:text-neutral-700 dark:text-[#777168]/40 dark:hover:text-[#ece7df] transition-colors font-sans"
        >
          Playlist
        </Link>
        <Link
          href="/gallery"
          className="text-[20px] sm:text-[24px] font-medium tracking-tight text-neutral-400/40 hover:text-neutral-700 dark:text-[#777168]/40 dark:hover:text-[#ece7df] transition-colors font-sans"
        >
          Gallery
        </Link>
      </div>

      {/* 按年份编年史排版 */}
      <div className="space-y-12 sm:space-y-14">
        {years.map((year) => {
          const yearPosts = postsByYear[year];

          return (
            <section key={year} className="relative">
              {/* Anthony Fu 经典空心艺术年份水印 (自然占位 h-16 ~ h-20，左探出，绝不与文章撞车) */}
              <div
                className="relative h-16 sm:h-20 pointer-events-none select-none"
                aria-hidden="true"
              >
                <span
                  className="absolute -left-6 sm:-left-12 -top-5 sm:-top-8 text-[7em] sm:text-[8em] font-bold font-mono tracking-tighter leading-none text-transparent"
                  style={{
                    WebkitTextStroke: "1.5px #888888",
                    opacity: 0.08,
                  }}
                >
                  {year}
                </span>
              </div>

              {/* 文章列表 (清爽正常字重，单行平滑流式排版，零横线) */}
              <div className="relative z-10 flex flex-col space-y-2.5 sm:space-y-3">
                {yearPosts.map((post) => {
                  const date = post.published_at || post.created_at;
                  const formattedDate = formatPostDate(date);
                  const readTime = getReadTime(post);
                  const targetLink = "/posts/" + (post.slug || post.id);

                  return (
                    <Link
                      key={post.id}
                      href={targetLink}
                      prefetch={true}
                      className="group flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 text-left py-0.5 transition-opacity"
                    >
                      <span className="text-[15.5px] sm:text-[16.5px] font-normal text-neutral-800 dark:text-[#ded8ce] group-hover:text-neutral-950 dark:group-hover:text-white transition-colors">
                        {post.title}
                      </span>
                      <span className="text-[12.5px] sm:text-[13px] font-sans text-neutral-400 dark:text-[#777168] whitespace-nowrap opacity-60 select-none">
                        {formattedDate}
                        {readTime ? " · " + readTime + "min" : ""}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {posts.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-[15px] text-neutral-500 dark:text-neutral-400 font-sans">
            No posts yet.
          </p>
        </div>
      )}
    </div>
  );
}
