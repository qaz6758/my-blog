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
  return (date.getMonth() + 1) + "月" + date.getDate() + "日";
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
      {/* 顶部洗练标题：温润文心，宣纸留白，零多余横线与修饰 */}
      <div className="mb-12 sm:mb-16">
        <h1 className="text-[32px] sm:text-[38px] font-wenkai font-normal tracking-[0.02em] text-neutral-900 dark:text-[#ece7df] select-none">
          文章
        </h1>
      </div>

      {/* 按年份编年史编排 */}
      <div className="space-y-12 sm:space-y-16">
        {years.map((year) => {
          const yearPosts = postsByYear[year];

          return (
            <section key={year} className="relative">
              {/* 年份标记：克制、静穆的书页时间锚点 */}
              <div className="mb-4 sm:mb-5 select-none">
                <span className="font-mono text-[17px] sm:text-[19px] font-medium tracking-wider text-neutral-400 dark:text-[#777168]">
                  {year}
                </span>
              </div>

              {/* 文章列表：左侧标题温润雅致，右侧日期静穆收束 */}
              <div className="flex flex-col space-y-2 sm:space-y-2.5">
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
                      className="group flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4 py-2 text-left transition-colors"
                    >
                      <span className="text-[15.5px] sm:text-[16.5px] font-normal leading-relaxed text-neutral-800 dark:text-[#ded8ce] group-hover:text-[#7f1d1d] dark:group-hover:text-white transition-colors">
                        {post.title}
                      </span>
                      <span className="shrink-0 font-mono text-[12px] sm:text-[12.5px] text-neutral-400 dark:text-[#777168] whitespace-nowrap opacity-60 group-hover:opacity-100 transition-opacity">
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
        <div className="py-24 text-center">
          <p className="text-[15px] font-wenkai text-neutral-500 dark:text-neutral-400">
            暂无文章
          </p>
        </div>
      )}
    </div>
  );
}
