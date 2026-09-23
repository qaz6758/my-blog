// app/sitemap.ts
import { MetadataRoute } from "next";
import { fetchPosts, fetchThoughts } from "@/lib/data";

export const dynamic = "force-static";
export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vinceou.site";

  // 1. 核心栏目页面
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/posts`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/thoughts`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/playlist`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${baseUrl}/gallery`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.75,
    },
  ];

  // 2. 博客文章页面 (包含 Notion 原创与 Supabase 文章，采用标准语义化 Slug)
  let postsSitemap: MetadataRoute.Sitemap = [];
  try {
    const posts = await fetchPosts(500);
    postsSitemap = (posts || []).map((post) => ({
      url: `${baseUrl}/posts/${post.slug || post.id}`,
      lastModified: new Date(post.published_at || post.created_at || new Date()),
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch (err) {
    console.warn("[Sitemap] 生成文章路由时警告:", err);
  }

  // 3. 随想录独立页面
  let thoughtsSitemap: MetadataRoute.Sitemap = [];
  try {
    const thoughts = await fetchThoughts();
    thoughtsSitemap = (thoughts || []).map((item) => ({
      url: `${baseUrl}/thoughts/${item.id}`,
      lastModified: new Date(item.rawDate || new Date()),
      changeFrequency: "monthly",
      priority: 0.6,
    }));
  } catch (err) {
    console.warn("[Sitemap] 生成随想路由时警告:", err);
  }

  return [...staticRoutes, ...postsSitemap, ...thoughtsSitemap];
}