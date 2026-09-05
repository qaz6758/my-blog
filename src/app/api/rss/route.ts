import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { fetchRSS, RSSItem } from "@/lib/rss";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 允许长任务最长执行 60 秒

const RSS_FEEDS = [
  {
    // 全球最热门极客开发者头条社区
    name: "Hacker News",
    url: "https://hnrss.org/frontpage",
    category: "技术前沿",
  },
  {
    // 全球最大开发者协作平台官方前沿与 AI 博客
    name: "GitHub Blog",
    url: "https://github.blog/feed/",
    category: "开发工具",
  },
  {
    // 全球最大开发者开源技术社区与实战干货
    name: "Dev.to",
    url: "https://dev.to/feed",
    category: "编程实战",
  },
  {
    // 优质中文深度技术周刊与知识总结
    name: "阮一峰的网络日志",
    url: "https://www.ruanyifeng.com/blog/atom.xml",
    category: "技术博客",
  },
];

export async function GET(req: NextRequest) {
  try {
    // 1. 安全鉴权：若配置了 CRON_SECRET 则必须携带鉴权头或 query token
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = req.headers.get("authorization");
      const urlToken = req.nextUrl.searchParams.get("token");

      if (authHeader !== `Bearer ${cronSecret}` && urlToken !== cronSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    console.log("🚀 [RSS Sync] 开始并行抓取所有 RSS 源...");

    // 2. 并行发起所有源的网络抓取
    const feedResults = await Promise.all(
      RSS_FEEDS.map(async (feed) => {
        const items = await fetchRSS(feed.url, feed.name);
        return {
          feed,
          items,
        };
      })
    );

    // 3. 聚合所有抓取到的文章并去重 URL
    const allFetchedItems: { item: RSSItem; feedCategory: string }[] = [];
    const urlMap = new Set<string>();

    for (const { feed, items } of feedResults) {
      for (const item of items) {
        if (!item.link || !item.title) continue;
        if (urlMap.has(item.link)) continue;

        urlMap.add(item.link);
        allFetchedItems.push({
          item,
          feedCategory: feed.category,
        });
      }
    }

    const totalFetched = allFetchedItems.length;
    if (totalFetched === 0) {
      return NextResponse.json({
        success: true,
        message: "未抓取到有效文章",
        totalFetched: 0,
        inserted: 0,
        skipped: 0,
      });
    }

    // 4. 分块批量查询数据库中已存在的文章标题（每块 40 条，避免 PostgREST URL 长度溢出与特殊字符截断）
    const existingTitleSet = new Set<string>();
    const CHUNK_SIZE = 40;
    const allTitles = allFetchedItems.map((entry) => entry.item.title);

    for (let i = 0; i < allTitles.length; i += CHUNK_SIZE) {
      const chunk = allTitles.slice(i, i + CHUNK_SIZE);
      const { data: existingRecords, error: queryError } = await supabase
        .from("posts")
        .select("title, content")
        .in("title", chunk);

      if (queryError) {
        console.warn(`[RSS Sync] 分块查询文章存在警告 (offset: ${i}):`, queryError.message);
      } else if (existingRecords) {
        existingRecords.forEach((r) => {
          // 仅当数据库中已有且正文不为空时才标记为已存在跳过，防止空正文幽灵记录
          if (r.content && r.content.trim().length > 10) {
            existingTitleSet.add(r.title);
          }
        });
      }
    }

    // 5. 过滤出真正需要新增入库的文章
    const newPostsToInsert = allFetchedItems
      .filter(({ item }) => !existingTitleSet.has(item.title))
      .map(({ item, feedCategory }) => {
        const publishedAt = item.pubDate
          ? new Date(item.pubDate).toISOString()
          : new Date().toISOString();

        return {
          slug: `rss-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          title: item.title,
          category: feedCategory,
          tags: ["RSS"],
          summary:
            item.description
              ?.replace(/<[^>]*>/g, "")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 300) || "",
          content: item.content || item.description || "",
          created_at: new Date().toISOString(),
          published_at: publishedAt,
          cover_image: item.image,
          is_published: true,
          status: "已发布",
        };
      });

    // 6. 分批批量写入新文章（每批 20 条，杜绝请求体超大异常）
    let totalInserted = 0;
    if (newPostsToInsert.length > 0) {
      const BATCH_INSERT_SIZE = 20;
      for (let i = 0; i < newPostsToInsert.length; i += BATCH_INSERT_SIZE) {
        const insertBatch = newPostsToInsert.slice(i, i + BATCH_INSERT_SIZE);
        const { error: insertError } = await supabase
          .from("posts")
          .insert(insertBatch);

        if (insertError) {
          console.error(`[RSS Sync] 批量写入分批异常 (offset: ${i}):`, insertError.message);
        } else {
          totalInserted += insertBatch.length;
        }
      }
    }

    const totalSkipped = totalFetched - totalInserted;

    console.log(
      `✅ [RSS Sync] 同步完成: 抓取 ${totalFetched} 篇，新增 ${totalInserted} 篇，跳过已有 ${totalSkipped} 篇`
    );

    return NextResponse.json({
      success: true,
      totalFetched,
      inserted: totalInserted,
      skipped: totalSkipped,
    });
  } catch (error) {
    console.error("❌ [RSS Sync] 任务异常:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "RSS 同步异常",
      },
      { status: 500 }
    );
  }
}