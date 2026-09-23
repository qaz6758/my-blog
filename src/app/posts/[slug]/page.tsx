import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchPosts, fetchPostDetail } from '@/lib/data';
import { DynamicPostReader, PostDetail } from '@/components/post/DynamicPostReader';
import { siteUrl } from '@/lib/site';

export const dynamicParams = false;
export const revalidate = 60;

// 1. 构建期预渲染当前已发布的 Notion 文章 Slug 与 ID（杜绝未命中 404）
export async function generateStaticParams() {
  const posts = await fetchPosts();

  if (!posts || posts.length === 0) {
    return [];
  }

  const params: { slug: string }[] = [];
  for (const post of posts) {
    if (post.slug) {
      params.push({ slug: post.slug });
    }
    if (post.id) {
      params.push({ slug: post.id });
      const noDash = post.id.replace(/-/g, '');
      if (noDash !== post.id) {
        params.push({ slug: noDash });
      }
    }
  }
  return params;
}

// 2. 动态生成文章 SEO 元数据 (标题、描述、OpenGraph、Twitter 及 Canonical 规范链接)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const post = await fetchPostDetail(slug);

  if (!post) {
    return {
      title: '文章未找到',
    };
  }

  const title = post.title;
  const description = post.summary || post.title;
  const canonicalUrl = siteUrl(`/posts/${post.slug || post.id}`);
  const images = post.cover_image ? [post.cover_image] : ['/og-cover.png'];

  return {
    title: {
      absolute: title,
    },
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'article',
      publishedTime: post.published_at || post.created_at,
      authors: ['Vince Ou'],
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    },
  };
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