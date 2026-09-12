// src/components/post/PostsListClient.tsx
"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { Pin } from "lucide-react";
import { SlideEnter } from "@/components/layout/SlideEnter";
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

  const [visibleCount, setVisibleCount] = useState<number>(BATCH_SIZE);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPosts) setPosts(initialPosts);
  }, [initialPosts]);

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

  // 2. 统计所有标签
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    posts.forEach((post) => {
      if (!post.tags) return;
      if (Array.isArray(post.tags)) {
        post.tags.forEach((t) => t && tagSet.add(t.trim()));
      } else if (typeof post.tags === "string") {
        post.tags.split(",").forEach((t) => t && tagSet.add(t.trim()));
      }
    });
    return Array.from(tagSet).slice(0, 20);
  }, [posts]);

  // 3. 过滤文章
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

  // 4. 区分置顶文章与常规文章
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

  // 5. 截取当前可见常规文章
  const displayedRegularPosts = useMemo(() => {
    return regularPosts.slice(0, visibleCount);
  }, [regularPosts, visibleCount]);

  // 6. 按年份归并常规文章
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

  // 7. 触底自动追加监听
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

  // 8. 切换分类与标签
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

  const handleTagToggle = (tag: string) => {
    const nextTag = activeTag === tag ? "" : tag;
    setActiveTag(nextTag);
    const params = new URLSearchParams();
    if (activeCategory) params.set("category", activeCategory);
    if (nextTag) params.set("tag", nextTag);
    const query = params.toString();
    window.history.replaceState(null, "", query ? `/posts?${query}` : "/posts");
  };

  const formatEditorialDate = (dateString: string) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return `${months[d.getMonth()]} ${d.getDate().toString().padStart(2, "0")}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 w-full">
      {/* 1. 左侧边栏：Sticky 固定吸顶，滚动不消失 */}
      <aside className="md:col-span-3 pt-6 pb-8 md:pr-8 md:border-r border-black/[0.08] dark:border-white/[0.08] flex flex-col gap-8 md:sticky md:top-24 md:self-start md:max-h-[calc(100vh-7rem)] md:overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Categories 分类 */}
        <SlideEnter stage={2}>
          <div>
            <div className="font-serif text-[11.5px] tracking-[0.2em] uppercase text-neutral-500 dark:text-neutral-400 mb-4 font-semibold">
              Categories
            </div>
            <ul className="flex flex-col space-y-1 text-[13.5px]">
              <li>
                <button
                  type="button"
                  onClick={() => handleCategoryChange("")}
                  className={`w-full text-left flex items-center justify-between py-1 transition-colors cursor-pointer ${
                    !activeCategory
                      ? "text-neutral-950 dark:text-white font-medium"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                  }`}
                >
                  <span>全部</span>
                  <span className="font-mono text-[11px] opacity-50 tabular-nums">
                    {posts.length}
                  </span>
                </button>
              </li>
              {categories.map((cat) => {
                const isCurrent = activeCategory === cat;
                const count = categoryCounts[cat] || 0;
                return (
                  <li key={cat}>
                    <button
                      type="button"
                      onClick={() => handleCategoryChange(cat)}
                      className={`w-full text-left flex items-center justify-between py-1 transition-colors cursor-pointer ${
                        isCurrent
                          ? "text-neutral-950 dark:text-white font-medium"
                          : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                      }`}
                    >
                      <span>{cat}</span>
                      <span className="font-mono text-[11px] opacity-40 tabular-nums">
                        {count}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </SlideEnter>

        {/* Tags 标签 */}
        {allTags.length > 0 && (
          <SlideEnter stage={3}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="font-serif text-[11.5px] tracking-[0.2em] uppercase text-neutral-500 dark:text-neutral-400 font-semibold">
                  Tags
                </div>
                {activeTag && (
                  <button
                    type="button"
                    onClick={handleClearTag}
                    className="text-[11px] font-mono text-neutral-400 hover:text-neutral-200 cursor-pointer underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 text-[12px] font-mono">
                {allTags.map((tag) => {
                  const isCurrent = activeTag.toLowerCase() === tag.toLowerCase();
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`cursor-pointer transition-colors py-0.5 px-1 rounded ${
                        isCurrent
                          ? "text-neutral-950 dark:text-white underline font-semibold"
                          : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                      }`}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </SlideEnter>
        )}
      </aside>

      {/* 2. 右侧主归档目录 (Main Ledger Archive)：严格单行对齐，等高平整 */}
      <main className="md:col-span-9 md:pl-10 pt-6 pb-16 min-w-0">
        <div key={`${activeCategory}-${activeTag}`} className="slide-enter-content w-full">
          {/* 置顶文章 (Pinned) */}
          {pinnedPosts.length > 0 && (
            <section className="mb-10">
              <SlideEnter stage={3}>
                <div className="py-2.5 border-b border-black/[0.08] dark:border-white/[0.08]">
                  <h2 className="font-serif text-[19px] sm:text-[20px] text-neutral-600 dark:text-neutral-300 font-medium tracking-wide">
                    Pinned
                  </h2>
                </div>
              </SlideEnter>

              <div className="flex flex-col">
                {pinnedPosts.map((post, index) => {
                  const date = post.published_at || post.created_at;
                  const editorialDate = formatEditorialDate(date);
                  const readTime = getReadTime(post);
                  const targetLink = `/posts/${post.slug || post.id}`;

                  return (
                    <SlideEnter
                      key={post.id}
                      stage={3 + index}
                      stagger={25}
                      style={{ contentVisibility: "auto", containIntrinsicSize: "0 48px" }}
                    >
                      <Link
                        href={targetLink}
                        title={post.title}
                        className="
                          group flex items-center py-3.5
                          border-b border-black/[0.06] dark:border-white/[0.06]
                          cursor-pointer transition-colors
                          hover:text-neutral-950 dark:hover:text-white
                        "
                      >
                        <div className="w-20 sm:w-24 shrink-0 font-mono text-[12px] text-neutral-400 dark:text-neutral-500 tracking-wider uppercase">
                          {editorialDate}
                        </div>
                        <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Pin className="h-3.5 w-3.5 shrink-0 -rotate-45 text-neutral-400 dark:text-neutral-500 opacity-60" />
                            <h3 className="font-serif text-[18px] sm:text-[20px] text-neutral-800 dark:text-[#eae5dc] group-hover:text-black dark:group-hover:text-white leading-normal font-normal truncate">
                              {post.title}
                            </h3>
                          </div>
                          {(post.category || readTime) && (
                            <span className="font-mono text-[11px] text-neutral-400 dark:text-neutral-500 shrink-0 hidden sm:inline tabular-nums">
                              {post.category && !activeCategory && <span>{post.category} · </span>}
                              {readTime && <span>{readTime} MIN</span>}
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

          {/* 年份文章分组 (Years) */}
          {years.map((year, yearIndex) => {
            const yearPosts = postsByYear[year];

            return (
              <section key={year} className="mb-10">
                <SlideEnter stage={3}>
                  <div className="py-2.5 border-b border-black/[0.08] dark:border-white/[0.08]">
                    <h2 className="font-serif text-[19px] sm:text-[20px] text-neutral-600 dark:text-neutral-300 font-medium tracking-wide">
                      {year}
                    </h2>
                  </div>
                </SlideEnter>

                <div className="flex flex-col">
                  {yearPosts.map((post, index) => {
                    const date = post.published_at || post.created_at;
                    const editorialDate = formatEditorialDate(date);
                    const readTime = getReadTime(post);
                    const postStage = Math.min(4 + index, 14);
                    const targetLink = `/posts/${post.slug || post.id}`;

                    const postItem = (
                      <Link
                        href={targetLink}
                        title={post.title}
                        className="
                          group flex items-center py-3.5
                          border-b border-black/[0.06] dark:border-white/[0.06]
                          cursor-pointer transition-colors
                          hover:text-neutral-950 dark:hover:text-white
                        "
                      >
                        <div className="w-20 sm:w-24 shrink-0 font-mono text-[12px] text-neutral-400 dark:text-neutral-500 tracking-wider uppercase">
                          {editorialDate}
                        </div>
                        <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                          <h3 className="font-serif text-[18px] sm:text-[20px] text-neutral-800 dark:text-[#eae5dc] group-hover:text-black dark:group-hover:text-white leading-normal font-normal truncate flex-1 min-w-0">
                            {post.title}
                          </h3>
                          {(post.category || readTime) && (
                            <span className="font-mono text-[11px] text-neutral-400 dark:text-neutral-500 shrink-0 hidden sm:inline tabular-nums">
                              {post.category && !activeCategory && <span>{post.category} · </span>}
                              {readTime && <span>{readTime} MIN</span>}
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
                        style={{ contentVisibility: "auto", containIntrinsicSize: "0 48px" }}
                      >
                        {postItem}
                      </SlideEnter>
                    ) : (
                      <div
                        key={post.id}
                        style={{ contentVisibility: "auto", containIntrinsicSize: "0 48px" }}
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

        {/* 触底加载更多哨兵 */}
        {hasMore && <div ref={loadMoreRef} className="h-10 w-full" />}

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
      </main>
    </div>
  );
}