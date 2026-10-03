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
  read_time?: number | null;
  status?: string | string[];
  source_url?: string | null;
}

type WorkerPost = PostItem;

function isWorkerPost(value: unknown): value is WorkerPost {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    (typeof value.id === "string" || typeof value.id === "number") &&
    "title" in value &&
    typeof value.title === "string" &&
    "created_at" in value &&
    typeof value.created_at === "string"
  );
}

function isPostsResponse(
  value: unknown
): value is { success: true; data: unknown[] } {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    value.success === true &&
    "data" in value &&
    Array.isArray(value.data)
  );
}

function isPublished(status: WorkerPost["status"]): boolean {
  const statuses = Array.isArray(status) ? status : [status ?? ""];
  return statuses.some(
    (value) =>
      value.includes("已发布") ||
      value.includes("Published") ||
      value.includes("🚀")
  );
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
  if (typeof post.read_time === "number" && post.read_time > 0) {
    return post.read_time;
  }
  if (post.content && post.content.trim()) {
    return calculateReadTime(post.content);
  }
  return null;
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
  const [syncedPosts, setSyncedPosts] = React.useState<{
    source: PostItem[];
    posts: PostItem[];
  } | null>(null);
  const posts =
    syncedPosts?.source === initialPosts ? syncedPosts.posts : initialPosts;
  const { locale } = useI18n();
  const isEn = locale === "en";

  // 2. 客户端兜底与增量同步（严格继承服务端置顶状态，杜绝 Worker 缺失字段引发重排）
  React.useEffect(() => {
    // 清理可能包含缺失置顶字段的旧会话缓存
    try {
      sessionStorage.removeItem("ow_posts_cache_v1");
    } catch {}

    const workerUrl =
      process.env.NEXT_PUBLIC_NOTION_WORKER_URL ||
      "https://api.vinceou.site";
    let isActive = true;
    fetch(`${workerUrl}/api/posts`)
      .then((res) => {
        if (!res.ok) throw new Error(`Worker returned HTTP ${res.status}`);
        return res.json() as Promise<unknown>;
      })
      .then((result) => {
        if (isPostsResponse(result) && result.data.length > 0) {
          // 建立已有文章索引以保留权威属性
          const existingMap = new Map<string, PostItem>();
          initialPosts.forEach((p) => {
            if (p.id) existingMap.set(String(p.id).replace(/-/g, ""), p);
            if (p.slug) existingMap.set(String(p.slug), p);
          });

          const published: PostItem[] = result.data
            .filter(isWorkerPost)
            .filter((p) => isPublished(p.status))
            .map((p) => {
              const cleanId = String(p.id || "").replace(/-/g, "");
              const cleanSlug = String(p.slug || p.source_url || "")
                .replace(/^https?:\/\/[^/]+\/posts\//, "")
                .replace(/^\/posts\//, "")
                .replace(/^\//, "");
              const existing = existingMap.get(cleanId) || (cleanSlug ? existingMap.get(cleanSlug) : undefined);

              return {
                ...p,
                slug: cleanSlug || String(p.id),
                // 核心关键：外部 Worker 缺失 is_pinned 时，100% 继承服务端权威真实的置顶状态
                is_pinned: (p.is_pinned !== undefined ? p.is_pinned : existing?.is_pinned) ?? false,
                read_time: p.read_time ?? existing?.read_time ?? null,
              };
            });

          const currentSign = initialPosts
            .map((p) => `${p.id}_${p.title}_${p.is_pinned}_${p.read_time}`)
            .join("|");
          const nextSign = published
            .map((p) => `${p.id}_${p.title}_${p.is_pinned}_${p.read_time}`)
            .join("|");
          if (isActive && published.length > 0 && currentSign !== nextSign) {
            setSyncedPosts({ source: initialPosts, posts: published });
          }
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          console.warn("[Posts] 后台文章同步失败:", error);
        }
      });
    return () => {
      isActive = false;
    };
  }, [initialPosts]);

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
        <p className="mt-2 text-[14px] sm:text-[15px] [font-family:Georgia,serif] italic text-neutral-500 dark:text-neutral-400 inline-block [transform:skewX(-14deg)] origin-left">
          {isEn ? "Things worth remembering in life" : "那些值得记录的人生"}
        </p>
      </div>

      {/* 按年份编年史编排 */}
      <div className="space-y-12 sm:space-y-16">
        {(() => {
          let stageIndex = 0;
          return years.map((year) => {
            const yearPosts = postsByYear[year];
            const yearStage = ++stageIndex;

            return (
              <section key={year} className="relative">
                {/* 年份分镜切割：经典 Georgia Italic + 细腻优雅灰线 */}
                <div
                  className="mb-1.5 sm:mb-2 select-none flex items-center gap-4 sm:gap-6 slide-enter"
                  style={{ "--enter-stage": Math.min(yearStage, 20) } as React.CSSProperties}
                >
                  <span className="shrink-0 [font-family:Georgia,serif] italic text-[34px] sm:text-[40px] font-normal text-neutral-900 dark:text-neutral-100 leading-none">
                    {year}
                  </span>
                  <div className="h-[1px] flex-1 bg-neutral-200 dark:bg-neutral-800" />
                </div>

                {/* 文章列表：纯净平滑悬停，错落入场 */}
                <div className="flex flex-col">
                  {yearPosts.map((post) => {
                    const postStage = ++stageIndex;
                    const date = post.published_at || post.created_at;
                    const formattedDate = formatPostDate(date, isEn);
                    const readTime = getReadTime(post);
                    const targetLink =
                      "/posts/" + (post.slug || post.source_url || post.id);

                    return (
                      <Link
                        key={post.id}
                        href={targetLink}
                        prefetch={true}
                        className="group relative flex flex-wrap items-baseline gap-2 py-2 text-left transition-colors duration-150 slide-enter"
                        style={{ "--enter-stage": Math.min(postStage, 20) } as React.CSSProperties}
                      >
                        <span className="text-[16px] sm:text-[18px] font-sans font-normal leading-snug text-neutral-600 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors duration-150">
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
                        <span className="shrink-0 font-sans text-[12px] sm:text-[13px] text-neutral-400 dark:text-neutral-500 opacity-80 dark:opacity-60 whitespace-nowrap">
                          {formattedDate}
                          {readTime ? <span> · {readTime}{isEn ? "min" : "分钟"}</span> : ""}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          });
        })()}
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
