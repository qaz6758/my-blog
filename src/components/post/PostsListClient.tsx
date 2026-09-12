// src/components/post/PostsListClient.tsx
"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { FolderOpen, Tag as TagIcon, X, Pin } from "lucide-react";
import { SlideEnter } from "@/components/layout/SlideEnter";
import { formatDate, calculateReadTime } from "@/lib/utils";

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
  return new Date(dateString).getFullYear() || new Date().getFullYear();
}

function getReadTime(post: PostItem): number | null {
  const raw = post.content || post.summary || "";
  if (!raw.trim()) return null;
  return calculateReadTime(raw);
}

const BATCH_SIZE = 35;

export function PostsListClient({
  initialPosts = [],
  initialCategory = "",
  initialTag = "",
}: PostsListClientProps) {
  const [posts, setPosts] = useState<PostItem[]>(initialPosts);
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [activeTag, setActiveTag] = useState<string>(initialTag);

  // 分批流式展示状态：初始 35 篇，滚动到底部自动平滑追加，彻底控制 DOM 节点�?
  const [visibleCount, setVisibleCount] = useState<number>(BATCH_SIZE);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPosts) setPosts(initialPosts);
  }, [initialPosts]);

  // 分类或标签切换时，重置回到首�?35 �?
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [activeCategory, activeTag]);

  // 1. 统计分类与数�?
  const { categoryCounts, categories } = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach((post) => {
      const cat = post.category?.trim();
      if (cat) counts[cat] = (counts[cat] || 0) + 1;
    });

    const sortedCats = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    return { categoryCounts: counts, categories: sortedCats };
  }, [posts]);

  // 2. 过滤文章
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (activeCategory && post.category !== activeCategory) return false;
      if (activeTag) {
        const rawTags = Array.isArray(post.tags) ? post.tags.join(",") : post.tags || "";
        if (!rawTags.toLowerCase().includes(activeTag.toLowerCase())) return false;
      }
      return true;
    });
  }, [posts, activeCategory, activeTag]);

  // 3. 区分置顶文章与常规文章（置顶文章永远保持在列表最顶层，不被年份分页截断）
  const { pinnedPosts, regularPosts } = useMemo(() => {
    const pinned: PostItem[] = [];
    const regular: PostItem[] = [];
    filteredPosts.forEach((post) => {
      if (post.is_pinned) {
        pinned.push(post);
      } else {
        regular.push(post);
      }
    });
    return { pinnedPosts: pinned, regularPosts: regular };
  }, [filteredPosts]);

  // 4. 截取当前可见常规文章（纯前端零延迟内存切片）
  const displayedRegularPosts = useMemo(() => {
    return regularPosts.slice(0, visibleCount);
  }, [regularPosts, visibleCount]);

  // 5. 按年份归并常规文章（彻底控制 DOM 节点数与主题切换重绘负载�?
  const { years, postsByYear } = useMemo(() => {
    const groups: Record<string, PostItem[]> = {};
    displayedRegularPosts.forEach((post) => {
      const date = post.published_at || post.created_at;
      const year = String(getYear(date));
      if (!groups[year]) groups[year] = [];
      groups[year].push(post);
    });

    const sortedYears = Object.keys(groups).sort((a, b) => Number(b) - Number(a));
    return { years: sortedYears, postsByYear: groups };
  }, [displayedRegularPosts]);

  // 6. 触底自动追加监听（提�?350px 预加载，无感平滑滚动�?
  const hasMore = visibleCount < regularPosts.length;
  useEffect(() => {
    if (!hasMore || !loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, regularPosts.length));
        }
      },
      { rootMargin: "350px" }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, regularPosts.length]);

  // 6. 切换分类与标�?
  const handleCategoryChange = (cat: string) => {
    const nextCategory = activeCategory === cat ? "" : cat;
    setActiveCategory(nextCategory);
    const params = new URLSearchParams();
    if (nextCategory) params.set("category", nextCategory);
    if (activeTag) params.set("tag", activeTag);
    const query = params.toString();
    window.history.replaceState(null, "", query ? `/posts?${query}` : "/posts");
  };

  const handleClearTag = () => {
    setActiveTag("");
    const params = new URLSearchParams();
    if (activeCategory) params.set("category", activeCategory);
    const query = params.toString();
    window.history.replaceState(null, "", query ? `/posts?${query}` : "/posts");
  };

  return (
    <>
      {/* 分类 Tab �?(Stage 2) */}
      <SlideEnter stage={2} className="mb-10">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 border-b border-black/[0.06] pb-3.5 dark:border-white/[0.08]">
          <button
            type="button"
            onClick={() => handleCategoryChange("")}
            className={`group inline-flex items-center gap-1.5 py-1 text-[13.5px] transition-opacity cursor-pointer select-none font-normal text-neutral-900 dark:text-[#eae5dc] ${
              !activeCategory ? "opacity-100 font-medium" : "opacity-55 hover:opacity-100"
            }`}
            style={{ transitionDuration: "var(--realm-motion-duration)", transitionTimingFunction: "var(--realm-motion-ease)" }}
          >
            <span>全部</span>
            <span className="font-mono text-[11px] tabular-nums opacity-60">
              {posts.length}
            </span>
          </button>

          {categories.map((cat) => {
            const isCurrent = activeCategory === cat;
            const count = categoryCounts[cat] || 0;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryChange(cat)}
                className={`group inline-flex items-center gap-1.5 py-1 text-[13.5px] transition-opacity cursor-pointer select-none font-normal text-neutral-900 dark:text-[#eae5dc] ${
                  isCurrent ? "opacity-100 font-medium" : "opacity-55 hover:opacity-100"
                }`}
                style={{ transitionDuration: "var(--realm-motion-duration)", transitionTimingFunction: "var(--realm-motion-ease)" }}
              >
                <FolderOpen className={`h-3.5 w-3.5 transition-opacity ${isCurrent ? "opacity-90" : "opacity-50 group-hover:opacity-100"}`} style={{ transitionDuration: "var(--realm-motion-duration)", transitionTimingFunction: "var(--realm-motion-ease)" }} />
                <span>{cat}</span>
                <span className="font-mono text-[11px] tabular-nums opacity-60">
                  {count}
                </span>
              </button>
            );
          })}

          {activeTag && (
            <button
              type="button"
              onClick={handleClearTag}
              className="inline-flex items-center gap-1.5 rounded border border-black/[0.08] px-2 py-0.5 text-xs font-medium text-neutral-700 transition-colors hover:text-neutral-950 dark:border-white/[0.1] dark:text-neutral-300 dark:hover:text-white cursor-pointer select-none"
            >
              <TagIcon className="h-3 w-3" />
              <span>#{activeTag}</span>
              <X className="h-3 w-3 opacity-60 hover:opacity-100" />
            </button>
          )}
        </div>
      </SlideEnter>

      {/* 年份文章列表 */}
      <div key={`${activeCategory}-${activeTag}`} className="slide-enter-content">
        {/* 置顶精选专�?(Pinned & Featured) */}
        {pinnedPosts.length > 0 && (
          <section className="relative mb-12 sm:mb-20 flex flex-col md:flex-row md:items-start gap-4 md:gap-12">
            <SlideEnter stage={3} className="md:w-32 shrink-0 pt-3 md:sticky md:top-32 h-fit z-10 hidden md:block">
              <h2 className="text-[11px] font-semibold tracking-[0.2em] text-neutral-400 dark:text-neutral-500 uppercase">
                Pinned
              </h2>
            </SlideEnter>
            <div className="md:hidden pt-4 pb-2 border-b border-black/[0.06] dark:border-white/[0.06] mb-2">
              <h2 className="text-[11px] font-semibold tracking-[0.2em] text-neutral-400 dark:text-neutral-500 uppercase">
                Pinned
              </h2>
            </div>

            <div className="flex-1 space-y-0.5">
              {pinnedPosts.map((post, index) => {
                const date = post.published_at || post.created_at;
                const readTime = getReadTime(post);
                const targetLink = `/posts/${post.slug || post.id}`;

                return (
                  <SlideEnter
                    key={post.id}
                    stage={3 + index}
                    stagger={25}
                    style={{ contentVisibility: "auto", containIntrinsicSize: "0 60px" }}
                  >
                    <Link
                      href={targetLink}
                      className="
                        group
                        flex
                        flex-col sm:flex-row
                        sm:items-center
                        justify-between
                        gap-2 sm:gap-6
                        py-3 sm:py-4
                        cursor-pointer
                        border-b border-black/[0.03] dark:border-white/[0.03]
                        hover:bg-neutral-50 dark:hover:bg-white/[0.02]
                        px-3 sm:px-4 -mx-3 sm:-mx-4 rounded-xl transition-all
                      "
                    >
                      <div className="flex items-center gap-3 sm:gap-5 min-w-0 flex-1">
                        <span className="w-12 sm:w-14 shrink-0 font-mono text-[11px] sm:text-xs text-neutral-400 dark:text-neutral-500 tabular-nums">
                          {formatDate(date, false)}
                        </span>
                        
                        <div className="flex min-w-0 items-center gap-2.5">
                          <Pin className="h-3.5 w-3.5 shrink-0 -rotate-45 text-neutral-400 dark:text-neutral-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                          <span className="text-[15px] font-medium leading-snug text-neutral-900 dark:text-[#eae5dc] group-hover:text-[#b91c1c] dark:group-hover:text-white transition-colors truncate sm:text-[16px]">
                            {post.title}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-4 sm:gap-6 pl-16 sm:pl-0 font-mono text-[10px] sm:text-xs text-neutral-400 dark:text-neutral-500 tabular-nums">
                        {post.category && !activeCategory && (
                          <span className="shrink-0 rounded border border-black/[0.08] dark:border-white/[0.08] px-2 py-0.5 font-normal text-neutral-500 dark:text-neutral-400">
                            {post.category}
                          </span>
                        )}
                        {readTime && (
                          <span className="w-12 text-right hidden sm:inline-block">
                            {readTime}m
                          </span>
                        )}
                      </div>
                    </Link>
                  </SlideEnter>
                );
              })}
            </div>
          </section>
        )}

        {years.map((year, yearIndex) => {
          const yearPosts = postsByYear[year];

          return (
            <section key={year} className="relative mb-12 sm:mb-20 flex flex-col md:flex-row md:items-start gap-4 md:gap-12">
              {/* 年份侧边�?(宽屏吸顶) */}
              <SlideEnter stage={3} className="md:w-32 shrink-0 pt-3 md:sticky md:top-32 h-fit z-10 hidden md:block">
                <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-mono">
                  {year}
                </h2>
              </SlideEnter>
              {/* 年份小标�?(移动�? */}
              <div className="md:hidden pt-4 pb-2 border-b border-black/[0.06] dark:border-white/[0.06] mb-2 flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-mono">
                  {year}
                </h2>
                <span className="text-xs text-neutral-400 font-mono">{yearPosts.length} posts</span>
              </div>

              {/* 文章列表 */}
              <div className="flex-1 space-y-0.5">
                {yearPosts.map((post, index) => {
                  const date = post.published_at || post.created_at;
                  const readTime = getReadTime(post);
                  const postStage = Math.min(4 + index, 14);
                  const targetLink = `/posts/${post.slug || post.id}`;

                  const postItem = (
                    <Link
                      href={targetLink}
                      className="
                        group
                        flex
                        flex-col sm:flex-row
                        sm:items-center
                        justify-between
                        gap-2 sm:gap-6
                        py-3 sm:py-4
                        cursor-pointer
                        border-b border-black/[0.03] dark:border-white/[0.03]
                        hover:bg-neutral-50 dark:hover:bg-white/[0.02]
                        px-3 sm:px-4 -mx-3 sm:-mx-4 rounded-xl transition-all
                      "
                    >
                      <div className="flex items-center gap-3 sm:gap-5 min-w-0 flex-1">
                        <span className="w-12 sm:w-14 shrink-0 font-mono text-[11px] sm:text-xs text-neutral-400 dark:text-neutral-500 tabular-nums">
                          {formatDate(date, false)}
                        </span>
                        
                        <span className="text-[15px] font-medium leading-snug text-neutral-900 dark:text-[#eae5dc] group-hover:text-[#b91c1c] dark:group-hover:text-white transition-colors truncate sm:text-[16px]">
                          {post.title}
                        </span>
                      </div>

                      <div className="flex shrink-0 items-center gap-4 sm:gap-6 pl-16 sm:pl-0 font-mono text-[10px] sm:text-xs text-neutral-400 dark:text-neutral-500 tabular-nums">
                        {post.category && !activeCategory && (
                          <span className="shrink-0 rounded border border-black/[0.08] dark:border-white/[0.08] px-2 py-0.5 font-normal text-neutral-500 dark:text-neutral-400">
                            {post.category}
                          </span>
                        )}
                        {readTime && (
                          <span className="w-12 text-right hidden sm:inline-block">
                            {readTime}m
                          </span>
                        )}
                      </div>
                    </Link>
                  );

                  return index < 15 ? (
                    <SlideEnter
                      key={post.id}
                      stage={postStage}
                      stagger={35}
                      style={{ contentVisibility: "auto", containIntrinsicSize: "0 60px" }}
                    >
                      {postItem}
                    </SlideEnter>
                  ) : (
                    <div
                      key={post.id}
                      style={{ contentVisibility: "auto", containIntrinsicSize: "0 60px" }}
                    >
                      {postItem}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* 底部触底探测哨兵与优雅的水墨底端提示 */}
      {filteredPosts.length > 0 && (
        <div
          ref={loadMoreRef}
          className="pt-10 pb-6 flex justify-center items-center text-xs text-neutral-400 dark:text-neutral-500 font-serif select-none"
        >
          {hasMore ? (
            <div className="inline-flex items-center gap-2 opacity-60">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-pulse" />
              <span>翻展余卷中�?/span>
            </div>
          ) : filteredPosts.length > BATCH_SIZE ? (
            <span className="opacity-40 tracking-wider">
              �?已展全卷（共 {filteredPosts.length} 篇）�?
            </span>
          ) : null}
        </div>
      )}

      {/* 空状�?(Stage 4) */}
      {filteredPosts.length === 0 && (
        <div key={`empty-${activeCategory}-${activeTag}`} className="slide-enter-content">
          <SlideEnter
            stage={4}
            className="py-20 text-center text-sm text-neutral-400 dark:text-neutral-500"
          >
            {activeCategory || activeTag ? "该分类下暂无文章" : "暂无文章"}
          </SlideEnter>
        </div>
      )}
    </>
  );
}
