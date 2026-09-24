// src/components/post/DynamicPostReader.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import { ThoughtDetailClient } from "@/components/post/ThoughtDetailClient";
import { TableOfContents, TocIcon } from "@/components/post/TableOfContents";
import { ThoughtMediaItem } from "@/lib/data";
import { useI18n } from "@/lib/i18n/I18nContext";
import { calculateReadTime } from "@/lib/utils";

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
  cover_image?: string;
  status?: string;
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
  // 数据由服务端注入，无需客户端 loading 等待；若无 initialPost 则客户端首屏展示仿真骨架屏
  const [loading, setLoading] = useState(!initialPost);
  const [post, setPost] = useState<PostDetail | null>(initialPost || null);
  const [thought, setThought] = useState<ThoughtMediaItem | null>(null);
  const [mode, setMode] = useState<"post" | "thought" | "404">(
    initialPost ? "post" : "post"
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

  // 计算展示正文（正體中文自动 OpenCC 纯离线秒转）
  const displayContent = useMemo(() => {
    if (!post) return "";
    let content = rawContent;
    if (globalLocale === "zh-TW") {
      content = convertText(rawContent);
    }
    
    // 智能剥离正文开篇与主标题重复的 Markdown # 一级标题（支持 # 后面有无空格），杜绝首屏双标题堆叠
    return content.replace(/^\s*#\s*[^\n]+(?:\r?\n)+/, "");
  }, [post, globalLocale, rawContent, convertText]);

  // 估算文章阅读耗时
  const readTime = useMemo(() => {
    if (!displayContent) return null;
    return calculateReadTime(displayContent);
  }, [displayContent]);

  // 智能检测文章内容是否为 HTML 富文本 (自适应支持 RSS 抓取的文章与原生 Markdown)
  const isHtmlContent = React.useMemo(() => {
    if (!post) return false;
    const raw = (displayContent || "").trim();
    return /<\/?(p|div|h[1-6]|article|section|blockquote|pre|code|table|ul|ol|li|html|body|a)\b/i.test(raw);
  }, [post, displayContent]);

  // 当 initialPost 或路由变化时同步数据，并开启 SWR 毫秒级后台静默比对
  useEffect(() => {
    const workerUrl =
      process.env.NEXT_PUBLIC_NOTION_WORKER_URL ||
      "https://api.vinceou.site";

    // 1. 如果已有服务端直出的 initialPost，优先瞬间渲染（0 毫秒首屏，秒开无白屏）
    if (initialPost) {
      let initialData = initialPost;
      try {
        const cached = sessionStorage.getItem(`ow_post_detail_${initialPost.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.title) {
            initialData = { ...initialPost, ...parsed };
          }
        }
      } catch {}

      setPost(initialData);
      setMode("post");
      setLoading(false);

      // 2. SWR (Stale-While-Revalidate)：后台静默对比 Notion 最新修改（免重新部署）
      const targetId = initialPost.id;
      if (targetId) {
        fetch(`${workerUrl}/api/posts/${targetId}`)
          .then((res) => {
            if (!res.ok) throw new Error("Fetch failed");
            return res.json();
          })
          .then((detailData) => {
            if (detailData?.success && detailData.data) {
              const latest = detailData.data;
              const isPub =
                latest.status?.includes("已发布") ||
                latest.status?.includes("Published") ||
                latest.status?.includes("🚀") ||
                latest.status?.includes("✅");

              // 如果在 Notion 中被取消发布（改为草稿或归档），前端自动降级为 404
              if (!isPub) {
                setPost(null);
                setMode("404");
                return;
              }

              // 对比是否有实质内容或标题变更，有变更才平滑触发更新
              setPost((current) => {
                if (!current) return latest;
                const isChanged =
                  latest.content !== current.content ||
                  latest.title !== current.title ||
                  latest.summary !== current.summary ||
                  latest.category !== current.category ||
                  latest.cover_image !== current.cover_image ||
                  JSON.stringify(latest.tags) !== JSON.stringify(current.tags);

                if (isChanged) {
                  try {
                    sessionStorage.setItem(`ow_post_detail_${targetId}`, JSON.stringify(latest));
                  } catch {}
                  return {
                    ...current,
                    ...latest,
                    slug: current.slug || latest.slug,
                    source_url: current.source_url || latest.source_url,
                  };
                }
                return current;
              });
            }
          })
          .catch(() => {
            // 容灾机制：网络异常或超时静默忽略，维持 initialPost 正常展示
          });
      }
      return;
    }

    // 3. 兜底：没有 initialPost（例如客户端动态路由或 404 回退渲染）
    if (typeof window === "undefined") return;
    const pathname = window.location.pathname;
    const matchThought = pathname.match(/\/thoughts\/([^\/\?#]+)/);
    const matchPost = pathname.match(/\/posts\/([^\/\?#]+)/);

    if (matchThought) {
      const id = matchThought[1];
      setMode("thought");
      setLoading(true);
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
    } else if (matchPost) {
      const slug = decodeURIComponent(matchPost[1]);
      setMode("post");
      setLoading(true);

      // 动态检索 Notion 唯一数据源
      fetch(`${workerUrl}/api/posts`)
        .then((res) => res.json())
        .then(async (result) => {
          if (result?.success && Array.isArray(result.data)) {
            const matched = result.data.find(
              (p: any) =>
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
              const detailData = await detailRes.json();
              if (detailData?.success && detailData.data) {
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
    } else {
      // 没有 initialPost 且不是 /thoughts 或 /posts 路由，直接 404
      setLoading(false);
      setMode("404");
    }
  }, [initialPost]);

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
                <TableOfContents
                  key={`${post.id}_${globalLocale}`}
                  isArticleHovered={isArticleHovered}
                  contentKey={`${displayTitle}_${(displayContent || "").slice(0, 80)}_${globalLocale}`}
                  locale={globalLocale}
                />
              </aside>
            </div>

            {/* 中间：正文主阅读列 (绝对居中，距屏幕两边留白绝对均等) */}
            <main
              className="relative z-10 w-full min-w-0 pb-20 pt-8 sm:pt-10"
              onPointerEnter={handlePointerEnter}
              onPointerLeave={handlePointerLeave}
            >
              
              <header className="mb-8 relative">
                <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-extrabold tracking-tight text-black dark:text-white leading-[1.15] font-sans relative inline-block">
                  {displayTitle}
                </h1>
                
                <div className="mt-3 flex items-center justify-between text-[13px] text-neutral-500 dark:text-neutral-400 font-sans opacity-60">
                  <div className="flex items-center gap-2">
                    {(post.published_at || post.created_at) && (
                      <span>
                        {new Date(post.published_at || post.created_at || "").toLocaleDateString(
                          globalLocale === "zh-TW" ? "zh-TW" : globalLocale === "en" ? "en-US" : globalLocale === "ja" ? "ja-JP" : globalLocale === "ko" ? "ko-KR" : "zh-CN",
                          { month: "long", day: "numeric", year: "numeric" }
                        )}
                      </span>
                    )}
                    {readTime && (
                      <span className="opacity-75">
                        · {readTime} {globalLocale === "en" ? "min" : "分钟"}
                      </span>
                    )}
                  </div>
                </div>
              </header>

              {/* 正文渲染区 (标准语义 lang 属性，助力 Chrome/Safari/Edge 浏览器原生秒翻) */}
              <article
                lang={isSourceZh ? "zh-CN" : "en"}
                className="post-article min-w-0 font-sans"
                style={{ fontSize: "1rem", lineHeight: "1.75", letterSpacing: "normal" }}
              >
                <PostContentWrapper
                  content={displayContent}
                  isHtml={isHtmlContent}
                  locale={globalLocale}
                />
              </article>

              {/* 返回文章列表 cd .. (Anthony Fu 同款经典风格) */}
              <div className="mt-10 sm:mt-12 mb-4">
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

              {/* 上下一篇导航 */}
              <div>
                {(prevPost || nextPost) && (
                  <nav className="my-16 grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-black/[0.08] dark:border-white/[0.08] pt-8">
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
              </div>

              {/* 评论区 */}
              <div className="mt-20">
                <CommentSection postId={String(post.id)} locale={globalLocale} />
              </div>
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