// lib/rss.ts
import { XMLParser } from "fast-xml-parser";
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

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  parseAttributeValue: true,
  trimValues: true,
});

/**
 * 辅助函数：从 XML 节点中安全提取文本（兼容带属性的 <content type="html"> 等节点）
 */
function extractXmlText(node: any): string {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (typeof node === "object") {
    if (typeof node["#text"] === "string") return node["#text"];
    if (typeof node["_text"] === "string") return node["_text"];
    if (Array.isArray(node)) {
      return node.map(extractXmlText).join("");
    }
  }
  return "";
}

/**
 * 辅助函数：使用 Cheerio 单次解析提取 HTML 正文中的封面图与纯净文本摘要
 */
function parseHtmlContent(html: string, baseUrl?: string) {
  if (!html) return { coverImage: null, cleanSummary: "" };

  const $ = cheerio.load(html);

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

  $("script, style, noscript, iframe, svg, pre, code").remove();
  const cleanSummary = $.text().replace(/\s+/g, " ").trim().slice(0, 180);

  return { coverImage, cleanSummary };
}

function normalizeDate(rawDate?: string | null): string | null {
  if (!rawDate) return null;
  try {
    const d = new Date(rawDate);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}

/**
 * 辅助函数：深度清洗 RSS HTML 正文，剥离外层 DOCTYPE、html、body 并解码实体
 */
function cleanRssContent(raw: string): string {
  if (!raw || typeof raw !== "string") return "";
  let text = raw.trim();

  const bodyMatch = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    text = bodyMatch[1];
  }

  text = text
    .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/?(html|head|body|meta|link)[^>]*>/gi, "")
    .trim();

  text = text
    .replace(/&rsquo;|&#8217;/gi, "'")
    .replace(/&lsquo;|&#8216;/gi, "'")
    .replace(/&rdquo;|&#8221;/gi, '"')
    .replace(/&ldquo;|&#8220;/gi, '"')
    .replace(/&mdash;|&#8212;/gi, "—")
    .replace(/&ndash;|&#8211;/gi, "–")
    .replace(/&hellip;|&#8230;/gi, "…")
    .replace(/&nbsp;/gi, " ");

  return text;
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
    const parsed = xmlParser.parse(xmlText);

    // 兼容 RSS 2.0 (channel.item) 与 Atom (feed.entry)
    const channel = parsed?.rss?.channel || parsed?.channel;
    const feed = parsed?.feed;
    const rawItems = channel?.item || feed?.entry || [];
    const itemsArray = Array.isArray(rawItems) ? rawItems : [rawItems];
    const feedTitle = channel?.title || feed?.title || "RSS";

    return itemsArray.map((item: any, index: number) => {
      const title =
        typeof item.title === "object"
          ? item.title["#text"] || ""
          : item.title || "无标题文章";

      let link = "#";
      if (typeof item.link === "string") {
        link = item.link;
      } else if (item.link?.["@_href"]) {
        link = item.link["@_href"];
      } else if (item.link?.[0]?.["@_href"]) {
        link = item.link[0]["@_href"];
      }

      const rawContent = extractXmlText(
        item["content:encoded"] ||
        item.content ||
        item.description ||
        item.summary ||
        ""
      );

      let image: string | null =
        item.enclosure?.["@_url"] ||
        item["media:content"]?.["@_url"] ||
        item["media:thumbnail"]?.["@_url"] ||
        null;

      const { coverImage: extractedImage, cleanSummary } = parseHtmlContent(
        rawContent,
        link || feedUrl
      );

      if (!image) {
        image = extractedImage;
      }

      const description =
        cleanSummary ||
        (typeof item.description === "string"
          ? item.description.slice(0, 180)
          : "");

      const pubDate = normalizeDate(
        item.pubDate || item.published || item.updated || item.isoDate
      );
      const author =
        item["dc:creator"] ||
        item.author?.name ||
        (typeof item.author === "string" ? item.author : null);
      const finalSource = sourceName || feedTitle;
      const category = item.category || finalSource || "Blog";

      return {
        id: item.guid || link || `${finalSource}-${index}`,
        title: title.trim(),
        link: link || "#",
        description,
        content: cleanRssContent(rawContent),
        pubDate,
        author,
        image,
        source: finalSource,
        category: typeof category === "string" ? category : finalSource,
      };
    });
  } catch (error) {
    console.error(`❌ 获取 RSS 失败 (${feedUrl}):`, error);
    return [];
  }
}