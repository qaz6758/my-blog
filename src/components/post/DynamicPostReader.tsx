// src/components/post/DynamicPostReader.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Tag as TagIcon, ArrowLeft, ArrowRight, Menu } from "lucide-react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import { LazyPostContent } from "@/components/post/LazyPostContent";
import { ThoughtDetailClient } from "@/components/post/ThoughtDetailClient";
import { TableOfContents, TocIcon } from "@/components/post/TableOfContents";
import { LazyCommentSection } from "@/components/post/LazyCommentSection";
import { ThoughtMediaItem } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export interface PostDetail {
  id: string;
  title: string;
  content?: string;
  summary?: string;
  created_at?: string;
  published_at?: string;
  category?: string;
  tags?: string[] | string;
  source?: string;
  source_url?: string;
  slug?: string;
}

export interface DynamicPostReaderProps {
  post?: PostDetail | null;
  prevPost?: PostDetail | null;
  nextPost?: PostDetail | null;
}

// 标准自然减速曲线 (Apple / Antfu 同款 Smooth Easing)
const SMOOTH_TRANSITION: Transition = {
  duration: 0.45,
  ease: [0.22, 1, 0.36, 1] as const,
};

export function DynamicPostReader({
  post: initialPost,
  prevPost,
  nextPost,
}: DynamicPostReaderProps) {
  // 数据由服务端注入，无需客户端 loading 等待
  const [loading, setLoading] = useState(false);
  const [post, setPost] = useState<PostDetail | null>(initialPost || null);
  const [thought, setThought] = useState<ThoughtMediaItem | null>(null);
  const [mode, setMode] = useState<"post" | "thought" | "404">(
    initialPost ? "post" : "404"
  );
  // 鼠标悬停文章正文字体范围或目录自身时触发目录展开（Antfu 同款交互：严格限定正文列，两侧留白绝不触发）
  const [isArticleHovered, setIsArticleHovered] = useState(false);
  const leaveTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handlePointerEnter = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setIsArticleHovered(true);
  };

  const handlePointerLeave = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
    }
    leaveTimerRef.current = setTimeout(() => {
      setIsArticleHovered(false);
    }, 400);
  };

  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current);
      }
    };
  }, []);

  // 智能检测文章内容是否为 HTML 富文本 (自适应支持 RSS 抓取的文章与原生 Markdown)
  const isHtmlContent = React.useMemo(() => {
    if (!post) return false;
    const raw = (post.content || post.summary || "").trim();
    return /<\/?(p|div|h[1-6]|article|section|blockquote|pre|code|table|ul|ol|li|html|body|a)\b/i.test(raw);
  }, [post]);

  // 当 initialPost 更新时同步（例如客户端路由跳转）
  useEffect(() => {
    if (initialPost) {
      setPost(initialPost);
      setMode("post");
      setLoading(false);
      return;
    }

    // 兜底：检查是否为 /thoughts 路由（思碎用的客户端动态加载）
    if (typeof window === "undefined") return;
    const pathname = window.location.pathname;
    const matchThought = pathname.match(/\/thoughts\/([^\/\?#]+)/);

    if (matchThought) {
      const id = matchThought[1];
      setMode("thought");
      setLoading(true);
      const workerUrl =
        process.env.NEXT_PUBLIC_NOTION_WORKER_URL ||
        "https://notion-api.dedeboki123.workers.dev";
      fetch(`${workerUrl}/api/thoughts/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Not found");
          return res.json();
        })
        .then((data) => {
          if (data?.success && data.data) {
            setThought(data.data);
          } else {
            setThought(null);
          }
        })
        .catch(() => setThought(null))
        .finally(() => setLoading(false));
    } else {
      // 没有 initialPost 且不是 /thoughts 路由，直接 404
      setLoading(false);
      setMode("404");
    }
  }, [initialPost]);

  return (
    <AnimatePresence mode="wait">
      {/* 1. 1:1 像素级仿真骨架屏 */}
      {loading ? (
        <motion.div
          key="skeleton"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative min-h-screen w-full flex flex-col justify-between"
        >
          {/* 左侧固定 TOC 骨架：首屏直接占位，防止后续闪烁 */}
          <aside className="hidden xl:block fixed top-28 left-6 sm:left-8 w-44 pointer-events-none opacity-40 select-none">
            <div className="mb-3.5 flex items-center justify-start bg-transparent p-0 text-neutral-400 dark:text-neutral-500">
              <TocIcon className="h-4.5 w-4.5" />
            </div>
          </aside>

          {/* 正文版心骨架 */}
          <main className="relative z-10 px-6 pt-24 pb-20 sm:px-8 sm:pt-28 flex-1">
            <div className="mx-auto w-full max-w-[65ch]">
              {/* 标题与日期占位 */}
              <div className="mb-8">
                <div className="h-10 sm:h-11 bg-neutral-200/80 dark:bg-neutral-800/80 rounded-md w-4/5 animate-pulse" />
                <div className="mt-3 h-3.5 bg-neutral-200/60 dark:bg-neutral-800/60 rounded w-24 animate-pulse" />
              </div>

              {/* 首段正文占位 */}
              <div className="space-y-3.5 mb-10">
                <div className="h-4 bg-neutral-200/70 dark:bg-neutral-800/70 rounded w-full animate-pulse" />
                <div className="h-4 bg-neutral-200/70 dark:bg-neutral-800/70 rounded w-[96%] animate-pulse" />
                <div className="h-4 bg-neutral-200/70 dark:bg-neutral-800/70 rounded w-[90%] animate-pulse" />
                <div className="h-4 bg-neutral-200/70 dark:bg-neutral-800/70 rounded w-3/5 animate-pulse" />
              </div>

              {/* 二级标题占位 */}
              <div className="h-6 bg-neutral-200/80 dark:bg-neutral-800/80 rounded w-48 mb-5 animate-pulse" />

              {/* 次段正文占位 */}
              <div className="space-y-3.5 mb-10">
                <div className="h-4 bg-neutral-200/70 dark:bg-neutral-800/70 rounded w-full animate-pulse" />
                <div className="h-4 bg-neutral-200/70 dark:bg-neutral-800/70 rounded w-[92%] animate-pulse" />
                <div className="h-4 bg-neutral-200/70 dark:bg-neutral-800/70 rounded w-4/5 animate-pulse" />
              </div>

              {/* 代码块占位 */}
              <div className="h-48 bg-neutral-200/50 dark:bg-neutral-800/50 rounded-lg w-full animate-pulse" />
            </div>
          </main>
        </motion.div>
      ) : mode === "post" && post ? (
        /* 2. 真实博客正文（平滑淡入） */
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={SMOOTH_TRANSITION}
          className="relative min-h-screen w-full flex flex-col justify-between"
        >
          {/* 左侧固定目录 (支持鼠标悬停正文字体范围淡入淡出，以及点击三条杠常驻，无背景纯净极简) */}
          <aside
            onMouseEnter={handlePointerEnter}
            onMouseLeave={handlePointerLeave}
            className="hidden xl:block fixed top-28 left-6 sm:left-8 w-44 pointer-events-auto z-20"
          >
            <TableOfContents isArticleHovered={isArticleHovered} />
          </aside>

          {/* 主体容器：移除全屏 hover 监听，绝不在两侧留白区域误触发 */}
          <main className="relative z-10 px-6 pt-24 pb-20 sm:px-8 sm:pt-28 flex-1">
            {/* 正文版心：仅当鼠标进入真实文章字体与阅读区域时才触发目录 */}
            <div
              onMouseEnter={handlePointerEnter}
              onMouseLeave={handlePointerLeave}
              className="mx-auto w-full max-w-[65ch]"
            >
              {/* 顶部返回导航 */}
              <div className="mb-6">
                <Link
                  href="/posts"
                  className="group inline-flex items-center gap-1.5 font-mono text-xs text-neutral-400 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white transition-colors cursor-pointer select-none"
                >
                  <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-1" />
                  <span>cd ..</span>
                </Link>
              </div>

              {/* 头部大标题与极简单行日期 */}
              <header className="mb-8">
                <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-bold tracking-tight text-neutral-900 dark:text-[#f4f4f5] leading-[1.2]">
                  {post.title}
                </h1>

                {post.published_at || post.created_at ? (
                  <p className="mt-2 text-sm text-neutral-400 dark:text-neutral-500 opacity-60">
                    {formatDate(post.published_at || post.created_at || "")}
                  </p>
                ) : null}
              </header>

              {/* 正文渲染区 */}
              <article className="post-article min-w-0">
                <LazyPostContent
                  content={post.content || post.summary || ""}
                  isHtml={isHtmlContent}
                />
              </article>

              {/* 标签列表 */}
              {post.tags && (
                <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-black/[0.08] dark:border-white/[0.08] pt-6">
                  <TagIcon className="h-3.5 w-3.5 text-neutral-400 opacity-60" />
                  {(Array.isArray(post.tags)
                    ? post.tags
                    : String(post.tags).split(/[,，\s]+/).filter(Boolean)
                  ).map((tag, index) => (
                    <Link
                      key={`${tag}-${index}`}
                      href={`/posts?tag=${encodeURIComponent(tag)}`}
                      className="text-xs text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}

              {/* 上一篇 / 下一篇 导航 */}
              {(prevPost || nextPost) && (
                <nav className="my-10 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-b border-black/[0.08] dark:border-white/[0.08] py-5">
                  {prevPost ? (
                    <Link
                      href={`/posts/${prevPost.slug || prevPost.id}`}
                      className="group flex flex-col gap-1 text-left transition-colors"
                    >
                      <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                        <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
                        上一篇
                      </span>
                      <span className="text-[14px] text-neutral-800 dark:text-neutral-200 group-hover:text-black dark:group-hover:text-white font-medium line-clamp-1">
                        {prevPost.title}
                      </span>
                    </Link>
                  ) : (
                    <div />
                  )}

                  {nextPost ? (
                    <Link
                      href={`/posts/${nextPost.slug || nextPost.id}`}
                      className="group flex flex-col gap-1 text-right sm:items-end transition-colors"
                    >
                      <span className="text-[11px] text-neutral-400 flex items-center gap-1 justify-end">
                        下一篇
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </span>
                      <span className="text-[14px] text-neutral-800 dark:text-neutral-200 group-hover:text-black dark:group-hover:text-white font-medium line-clamp-1">
                        {nextPost.title}
                      </span>
                    </Link>
                  ) : (
                    <div />
                  )}
                </nav>
              )}

              {/* 底部返回 */}
              <div className="mt-8 mb-4">
                <Link
                  href="/posts"
                  className="group inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
                  <span>cd ..</span>
                </Link>
              </div>

              {/* 评论区 */}
              <div className="mt-12">
                <LazyCommentSection postId={String(post.id)} />
              </div>
            </div>
          </main>
        </motion.div>
      ) : mode === "thought" && thought ? (
        /* 3. 随想录详情 */
        <motion.div
          key="thought"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={SMOOTH_TRANSITION}
          className="relative min-h-screen w-full bg-transparent px-4 pt-24 pb-16 sm:px-8 lg:px-12 antialiased flex flex-col justify-between"
        >
          <main className="mx-auto w-full max-w-[65ch]">
            <header className="mb-10 pl-1">
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-[#f4f4f5] sm:text-4xl">
                思考
              </h1>
              <p className="mt-3 text-2xl text-neutral-500 dark:text-[#8e8e93] tracking-widest">
                感君倾耳。
              </p>
            </header>

            <div className="mb-6 pl-1">
              <Link
                href="/thoughts"
                className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 dark:text-[#71717a] dark:hover:text-[#f4f4f5] transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                返回
              </Link>
            </div>

            <ThoughtDetailClient item={thought} />
          </main>
        </motion.div>
      ) : (
        /* 4. 404 状态 */
        <motion.div
          key="404"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4"
        >
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-white">
            404
          </h1>
          <p className="mt-2 text-sm text-neutral-500">Page Not Found</p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>返回首页</span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}