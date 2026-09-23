// app/sitemap.ts
import { MetadataRoute } from "next";
import { fetchPosts, fetchThoughts } from "@/lib/data";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";
export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. 核心栏目页面
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: siteUrl("/posts"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: siteUrl("/thoughts"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: siteUrl("/playlist"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: siteUrl("/gallery"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.75,
    },
  ];


  let postsSitemap: MetadataRoute.Sitemap = [];
  try {
    const posts = await fetchPosts(500);
    postsSitemap = (posts || []).map((post) => ({
      url: siteUrl(`/posts/${post.slug || post.id}`),
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
      url: siteUrl(`/thoughts/${item.id}`),
      lastModified: new Date(item.rawDate || new Date()),
      changeFrequency: "monthly",
      priority: 0.6,
    }));
  } catch (err) {
    console.warn("[Sitemap] 生成随想路由时警告:", err);
  }

  return [...staticRoutes, ...postsSitemap, ...thoughtsSitemap];
}