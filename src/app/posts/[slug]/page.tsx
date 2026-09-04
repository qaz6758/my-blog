// src/app/posts/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { fetchPosts, fetchPostDetail } from '@/lib/data';
import PostDetailClient from './PostDetailClient';
import { PostDetail } from '@/components/post/DynamicPostReader';

// 允许动态渲染未在构建期列举的 slug（如 Notion 新发布的文章），防止 404
export const dynamicParams = true;
export const revalidate = 60;

// 1. 构建期提取所有已发布文章的 Slug（包含 Notion 原创与 Supabase 文章）
export async function generateStaticParams() {
  const posts = await fetchPosts();

  if (!posts || posts.length === 0) {
    return [];
  }

  return posts
    .filter((post) => Boolean(post.slug || post.id))
    .map((post) => ({
      slug: post.slug || post.id,
    }));
}

// 2. 服务端预取当前文章 + 前后篇数据，直接注入客户端
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  const allPosts = await fetchPosts();

  let prevPost: PostDetail | null = null;
  let nextPost: PostDetail | null = null;

  if (allPosts && allPosts.length > 0) {
    const currentIndex = allPosts.findIndex(
      (p) => p.slug === slug || p.id === slug
    );

    if (currentIndex !== -1) {
      prevPost = (allPosts[currentIndex + 1] as unknown as PostDetail) || null;
      nextPost = (allPosts[currentIndex - 1] as unknown as PostDetail) || null;
    }
  }

  // 优先从 Notion 抓取文章（带 Markdown 正文），未命中则从 Supabase 提取
  const post = (await fetchPostDetail(slug)) as unknown as PostDetail | null;

  if (!post) {
    notFound();
  }

  return (
    <PostDetailClient
      post={post}
      prevPost={prevPost}
      nextPost={nextPost}
    />
  );
}