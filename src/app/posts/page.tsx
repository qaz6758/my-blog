// src/app/posts/page.tsx
import { fetchPosts } from '@/lib/data';
import { PostsListClient, PostItem } from '@/components/post/PostsListClient';
import { SlideEnter } from '@/components/layout/SlideEnter';
import { WaterArchiveBackground } from '@/components/effects/WaterArchiveBackground';

export const revalidate = 60;

export default async function PostsPage() {
  const posts = await fetchPosts();

  return (
    <div className="relative min-h-screen w-full">
      {/* 方案C真实水晕漫射与水纹等高线柔焦背景 */}
      <WaterArchiveBackground />

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 pt-20 pb-20">
        {/* 顶部通栏标题 (Option C Header Bar) */}
        <SlideEnter stage={1} className="pb-6 border-b border-black/[0.08] dark:border-white/[0.08] mb-2">
          <header className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
            <h1 className="font-serif text-3xl sm:text-4xl tracking-wide font-normal text-neutral-900 dark:text-neutral-100">
              Archive
            </h1>
            <p className="text-xs sm:text-sm font-serif italic text-neutral-500 dark:text-neutral-400">
              感君倾耳，记录技术与生活的探索。
            </p>
          </header>
        </SlideEnter>

        {/* 整个文章归档交互客户端 (双栏账册架构) */}
        <PostsListClient initialPosts={posts as PostItem[]} />
      </div>
    </div>
  );
}