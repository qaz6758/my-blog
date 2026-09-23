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
  const [posts, setPosts] = React.useState<PostItem[]>(initialPosts);

  React.useEffect(() => {
    const workerUrl =
      process.env.NEXT_PUBLIC_NOTION_WORKER_URL ||
      "https://notion-api.dedeboki123.workers.dev";
    fetch(`${workerUrl}/api/posts`)
      .then((res) => res.json())
      .then((result) => {
        if (result?.success && Array.isArray(result.data) && result.data.length > 0) {
          const published = result.data
            .filter(
              (p: any) =>
                p.status?.includes('已发布') ||
                p.status?.includes('Published') ||
                p.status?.includes('🚀')
            )
            .map((p: any) => ({
              ...p,
              slug: p.slug || p.source_url || p.id,
            }));
          if (published.length > 0) {
            setPosts(published);
          }
        }
      })
      .catch(() => {});
  }, []);

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
      {/* 顶部洗练标题：黑白漫卷首 */}
      <div className="mb-12 sm:mb-16">
        <h1 className="text-[36px] sm:text-[42px] font-sans font-extrabold tracking-tight text-black dark:text-white select-none">
          文章
        </h1>
      </div>

      {/* 按年份编年史编排 */}
      <div className="space-y-12 sm:space-y-16">
        {years.map((year) => {
          const yearPosts = postsByYear[year];

          return (
            <section key={year} className="relative">
              {/* 年份分镜切割：粗黑实线 */}
              <div className="mb-5 sm:mb-6 select-none border-b-2 border-black dark:border-white pb-2">
                <span className="font-sans text-[24px] sm:text-[28px] font-bold tracking-wider text-black dark:text-white">
                  {year}
                </span>
              </div>

              {/* 文章列表：手绘分镜投影悬浮 */}
              <div className="flex flex-col space-y-1">
                {yearPosts.map((post) => {
                  const date = post.published_at || post.created_at;
                  const formattedDate = formatPostDate(date);
                  const readTime = getReadTime(post);
                  const targetLink = "/posts/" + (post.slug || (post as any).source_url || post.id);

                  return (
                    <Link
                      key={post.id}
                      href={targetLink}
                      prefetch={true}
                      className="group relative flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4 px-4 py-3 -mx-4 text-left transition-all duration-75 border border-transparent hover:border-black dark:hover:border-white hover:bg-white dark:hover:bg-black hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0_#000] dark:hover:shadow-[4px_4px_0_#fff]"
                    >
                      <span className="text-[16px] sm:text-[17px] font-sans font-normal leading-relaxed text-[#222] dark:text-[#ddd] opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                        {post.title}
                      </span>
                      <span className="shrink-0 font-mono text-[12px] sm:text-[12.5px] text-[#888] opacity-50 whitespace-nowrap transition-opacity duration-200">
                        {formattedDate}
                        {readTime ? <span className="opacity-80"> · {readTime}min</span> : ""}
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
          <p className="text-[15px] font-sans text-neutral-500 dark:text-neutral-400">
            暂无文章
          </p>
        </div>
      )}
    </div>
  );
}
