// src/components/post/DynamicPostReader.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Tag as TagIcon, ArrowLeft, ArrowRight, Menu, Globe, Loader2 } from "lucide-react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import { ThoughtDetailClient } from "@/components/post/ThoughtDetailClient";
import { TableOfContents, TocIcon } from "@/components/post/TableOfContents";
import { ThoughtMediaItem } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/I18nContext";
import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";

// ─── 动态按需加载模块（内联声明，无需额外包装文件） ──────────────
const PostContentWrapper = dynamic(
  () =>
    import("@/components/post/PostContentWrapper").then(
      (m) => m.PostContentWrapper
    ),
  { ssr: true }
);

const CommentSection = dynamic(
  () =>
    import("@/components/post/CommentSection").then((m) => m.CommentSection),
  {
    ssr: false,
    loading: () => null,
  }
);

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
  post_type?: string;
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

  // 多语言与翻译支持
  const { locale, t, convertText } = useI18n();
  const [isTranslated, setIsTranslated] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translatedTitle, setTranslatedTitle] = useState("");
  const [translatedContent, setTranslatedContent] = useState("");

  // 判断当前文章是否为 RSS 外部聚合文章（评论区仅在博主个人原创文章展示，RSS 聚合文章彻底不出现）
  const isRssArticle = useMemo(() => {
    if (!post) return false;
    if (post.post_type === "rss") return true;
    if (post.slug?.startsWith("rss-")) return true;
    if (post.source === "RSS 聚合" || post.source === "RSS") return true;
    if (post.category?.toLowerCase() === "rss") return true;
    if (Array.isArray(post.tags)) {
      return post.tags.some(
        (t) => typeof t === "string" && t.trim().toLowerCase() === "rss"
      );
    }
    if (typeof post.tags === "string" && post.tags.toLowerCase().includes("rss")) {
      return true;
    }
    return false;
  }, [post]);

  // 当文章或全站语言切换时重置或读取缓存
  useEffect(() => {
    if (!post) return;
    if (locale === "zh-CN" || locale === "zh-TW") {
      setIsTranslated(false);
      return;
    }

    // 检查本地缓存
    try {
      const cacheKey = `blog_trans_${post.id}_${locale}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        setTranslatedTitle(parsed.title || "");
        setTranslatedContent(parsed.content || "");
        setIsTranslated(true);
        return;
      }
    } catch {}

    setIsTranslated(false);
  }, [post?.id, locale]);

  // 触发翻译
  const handleToggleTranslate = async () => {
    if (!post) return;
    if (isTranslated) {
      setIsTranslated(false);
      return;
    }

    if (translatedTitle && translatedContent) {
      setIsTranslated(true);
      return;
    }

    setTranslating(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: post.title,
          text: post.content || post.summary || "",
          targetLang: locale,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const tTitle = data.translatedTitle || post.title;
        const tContent = data.translated || post.content || "";
        setTranslatedTitle(tTitle);
        setTranslatedContent(tContent);
        setIsTranslated(true);

        try {
          sessionStorage.setItem(
            `blog_trans_${post.id}_${locale}`,
            JSON.stringify({ title: tTitle, content: tContent })
          );
        } catch {}
      }
    } catch (e) {
      console.error("[Translation error]:", e);
    } finally {
      setTranslating(false);
    }
  };

  // 计算展示标题（正體中文自动 OpenCC 纯离线秒转，外语在开启翻译时展示译文）
  const displayTitle = useMemo(() => {
    if (!post) return "";
    if (locale === "zh-TW") return convertText(post.title);
    if (isTranslated && translatedTitle) return translatedTitle;
    return post.title;
  }, [post, locale, isTranslated, translatedTitle, convertText]);

  // 计算展示正文
  const rawContent = post?.content || post?.summary || "";
  const displayContent = useMemo(() => {
    if (!post) return "";
    let content = rawContent;
    if (locale === "zh-TW") content = convertText(rawContent);
    else if (isTranslated && translatedContent) content = translatedContent;
    
    // 智能剥离正文开篇与主标题重复的 Markdown # 一级标题，杜绝首屏双标题堆叠
    return content.replace(/^\s*#\s+[^\n]+(?:\r?\n)+/, "");
  }, [post, locale, isTranslated, translatedContent, rawContent, convertText]);

  // 智能检测文章内容是否为 HTML 富文本 (自适应支持 RSS 抓取的文章与原生 Markdown)
  const isHtmlContent = React.useMemo(() => {
    if (!post) return false;
    const raw = (displayContent || "").trim();
    return /<\/?(p|div|h[1-6]|article|section|blockquote|pre|code|table|ul|ol|li|html|body|a)\b/i.test(raw);
  }, [post, displayContent]);

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
          {/* 左侧固定 TOC 骨架：首屏直接占位，防止后续闪烁 (20px 对齐，距离 Logo 底部 24px) */}
          <aside className="hidden xl:block fixed top-[82px] left-5 w-44 pointer-events-none opacity-40 select-none">
            <div className="mb-3.5 flex items-center justify-start bg-transparent p-0 text-neutral-400 dark:text-neutral-500">
              <TocIcon className="w-[18px] h-[18px]" />
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
          {/* Grid 居中贴边布局 (100% 严格对称大局观：左边 Logo 与目录 20px，右边导航栏 20px，中间正文绝对居中) */}
          <div className="w-full grid grid-cols-1 xl:grid-cols-[1fr_minmax(auto,720px)_1fr] px-5 pt-[82px]">
            
            {/* 左侧：目录 (其最左侧与顶部 Logo 严格同轴对齐，距最左侧 20px，距 Logo 底部 24px) */}
            <div className="hidden xl:block relative">
              <aside
                className="sticky top-[82px] w-[200px] 2xl:w-[260px] flex flex-col"
                onPointerEnter={handlePointerEnter}
                onPointerLeave={handlePointerLeave}
              >
                <TableOfContents isArticleHovered={isArticleHovered} />
              </aside>
            </div>

            {/* 中间：正文主阅读列 (绝对居中，距屏幕两边留白绝对均等) */}
            <main
              className="relative z-10 w-full min-w-0 pb-20 pt-8 sm:pt-10"
              onPointerEnter={handlePointerEnter}
              onPointerLeave={handlePointerLeave}
            >
              
              <header className="mb-7 relative">
                <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-bold tracking-tight text-neutral-900 dark:text-neutral-50 leading-[1.35] font-sans relative inline-block">
                  {displayTitle}
                </h1>
                
                <div className="mt-2 text-[13px] text-neutral-500 dark:text-neutral-400 font-sans">
                  {(post.published_at || post.created_at) && (
                    <span>
                      {new Date(post.published_at || post.created_at || "").toLocaleDateString("zh-CN", { month: "long", day: "numeric" })}
                    </span>
                  )}
                </div>
              </header>

              {/* Innei 同款 AI 翻译提示栏 (当访问者语言为外语 en / ja / ko 时优雅呈现) */}
              {locale !== "zh-CN" && locale !== "zh-TW" && (
                <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-black/[0.06] bg-neutral-50/80 px-4 py-2.5 text-xs text-neutral-600 dark:border-white/[0.08] dark:bg-neutral-900/60 dark:text-neutral-400">
                  <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-neutral-500" />
                    <span>
                      {t("article.ai_translation")} · {t("article.original_lang")} ➔{" "}
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">
                        {SUPPORTED_LOCALES.find((l) => l.id === locale)?.label}
                      </span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleTranslate}
                    disabled={translating}
                    className="inline-flex items-center gap-1.5 rounded-md bg-neutral-200/80 px-3 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {translating ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>{t("article.translating")}</span>
                      </>
                    ) : isTranslated ? (
                      <span>{t("article.view_original")}</span>
                    ) : (
                      <span>{t("article.view_translation")}</span>
                    )}
                  </button>
                </div>
              )}

              {/* 正文渲染区 */}
              <article className="post-article min-w-0 font-sans" style={{ fontSize: "1.0625rem", lineHeight: "1.85", letterSpacing: "normal" }}>
                <PostContentWrapper
                  content={displayContent}
                  isHtml={isHtmlContent}
                />
              </article>

              {/* 上下一篇导航 */}
              <div>
                {(prevPost || nextPost) && (
                  <nav className="my-16 grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-black/[0.08] dark:border-white/[0.08] pt-8">
                    {prevPost ? (
                      <Link
                         href={`/posts/${prevPost.slug || prevPost.id}`}
                         className="group flex flex-col gap-2 text-left transition-colors"
                       >
                         <span className="text-[11px] text-neutral-400 dark:text-[#777168] flex items-center gap-1 group-hover:text-black dark:group-hover:text-white transition-colors">
                           <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
                           {locale === "zh-TW" ? "上一篇" : locale === "en" ? "Previous" : locale === "ja" ? "前の記事" : locale === "ko" ? "이전 글" : "上一篇"}
                         </span>
                         <span className="text-[15px] font-serif font-bold text-neutral-700 dark:text-neutral-300 group-hover:text-black dark:group-hover:text-white line-clamp-2 transition-colors">
                           {locale === "zh-TW" ? convertText(prevPost.title) : prevPost.title}
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
                         <span className="text-[11px] text-neutral-400 dark:text-[#777168] flex items-center gap-1 justify-end group-hover:text-black dark:group-hover:text-white transition-colors">
                           {locale === "zh-TW" ? "下一篇" : locale === "en" ? "Next" : locale === "ja" ? "次の記事" : locale === "ko" ? "다음 글" : "下一篇"}
                           <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                         </span>
                         <span className="text-[15px] font-serif font-bold text-neutral-700 dark:text-neutral-300 group-hover:text-black dark:group-hover:text-white line-clamp-2 transition-colors">
                           {locale === "zh-TW" ? convertText(nextPost.title) : nextPost.title}
                         </span>
                       </Link>
                    ) : (
                      <div />
                    )}
                  </nav>
                )}
              </div>

              {/* 评论区：仅在博主个人原创文章中展现，RSS 聚合文章彻底不出现 */}
              {!isRssArticle && (
                <div className="mt-20">
                  <CommentSection postId={String(post.id)} />
                </div>
              )}
            </main>

            {/* 右侧：空白占位，确保正文绝对居中 */}
            <div className="hidden xl:block"></div>
            
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