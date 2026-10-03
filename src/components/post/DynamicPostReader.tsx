// src/components/post/DynamicPostReader.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight, Lightbulb } from "lucide-react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import { ThoughtDetailClient } from "@/components/post/ThoughtDetailClient";
import { TableOfContents } from "@/components/post/TableOfContents";
import { ThoughtMediaItem } from "@/lib/data";
import { useI18n } from "@/lib/i18n/I18nContext";
import { calculateReadTime, formatDate } from "@/lib/utils";

import { PostContentWrapper } from "@/components/post/PostContentWrapper";

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
  cover_image?: string;
  status?: string;
  is_pinned?: boolean | null;
  inspiration?: string;
  inspiration_url?: string;
  read_time?: number | null;
}

interface WorkerPost {
  id: string;
  slug?: string;
  source_url?: string;
  status?: string;
}

function isWorkerPost(value: unknown): value is WorkerPost {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string"
  );
}

function isPostDetail(value: unknown): value is PostDetail {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "title" in value &&
    typeof value.title === "string"
  );
}

function isThoughtMediaItem(value: unknown): value is ThoughtMediaItem {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "title" in value &&
    typeof value.title === "string" &&
    "author" in value &&
    typeof value.author === "string"
  );
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
  const pathname = usePathname();
  const isPostFallback = pathname?.startsWith("/posts/") ?? false;
  const isThoughtFallback = pathname?.startsWith("/thoughts/") ?? false;
  // 数据由服务端注入，无需客户端 loading 等待；若无 initialPost 则客户端首屏展示仿真骨架屏
  const [loading, setLoading] = useState(
    !initialPost && (isPostFallback || isThoughtFallback)
  );
  const [post, setPost] = useState<PostDetail | null>(initialPost || null);
  const [thought, setThought] = useState<ThoughtMediaItem | null>(null);
  const [mode, setMode] = useState<"post" | "thought" | "404">(
    initialPost || isPostFallback ? "post" : isThoughtFallback ? "thought" : "404"
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

  // 多语言与文案转换（全局设置，正體中文由 OpenCC 客户端秒转）
  const { locale: globalLocale, convertText } = useI18n();


  const rawContent = post?.content || post?.summary || "";
  const postTitle = post?.title || "";

  // 智能检测文章自身的源语种（通过中文字符采样判断：超过 15 个汉字判定为中文源，否则判定为英文/外文源，供 HTML 语义 lang 属性识别，激活浏览器原生翻译）
  const isSourceZh = useMemo(() => {
    if (!post) return true;
    const sample = (postTitle + " " + rawContent.slice(0, 1000));
    const zhCount = (sample.match(/[\u4e00-\u9fa5]/g) || []).length;
    return zhCount > 15;
  }, [post, postTitle, rawContent]);

  // 计算展示标题（正體中文自动 OpenCC 纯离线秒转）
  const displayTitle = useMemo(() => {
    if (!post) return "";
    if (globalLocale === "zh-TW") return convertText(post.title);
    return post.title;
  }, [post, globalLocale, convertText]);

  // 确保浏览器标签页与窗口标题始终与当前文章标题保持精准同步
  useEffect(() => {
    if (displayTitle) {
      document.title = displayTitle;
    }
  }, [displayTitle]);

  // 计算展示正文（正體中文自动 OpenCC 纯离线秒转）
  const displayContent = useMemo(() => {
    if (!post) return "";
    let content = rawContent;
    if (globalLocale === "zh-TW") {
      content = convertText(rawContent);
    }
    
    // 1. 智能剥离正文开篇与主标题重复的 Markdown # 一级标题（支持 # 后面有无空格），杜绝首屏双标题堆叠
    content = content.replace(/^\s*#\s*[^\n]+(?:\r?\n)+/, "").trim();

    // 2. 智能剥离正文开篇与顶部“创意和灵感来源”重复的引用导言（杜绝图文双重堆叠）
    if (post.inspiration) {
      const normInsp = post.inspiration.replace(/[\s\p{P}]/gu, "");
      const matchQuote = content.match(/^\s*>\s*([^\n]+)(?:\r?\n)*/);
      if (matchQuote) {
        const quoteText = matchQuote[1].replace(/[\s\p{P}]/gu, "");
        // 如果开篇引用文字与灵感来源高度相似（前6字匹配或互相包含），判定为重复导言，予以剥离
        if (
          (normInsp.length >= 6 && quoteText.length >= 6 && normInsp.slice(0, 6) === quoteText.slice(0, 6)) ||
          (normInsp.length >= 8 && quoteText.includes(normInsp.slice(0, 8))) ||
          (quoteText.length >= 8 && normInsp.includes(quoteText.slice(0, 8)))
        ) {
          content = content.replace(/^\s*>\s*[^\n]+(?:\r?\n)*/, "").trim();
        }
      }
    }

    return content;
  }, [post, globalLocale, rawContent, convertText]);

  // 估算文章阅读耗时
  const readTime = useMemo(() => {
    if (!displayContent) return post?.read_time || null;
    return calculateReadTime(displayContent);
  }, [displayContent, post]);

  // 智能检测文章内容是否为 HTML 富文本 (自适应支持 RSS 抓取的文章与原生 Markdown)
  const isHtmlContent = React.useMemo(() => {
    if (!post) return false;
    const raw = (displayContent || "").trim();
    return /<\/?(p|div|h[1-6]|article|section|blockquote|pre|code|table|ul|ol|li|html|body|a)\b/i.test(raw);
  }, [post, displayContent]);

function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .trim();
}

  // 当 initialPost 或路由变化时同步数据，并开启 SWR 毫秒级后台静默比对
  useEffect(() => {
    const workerUrl =
      process.env.NEXT_PUBLIC_NOTION_WORKER_URL ||
      "https://api.vinceou.site";

    // 1. 服务端文章已由 state initializer 渲染；这里只进行后台校验。
    if (initialPost) {
      // 开启 SWR 后台静默校验：短延时（300ms）执行，迅速校准后台修改，杜绝数秒后阅读时突兀跳变
      const rawId = String(initialPost.id || "").replace(/-/g, "");
      const cleanTargetId = rawId.length === 32 ? rawId : undefined;
      if (!cleanTargetId) return;

      const swrTimer = setTimeout(() => {
        fetch(`${workerUrl}/api/posts/${cleanTargetId}`)
          .then((res) => {
            if (!res.ok) throw new Error("Worker fetch failed");
            return res.json();
          })
          .then((detailData) => {
            if (detailData?.success && detailData.data && detailData.data.content) {
              const fresh = detailData.data as PostDetail;
              setPost((prev) => {
                if (!prev) return fresh;
                const prevContent = normalizeText(prev.content || "");
                const freshContent = normalizeText(fresh.content || "");
                const prevTitle = (prev.title || "").trim();
                const freshTitle = (fresh.title || "").trim();

                // 仅当正文或标题发生实质性变化时触发静默更新（过滤换行/空格差异，杜绝无谓 re-render 与二次进场动画）
                if (prevContent !== freshContent || prevTitle !== freshTitle) {
                  return {
                    ...prev,
                    ...fresh,
                    // 继承已有权威字段
                    is_pinned: prev.is_pinned ?? fresh.is_pinned,
                    inspiration: fresh.inspiration || prev.inspiration,
                    inspiration_url: fresh.inspiration_url || prev.inspiration_url,
                  };
                }
                return prev;
              });
            }
          })
          .catch(() => {});
      }, 300);

      return () => clearTimeout(swrTimer);
    }

    // 3. 兜底：没有 initialPost（例如客户端动态路由或 404 回退渲染）
    if (typeof window === "undefined") return;
    const currentPath = window.location.pathname;
    const matchThought = currentPath.match(/\/thoughts\/([^\/\?#]+)/);
    const matchPost = currentPath.match(/\/posts\/([^\/\?#]+)/);

    if (matchThought) {
      const id = matchThought[1];
      fetch(`${workerUrl}/api/thoughts/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Not found");
          return res.json();
        })
        .then((data: unknown) => {
          if (
            typeof data === "object" &&
            data !== null &&
            "success" in data &&
            data.success === true &&
            "data" in data &&
            isThoughtMediaItem(data.data)
          ) {
            setThought(data.data);
          } else {
            setThought(null);
          }
        })
        .catch(() => setThought(null))
        .finally(() => setLoading(false));
    } else if (matchPost) {
      const slug = decodeURIComponent(matchPost[1]);

      // 动态检索 Notion 唯一数据源
      fetch(`${workerUrl}/api/posts`)
        .then((res) => res.json())
        .then(async (result: unknown) => {
          if (
            typeof result === "object" &&
            result !== null &&
            "success" in result &&
            result.success === true &&
            "data" in result &&
            Array.isArray(result.data)
          ) {
            const matched = result.data.filter(isWorkerPost).find(
              (p) =>
                p.slug === slug ||
                p.id === slug ||
                p.source_url === slug ||
                p.source_url === `/posts/${slug}` ||
                p.source_url?.replace(/^\/posts\//, "") === slug ||
                p.id?.replace(/-/g, "") === slug.replace(/-/g, "")
            );
            if (
              matched &&
              (matched.status?.includes("已发布") ||
                matched.status?.includes("Published") ||
                matched.status?.includes("🚀") ||
                matched.status?.includes("✅"))
            ) {
              const detailRes = await fetch(`${workerUrl}/api/posts/${matched.id}`);
              const detailData: unknown = await detailRes.json();
              if (
                typeof detailData === "object" &&
                detailData !== null &&
                "success" in detailData &&
                detailData.success === true &&
                "data" in detailData &&
                isPostDetail(detailData.data)
              ) {
                setPost(detailData.data);
                return;
              }
            }
          }
          setPost(null);
          setMode("404");
        })
        .catch(() => {
          setPost(null);
          setMode("404");
        })
        .finally(() => setLoading(false));
    }
  }, [initialPost, pathname]);

  return (
    <AnimatePresence>
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
          {/* 左侧固定 TOC 骨架：保持占位空间，但不预置图标（无标题文章 100% 隐藏，杜绝闪烁跳变） */}
          <aside className="hidden xl:block fixed top-[88px] left-8 w-44 pointer-events-none opacity-40 select-none" />

          {/* 正文版心骨架 */}
          <main className="relative z-10 px-6 pt-24 pb-28 sm:pb-36 lg:pb-40 sm:px-8 sm:pt-28 flex-1">
            <div className="mx-auto w-full max-w-[620px]">
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
          className="relative w-full flex flex-col items-center"
        >
          {/* Grid 居中贴边布局 (100% 严格对称大局观：左边 Logo 与目录 32px，右边导航栏 32px，中间正文绝对居中，620px 与页脚严格同轴垂直对齐) */}
          <div className="w-full grid grid-cols-1 xl:grid-cols-[1fr_minmax(auto,620px)_1fr] px-6 sm:px-8 pt-[88px]">
            
            {/* 左侧：目录 (其最左侧与顶部 Logo 严格同轴对齐，距最左侧 32px，距 Logo 底部 28px 呼吸留白) */}
            <div className="hidden xl:block relative">
              <aside
                className="sticky top-[88px] w-[220px] 2xl:w-[280px] flex flex-col"
                onPointerEnter={handlePointerEnter}
                onPointerLeave={handlePointerLeave}
              >
                <TableOfContents
                  key={`${post.id}_${globalLocale}`}
                  isArticleHovered={isArticleHovered}
                  contentKey={`${displayTitle}_${displayContent}_${globalLocale}`}
                  locale={globalLocale}
                />
              </aside>
            </div>

            {/* 中间：正文主阅读列 (绝对居中，620px 黄金阅读宽，与全站页脚严格垂直同轴对齐，距屏幕两边留白绝对均等，与页脚建立通透呼吸感) */}
            <main
              className="relative z-10 w-full max-w-[620px] mx-auto min-w-0 pb-28 sm:pb-36 lg:pb-40 pt-3 sm:pt-4"
              onPointerEnter={handlePointerEnter}
              onPointerLeave={handlePointerLeave}
            >
              
              {/* 标题头部保持静止不动（消除位移动画），正文段落优雅递进滑入 */}
              <header className="mb-5 sm:mb-6 relative">
                <h1 className="text-2xl sm:text-3xl lg:text-[36px] font-bold tracking-tight text-neutral-800 dark:text-neutral-100 leading-[1.15] font-sans relative inline-block">
                  {displayTitle}
                </h1>
                
                <p className="mt-1.5 sm:mt-2 text-[13px] sm:text-[13.5px] text-neutral-500 dark:text-neutral-400 font-sans opacity-50 select-none">
                  {(post.published_at || post.created_at) && (
                    <span>{formatDate(post.published_at || post.created_at)}</span>
                  )}
                  {readTime && (
                    <span>
                      {(post.published_at || post.created_at) ? " · " : ""}
                      {readTime}min
                    </span>
                  )}
                </p>

                {/* 创意和灵感来源专属标识 */}
                {post.inspiration && (
                  <div className="mt-4 border-l-4 border-amber-500/80 dark:border-amber-400/80 pl-3.5 py-0.5 select-text">
                    <div className="flex items-center gap-1.5 text-[13px] font-medium text-amber-600 dark:text-amber-400 mb-0.5 select-none" suppressHydrationWarning>
                      <Lightbulb className="h-3.5 w-3.5 shrink-0 stroke-[2.2]" />
                      <span>{globalLocale === "en" ? "Inspiration & Source" : "创意和灵感来源"}</span>
                    </div>
                    <div className="text-[14px] sm:text-[14.5px] leading-[1.65] text-neutral-600 dark:text-neutral-300 font-sans">
                      {post.inspiration_url ? (
                        <a
                          href={post.inspiration_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline underline-offset-4 decoration-amber-500/40 inline-flex items-center gap-1"
                        >
                          <span>{post.inspiration}</span>
                          <span className="text-[11px] opacity-60">↗</span>
                        </a>
                      ) : (
                        <span>{post.inspiration}</span>
                      )}
                    </div>
                  </div>
                )}
              </header>

              {/* 正文渲染区 (标准语义 lang 属性，助力 Chrome/Safari/Edge 浏览器原生秒翻) */}
              <article
                lang={isSourceZh ? "zh-CN" : "en"}
                className="post-article min-w-0 font-sans"
                style={{ fontSize: "16px", lineHeight: "1.75", letterSpacing: "normal" }}
              >
                <PostContentWrapper
                  content={displayContent}
                  isHtml={isHtmlContent}
                  locale={globalLocale}
                />
              </article>

              {/* 返回文章列表 cd .. (Anthony Fu 同款经典风格) */}
              <div className="mt-12 sm:mt-16 mb-0">
                <Link
                  href="/posts"
                  className="group inline-flex items-center gap-1.5 font-mono text-[14px] text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer select-none"
                >
                  <span className="opacity-50 select-none">&gt;</span>
                  <span className="underline underline-offset-4 decoration-neutral-300 dark:decoration-neutral-700 group-hover:decoration-current">
                    cd ..
                  </span>
                </Link>
              </div>

              {/* 上下一篇导航 (自然收束，与页脚建立舒适的呼吸留白) */}
              {(prevPost || nextPost) && (
                <nav className="mt-12 sm:mt-16 pt-8 border-t border-black/[0.08] dark:border-white/[0.08] grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {prevPost ? (
                    <Link
                       href={`/posts/${prevPost.slug || prevPost.source_url || prevPost.id}`}
                       className="group flex flex-col gap-2 text-left transition-colors"
                     >
                       <span className="text-[11px] text-neutral-400 dark:text-neutral-400 flex items-center gap-1 group-hover:text-black dark:group-hover:text-white transition-colors">
                         <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
                         {globalLocale === "zh-TW" ? "上一篇" : globalLocale === "en" ? "Previous" : globalLocale === "ja" ? "前の記事" : globalLocale === "ko" ? "이전 글" : "上一篇"}
                       </span>
                       <span className="text-[15px] font-serif font-bold text-neutral-700 dark:text-neutral-300 group-hover:text-black dark:group-hover:text-white line-clamp-2 transition-colors">
                         {globalLocale === "zh-TW" ? convertText(prevPost.title) : prevPost.title}
                       </span>
                     </Link>
                  ) : (
                    <div />
                  )}

                  {nextPost ? (
                    <Link
                       href={`/posts/${nextPost.slug || nextPost.source_url || nextPost.id}`}
                       className="group flex flex-col gap-2 text-right sm:items-end transition-colors"
                     >
                       <span className="text-[11px] text-neutral-400 dark:text-neutral-400 flex items-center gap-1 justify-end group-hover:text-black dark:group-hover:text-white transition-colors">
                         {globalLocale === "zh-TW" ? "下一篇" : globalLocale === "en" ? "Next" : globalLocale === "ja" ? "次の記事" : globalLocale === "ko" ? "다음 글" : "下一篇"}
                         <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                       </span>
                       <span className="text-[15px] font-serif font-bold text-neutral-700 dark:text-neutral-300 group-hover:text-black dark:group-hover:text-white line-clamp-2 transition-colors">
                         {globalLocale === "zh-TW" ? convertText(nextPost.title) : nextPost.title}
                       </span>
                     </Link>
                  ) : (
                    <div />
                  )}
                </nav>
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
          <main className="mx-auto w-full max-w-[620px]">
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
            <span>{globalLocale === "en" ? "Back to Home" : "返回首页"}</span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}