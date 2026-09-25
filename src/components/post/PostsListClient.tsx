// src/components/post/PostsListClient.tsx
"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { calculateReadTime } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/I18nContext";

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

function formatPostDate(dateString: string, isEn: boolean) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  if (isEn) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return (date.getMonth() + 1) + "月" + date.getDate() + "日";
}

export function PostsListClient({ initialPosts = [] }: PostsListClientProps) {
  const [posts, setPosts] = React.useState<PostItem[]>(initialPosts);
  const { locale } = useI18n();
  const isEn = locale === "en";

  // 1. 当服务端 ISR 刷新后 initialPosts 产生变化时无缝同步最新数据
  React.useEffect(() => {
    if (initialPosts && initialPosts.length > 0) {
      setPosts(initialPosts);
    }
  }, [initialPosts]);

  // 2. 客户端兜底与增量同步（严格继承服务端置顶状态，杜绝 Worker 缺失字段引发重排）
  React.useEffect(() => {
    // 清理可能包含缺失置顶字段的旧会话缓存
    try {
      sessionStorage.removeItem("ow_posts_cache_v1");
    } catch {}

    const workerUrl =
      process.env.NEXT_PUBLIC_NOTION_WORKER_URL ||
      "https://api.vinceou.site";
    fetch(`${workerUrl}/api/posts`)
      .then((res) => res.json())
      .then((result) => {
        if (result?.success && Array.isArray(result.data) && result.data.length > 0) {
          // 建立已有文章索引以保留权威属性
          const existingMap = new Map<string, PostItem>();
          [...initialPosts, ...posts].forEach((p) => {
            if (p.id) existingMap.set(String(p.id).replace(/-/g, ""), p);
            if (p.slug) existingMap.set(String(p.slug), p);
          });

          const published: PostItem[] = result.data
            .filter(
              (p: any) =>
                p.status?.includes("已发布") ||
                p.status?.includes("Published") ||
                p.status?.includes("🚀")
            )
            .map((p: any) => {
              const cleanId = String(p.id || "").replace(/-/g, "");
              const cleanSlug = String(p.slug || p.source_url || "")
                .replace(/^https?:\/\/[^/]+\/posts\//, "")
                .replace(/^\/posts\//, "")
                .replace(/^\//, "");
              const existing = existingMap.get(cleanId) || (cleanSlug ? existingMap.get(cleanSlug) : undefined);

              return {
                ...p,
                slug: cleanSlug || p.slug || p.source_url || p.id,
                // 核心关键：外部 Worker 缺失 is_pinned 时，100% 继承服务端权威真实的置顶状态
                is_pinned: (p.is_pinned !== undefined ? p.is_pinned : existing?.is_pinned) ?? false,
              };
            });

          if (published.length > 0) {
            setPosts((prev) => {
              // 若核心字段与排序均一致，绝不触发不必要的重新渲染
              const prevSign = prev.map((p: PostItem) => `${p.id}_${p.title}_${p.is_pinned}`).join("|");
              const nextSign = published.map((p: PostItem) => `${p.id}_${p.title}_${p.is_pinned}`).join("|");
              if (prevSign === nextSign) {
                return prev;
              }
              return published;
            });
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
      {/* 顶部标题：经典雅致 Georgia 杂志版式 */}
      <div className="mb-8 sm:mb-11">
        <h1 className="text-[40px] sm:text-[48px] [font-family:Georgia,serif] font-bold tracking-tight text-neutral-900 dark:text-neutral-100 select-none leading-tight">
          {isEn ? "Posts" : "随笔"}
        </h1>
        <p className="mt-2 text-[14px] sm:text-[15px] [font-family:Georgia,serif] italic text-neutral-500 dark:text-neutral-400">
          {isEn ? "Things worth remembering in life" : "那些值得记录的人生"}
        </p>
      </div>

      {/* 按年份编年史编排 */}
      <div className="space-y-12 sm:space-y-16">
        {years.map((year) => {
          const yearPosts = postsByYear[year];

          return (
            <section key={year} className="relative">
              {/* 年份分镜切割：经典 Georgia Italic + 细腻优雅灰线 */}
              <div className="mb-1.5 sm:mb-2 select-none flex items-center gap-4 sm:gap-6">
                <span className="shrink-0 [font-family:Georgia,serif] italic text-[34px] sm:text-[40px] font-normal text-neutral-900 dark:text-neutral-100 leading-none">
                  {year}
                </span>
                <div className="h-[1px] flex-1 bg-neutral-200 dark:bg-neutral-800" />
              </div>

              {/* 文章列表：纯净平滑悬停，去除波普跳动 */}
              <div className="flex flex-col space-y-1">
                {yearPosts.map((post) => {
                  const date = post.published_at || post.created_at;
                  const formattedDate = formatPostDate(date, isEn);
                  const readTime = getReadTime(post);
                  const targetLink = "/posts/" + (post.slug || (post as any).source_url || post.id);

                  return (
                    <Link
                      key={post.id}
                      href={targetLink}
                      prefetch={true}
                      className="group relative flex flex-wrap items-baseline gap-2.5 px-3 sm:px-4 py-2 -mx-3 sm:-mx-4 text-left rounded-lg transition-colors duration-150 hover:bg-black/[0.035] dark:hover:bg-transparent"
                    >
                      <span className="text-[18px] sm:text-[18px] font-sans font-normal leading-snug text-neutral-800 dark:text-neutral-200 group-hover:text-black dark:group-hover:text-white transition-colors duration-150">
                        {post.title}
                      </span>
                      {post.is_pinned && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-400 dark:text-neutral-500 opacity-80 select-none">
                          <svg className="w-3 h-3 rotate-45 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="17" x2="12" y2="22" />
                            <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
                          </svg>
                          <span>{isEn ? "" : "置顶"}</span>
                        </span>
                      )}
                      <span className="shrink-0 font-sans text-[12px] sm:text-[12px] text-neutral-500 dark:text-neutral-400 opacity-60 dark:opacity-50 whitespace-nowrap">
                        {formattedDate}
                        {readTime ? <span> · {readTime}{isEn ? "min" : "分钟"}</span> : ""}
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
            {isEn ? "No posts yet" : "暂无随笔"}
          </p>
        </div>
      )}
    </div>
  );
}
