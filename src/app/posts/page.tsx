// src/app/posts/page.tsx
import { fetchPosts } from '@/lib/data';
import { PostsListClient, PostItem } from '@/components/post/PostsListClient';

export const revalidate = 60;

export default async function PostsPage() {
  const posts = await fetchPosts();

  return (
    <div className="relative min-h-screen w-full">
      <div className="relative z-10 max-w-[1360px] mx-auto px-4 sm:px-6 xl:px-8 pt-20 pb-20">
        {/* 整个文章归档交互客户端 (绝对居中主体 + 右侧独立伴随轨道) */}
        <PostsListClient initialPosts={posts as PostItem[]} />
      </div>
    </div>
  );
}