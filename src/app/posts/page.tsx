import type { Metadata } from 'next';
import { fetchPosts } from '@/lib/data';
import { RetroPostsView } from '@/components/post/RetroPostsView';
import { siteUrl } from '@/lib/site';

export const dynamic = "force-static";
export const revalidate = 10;

export const metadata: Metadata = {
  title: 'Blog',
  description: '技术探索、设计思考与经验总结',
  alternates: {
    canonical: siteUrl('/posts'),
  },
};

export default async function PostsPage() {
  const posts = await fetchPosts();

  return <RetroPostsView posts={posts} />;
}