// lib/notion.ts
import { PlaylistCategory } from "@/components/playlist/Playlist";
import { Song } from "@/components/playlist/SongList";

const NOTION_API_KEY = process.env.NOTION_API_KEY?.trim();
const NOTION_VERSION = "2022-06-28";

export interface ThoughtMediaItem {
  id: string;
  author: string;
  action: string;
  time: string;
  type: string;
  year: string;
  title: string;
  description: string;
  rating?: string;
  tags?: string;
  sourceUrl?: string;
  posterUrl?: string;
  likes: number;
  upvotes: number;
  replies: number;
}

function extractDatabaseId(input?: string): string {
  if (!input) return "";
  const clean = input.replace(/-/g, "").trim();
  const match = clean.match(/[a-f0-9]{32}/i);
  return match ? match[0] : "";
}

async function queryNotionDatabase(rawDatabaseId: string, name: string) {
  const cleanId = extractDatabaseId(rawDatabaseId);
  if (!cleanId) {
    throw new Error(`环境变量中的 ${name} 无效，未能提取到 32 位 ID`);
  }
  const res = await fetch(`https://api.notion.com/v1/databases/${cleanId}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
    next: { revalidate: 60 },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Notion [${name}] 查询错误: ${data.message || JSON.stringify(data)}`);
  }
  return data;
}

function findProp(props: any, ...keys: string[]) {
  const lowerKeys = keys.map((k) => k.toLowerCase().replace(/[\s_-]/g, ""));
  for (const propKey of Object.keys(props)) {
    const cleanPropKey = propKey.toLowerCase().replace(/[\s_-]/g, "");
    if (lowerKeys.includes(cleanPropKey)) {
      return props[propKey];
    }
  }
  return null;
}

function getText(prop: any): string {
  if (!prop) return "";
  if (prop.type === "title") return prop.title?.[0]?.plain_text || "";
  if (prop.type === "rich_text") return prop.rich_text?.[0]?.plain_text || "";
  return "";
}

function getUrl(prop: any): string {
  if (!prop) return "";
  if (prop.type === "url") return prop.url || "";
  if (prop.type === "files") return prop.files?.[0]?.file?.url || prop.files?.[0]?.external?.url || "";
  return "";
}

function getSelect(prop: any): string {
  if (!prop) return "";
  if (prop.type === "select") return prop.select?.name || "";
  return "";
}

function getMultiSelect(prop: any): string[] {
  if (!prop) return [];
  if (prop.type === "multi_select") return (prop.multi_select || []).map((item: any) => item.name);
  return [];
}

function getCheckbox(prop: any): boolean {
  if (!prop) return false;
  if (prop.type === "checkbox") return !!prop.checkbox;
  return false;
}

function getDate(prop: any): string {
  if (!prop) return "";
  if (prop.type === "date") return prop.date?.start || "";
  return "";
}

function getNumber(prop: any): number | null {
  if (!prop) return null;
  if (prop.type === "number") return prop.number;
  return null;
}

function formatThoughtDate(dateStr: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const days = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  
  // 补零格式化时分（例如 09:05）
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  // 格式示例：2026年8月31日 星期一 14:30
  return `${year}年${month}月${day}日 ${days[date.getDay()]} ${hours}:${minutes}`;
}

export async function fetchPlaylistsFromNotion(): Promise<PlaylistCategory[]> {
  const playlistDbId = process.env.NOTION_PLAYLIST_DB_ID;
  const songsDbId = process.env.NOTION_SONGS_DB_ID;
  if (!playlistDbId || !songsDbId || !NOTION_API_KEY) throw new Error("Missing Notion Env");
  const [playlistsRes, songsRes] = await Promise.all([
    queryNotionDatabase(playlistDbId, "NOTION_PLAYLIST_DB_ID"),
    queryNotionDatabase(songsDbId, "NOTION_SONGS_DB_ID"),
  ]);
  const allSongs: (Song & { playlistKey: string })[] = (songsRes.results || []).map((page: any) => {
    const p = page.properties;
    return {
      id: page.id,
      playlistKey: getText(findProp(p, "Playlist_Key", "PlaylistKey", "Playlist")),
      title: getText(findProp(p, "Title", "Name", "Song", "歌曲")) || "未知歌曲",
      artist: getText(findProp(p, "Artist", "Singer", "歌手")) || "未知歌手",
      album: getText(findProp(p, "Album", "专辑")),
      duration: getText(findProp(p, "Duration", "时长")) || "03:30",
      audio_url: getUrl(findProp(p, "AudioUrl", "Audio", "音频")),
      cover_url: getUrl(findProp(p, "Cover", "Pic", "封面")) || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80",
      links: { spotify: getUrl(findProp(p, "SpotifyUrl", "Spotify")), netease: getUrl(findProp(p, "NeteaseUrl", "Netease", "网易云")) },
    };
  });
  return (playlistsRes.results || []).map((page: any) => {
    const p = page.properties;
    const key = getText(findProp(p, "ID_Key", "IDKey", "ID", "Slug")) || page.id;
    const matchedSongs = allSongs.filter((s) => s.playlistKey && s.playlistKey === key);
    return {
      id: key,
      title: getText(findProp(p, "Title", "Name", "歌单")) || "未命名歌单",
      description: getText(findProp(p, "Description", "Desc", "简介")) || "精选私藏音乐",
      cover: getUrl(findProp(p, "Cover", "Pic", "封面")) || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
      tag: getSelect(findProp(p, "Tag", "Category", "标签")) || "Music",
      curatorNote: getText(findProp(p, "CuratorNote", "Note", "手记")) || "日常反复循环的旋律记录。",
      songs: matchedSongs,
    };
  });
}

export async function fetchThoughtsFromNotion(): Promise<ThoughtMediaItem[]> {
  const thoughtsDbId = process.env.NOTION_THOUGHTS_DB_ID;
  if (!thoughtsDbId || !NOTION_API_KEY) {
    throw new Error("缺少 Notion 环境变量，请检查 .env.local 中的 NOTION_API_KEY / NOTION_THOUGHTS_DB_ID");
  }

  const thoughtsRes = await queryNotionDatabase(thoughtsDbId, "NOTION_THOUGHTS_DB_ID");
  const items: ThoughtMediaItem[] = [];

  (thoughtsRes.results || []).forEach((page: any) => {
    const p = page.properties;
    const publishedProp = findProp(p, "Published", "公开", "发布");
    if (publishedProp && !getCheckbox(publishedProp)) return;

    const rawDate = getDate(findProp(p, "Date", "日期", "时间")) || page.created_time;
    const ratingNum = getNumber(findProp(p, "Rating", "评分", "Score"));
    const ratingText = ratingNum !== null ? ratingNum.toString() : getText(findProp(p, "Rating", "评分"));
    const tagsList = getMultiSelect(findProp(p, "Tags", "Tag", "标签", "分类"));

    items.push({
      id: page.id,
      author: getText(findProp(p, "Author", "作者")) || "theyole",
      action: getSelect(findProp(p, "Action", "动态", "动作")) || "",
      time: formatThoughtDate(rawDate),
      type: getSelect(findProp(p, "Type", "类型")) || getText(findProp(p, "Type", "类型")) || "NOTE",
      year: getText(findProp(p, "Year", "年份")) || getNumber(findProp(p, "Year", "年份"))?.toString() || "",
      title: getText(findProp(p, "Title", "Name", "标题")) || "",
      description: getText(findProp(p, "Content", "Description", "Desc", "内容", "正文")),
      rating: ratingText || undefined,
      tags: tagsList.length > 0 ? tagsList.join(", ") : getText(findProp(p, "Tags", "标签")) || undefined,
      sourceUrl: getUrl(findProp(p, "SourceUrl", "Source", "来源", "链接")) || undefined,
      posterUrl: getUrl(findProp(p, "Poster", "Cover", "海报", "封面", "Pic")) || undefined,
      likes: getNumber(findProp(p, "Likes", "点赞")) || 0,
      upvotes: getNumber(findProp(p, "Upvotes", "推荐")) || 0,
      replies: getNumber(findProp(p, "Replies", "回复")) || 0,
    });
  });

  return items;
}

// ================= 新增：抓取单条详情 =================
export async function fetchThoughtDetailFromNotion(pageId: string): Promise<ThoughtMediaItem | null> {
  if (!NOTION_API_KEY) return null;
  try {
    const cleanId = extractDatabaseId(pageId);
    if (!cleanId) return null;

    const res = await fetch(`https://api.notion.com/v1/pages/${cleanId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        "Notion-Version": NOTION_VERSION,
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) return null;
    const page = await res.json();
    const p = page.properties;

    const rawDate = getDate(findProp(p, "Date", "日期", "时间")) || page.created_time;
    const ratingNum = getNumber(findProp(p, "Rating", "评分", "Score"));
    const tagsList = getMultiSelect(findProp(p, "Tags", "Tag", "标签", "分类"));

    return {
      id: page.id,
      author: getText(findProp(p, "Author", "作者")) || "theyole",
      action: getSelect(findProp(p, "Action", "动态", "动作")) || "",
      time: formatThoughtDate(rawDate),
      type: getSelect(findProp(p, "Type", "类型")) || getText(findProp(p, "Type", "类型")) || "NOTE",
      year: getText(findProp(p, "Year", "年份")) || getNumber(findProp(p, "Year", "年份"))?.toString() || "",
      title: getText(findProp(p, "Title", "Name", "标题")) || "",
      description: getText(findProp(p, "Content", "Description", "Desc", "内容", "正文")),
      rating: ratingNum !== null ? ratingNum.toString() : getText(findProp(p, "Rating", "评分")) || undefined,
      tags: tagsList.length > 0 ? tagsList.join(", ") : getText(findProp(p, "Tags", "标签")) || undefined,
      sourceUrl: getUrl(findProp(p, "SourceUrl", "Source", "来源", "链接")) || undefined,
      posterUrl: getUrl(findProp(p, "Poster", "Cover", "海报", "封面", "Pic")) || undefined,
      likes: getNumber(findProp(p, "Likes", "点赞")) || 0,
      upvotes: getNumber(findProp(p, "Upvotes", "推荐")) || 0,
      replies: getNumber(findProp(p, "Replies", "回复")) || 0,
    };
  } catch (error) {
    console.error("获取 Notion 单页失败:", error);
    return null;
  }
}

// ============================================================
// 博客文章（Notion as CMS）
// ============================================================

export interface NotionPostItem {
  id: string;
  title: string;
  created_at: string;
  published_at: string;
  summary: string;
  category: string;
  tags: string[];
  source: string;
  source_url?: string;
  post_type: "original" | "notion" | "rss";
  status: string;
  content?: string;
}

function getStatus(prop: any): string {
  if (!prop) return "";
  if (prop.type === "status") return prop.status?.name || "";
  if (prop.type === "select") return prop.select?.name || "";
  return "";
}

function richTextToMarkdown(richTexts: any[] = []): string {
  return richTexts
    .map((rt) => {
      let text = rt.plain_text || "";
      if (rt.annotations) {
        if (rt.annotations.code) text = `\`${text}\``;
        if (rt.annotations.bold) text = `**${text}**`;
        if (rt.annotations.italic) text = `*${text}*`;
        if (rt.annotations.strikethrough) text = `~~${text}~~`;
      }
      if (rt.href) {
        text = `[${text}](${rt.href})`;
      }
      return text;
    })
    .join("");
}

async function fetchBlockChildren(blockId: string): Promise<any[]> {
  const cleanId = extractDatabaseId(blockId);
  if (!cleanId || !NOTION_API_KEY) return [];
  try {
    const res = await fetch(`https://api.notion.com/v1/blocks/${cleanId}/children?page_size=100`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        "Notion-Version": NOTION_VERSION,
      },
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

async function convertBlocksToMarkdown(blocks: any[]): Promise<string> {
  const lines: string[] = [];

  for (const block of blocks) {
    const type = block.type;
    const data = block[type];

    switch (type) {
      case "paragraph":
        lines.push(richTextToMarkdown(data?.rich_text) + "\n");
        break;
      case "heading_1":
        lines.push(`\n# ${richTextToMarkdown(data?.rich_text)}\n`);
        break;
      case "heading_2":
        lines.push(`\n## ${richTextToMarkdown(data?.rich_text)}\n`);
        break;
      case "heading_3":
        lines.push(`\n### ${richTextToMarkdown(data?.rich_text)}\n`);
        break;
      case "bulleted_list_item":
        lines.push(`* ${richTextToMarkdown(data?.rich_text)}`);
        break;
      case "numbered_list_item":
        lines.push(`1. ${richTextToMarkdown(data?.rich_text)}`);
        break;
      case "to_do":
        lines.push(`* [${data?.checked ? "x" : " "}] ${richTextToMarkdown(data?.rich_text)}`);
        break;
      case "quote":
        lines.push(`> ${richTextToMarkdown(data?.rich_text)}\n`);
        break;
      case "code":
        const codeText = (data?.rich_text || []).map((t: any) => t.plain_text).join("");
        const lang = data?.language || "";
        lines.push(`\n\`\`\`${lang}\n${codeText}\n\`\`\`\n`);
        break;
      case "callout":
        lines.push(`> 💡 ${richTextToMarkdown(data?.rich_text)}\n`);
        break;
      case "divider":
        lines.push(`\n---\n`);
        break;
      case "image":
        const imgUrl = data?.file?.url || data?.external?.url || "";
        const caption = (data?.caption || []).map((t: any) => t.plain_text).join("") || "配图";
        if (imgUrl) lines.push(`\n![${caption}](${imgUrl})\n`);
        break;
      case "bookmark":
      case "link_preview":
        const url = data?.url || "";
        if (url) lines.push(`\n[${url}](${url})\n`);
        break;
      default:
        if (data?.rich_text) {
          lines.push(richTextToMarkdown(data.rich_text) + "\n");
        }
        break;
    }
  }

  return lines.join("\n");
}

export async function fetchPostsFromNotion(): Promise<NotionPostItem[]> {
  const postsDbId = process.env.NOTION_POSTS_DB_ID;
  if (!postsDbId || !NOTION_API_KEY) return [];

  try {
    const postsRes = await queryNotionDatabase(postsDbId, "NOTION_POSTS_DB_ID");
    const items: NotionPostItem[] = [];

    (postsRes.results || []).forEach((page: any) => {
      const p = page.properties;
      const status = getStatus(findProp(p, "状态", "Status", "State"));
      
      // 仅展示已发布或准备发布的文章（或者不带状态过滤）
      const isPublished =
        status.includes("已发布") ||
        status.includes("准备发布") ||
        status.includes("Published") ||
        getCheckbox(findProp(p, "Published", "公开", "发布"));

      // 允许显示带公开标记的文章，如果没有状态属性则默认展示
      if (status && !isPublished && !status.includes("发布")) {
        return;
      }

      const rawDate = getDate(findProp(p, "发布日期", "Date", "日期", "时间")) || page.created_time;
      const title = getText(findProp(p, "文章标题", "Title", "Name", "标题")) || "未命名文章";
      const category = getSelect(findProp(p, "主题/分类", "Category", "分类", "主题")) || "技术";
      const tagsList = getMultiSelect(findProp(p, "主要SEO关键词", "Tags", "Tag", "标签", "关键词"));
      const seoKeywords = getText(findProp(p, "主要SEO关键词", "Keywords", "摘要"));
      const splitKeywords = seoKeywords
        ? seoKeywords.split(/[,，、\s]+/).map((s: string) => s.trim()).filter(Boolean)
        : [];
      const finalTags = Array.from(new Set([...tagsList, ...splitKeywords]));
      const summary = getText(findProp(p, "Summary", "Description", "简介", "摘要")) || seoKeywords || "";

      items.push({
        id: page.id,
        title,
        created_at: new Date(rawDate).toISOString(),
        published_at: new Date(rawDate).toISOString(),
        summary,
        category,
        tags: finalTags,
        source: "Notion 原创",
        source_url: getUrl(findProp(p, "发布网址", "Url", "Link")) || undefined,
        post_type: "original",
        status: status || "已发布",
      });
    });

    return items;
  } catch (error) {
    console.error("抓取 Notion 博客文章列表失败:", error);
    return [];
  }
}

export async function fetchPostDetailFromNotion(pageId: string): Promise<NotionPostItem | null> {
  if (!NOTION_API_KEY) return null;
  try {
    const cleanId = extractDatabaseId(pageId);
    if (!cleanId) return null;

    const [pageRes, blocks] = await Promise.all([
      fetch(`https://api.notion.com/v1/pages/${cleanId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${NOTION_API_KEY}`,
          "Notion-Version": NOTION_VERSION,
        },
        next: { revalidate: 60 },
      }),
      fetchBlockChildren(cleanId),
    ]);

    if (!pageRes.ok) return null;
    const page = await pageRes.json();
    const p = page.properties;

    const rawDate = getDate(findProp(p, "发布日期", "Date", "日期", "时间")) || page.created_time;
    const title = getText(findProp(p, "文章标题", "Title", "Name", "标题")) || "未命名文章";
    const category = getSelect(findProp(p, "主题/分类", "Category", "分类", "主题")) || "技术";
    const tagsList = getMultiSelect(findProp(p, "主要SEO关键词", "Tags", "Tag", "标签", "关键词"));
    const seoKeywords = getText(findProp(p, "主要SEO关键词", "Keywords", "摘要"));
    const splitKeywords = seoKeywords
      ? seoKeywords.split(/[,，、\s]+/).map((s: string) => s.trim()).filter(Boolean)
      : [];
    const finalTags = Array.from(new Set([...tagsList, ...splitKeywords]));
    const summary = getText(findProp(p, "Summary", "Description", "简介", "摘要")) || seoKeywords || "";
    const status = getStatus(findProp(p, "状态", "Status", "State"));
    const markdownContent = await convertBlocksToMarkdown(blocks);

    return {
      id: page.id,
      title,
      created_at: new Date(rawDate).toISOString(),
      published_at: new Date(rawDate).toISOString(),
      summary,
      category,
      tags: finalTags,
      source: "Notion 原创",
      source_url: getUrl(findProp(p, "发布网址", "Url", "Link")) || undefined,
      post_type: "original",
      status: status || "已发布",
      content: markdownContent,
    };
  } catch (error) {
    console.error("获取 Notion 博客详情失败:", error);
    return null;
  }
}