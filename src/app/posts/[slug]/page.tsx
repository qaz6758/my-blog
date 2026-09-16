// src/app/posts/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { fetchPosts, fetchPostDetail } from '@/lib/data';
import { DynamicPostReader, PostDetail } from '@/components/post/DynamicPostReader';

export const dynamicParams = false;
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
      // 顺应正常阅读心智模型与列表阅读流：
      // prevPost (上一篇 / 较新文章)：列表中排在更上方(时间更新)的文章 (currentIndex - 1)
      // nextPost (下一篇 / 较早文章)：列表中排在更下方(时间更早)的文章 (currentIndex + 1)
      prevPost = (allPosts[currentIndex - 1] as unknown as PostDetail) || null;
      nextPost = (allPosts[currentIndex + 1] as unknown as PostDetail) || null;
    }
  }

  // 优先从 Notion 抓取文章（带 Markdown 正文），未命中则从 Supabase 提取
  const post = (await fetchPostDetail(slug)) as unknown as PostDetail | null;

  if (!post) {
    notFound();
  }

  return (
    <DynamicPostReader
      post={post}
      prevPost={prevPost}
      nextPost={nextPost}
    />
  );
}