// app/posts/page.tsx

import { Footer } from "@/components/layout/Footer";
import { SlideEnter } from "@/components/layout/SlideEnter";
import { supabase } from "@/lib/supabase";
import { fetchPostsFromNotion } from "@/lib/notion";
import { PostsListClient, PostItem } from "@/components/post/PostsListClient";

export const revalidate = 60;

interface PostsPageProps {
  searchParams: Promise<{
    category?: string;
    tag?: string;
  }>;
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const { category, tag } = await searchParams;

  // 并行获取 Notion 原创文章与 Supabase RSS 文章
  const [notionPosts, supabaseRes] = await Promise.all([
    fetchPostsFromNotion(),
    supabase
      .from("posts")
      .select("id, title, created_at, published_at, summary, category, tags, source, post_type")
      .eq("post_type", "rss")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  if (supabaseRes.error) {
    console.error("[Supabase Error] Failed to fetch posts:", supabaseRes.error);
  }

  const supabasePosts = (supabaseRes.data || []) as PostItem[];

  // 合并数据源并按发布时间倒序排列
  const allPosts = [...notionPosts, ...supabasePosts].sort((a, b) => {
    const timeA = new Date(a.published_at || a.created_at).getTime();
    const timeB = new Date(b.published_at || b.created_at).getTime();
    return timeB - timeA;
  });

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <main className="relative z-10 min-h-screen px-5 pt-24 pb-20 sm:px-8 sm:pt-28">
        <div className="slide-enter-content mx-auto w-full max-w-[760px]">
          {/* 页面头部标题 */}
          <header className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl">
              Blog
            </h1>
            <p className="mt-3 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              记录技术探索、折腾过程与生活碎片。
            </p>
          </header>

          {/* 即时响应式文章分类过滤列表 */}
          <PostsListClient
            initialPosts={allPosts}
            initialCategory={category}
            initialTag={tag}
          />
        </div>
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}