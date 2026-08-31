import Parser from "rss-parser";
import * as cheerio from "cheerio";

export interface RSSItem {
  id: string;
  title: string;
  link: string;
  description: string;
  content: string;
  pubDate: string | null;
  author: string | null;
  image: string | null;
  source: string;
  category: string;
}

type CustomItem = {
  description?: string;
  contentEncoded?: string;
  "content:encoded"?: string;
  media?: { $?: { url?: string } };
  "media:content"?: { $?: { url?: string } };
  "media:thumbnail"?: { $?: { url?: string } };
  thumbnail?: { $?: { url?: string } } | string;
  creator?: string;
  author?: string;
};

const parser = new Parser<Record<string, unknown>, CustomItem>({
  customFields: {
    item: [
      ["media:content", "media"],
      ["media:thumbnail", "thumbnail"],
      ["content:encoded", "contentEncoded"],
      ["description", "description"],
    ],
  },
});

/**
 * 辅助函数：使用 Cheerio 单次解析提取 HTML 正文中的封面图与纯净文本摘要
 */
function parseHtmlContent(html: string, baseUrl?: string) {
  if (!html) return { coverImage: null, cleanSummary: "" };

  // 单次加载 DOM 树，节约内存开销
  const $ = cheerio.load(html);

  // 1. 提取首张图片（兼容懒加载，并自动转换相对路径）
  let coverImage: string | null = null;
  const firstImg = $("img").first();

  if (firstImg.length > 0) {
    const rawSrc =
      firstImg.attr("src") ||
      firstImg.attr("data-src") ||
      firstImg.attr("data-original");

    if (rawSrc) {
      try {
        coverImage = baseUrl ? new URL(rawSrc, baseUrl).href : rawSrc;
      } catch {
        coverImage = rawSrc;
      }
    }
  }

  // 2. 移除噪音标签，提取纯净摘要
  $("script, style, noscript, iframe, svg, pre, code").remove();
  const cleanSummary = $.text().replace(/\s+/g, " ").trim().slice(0, 180);

  return { coverImage, cleanSummary };
}

/**
 * 辅助函数：标准化日期格式为 ISO 8601
 */
function normalizeDate(rawDate?: string | null): string | null {
  if (!rawDate) return null;
  try {
    const d = new Date(rawDate);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}

export async function fetchRSS(
  feedUrl: string,
  sourceName?: string
): Promise<RSSItem[]> {
  try {
    const response = await fetch(feedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(10000), // 10秒防挂起超时
      next: { revalidate: 1800 },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlText = await response.text();
    const feed = await parser.parseString(xmlText);

    return (feed.items || []).map((item, index) => {
      const rawContent =
        item.contentEncoded ||
        item["content:encoded"] ||
        item.content ||
        item.description ||
        "";

      // 1. 优先提取 Feed 原生定义的封面图
      let image: string | null =
        item.enclosure?.url ||
        item.media?.$?.url ||
        item["media:content"]?.$?.url ||
        item["media:thumbnail"]?.$?.url ||
        (typeof item.thumbnail === "string"
          ? item.thumbnail
          : item.thumbnail?.$?.url) ||
        null;

      // 2. 单次 Cheerio 解析正文提取图片与纯净摘要
      const { coverImage: extractedImage, cleanSummary } = parseHtmlContent(
        rawContent,
        item.link || feedUrl
      );

      if (!image) {
        image = extractedImage;
      }

      const description =
        item.contentSnippet?.replace(/\s+/g, " ").trim().slice(0, 180) ||
        cleanSummary ||
        "";

      const title = item.title?.trim() || "无标题文章";
      const pubDate = normalizeDate(item.isoDate || item.pubDate);
      const author = item.creator || item.author || null;
      const finalSource = sourceName || feed.title || "RSS";
      const category =
        (item.categories && item.categories[0]) || finalSource || "Blog";

      return {
        id: item.guid || item.link || `${finalSource}-${index}`,
        title,
        link: item.link || "#",
        description,
        content: rawContent,
        pubDate,
        author,
        image,
        source: finalSource,
        category,
      };
    });
  } catch (error) {
    console.error(`❌ 获取 RSS 失败 (${feedUrl}):`, error);
    return [];
  }
}