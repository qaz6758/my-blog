import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock,
  ExternalLink,
  FolderOpen,
  Tag as TagIcon,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import type { TocItem } from "@/components/post/TableOfContents";
import {
  formatDate,
  slugifyHeading,
  decodeHtmlEntities,
  normalizeTags,
  calculateReadTime,
} from "@/lib/utils";
// ⚡ 懒加载桥接组件 — Prism.js + ReactMarkdown + 评论区 + ToC 均延迟打包
import { LazyPostContent } from "@/components/post/LazyPostContent";
import { LazyCommentSection } from "@/components/post/LazyCommentSection";
import { LazyTableOfContents } from "@/components/post/LazyTableOfContents";
import { Footer } from "@/components/layout/Footer";

import { fetchPostsFromNotion, fetchPostDetailFromNotion } from "@/lib/notion";

interface PostPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const revalidate = 5;

export async function generateStaticParams() {
  const [notionPosts, { data: supabasePosts }] = await Promise.all([
    fetchPostsFromNotion(),
    supabase.from("posts").select("id").limit(1000),
  ]);

  const notionParams = (notionPosts || []).map((p) => ({ id: String(p.id) }));
  const supabaseParams = (supabasePosts || []).map((p) => ({ id: String(p.id) }));
  return [...notionParams, ...supabaseParams];
}

interface Post {
  id: string | number;
  title: string;
  content?: string | null;
  summary?: string | null;
  description?: string | null;
  created_at?: string | null;
  published_at?: string | null;
  updated_at?: string | null;
  tags?: string[] | string | null;
  category?: string | null;
  source?: string | null;
  source_url?: string | null;
  author?: string | null;
  post_type?: string | null;
}

/* ============================================================
   解析文章目录（增强唯一 ID 冲突检测）
   ============================================================ */
function parseTocAndContent(rawContent: string) {
  const isHtml = /<[a-z][\s\S]*>/i.test(rawContent);
  const tocList: TocItem[] = [];
  const seenIds = new Map<string, number>();

  const getUniqueId = (baseId: string) => {
    const count = seenIds.get(baseId) || 0;
    seenIds.set(baseId, count + 1);
    return count === 0 ? baseId : `${baseId}-${count}`;
  };

  if (isHtml) {
    const processedContent = rawContent.replace(
      /<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/gi,
      (match, levelStr: string, attrs: string, innerText: string) => {
        const level = Number(levelStr);
        const cleanText = decodeHtmlEntities(
          innerText.replace(/<[^>]+>/g, "").trim()
        );
        const idMatch = attrs.match(/id=["']([^"']+)["']/i);
        const rawId = idMatch?.[1] || slugifyHeading(cleanText);
        const uniqueId = getUniqueId(rawId);

        if (cleanText) {
          tocList.push({ id: uniqueId, text: cleanText, level });
        }

        if (idMatch) {
          return match.replace(/id=["'][^"']+["']/i, `id="${uniqueId}"`);
        }
        return `<h${level}${attrs} id="${uniqueId}">${innerText}</h${level}>`;
      }
    );

    return { tocList, processedContent, isHtml: true };
  }

  const lines = rawContent.split("\n");
  lines.forEach((line) => {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (!match) return;

    const level = match[1].length;
    const text = decodeHtmlEntities(match[2].trim());
    const uniqueId = getUniqueId(slugifyHeading(text));

    tocList.push({ id: uniqueId, text, level });
  });

  return {
    tocList,
    processedContent: rawContent,
    isHtml: false,
  };
}

export default async function PostDetailPage({ params }: PostPageProps) {
  const { id } = await params;
  let currentPost: Post | null = null;

  // 1. 如果 ID 包含连字符或长度为 32 位 hex，优先从 Notion 抓取
  const cleanId = id.replace(/-/g, "").trim();
  if (cleanId.length === 32 || /[a-f0-9]{32}/i.test(cleanId)) {
    const notionPost = await fetchPostDetailFromNotion(id);
    if (notionPost) {
      currentPost = notionPost as unknown as Post;
    }
  }

  // 2. 如果 Notion 中未查到或为数字 ID，回退到 Supabase 查询 (RSS 文章)
  if (!currentPost) {
    const queryId = !Number.isNaN(Number(id)) ? Number(id) : id;
    const { data: supabasePost } = await supabase
      .from("posts")
      .select("*")
      .eq("id", queryId)
      .maybeSingle();

    if (supabasePost) {
      currentPost = supabasePost as Post;
    }
  }

  if (!currentPost) {
    notFound();
  }
  const currentDate =
    currentPost.created_at ||
    currentPost.published_at ||
    new Date().toISOString();

  const [{ data: prevPost }, { data: nextPost }] = await Promise.all([
    supabase
      .from("posts")
      .select("id, title")
      .gt("created_at", currentDate)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("posts")
      .select("id, title")
      .lt("created_at", currentDate)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const rawContent =
    currentPost.content ||
    currentPost.summary ||
    currentPost.description ||
    "";

  const { tocList, processedContent, isHtml } = parseTocAndContent(rawContent);
  const publishDate = formatDate(currentPost.published_at || currentPost.created_at);
  const updatedDate = formatDate(currentPost.updated_at || currentPost.created_at);
  const readTime = calculateReadTime(rawContent);
  const postTags = normalizeTags(currentPost.tags);
  const isRssPost = currentPost.post_type === "rss" || Boolean(currentPost.source_url) || Boolean(currentPost.source);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <main className="relative z-10 px-6 pt-24 pb-20 sm:px-8 sm:pt-28">
        <div className="relative w-full">
          {/* 左侧悬浮目录（Anthony Fu 纯净文本浮动大纲） */}
          {tocList.length > 0 && (
            <div className="fixed left-8 top-28 hidden w-48 xl:block z-20">
              <LazyTableOfContents
                tocList={tocList}
                className="!w-full !static"
              />
            </div>
          )}

          {/* 正文居中容器 (Anthony Fu 官方黄金 65ch 比例) */}
          <div className="slide-enter-content mx-auto w-full max-w-[65ch]">
            {/* 返回按钮 */}
            

            {/* 页面头部：标题与极简元信息 */}
            <header className="mb-10">
              <h1 className="text-3xl sm:text-4xl lg:text-[38px] font-bold tracking-tight text-neutral-900 dark:text-white leading-[1.25]">
                {currentPost.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-neutral-400 dark:text-[#888888] font-normal">
                {publishDate && (
                  <span>{publishDate}</span>
                )}

                {publishDate && readTime && (
                  <span className="opacity-40">·</span>
                )}

                <span>{readTime} min read</span>

                {currentPost.category && (
                  <>
                    <span className="opacity-40">·</span>
                    <Link
                      href={`/posts?category=${encodeURIComponent(currentPost.category)}`}
                      className="hover:text-neutral-900 dark:hover:text-white transition-colors"
                    >
                      {currentPost.category}
                    </Link>
                  </>
                )}

                {currentPost.source_url && (
                  <>
                    <span className="opacity-40">·</span>
                    <a
                      href={currentPost.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-neutral-900 dark:hover:text-white transition-colors inline-flex items-center gap-1"
                    >
                      <span>{currentPost.source || "Source"}</span>
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  </>
                )}
              </div>

              {updatedDate && updatedDate !== publishDate && (
                <p className="mt-2 text-xs text-neutral-400 dark:text-neutral-600">
                  Updated {updatedDate}
                </p>
              )}
            </header>

            {/* 正文内容 */}
            <article className="post-article min-w-0">
              <LazyPostContent
                content={processedContent}
                isHtml={isHtml}
              />
            </article>

            {/* 标签列表 */}
            {postTags.length > 0 && (
              <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-neutral-200 dark:border-neutral-800/80 pt-6">
                <TagIcon className="h-3.5 w-3.5 text-neutral-400 opacity-60" />
                {postTags.map((tag, index) => (
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

            {/* 移动端底部目录 */}
            {tocList.length > 0 && (
              <div className="mt-12 border-t border-neutral-200 dark:border-neutral-800/80 pt-8 xl:hidden">
                <div className="mb-4 text-xs font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  On this page
                </div>
                <LazyTableOfContents
                  tocList={tocList}
                  className="!block !w-full !static"
                />
              </div>
            )}

            {/* 上一篇 / 下一篇导航 */}
            <nav className="mt-12 grid grid-cols-2 gap-4 border-t border-neutral-200 dark:border-neutral-800/80 pt-8">
              <div>
                {prevPost ? (
                  <Link href={`/posts/${prevPost.id}`} className="group block">
                    <span className="flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500">
                      <ArrowLeft className="h-3 w-3" />
                      Previous
                    </span>
                    <span className="mt-2 block line-clamp-2 text-sm leading-6 text-neutral-600 transition-colors group-hover:text-neutral-950 dark:text-neutral-300 dark:group-hover:text-white">
                      {prevPost.title}
                    </span>
                  </Link>
                ) : (
                  <span className="text-xs text-neutral-300 dark:text-neutral-700">
                    No newer post
                  </span>
                )}
              </div>

              <div className="text-right">
                {nextPost ? (
                  <Link href={`/posts/${nextPost.id}`} className="group block">
                    <span className="flex items-center justify-end gap-1.5 text-xs text-neutral-400 dark:text-neutral-500">
                      Next
                      <ArrowRight className="h-3 w-3" />
                    </span>
                    <span className="mt-2 block line-clamp-2 text-sm leading-6 text-neutral-600 transition-colors group-hover:text-neutral-950 dark:text-neutral-300 dark:group-hover:text-white">
                      {nextPost.title}
                    </span>
                  </Link>
                ) : (
                  <span className="text-xs text-neutral-300 dark:text-neutral-700">
                    No older post
                  </span>
                )}
              </div>
            </nav>

            {/* 评论区：仅原创文章开放评论，RSS 订阅聚合文章不显示 */}
            {!isRssPost && (
              <section className="mt-16">
                <LazyCommentSection postId={currentPost.id} />
              </section>
            )}
          </div>
        </div>
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}