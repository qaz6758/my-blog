// app/posts/page.tsx

import { Footer } from "@/components/layout/Footer";
import { SlideEnter } from "@/components/layout/SlideEnter";
import { supabase } from "@/lib/supabase";
import { PageTransition } from "@/components/layout/PageTransition";
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

  // 服务端一次性读取轻量列表元数据（不读取重体积的 content 正文）
  const { data: postsData, error } = await supabase
    .from("posts")
    .select("id, title, created_at, published_at, summary, category, tags")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[Supabase Error] Failed to fetch posts:", error);
  }

  const posts = (postsData || []) as PostItem[];

  return (
    <PageTransition>
      <div className="relative min-h-screen w-full overflow-hidden">
        <main className="relative z-10 min-h-screen px-5 pt-24 pb-20 sm:px-8 sm:pt-28">
          <div className="mx-auto w-full max-w-[760px]">
            {/* 页面头部标题 */}
            <SlideEnter stage={1} as="header" className="mb-8">
              <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl">
                Blog
              </h1>
              <p className="mt-3 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                记录技术探索、折腾过程与生活碎片。
              </p>
            </SlideEnter>

            {/* 即时响应式文章分类过滤列表 */}
            <PostsListClient
              initialPosts={posts}
              initialCategory={category}
              initialTag={tag}
            />
          </div>
        </main>

        <div className="relative z-10">
          <Footer />
        </div>
      </div>
    </PageTransition>
  );
}