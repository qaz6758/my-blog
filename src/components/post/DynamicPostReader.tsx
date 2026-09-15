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
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={SMOOTH_TRANSITION}
          className="relative min-h-screen w-full flex flex-col items-center justify-between"
        >
          {/* 三栏布局容器 */}
          <div className="mx-auto flex max-w-[1360px] w-full justify-center px-4 sm:px-6 xl:px-8">
            
            {/* 左侧：辅助信息轨道 (文章信息 + 上下一篇) */}
            <aside className="hidden xl:flex w-[260px] flex-col shrink-0 sticky top-32 h-[calc(100vh-128px)] overflow-y-auto pr-10 pt-2">
              <div className="space-y-10">
                {/* 返回文章列表 */}
                <div>
                  <Link
                    href="/posts"
                    className="group inline-flex items-center gap-1.5 font-mono text-xs text-neutral-400 hover:text-neutral-900 dark:text-[#777168] dark:hover:text-[#eae5dc] transition-colors cursor-pointer select-none"
                    title="返回文章列表"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                    <span>cd ..</span>
                  </Link>
                </div>

                {/* 文章信息块 */}
                <div className="space-y-6">
                  {post.category && (
                    <div className="text-xs text-neutral-500 dark:text-[#9d9589] tracking-wider mb-2">
                      {post.category}
                    </div>
                  )}
                  
                  <div className="space-y-3 font-mono text-xs text-neutral-400 dark:text-[#777168]">
                    {/* {post.pinned && <div className="flex items-center gap-2"><span className="text-neutral-500">📌</span> 置顶</div>} */}
                    {(post.published_at || post.created_at) && (
                      <div className="flex items-center gap-2">
                        <span>{formatDate(post.published_at || post.created_at || "").replace(/-/g, '.')}</span>
                      </div>
                    )}
                    {/* Mock reading time */}
                    <div className="flex items-center gap-2">
                      <span>8 min read</span>
                    </div>
                  </div>

                  {post.tags && (
                    <div className="pt-2">
                      <div className="text-xs text-neutral-400 dark:text-[#777168] mb-3">标签</div>
                      <div className="flex flex-wrap items-center gap-2">
                        {(Array.isArray(post.tags)
                          ? post.tags
                          : String(post.tags).split(/[,，\s]+/).filter(Boolean)
                        ).map((tag, index) => (
                          <Link
                            key={`${tag}-${index}`}
                            href={`/posts?tag=${encodeURIComponent(tag)}`}
                            className="text-xs text-neutral-500 hover:text-[#b91c1c] dark:text-[#9d9589] dark:hover:text-white transition-colors"
                          >
                            #{tag}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 上下一篇导航 */}
                <nav className="flex flex-col gap-8 pt-6 border-t border-black/[0.04] dark:border-white/[0.04]">
                  {prevPost && (
                    <Link
                      href={`/posts/${prevPost.slug || prevPost.id}`}
                      className="group flex flex-col gap-2 transition-colors"
                    >
                      <span className="text-[11px] text-neutral-400 dark:text-[#777168] flex items-center gap-1 group-hover:text-[#b91c1c] dark:group-hover:text-white transition-colors">
                        <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
                        上一篇
                      </span>
                      <span className="text-[13px] text-neutral-700 dark:text-neutral-300 group-hover:text-[#b91c1c] dark:group-hover:text-white font-medium line-clamp-2 leading-relaxed transition-colors">
                        {prevPost.title}
                      </span>
                    </Link>
                  )}
                  {nextPost && (
                    <Link
                      href={`/posts/${nextPost.slug || nextPost.id}`}
                      className="group flex flex-col gap-2 transition-colors"
                    >
                      <span className="text-[11px] text-neutral-400 dark:text-[#777168] flex items-center gap-1 group-hover:text-[#b91c1c] dark:group-hover:text-white transition-colors">
                        下一篇
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </span>
                      <span className="text-[13px] text-neutral-700 dark:text-neutral-300 group-hover:text-[#b91c1c] dark:group-hover:text-white font-medium line-clamp-2 leading-relaxed transition-colors">
                        {nextPost.title}
                      </span>
                    </Link>
                  )}
                </nav>
              </div>
            </aside>

            {/* 中间：正文绝对中心 (760px - 820px) */}
            <main className="relative z-10 w-full max-w-[780px] shrink-0 pt-24 pb-20 px-0 sm:px-6">
              
              {/* 头部大标题与极简单行日期（移动端显示信息） */}
              <header className="mb-14 relative">
                {/* 移动端返回导航 */}
                <div className="xl:hidden mb-6">
                  <Link
                    href="/posts"
                    className="group inline-flex items-center gap-1.5 font-mono text-xs text-neutral-400 hover:text-neutral-900 dark:text-[#777168] dark:hover:text-[#eae5dc] transition-colors cursor-pointer select-none"
                    title="返回文章列表"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                    <span>cd ..</span>
                  </Link>
                </div>
                
                <div className="xl:hidden text-xs text-neutral-500 dark:text-[#9d9589] tracking-wider mb-4">
                  <span>{post.category || "思考与技术"}</span>
                </div>
                
                <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-bold tracking-tight text-[#292623] dark:text-[#eae5dc] leading-[1.3] font-serif relative inline-block">
                  {post.title}
                </h1>
                
                {/* 移动端辅助信息 */}
                <div className="xl:hidden mt-6 flex flex-wrap items-center gap-3 text-xs font-mono text-neutral-400 dark:text-[#777168]">
                  {(post.published_at || post.created_at) && (
                    <span>{formatDate(post.published_at || post.created_at || "").replace(/-/g, '.')}</span>
                  )}
                  <span className="opacity-40">·</span>
                  <span>8 min read</span>
                </div>
              </header>

              {/* 正文渲染区 */}
              <article className="post-article min-w-0 font-serif" style={{ fontSize: "1.125rem", lineHeight: "2", letterSpacing: "normal" }}>
                <LazyPostContent
                  content={post.content || post.summary || ""}
                  isHtml={isHtmlContent}
                />
              </article>

              {/* 移动端上下一篇 导航 */}
              <div className="xl:hidden">
                {(prevPost || nextPost) && (
                  <nav className="my-16 grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-black/[0.08] dark:border-white/[0.08] pt-8">
                    {prevPost ? (
                      <Link
                        href={`/posts/${prevPost.slug || prevPost.id}`}
                        className="group flex flex-col gap-2 text-left transition-colors"
                      >
                        <span className="text-[11px] text-neutral-400 dark:text-[#777168] flex items-center gap-1 group-hover:text-[#b91c1c] dark:group-hover:text-white transition-colors">
                          <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
                          上一篇
                        </span>
                        <span className="text-[14px] text-neutral-700 dark:text-neutral-300 group-hover:text-[#b91c1c] dark:group-hover:text-white font-medium line-clamp-1 transition-colors">
                          {prevPost.title}
                        </span>
                      </Link>
                    ) : (
                      <div />
                    )}

                    {nextPost ? (
                      <Link
                        href={`/posts/${nextPost.slug || nextPost.id}`}
                        className="group flex flex-col gap-2 text-right sm:items-end transition-colors"
                      >
                        <span className="text-[11px] text-neutral-400 dark:text-[#777168] flex items-center gap-1 justify-end group-hover:text-[#b91c1c] dark:group-hover:text-white transition-colors">
                          下一篇
                          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                        </span>
                        <span className="text-[14px] text-neutral-700 dark:text-neutral-300 group-hover:text-[#b91c1c] dark:group-hover:text-white font-medium line-clamp-1 transition-colors">
                          {nextPost.title}
                        </span>
                      </Link>
                    ) : (
                      <div />
                    )}
                  </nav>
                )}
              </div>

              {/* 评论区 */}
              <div className="mt-20">
                <LazyCommentSection postId={String(post.id)} />
              </div>
            </main>

            {/* 右侧：目录与阅读进度 */}
            <aside className="hidden xl:flex w-[260px] flex-col shrink-0 sticky top-32 h-[calc(100vh-128px)] overflow-y-auto pl-12 pt-2">
              <TableOfContents />
            </aside>
            
          </div>
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
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-[#eae5dc] sm:text-4xl">
                思考
              </h1>
              <p className="mt-3 text-2xl text-neutral-500 dark:text-[#777168] tracking-widest">
                感君倾耳。
              </p>
            </header>

            <div className="mb-6 pl-1">
              <Link
                href="/thoughts"
                className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-[#b91c1c] dark:text-[#9d9589] dark:hover:text-white transition-colors"
                style={{ transitionDuration: "var(--realm-motion-duration)", transitionTimingFunction: "var(--realm-motion-ease)" }}
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