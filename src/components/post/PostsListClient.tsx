"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FolderOpen, Tag as TagIcon, X } from "lucide-react";
import { SlideEnter } from "@/components/layout/SlideEnter";
import { formatDate, calculateReadTime } from "@/lib/utils";

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

function getYear(dateString: string) {
  return new Date(dateString).getFullYear() || new Date().getFullYear();
}

function getReadTime(post: PostItem): number | null {
  const raw = post.content || post.summary || "";
  if (!raw.trim()) return null;
  return calculateReadTime(raw);
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
      {/* 分类 Tab 栏：极简纯文字（灰转白过渡） */}
      <SlideEnter stage={2} className="mb-10">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 border-b border-black/[0.06] pb-3.5 dark:border-white/[0.08]">
          {/* 全部 Tab */}
          <button
            type="button"
            onClick={() => handleCategoryChange("")}
            className={`group inline-flex items-center gap-1.5 py-1 text-[13.5px] transition-opacity duration-200 cursor-pointer select-none font-normal text-neutral-900 dark:text-white ${
              !activeCategory
                ? "opacity-100"
                : "opacity-55 hover:opacity-100"
            }`}
          >
            <span>全部</span>
            <span className="font-mono text-[11px] tabular-nums opacity-60">
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
                className={`group inline-flex items-center gap-1.5 py-1 text-[13.5px] transition-opacity duration-200 cursor-pointer select-none font-normal text-neutral-900 dark:text-white ${
                  isCurrent
                    ? "opacity-100"
                    : "opacity-55 hover:opacity-100"
                }`}
              >
                <FolderOpen className={`h-3.5 w-3.5 transition-opacity duration-200 ${isCurrent ? "opacity-90" : "opacity-50 group-hover:opacity-100"}`} />
                <span>{cat}</span>
                <span className="font-mono text-[11px] tabular-nums opacity-60">
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
                        className="
                          group
                          flex
                          items-baseline
                          justify-between
                          gap-4
                          py-2.5
                          transition-all
                          duration-200
                          cursor-pointer
                        "
                      >
                        <div className="flex min-w-0 flex-1 items-baseline gap-2.5">
                          <span
                            className="
                              text-[15px]
                              font-normal
                              leading-snug
                              text-neutral-900
                              dark:text-white
                              opacity-65
                              group-hover:opacity-100
                              transition-opacity
                              duration-200
                              ease-out
                              antialiased
                              sm:text-[16px]
                              sm:leading-relaxed
                            "
                          >
                            {post.title}
                          </span>

                          {post.category && !activeCategory && (
                            <span className="hidden shrink-0 rounded border border-black/[0.08] dark:border-white/[0.08] px-1.5 py-0.5 text-[10px] font-normal text-neutral-900 dark:text-white opacity-45 group-hover:opacity-80 transition-opacity duration-200 sm:inline">
                              {post.category}
                            </span>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-3 font-mono text-xs text-neutral-900 dark:text-white opacity-40 group-hover:opacity-75 transition-opacity duration-200 tabular-nums">
                          {readTime && (
                            <span className="hidden sm:inline">
                              {readTime}m
                            </span>
                          )}
                          <span>
                            {formatDate(date, false)}
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