import type { Metadata } from 'next';
import { fetchPosts } from '@/lib/data';
import { PostsListClient, PostItem } from '@/components/post/PostsListClient';

export const dynamic = "force-static";
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Blog',
  description: '技术探索、设计思考与经验总结',
  alternates: {
    canonical: 'https://vinceou.site/posts',
  },
};

export default async function PostsPage() {
  const posts = await fetchPosts();

  return (
    <div className="relative w-full overflow-hidden pt-28 sm:pt-36 pb-24 px-6 sm:px-8">
      <div className="relative z-10 mx-auto w-full max-w-[660px]">
        <PostsListClient initialPosts={posts as PostItem[]} />
      </div>
    </div>
  );
}