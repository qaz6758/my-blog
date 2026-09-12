// src/app/posts/page.tsx
import { fetchPosts } from '@/lib/data';
import { PostsListClient, PostItem } from '@/components/post/PostsListClient';
import { SlideEnter } from '@/components/layout/SlideEnter';

export const revalidate = 60;

export default async function PostsPage() {
  const posts = await fetchPosts();

  return (
    <div className="relative min-h-screen w-full">
      {/* 侘寂暗纹与微弱环境柔光背景层 (Option C Texture & Ambient Vignette) */}
      <div className="fixed inset-0 pointer-events-none z-0 dark:block hidden">
        {/* 1. 中心微弱环境光与四周自然暗角 */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 90% 70% at 50% 15%, rgba(255, 255, 255, 0.025) 0%, transparent 80%), radial-gradient(circle at 85% 85%, rgba(255, 255, 255, 0.015) 0%, transparent 60%)",
          }}
        />
        {/* 2. 细腻纸质/木纹暗纹叠加 */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `
              radial-gradient(circle at 10% 20%, #fff 1px, transparent 1px),
              radial-gradient(circle at 80% 40%, #fff 1.5px, transparent 1.5px),
              repeating-radial-gradient(circle at 0% 100%, transparent 0, transparent 40px, rgba(255,255,255,0.12) 41px, transparent 42px)
            `,
            backgroundSize: "180px 180px, 240px 240px, 600px 600px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 pt-20 pb-20">
        {/* 顶部通栏标题 (Option C Header Bar) */}
        <SlideEnter stage={1} className="pb-6 border-b border-black/[0.08] dark:border-white/[0.08] mb-2">
          <header className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
            <h1 className="font-serif text-2xl sm:text-3xl tracking-[0.18em] font-medium text-neutral-900 dark:text-neutral-200 uppercase">
              Writer&apos;s Archive
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