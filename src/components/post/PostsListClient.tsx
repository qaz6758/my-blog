// src/components/post/PostsListClient.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search, X } from "lucide-react";
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

const BATCH_SIZE = 60;

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

function getPostTags(post: PostItem): string[] {
  if (!post.tags) {
    return [];
  }
  if (Array.isArray(post.tags)) {
    return post.tags.map((tag) => tag?.trim()).filter(Boolean);
  }
  return post.tags.split(",").map((tag) => tag.trim()).filter(Boolean);
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return {
      monthStr: "--",
      dayStr: "--",
      formatted: "--.--",
    };
  }
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return {
    monthStr: `${date.getMonth() + 1}月`,
    dayStr: d,
    formatted: `${m}.${d}`,
  };
}

export function PostsListClient({
  initialPosts = [],
  initialCategory = "",
  initialTag = "",
}: PostsListClientProps) {
  const posts = initialPosts;
  const [activeTopic, setActiveTopic] = useState<string>(initialCategory || initialTag || "");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showAllTags, setShowAllTags] = useState<boolean>(false);

  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setVisibleCount(BATCH_SIZE);
  }, [activeTopic, searchQuery]);

  /* -------------------------------------------------------------------------- */
  /* 统一主题池 (合并分类与标签，去重排重，剔除 RSS 等系统废标签，常驻不漂移)        */
  /* -------------------------------------------------------------------------- */

  const { allTopics, topicCounts } = useMemo(() => {
    const JUNK_TAGS = new Set(["rss", "feed"]);
    const counts: Record<string, number> = {};
    const displayMap: Record<string, string> = {};

    // 核心大类优先权（如编程实战、技术前沿、思考）
    const priorityOrder: Record<string, number> = {
      "编程实战": 1,
      "技术前沿": 2,
      "思考": 3,
    };

    posts.forEach((post) => {
      const cat = post.category?.trim();
      const tags = getPostTags(post).map((t) => t.trim()).filter(Boolean);

      // 单篇去重：若某文章分类为“思考”且标签也是“思考”，在该文章中只计 1 次
      const postTopics = new Set<string>();
      if (cat) postTopics.add(cat);
      tags.forEach((t) => {
        if (!JUNK_TAGS.has(t.toLowerCase())) {
          postTopics.add(t);
        }
      });

      postTopics.forEach((topic) => {
        const key = topic.toLowerCase();
        counts[key] = (counts[key] || 0) + 1;
        if (!displayMap[key]) {
          displayMap[key] = topic; // 保留最佳原始大小写显示
        }
      });
    });

    // 排序：优先大类置顶，其余按文章篇数倒序
    const sortedKeys = Object.keys(counts).sort((a, b) => {
      const pA = priorityOrder[displayMap[a]] || 999;
      const pB = priorityOrder[displayMap[b]] || 999;
      if (pA !== pB) return pA - pB;
      return counts[b] - counts[a] || a.localeCompare(b);
    });

    return {
      allTopics: sortedKeys.map((k) => displayMap[k]),
      topicCounts: counts,
    };
  }, [posts]);

  /* -------------------------------------------------------------------------- */
  /* 综合匹配 (主题单选精准命中 + 即时模糊搜索)                                   */
  /* -------------------------------------------------------------------------- */

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (activeTopic) {
        const target = activeTopic.toLowerCase();
        const catMatch = post.category?.trim().toLowerCase() === target;
        const tagMatch = getPostTags(post).some(
          (t) => t.trim().toLowerCase() === target
        );
        if (!catMatch && !tagMatch) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchTitle = post.title.toLowerCase().includes(q);
        const matchSummary = post.summary ? post.summary.toLowerCase().includes(q) : false;
        const matchTags = getPostTags(post).some((t) => t.toLowerCase().includes(q));
        const matchCategory = post.category ? post.category.toLowerCase().includes(q) : false;
        if (!matchTitle && !matchSummary && !matchTags && !matchCategory) {
          return false;
        }
      }

      return true;
    });
  }, [posts, activeTopic, searchQuery]);

  /* -------------------------------------------------------------------------- */
  /* Pinned / regular                                                             */
  /* -------------------------------------------------------------------------- */

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

    return {
      pinnedPosts: pinned,
      regularPosts: regular,
    };
  }, [filteredPosts]);

  const displayedRegularPosts = useMemo(() => {
    return regularPosts.slice(0, visibleCount);
  }, [regularPosts, visibleCount]);

  /* -------------------------------------------------------------------------- */
  /* Year archive                                                                 */
  /* -------------------------------------------------------------------------- */

  const { years, postsByYear } = useMemo(() => {
    const groups: Record<string, PostItem[]> = {};

    displayedRegularPosts.forEach((post) => {
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
  }, [displayedRegularPosts]);

  /* -------------------------------------------------------------------------- */
  /* Infinite loading                                                             */
  /* -------------------------------------------------------------------------- */

  const hasMore = visibleCount < regularPosts.length;

  useEffect(() => {
    if (!hasMore || !loadMoreRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) {
          return;
        }

        setVisibleCount((previous) =>
          Math.min(previous + BATCH_SIZE, regularPosts.length)
        );
      },
      {
        rootMargin: "350px",
      }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasMore, regularPosts.length]);

  /* -------------------------------------------------------------------------- */
  /* URL state                                                                    */
  /* -------------------------------------------------------------------------- */

  /* -------------------------------------------------------------------------- */
  /* URL state & handlers                                                        */
  /* -------------------------------------------------------------------------- */

  const updateQuery = (topic: string) => {
    const params = new URLSearchParams();
    if (topic) {
      params.set("topic", topic);
    }
    const query = params.toString();
    window.history.replaceState(null, "", query ? `/posts?${query}` : "/posts");
  };

  const handleTopicToggle = (topic: string) => {
    const next = activeTopic.toLowerCase() === topic.toLowerCase() ? "" : topic;
    setActiveTopic(next);
    updateQuery(next);
  };

  const handleResetAll = () => {
    setSearchQuery("");
    setActiveTopic("");
    updateQuery("");
  };

  /* -------------------------------------------------------------------------- */
  /* Shared metadata                                                             */
  /* -------------------------------------------------------------------------- */

  const renderMeta = (post: PostItem) => {
    const postCategory = post.category?.trim();
    const tags = getPostTags(post)
      .filter(
        (tag) =>
          tag.toLowerCase() !== "rss" &&
          tag.toLowerCase() !== "feed" &&
          tag.trim().toLowerCase() !== postCategory?.toLowerCase()
      )
      .slice(0, 2);
    const readTime = getReadTime(post);

    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-[11px] text-neutral-400 dark:text-neutral-500">
        {postCategory && (
          <span className="text-neutral-500 dark:text-neutral-400">
            {postCategory}
          </span>
        )}

        {tags.map((tag) => (
          <React.Fragment key={tag}>
            <span className="text-neutral-300 dark:text-neutral-700">/</span>
            <span>{tag}</span>
          </React.Fragment>
        ))}

        {readTime && (
          <>
            <span className="text-neutral-300 dark:text-neutral-700">/</span>
            <span>{readTime} min</span>
          </>
        )}
      </div>
    );
  };

  /* -------------------------------------------------------------------------- */
  /* Post item (内敛题跋日期 · 统一中西文排印 · 沉稳呼吸感)                          */
  /* -------------------------------------------------------------------------- */

  const renderPost = (
    post: PostItem,
    index: number,
    year?: string,
    pinned = false
  ) => {
    const date = post.published_at || post.created_at;
    const { formatted } = formatDate(date);
    const targetLink = `/posts/${post.slug || post.id}`;

    return (
      <Link
        key={post.id}
        href={targetLink}
        prefetch={true}
        title={post.title}
        className="group block"
      >
        <article
          className="
            relative
            grid
            grid-cols-[46px_minmax(0,1fr)]
            gap-3.5
            border-t
            first:border-t-0
            border-black/[0.05]
            py-5
            transition-colors
            duration-200
            dark:border-white/[0.04]
            sm:grid-cols-[54px_minmax(0,1fr)_24px]
            sm:gap-5
            sm:py-6
          "
        >
          {/* 日期栏 (内敛单行题跋：MM.DD，安静不喧宾夺主) */}
          <div className="relative flex flex-col justify-start pt-1 font-mono select-none">
            <span className="text-[12.5px] sm:text-[13px] font-medium tracking-tight text-neutral-400 dark:text-[#777168] group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
              {formatted}
            </span>
          </div>

          {/* 内容主体 (升级为 font-serif: 英文 Charter/Georgia 刚劲饱满，中文霞鹜文楷温润) */}
          <div className="min-w-0">
            <h3
              className="
                font-serif
                text-[19px]
                sm:text-[22px]
                font-normal
                sm:font-medium
                leading-[1.45]
                tracking-[0.01em]
                text-neutral-800
                transition-colors
                duration-200
                group-hover:text-[#7f1d1d]
                dark:text-[#eae5dc]
                dark:group-hover:text-white
              "
            >
              {post.title}
            </h3>

            {post.summary?.trim() && (
              <p
                className="
                  mt-2
                  max-w-[720px]
                  font-sans
                  text-[13px]
                  leading-[1.8]
                  text-neutral-600
                  dark:text-neutral-400
                  line-clamp-2
                "
              >
                {post.summary.trim()}
              </p>
            )}

            <div className={post.summary?.trim() ? "mt-3.5" : "mt-2.5"}>
              {renderMeta(post)}
            </div>
          </div>

          {/* 右侧微光指示箭头 */}
          <div className="hidden items-start justify-end pt-1.5 sm:flex">
            <ArrowUpRight
              className="
                h-4
                w-4
                text-neutral-400
                opacity-30
                transition-all
                duration-200
                group-hover:opacity-100
                group-hover:translate-x-0.5
                group-hover:-translate-y-0.5
                group-hover:text-[#7f1d1d]
                dark:text-neutral-500
                dark:group-hover:text-white
              "
            />
          </div>
        </article>
      </Link>
    );
  };

  /* -------------------------------------------------------------------------- */
  /* Filter Card Widget (参考图精致内聚胶囊挂件架构 · 轻盈透气纸面风格)         */
  /* -------------------------------------------------------------------------- */

  const renderFilterCard = (keyPrefix = "filter") => {
    const initialTopicLimit = 10;
    const displayedTopics = showAllTags
      ? allTopics
      : allTopics.slice(0, initialTopicLimit);
    const remainingTopicsCount = Math.max(0, allTopics.length - initialTopicLimit);

    return (
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.015] dark:bg-white/[0.02] p-4 sm:p-5 backdrop-blur-[2px]">
        {/* 顶部：极简内嵌搜索 (零多余框框，无 focus 边框与外轮廓) */}
        <div className="relative flex items-center pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
          <Search className="h-3.5 w-3.5 text-neutral-400 dark:text-[#777168] shrink-0 mr-2.5 pointer-events-none" />
          <input
            type="text"
            id={`${keyPrefix}-search-input`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSearchQuery("");
            }}
            placeholder="搜索文章、主题..."
            style={{ outline: "none", boxShadow: "none", border: "none" }}
            className="w-full bg-transparent text-[13px] text-neutral-800 dark:text-[#ede7dc] placeholder:text-neutral-400 dark:placeholder:text-[#6a645b] outline-none border-0 ring-0 focus:outline-none focus:border-0 focus:ring-0 focus-visible:outline-none focus-visible:ring-0 shadow-none font-sans"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors cursor-pointer"
              aria-label="清空搜索"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* 中间：胶囊实体按键网格 (全量主题排重常驻，永不因筛选而跳动漂移) */}
        <div className="pt-3.5">
          <div className="flex flex-wrap gap-2">
            {/* 全部胶囊 */}
            <button
              type="button"
              onClick={() => {
                setActiveTopic("");
                updateQuery("");
              }}
              className={`
                group flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-sans transition-all duration-200 cursor-pointer border
                ${!activeTopic
                  ? "bg-[#24211e] text-[#ede7dc] border-[#24211e] dark:bg-[#ede7dc] dark:text-[#111213] dark:border-[#ede7dc] font-medium shadow-sm"
                  : "bg-black/[0.02] dark:bg-white/[0.03] text-neutral-600 dark:text-neutral-300 border-black/[0.08] dark:border-white/[0.08] hover:border-black/25 dark:hover:border-white/25 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                }
              `}
            >
              <span className="truncate">全部</span>
              <span className={`font-mono text-[10.5px] tabular-nums ${!activeTopic ? "opacity-75" : "text-neutral-400 dark:text-neutral-500"}`}>
                ( {posts.length} )
              </span>
            </button>

            {/* 所有排重主题与标签项 */}
            {displayedTopics.map((topic) => {
              const active = activeTopic.toLowerCase() === topic.toLowerCase();
              const count = topicCounts[topic.toLowerCase()] || 0;

              return (
                <button
                  key={`${keyPrefix}-topic-${topic}`}
                  type="button"
                  onClick={() => handleTopicToggle(topic)}
                  className={`
                    group flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-sans transition-all duration-200 cursor-pointer border
                    ${active
                      ? "bg-[#24211e] text-[#ede7dc] border-[#24211e] dark:bg-[#ede7dc] dark:text-[#111213] dark:border-[#ede7dc] font-medium shadow-sm"
                      : "bg-black/[0.02] dark:bg-white/[0.03] text-neutral-600 dark:text-neutral-300 border-black/[0.08] dark:border-white/[0.08] hover:border-black/25 dark:hover:border-white/25 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                    }
                  `}
                >
                  <span className="truncate">{topic}</span>
                  <span className={`font-mono text-[10.5px] tabular-nums ${active ? "opacity-75" : "text-neutral-400 dark:text-neutral-500"}`}>
                    ( {count} )
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 底部折叠与重置链路 */}
        {(allTopics.length > initialTopicLimit || activeTopic || searchQuery) && (
          <div className="pt-3.5 mt-3.5 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between text-[11.5px] font-sans">
            {allTopics.length > initialTopicLimit ? (
              <button
                type="button"
                onClick={() => setShowAllTags(!showAllTags)}
                className="cursor-pointer text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white underline underline-offset-4 transition-colors"
              >
                {showAllTags ? "收起标签" : `所有标签 ( +${remainingTopicsCount} )`}
              </button>
            ) : <span />}

            {(activeTopic || searchQuery) && (
              <button
                type="button"
                onClick={handleResetAll}
                className="cursor-pointer text-neutral-400 hover:text-[#7f1d1d] dark:hover:text-neutral-200 transition-colors"
              >
                清空筛选
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* 整个页面由中央文章绝对主体 + 右侧独立伴随轨道组成 (文章居中，挂件在右，绝不挤压正文空间) */}
      <div className="relative mx-auto flex w-full justify-center">

        {/* 左侧平衡占位：与右侧挂件等宽，确保中间 780px 文章主体在电脑大屏上 100% 绝对居中 */}
        <div className="hidden xl:block w-[260px] shrink-0 mr-12 2xl:mr-16 pointer-events-none" aria-hidden="true" />

        {/* ================= 1. 文章列表主体 (绝对主角，黄金 780px 宽度) ================= */}
        <div className="w-full max-w-[780px] shrink-0 min-w-0">
          
          {/* 页面标题区 */}
          <section className="border-b border-black/[0.08] pb-8 pt-4 sm:pb-10 dark:border-white/[0.08]">
            <div>
              <h1 className="font-wenkai text-[40px] font-normal leading-tight tracking-[0.01em] text-neutral-900 dark:text-[#eee8de] sm:text-[48px] min-h-[48px] sm:min-h-[58px]">
                文章
              </h1>

              <p className="mt-4 max-w-xl font-sans text-[13px] leading-[2] text-neutral-600 dark:text-neutral-400 sm:text-[14px]">
                记录技术探索、网站折腾，以及那些值得留下来的生活碎片 · 共 {posts.length} 篇。
              </p>
            </div>
          </section>

          {/* 移动端/平板轻盈挂件 (只在 xl 以下显示，且通透不抢戏) */}
          <div className="block xl:hidden mt-6 mb-8">
            {renderFilterCard("mobile")}
          </div>

          {/* 文章时间线主轴 (静态直出零延迟，杜绝任何二次刷新割裂感) */}
          <main className="mt-8 lg:mt-10 min-w-0">
              {/* 当前筛选反馈提示 (当有搜索或筛选且有命中时) */}
              {(activeTopic || searchQuery) && (
                <div className="mb-6 flex items-center justify-between text-xs border-b border-black/[0.05] pb-3.5 dark:border-white/[0.05]">
                  <div className="font-sans text-neutral-500 dark:text-neutral-400">
                    当前筛选命中{" "}
                    <span className="text-[#7f1d1d] dark:text-[#ede7dc] font-medium font-mono mx-1">
                      {filteredPosts.length}
                    </span>{" "}
                    篇
                    {activeTopic && (
                      <span className="ml-1 text-neutral-700 dark:text-neutral-300 font-medium">
                        （主题：“{activeTopic}”）
                      </span>
                    )}
                    {searchQuery && (
                      <span className="ml-1.5 opacity-75">
                        （包含 “{searchQuery}”）
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleResetAll}
                    className="cursor-pointer font-sans text-[11px] tracking-wider text-neutral-400 underline underline-offset-4 transition-colors hover:text-neutral-800 dark:hover:text-neutral-200"
                  >
                    清空全部筛选
                  </button>
                </div>
              )}

              {/* ---------------------------------------------------------------- */}
              {/* Pinned 置顶文章                                                   */}
              {/* ---------------------------------------------------------------- */}

              {pinnedPosts.length > 0 && (
                <section className="mb-10">
                  <div className="flex items-end justify-between border-b border-black/[0.08] pb-3.5 dark:border-white/[0.08]">
                    <div className="flex items-end gap-3">
                      <h2 className="font-wenkai text-[22px] sm:text-[24px] font-normal leading-none text-neutral-800 dark:text-neutral-200">
                        置顶文章
                      </h2>
                    </div>

                    <span className="font-mono text-[11px] text-neutral-400 dark:text-[#777168]">
                      {pinnedPosts.length} 篇
                    </span>
                  </div>

                  <div>
                    {pinnedPosts.map((post, index) =>
                      renderPost(post, index, undefined, true)
                    )}
                  </div>
                </section>
              )}

              {/* ---------------------------------------------------------------- */}
              {/* Years 年份编年史                                                  */}
              {/* ---------------------------------------------------------------- */}

              <div>
                {years.map((year) => {
                  const yearPosts = postsByYear[year];

                  return (
                    <section key={year} className="mb-12 last:mb-0">
                      <div className="flex items-end justify-between border-b border-black/[0.08] pb-3.5 dark:border-white/[0.08]">
                        <div className="flex items-end gap-3">
                          <h2 className="font-wenkai text-[26px] sm:text-[28px] font-normal leading-none text-neutral-800 dark:text-neutral-200">
                            {year}
                          </h2>
                        </div>

                        <span className="font-mono text-[11px] text-neutral-400 dark:text-[#777168]">
                          {yearPosts.length} 篇
                        </span>
                      </div>

                      <div>
                        {yearPosts.map((post, index) =>
                          renderPost(post, index, year, false)
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>

              {/* Loading sentinel */}
              {hasMore && (
                <div
                  ref={loadMoreRef}
                  className="h-20 w-full"
                  aria-hidden="true"
                />
              )}

              {/* Empty */}
              {filteredPosts.length === 0 && (
                <div className="border-t border-black/[0.06] py-24 text-center dark:border-white/[0.06]">
                  <p className="font-serif text-[16px] sm:text-[17px] text-neutral-500 dark:text-neutral-400">
                    {searchQuery
                      ? `未找到与 “${searchQuery}” 相关的文章`
                      : activeTopic
                      ? `“${activeTopic}” 主题下暂无文章`
                      : "这里还没有文章"}
                  </p>
                  {(searchQuery || activeTopic) && (
                    <button
                      type="button"
                      onClick={handleResetAll}
                      className="mt-4 px-4 py-1.5 text-xs font-serif tracking-wider rounded border border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                    >
                      重置搜索与全部筛选
                    </button>
                  )}
                </div>
              )}
            </main>

          {/* 底部纸面收束 */}
          <div className="mt-16 border-t border-black/[0.08] pt-5 dark:border-white/[0.08]">
            <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-400 dark:text-[#6a645b]">
              <span>End of archive</span>
              <span>{posts.length} writings</span>
            </div>
          </div>
        </div>

        {/* ================= 2. 右侧独立伴随轨道 (处于文章列表右侧留白，绝不入侵正文) ================= */}
        <aside className="hidden xl:block w-[260px] shrink-0 ml-12 2xl:ml-16 sticky top-28 self-start pt-2">
          {renderFilterCard("desktop")}
        </aside>

      </div>
    </div>
  );
}
