"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FolderOpen, Tag as TagIcon, X } from "lucide-react";
import { SlideEnter } from "@/components/layout/SlideEnter";

export interface PostItem {
  id: string | number;
  title: string;
  created_at: string;
  published_at?: string | null;
  content?: string | null;
  summary?: string | null;
  category?: string | null;
  tags?: string[] | string | null;
}

interface PostsListClientProps {
  initialPosts: PostItem[];
  initialCategory?: string;
  initialTag?: string;
}

function formatDate(dateString: string) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function getYear(dateString: string) {
  return new Date(dateString).getFullYear() || new Date().getFullYear();
}

function getReadTime(post: PostItem): number | null {
  const raw = post.content || post.summary || "";
  if (!raw.trim()) return null;

  const text = raw
    .replace(/<[^>]*>/g, "")
    .replace(/[#>*_`~()[\]\\]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!text.length) return null;
  return Math.max(1, Math.ceil(text.length / 350));
}

export function PostsListClient({
  initialPosts,
  initialCategory = "",
  initialTag = "",
}: PostsListClientProps) {
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [activeTag, setActiveTag] = useState<string>(initialTag);

  // 1. 统计全量文章数与各分类数量
  const { categoryCounts, categories } = useMemo(() => {
    const counts: Record<string, number> = {};
    initialPosts.forEach((post) => {
      const cat = post.category?.trim();
      if (cat) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });

    const sortedCats = Object.keys(counts).sort(
      (a, b) => counts[b] - counts[a]
    );

    return { categoryCounts: counts, categories: sortedCats };
  }, [initialPosts]);

  // 2. 内存秒级过滤文章
  const filteredPosts = useMemo(() => {
    return initialPosts.filter((post) => {
      if (activeCategory && post.category !== activeCategory) {
        return false;
      }
      if (activeTag) {
        const rawTags = Array.isArray(post.tags)
          ? post.tags.join(",")
          : post.tags || "";
        if (!rawTags.toLowerCase().includes(activeTag.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [initialPosts, activeCategory, activeTag]);

  // 3. 按年份归并文章
  const { years, postsByYear } = useMemo(() => {
    const groups: Record<string, PostItem[]> = {};

    filteredPosts.forEach((post) => {
      const date = post.published_at || post.created_at;
      const year = String(getYear(date));
      if (!groups[year]) groups[year] = [];
      groups[year].push(post);
    });

    const sortedYears = Object.keys(groups).sort(
      (a, b) => Number(b) - Number(a)
    );

    return { years: sortedYears, postsByYear: groups };
  }, [filteredPosts]);

  // 4. 切换分类：即时响应并同步 URL
  const handleCategoryChange = (cat: string) => {
    const nextCategory = activeCategory === cat ? "" : cat;
    setActiveCategory(nextCategory);

    // 静默同步浏览器 URL，避免网络请求延迟
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
      {/* 分类 Tab 栏：精致胶囊与浮动平滑背景 */}
      <SlideEnter stage={2} className="mb-12">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-black/[0.06] pb-4 dark:border-white/[0.08]">
          {/* 全部 Tab */}
          <button
            type="button"
            onClick={() => handleCategoryChange("")}
            className={`relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer select-none ${
              !activeCategory
                ? "text-neutral-950 dark:text-white font-semibold"
                : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
            }`}
          >
            {!activeCategory && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 rounded-lg bg-neutral-200/70 shadow-sm dark:bg-white/[0.12]"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
              />
            )}
            <span className="relative z-10">全部</span>
            <span
              className={`relative z-10 font-mono text-[10px] tabular-nums ${
                !activeCategory
                  ? "text-neutral-700 dark:text-neutral-300"
                  : "text-neutral-400 dark:text-neutral-500"
              }`}
            >
              {initialPosts.length}
            </span>
          </button>

          {/* 各分类 Tab */}
          {categories.map((cat) => {
            const isCurrent = activeCategory === cat;
            const count = categoryCounts[cat] || 0;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryChange(cat)}
                className={`relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer select-none ${
                  isCurrent
                    ? "text-neutral-950 dark:text-white font-semibold"
                    : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                }`}
              >
                {isCurrent && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 rounded-lg bg-neutral-200/70 shadow-sm dark:bg-white/[0.12]"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <FolderOpen className="relative z-10 h-3 w-3 opacity-60" />
                <span className="relative z-10">{cat}</span>
                <span
                  className={`relative z-10 font-mono text-[10px] tabular-nums ${
                    isCurrent
                      ? "text-neutral-700 dark:text-neutral-300"
                      : "text-neutral-400 dark:text-neutral-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {/* 激活的标签徽章 */}
          {activeTag && (
            <button
              type="button"
              onClick={handleClearTag}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/10 px-2.5 py-1.5 text-xs font-medium text-sky-600 transition-colors hover:bg-sky-500/20 dark:bg-sky-400/10 dark:text-sky-400 dark:hover:bg-sky-400/20"
            >
              <TagIcon className="h-3 w-3" />
              <span>#{activeTag}</span>
              <X className="h-3 w-3 opacity-60 hover:opacity-100" />
            </button>
          )}
        </div>
      </SlideEnter>

      {/* 年份文章列表 */}
      <div className="space-y-14">
        {years.map((year) => {
          const yearPosts = postsByYear[year];

          return (
            <section key={year} className="relative">
              {/* 年份背景水印与标题 */}
              <SlideEnter
                stage={3}
                className="relative mb-6 flex items-center select-none"
              >
                <span
                  aria-hidden="true"
                  className="
                    pointer-events-none
                    absolute
                    -left-2
                    -top-6
                    -z-10
                    select-none
                    font-mono
                    text-7xl
                    font-bold
                    tracking-tighter
                    text-neutral-200/50
                    opacity-80
                    dark:text-neutral-800/40
                    sm:-left-4
                    sm:-top-8
                    sm:text-8xl
                  "
                >
                  {year}
                </span>

                <h2 className="relative text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-2xl">
                  {year}
                </h2>
              </SlideEnter>

              {/* 文章条目 */}
              <div className="space-y-1">
                {yearPosts.map((post, index) => {
                  const date = post.published_at || post.created_at;
                  const readTime = getReadTime(post);
                  const postStage = Math.min(4 + index, 14);

                  return (
                    <SlideEnter
                      key={post.id}
                      stage={postStage}
                      stagger={35}
                    >
                      <Link
                        href={`/posts/${post.id}`}
                        prefetch={false}
                        className="
                          group
                          -mx-3
                          flex
                          items-baseline
                          justify-between
                          gap-4
                          rounded-lg
                          px-3
                          py-2.5
                          hover:bg-black/[0.03]
                          dark:hover:bg-white/[0.04]
                        "
                      >
                        <div className="flex min-w-0 flex-1 items-baseline gap-2.5">
                          <span
                            className="
                              text-[15px]
                              font-normal
                              leading-snug
                              text-neutral-700
                              antialiased
                              group-hover:text-neutral-950
                              dark:text-neutral-300
                              dark:group-hover:text-white
                              sm:text-[16px]
                              sm:leading-relaxed
                            "
                          >
                            {post.title}
                          </span>

                          {post.category && !activeCategory && (
                            <span className="hidden shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 group-hover:text-neutral-700 dark:bg-neutral-800/80 dark:text-neutral-400 dark:group-hover:text-neutral-300 sm:inline">
                              {post.category}
                            </span>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-3 font-mono text-xs text-neutral-400 dark:text-neutral-500">
                          {readTime && (
                            <span className="hidden opacity-60 tabular-nums sm:inline">
                              {readTime}m
                            </span>
                          )}
                          <span className="tabular-nums opacity-75">
                            {formatDate(date)}
                          </span>
                        </div>
                      </Link>
                    </SlideEnter>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* 空状态 */}
      {filteredPosts.length === 0 && (
        <SlideEnter
          stage={4}
          className="py-20 text-center text-sm text-neutral-400 dark:text-neutral-500"
        >
          {activeCategory || activeTag ? "该分类下暂无文章" : "暂无文章"}
        </SlideEnter>
      )}
    </>
  );
}