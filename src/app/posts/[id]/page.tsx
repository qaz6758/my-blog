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
import TableOfContents, { TocItem } from "@/components/post/TableOfContents";
import { CommentSection } from "@/components/post/CommentSection";
import { PostContentWrapper } from "@/components/post/PostContentWrapper";
import { Footer } from "@/components/layout/Footer";

import { fetchPostsFromNotion, fetchPostDetailFromNotion } from "@/lib/notion";

interface PostPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const revalidate = 60;

export async function generateStaticParams() {
  const [notionPosts, { data: supabasePosts }] = await Promise.all([
    fetchPostsFromNotion(),
    supabase.from("posts").select("id").limit(100),
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
}

function decodeHtmlEntities(str: string) {
  return str
    .replace(/&nbsp;/gi, " ")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&rdquo;/gi, '"')
    .replace(/&ldquo;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'");
}

function slugifyHeading(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\u4e00-\u9fa5\d-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "heading"
  );
}

/* ============================================================
   解析文章目录（增强唯一 ID 冲突检测）
   ============================================================ */
function parseTocAndContent(rawContent: string) {
  const isHtml = /<[a-z][\s\S]*>/i.test(rawContent);
  const tocList: TocItem[] = [];
  const seenIds = new Map<string, number>();

  // 生成全局唯一 ID 防止目录 key 冲突
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

function formatDate(dateString?: string | null) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function calculateReadTime(content: string) {
  const plainText = content
    .replace(/<[^>]*>/g, "")
    .replace(/[#>*_`~()[\]\\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!plainText) return 1;
  return Math.max(1, Math.ceil(plainText.length / 350));
}

function normalizeTags(tags?: string[] | string | null): string[] {
  if (!tags) return [];
  const rawList: string[] = [];
  const items = Array.isArray(tags) ? tags : [tags];
  for (const item of items) {
    if (typeof item === "string") {
      const split = item.split(/[,，、\s]+/).map((s) => s.trim()).filter(Boolean);
      rawList.push(...split);
    }
  }
  return Array.from(new Set(rawList));
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

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <main className="relative z-10 px-5 pt-24 pb-20 sm:px-8 sm:pt-28">
        <div className="relative w-full">
          {/* 左侧悬浮目录 */}
          {tocList.length > 0 && (
            <div className="fixed left-6 top-24 hidden w-56 xl:block">
              <TableOfContents
                tocList={tocList}
                className="!w-full !static"
              />
            </div>
          )}

          {/* 正文居中容器 */}
          <div className="mx-auto w-full max-w-[760px]">
            <header className="mb-12">
              <h1 className="text-3xl font-semibold leading-[1.18] tracking-[-0.025em] text-neutral-900 dark:text-neutral-100 sm:text-4xl lg:text-[42px]">
                {currentPost.title}
              </h1>

              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-neutral-400 dark:text-neutral-500">
                {currentPost.category && (
                  <Link
                    href={`/posts?category=${encodeURIComponent(currentPost.category)}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-0.5 font-medium text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  >
                    <FolderOpen className="h-3 w-3" />
                    <span>{currentPost.category}</span>
                  </Link>
                )}

                {publishDate && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {publishDate}
                  </span>
                )}

                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {readTime} min read
                </span>

                {currentPost.source_url && (
                  <a
                    href={currentPost.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-neutral-900 dark:hover:text-white"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>{currentPost.source || "Original source"}</span>
                  </a>
                )}
              </div>

              {updatedDate && updatedDate !== publishDate && (
                <p className="mt-2 text-[11px] text-neutral-400 dark:text-neutral-600">
                  Updated {updatedDate}
                </p>
              )}
            </header>

            {/* 正文内容 */}
            <article className="post-article min-w-0">
              <PostContentWrapper
                content={processedContent}
                isHtml={isHtml}
              />
            </article>

            {/* 标签列表（带双重防冲突 key） */}
            {postTags.length > 0 && (
              <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-black/[0.06] pt-6 dark:border-white/[0.08]">
                <TagIcon className="h-3.5 w-3.5 text-neutral-400" />
                {postTags.map((tag, index) => (
                  <Link
                    key={`${tag}-${index}`}
                    href={`/posts?tag=${encodeURIComponent(tag)}`}
                    className="rounded-md bg-neutral-50 px-2 py-1 text-xs text-neutral-600 transition-colors hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* 移动端底部目录 */}
            {tocList.length > 0 && (
              <div className="mt-14 border-t border-black/[0.06] pt-8 dark:border-white/[0.08] xl:hidden">
                <div className="mb-4 text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500">
                  On this page
                </div>
                <TableOfContents
                  tocList={tocList}
                  className="!block !w-full !static"
                />
              </div>
            )}

            {/* 上一篇 / 下一篇导航 */}
            <nav className="mt-16 grid grid-cols-2 gap-4 border-t border-black/[0.06] pt-6 dark:border-white/[0.08]">
              <div>
                {prevPost ? (
                  <Link href={`/posts/${prevPost.id}`} prefetch={false} className="group block">
                    <span className="flex items-center gap-1.5 text-[11px] text-neutral-400 dark:text-neutral-500">
                      <ArrowLeft className="h-3 w-3" />
                      Previous
                    </span>
                    <span className="mt-2 block line-clamp-2 text-sm leading-6 text-neutral-600 transition-colors group-hover:text-neutral-950 dark:text-neutral-300 dark:group-hover:text-white">
                      {prevPost.title}
                    </span>
                  </Link>
                ) : (
                  <span className="text-[11px] text-neutral-300 dark:text-neutral-700">
                    No newer post
                  </span>
                )}
              </div>

              <div className="text-right">
                {nextPost ? (
                  <Link href={`/posts/${nextPost.id}`} prefetch={false} className="group block">
                    <span className="flex items-center justify-end gap-1.5 text-[11px] text-neutral-400 dark:text-neutral-500">
                      Next
                      <ArrowRight className="h-3 w-3" />
                    </span>
                    <span className="mt-2 block line-clamp-2 text-sm leading-6 text-neutral-600 transition-colors group-hover:text-neutral-950 dark:text-neutral-300 dark:group-hover:text-white">
                      {nextPost.title}
                    </span>
                  </Link>
                ) : (
                  <span className="text-[11px] text-neutral-300 dark:text-neutral-700">
                    No older post
                  </span>
                )}
              </div>
            </nav>

            {/* 评论区 */}
            <section className="mt-16">
              <CommentSection postId={currentPost.id} />
            </section>
          </div>
        </div>
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}