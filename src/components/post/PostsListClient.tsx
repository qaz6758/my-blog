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
      {/* 页面标题：纯净极简，零横线，零多余说明 (对齐 Anthony Fu antfu.me) */}
      <div className="mb-10 sm:mb-14">
        <h1 className="text-[32px] sm:text-[40px] font-bold tracking-[-0.03em] text-neutral-900 dark:text-[#ece7df] select-none font-sans">
          Blog
        </h1>
      </div>

      {/* 按年份编年史排版 */}
      <div className="space-y-14 sm:space-y-16">
        {years.map((year) => {
          const yearPosts = postsByYear[year];

          return (
            <section key={year} className="relative">
              {/* Anthony Fu 经典空心艺术年份水印 (放置于每年首篇文章背后) */}
              <div
                className="pointer-events-none select-none -mb-10 sm:-mb-14 -top-5 sm:-top-7 relative z-0"
                aria-hidden="true"
              >
                <span
                  className="text-[6.5rem] sm:text-[8rem] font-bold font-mono tracking-tighter leading-none text-transparent"
                  style={{
                    WebkitTextStroke: "1.5px currentColor",
                    opacity: 0.10,
                  }}
                >
                  {year}
                </span>
              </div>

              {/* 文章列表 (零横线、零多余标签/摘要、标题直接靠左对齐，日期时长紧随其后) */}
              <div className="relative z-10 flex flex-col space-y-3 sm:space-y-3.5 pt-1">
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
                      className="group flex flex-wrap items-baseline gap-x-2.5 gap-y-1 text-left transition-opacity duration-150"
                    >
                      <span className="text-[15.5px] sm:text-[16.5px] font-normal sm:font-medium text-neutral-800 dark:text-[#ece7df] group-hover:text-[#7f1d1d] dark:group-hover:text-white transition-colors">
                        {post.title}
                      </span>
                      <span className="text-[12.5px] sm:text-[13.5px] font-sans text-neutral-400 dark:text-[#777168] whitespace-nowrap select-none">
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
