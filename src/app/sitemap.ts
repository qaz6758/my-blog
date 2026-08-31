// app/sitemap.ts
import { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

export const revalidate = 3600; // 每小时重新生成一次 Sitemap

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com";

  // 1. 查询数据库中所有文章的 ID 与更新/发布时间
  const { data: posts } = await supabase
    .from("posts")
    .select("id, updated_at, published_at, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);

  const postsSitemap: MetadataRoute.Sitemap = (posts || []).map((post) => ({
    url: `${baseUrl}/posts/${post.id}`,
    lastModified: new Date(
      post.updated_at || post.published_at || post.created_at || new Date()
    ),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // 2. 静态核心页面
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
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  return [...staticRoutes, ...postsSitemap];
}