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

  // 分批流式展示状态：初始 35 篇，滚动到底部自动平滑追加，彻底控制 DOM 节点数
  const [visibleCount, setVisibleCount] = useState<number>(BATCH_SIZE);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPosts) setPosts(initialPosts);
  }, [initialPosts]);

  // 分类或标签切换时，重置回到首批 35 篇
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [activeCategory, activeTag]);

  // 1. 统计分类与数量
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

  // 5. 按年份归并常规文章（彻底控制 DOM 节点数与主题切换重绘负载）
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

  // 6. 触底自动追加监听（提前 350px 预加载，无感平滑滚动）
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

  // 6. 切换分类与标签
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
      {/* 分类 Tab 栏 (Stage 2) */}
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
      <div key={`${activeCategory}-${activeTag}`} className="slide-enter-content max-w-4xl mx-auto w-full">
        {/* 置顶Pinned专栏 (Pinned & Featured) */}
        {pinnedPosts.length > 0 && (
          <section className="relative mb-8">
            <SlideEnter stage={3} className="py-2 mb-1">
              <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-neutral-900 dark:text-neutral-100">
                精选
              </h2>
            </SlideEnter>

            <div className="flex-col space-y-0">
              {pinnedPosts.map((post, index) => {
                const date = post.published_at || post.created_at;
                const readTime = getReadTime(post);
                const targetLink = `/posts/${post.slug || post.id}`;

                return (
                  <SlideEnter
                    key={post.id}
                    stage={3 + index}
                    stagger={25}
                    style={{ contentVisibility: "auto", containIntrinsicSize: "0 80px" }}
                  >
                    <Link
                      href={targetLink}
                      className="
                        group
                        flex
                        flex-col
                        py-3
                        cursor-pointer
                        border-b border-black/[0.04] dark:border-white/[0.04]
                        transition-transform
                        hover:translate-x-[2px]
                      "
                    >
                      <div className="flex items-baseline gap-4 sm:gap-6 min-w-0">
                        <span className="w-[4.5rem] shrink-0 font-mono text-[13px] text-neutral-400/80 dark:text-neutral-500/80 tabular-nums">
                          {formatDate(date, false)}
                        </span>
                        
                        <div className="flex min-w-0 items-start gap-2">
                          <Pin className="h-3.5 w-3.5 shrink-0 -rotate-45 text-neutral-400 dark:text-neutral-500 opacity-50 mt-1" />
                          <h3 className="text-[16px] sm:text-[18px] font-medium leading-relaxed text-neutral-900 dark:text-[#eae5dc] ">
                            {post.title}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pl-[5.5rem] sm:pl-[6rem] mt-1.5 font-mono text-[11px] sm:text-[12px] text-neutral-400/70 dark:text-neutral-500/70 tracking-wide">
                        {post.category && !activeCategory && (
                          <span>{post.category}</span>
                        )}
                        {post.category && !activeCategory && readTime && (
                          <span>·</span>
                        )}
                        {readTime && (
                          <span>{readTime} min</span>
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
            <section key={year} className="relative mb-8">
              <SlideEnter stage={3} className="py-2 mb-1">
                <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-neutral-900 dark:text-neutral-100">
                  {year}
                </h2>
              </SlideEnter>

              <div className="flex-col space-y-0">
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
                        flex-col
                        py-3
                        cursor-pointer
                        border-b border-black/[0.04] dark:border-white/[0.04]
                        transition-transform
                        hover:translate-x-[2px]
                      "
                    >
                      <div className="flex items-baseline gap-4 sm:gap-6 min-w-0">
                        <span className="w-[4.5rem] shrink-0 font-mono text-[13px] text-neutral-400/80 dark:text-neutral-500/80 tabular-nums">
                          {formatDate(date, false)}
                        </span>
                        
                        <h3 className="text-[16px] sm:text-[18px] font-medium leading-relaxed text-neutral-900 dark:text-[#eae5dc] ">
                          {post.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 pl-[5.5rem] sm:pl-[6rem] mt-1.5 font-mono text-[11px] sm:text-[12px] text-neutral-400/70 dark:text-neutral-500/70 tracking-wide">
                        {post.category && !activeCategory && (
                          <span>{post.category}</span>
                        )}
                        {post.category && !activeCategory && readTime && (
                          <span>·</span>
                        )}
                        {readTime && (
                          <span>{readTime} min</span>
                        )}
                      </div>
                    </Link>
                  );

                  return index < 15 ? (
                    <SlideEnter
                      key={post.id}
                      stage={postStage}
                      stagger={35}
                      style={{ contentVisibility: "auto", containIntrinsicSize: "0 80px" }}
                    >
                      {postItem}
                    </SlideEnter>
                  ) : (
                    <div
                      key={post.id}
                      style={{ contentVisibility: "auto", containIntrinsicSize: "0 80px" }}
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

      {/* 空状态 (Stage 4) */}
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