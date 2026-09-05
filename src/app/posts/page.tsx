// src/app/posts/page.tsx
import { fetchPosts } from '@/lib/data';
import { PostsListClient, PostItem } from '@/components/post/PostsListClient';
import { SlideEnter } from '@/components/layout/SlideEnter';

export const dynamic = 'force-static';
export const revalidate = 60;

export default async function PostsPage() {
  const posts = await fetchPosts();

  return (
    <div className="relative min-h-screen w-full px-6 pt-24 pb-20 sm:px-8 sm:pt-28">
      <main className="mx-auto w-full max-w-[65ch]">
        {/* 1. 大标题与简介文案 */}
        <SlideEnter stage={1} className="mb-10">
          <header>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-[#f4f4f5] sm:text-4xl">
              Blog
            </h1>
            <p className="mt-3 text-neutral-500 dark:text-[#8e8e93]">
              感君倾耳，记录技术与生活的探索。
            </p>
          </header>
        </SlideEnter>

        {/* 2. 文章列表交互客户端 */}
        <PostsListClient initialPosts={posts as PostItem[]} />
      </main>
    </div>
  );
}