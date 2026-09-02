import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { fetchRSS, RSSItem } from "@/lib/rss";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // 允许长任务最长执行 60 秒

const RSS_FEEDS = [
  {
    name: "Anthony Fu",
    url: "https://antfu.me/feed.xml",
    category: "前端开发",
  },
  {
    name: "Smashing Magazine",
    url: "https://www.smashingmagazine.com/feed/",
    category: "前端设计",
  },
  {
    name: "GitHub Blog",
    url: "https://github.blog/feed/",
    category: "技术前沿",
  },
  {
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

    // 4. 一次性批量查询数据库中已存在的 source_url（消除 N+1 查询）
    const allUrls = allFetchedItems.map((entry) => entry.item.link);
    const { data: existingRecords, error: queryError } = await supabase
      .from("posts")
      .select("source_url")
      .in("source_url", allUrls);

    if (queryError) {
      throw new Error(`批量查询已有文章失败: ${queryError.message}`);
    }

    const existingUrlSet = new Set(
      (existingRecords || []).map((r) => r.source_url)
    );

    // 5. 过滤出真正需要新增入库的文章
    const newPostsToInsert = allFetchedItems
      .filter(({ item }) => !existingUrlSet.has(item.link))
      .map(({ item, feedCategory }) => {
        const publishedAt = item.pubDate
          ? new Date(item.pubDate).toISOString()
          : new Date().toISOString();

        return {
          title: item.title,
          category: feedCategory,
          tags: "RSS",
          summary:
            item.description
              ?.replace(/<[^>]*>/g, "")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 300) || "",
          content: item.content || item.description || "",
          created_at: new Date().toISOString(),
          published_at: publishedAt,
          source: item.source,
          source_url: item.link,
          author: item.author,
          cover_image: item.image,
          post_type: "rss",
        };
      });

    // 6. 单次批量写入新文章（Batch Insert）
    let totalInserted = 0;
    if (newPostsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("posts")
        .insert(newPostsToInsert);

      if (insertError) {
        throw new Error(`批量写入文章失败: ${insertError.message}`);
      }
      totalInserted = newPostsToInsert.length;
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