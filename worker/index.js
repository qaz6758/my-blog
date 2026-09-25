/**
 * Cloudflare Worker: Notion Realtime API Gateway
 * 专为 VinceOu's Blog 打造的免部署实时 Notion 数据网关
 * 
 * 作用：
 * 1. 安全携带 NOTION_API_KEY，消除前端密钥泄露风险；
 * 2. 完美解决跨域 (CORS) 问题；
 * 3. 毫秒级边缘缓存 (30s 缓存，写完 Notion 最多 30 秒自动全网更新)；
 * 4. 彻底终结前端手动构建与部署！
 */

const NOTION_VERSION = "2022-06-28";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
      // 1. 获取文章列表: GET /api/posts
      if (pathname === "/api/posts" || pathname === "/posts") {
        return await handleGetPosts(env);
      }

      // 2. 获取文章详情: GET /api/posts/:id
      if (pathname.startsWith("/api/posts/") || pathname.startsWith("/posts/")) {
        const id = pathname.replace(/^\/(api\/)?posts\//, "");
        return await handleGetPostDetail(id, env);
      }

      // 3. 获取随想录列表: GET /api/thoughts
      if (pathname === "/api/thoughts" || pathname === "/thoughts") {
        return await handleGetThoughts(env);
      }

      // 4. 获取随想录详情: GET /api/thoughts/:id
      if (pathname.startsWith("/api/thoughts/") || pathname.startsWith("/thoughts/")) {
        const id = pathname.replace(/^\/(api\/)?thoughts\//, "");
        return await handleGetThoughtDetail(id, env);
      }

      // 5. 获取歌单及歌曲列表: GET /api/playlists
      if (pathname === "/api/playlists" || pathname === "/playlists" || pathname === "/api/playlist") {
        return await handleGetPlaylists(env);
      }

      // 6. 默认健康检查
      return jsonResponse({
        status: "ok",
        message: "VinceOu Blog Notion Realtime API Gateway is running!",
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      return jsonResponse(
        { success: false, error: err.message || "Internal Server Error" },
        500
      );
    }
  },
};

/* ========================================================================= */
/* 路由处理器                                                                */
/* ========================================================================= */

// 全局阅读时长与字符数内存缓存，避免重复拉取 blocks
const POSTS_READ_TIME_CACHE = new Map();

async function getOrComputePostReadTime(cleanId, apiKey) {
  const cached = POSTS_READ_TIME_CACHE.get(cleanId);
  const now = Date.now();
  if (cached && now - cached.timestamp < 30 * 60 * 1000) {
    return cached.readTime;
  }

  try {
    let chars = 0;
    let cursor = undefined;
    let hasMore = true;
    let pages = 0;
    while (hasMore && pages < 5) {
      pages++;
      const url = new URL(`https://api.notion.com/v1/blocks/${cleanId}/children`);
      url.searchParams.set("page_size", "100");
      if (cursor) url.searchParams.set("start_cursor", cursor);

      const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Notion-Version": NOTION_VERSION,
        },
      });
      if (!res.ok) break;
      const data = await res.json();
      for (const block of data.results || []) {
        const textArr = block[block.type]?.rich_text;
        if (Array.isArray(textArr)) {
          for (const item of textArr) {
            chars += (item.plain_text || "").length;
          }
        }
      }
      hasMore = !!data.has_more;
      cursor = data.next_cursor || undefined;
    }

    const readTime = Math.max(1, Math.ceil(chars / 350));
    POSTS_READ_TIME_CACHE.set(cleanId, { readTime, timestamp: now });
    return readTime;
  } catch {
    return 1;
  }
}

async function handleGetPosts(env) {
  const postsDbId = env.NOTION_POSTS_DB_ID || "958002305c948374b96f0187a87dafcf";
  const apiKey = env.NOTION_API_KEY;

  if (!apiKey || !postsDbId) {
    return jsonResponse({ success: false, error: "Missing Notion credentials in Worker env" }, 500);
  }

  const cleanDbId = postsDbId.replace(/-/g, "").trim();
  const res = await fetch(`https://api.notion.com/v1/databases/${cleanDbId}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ page_size: 100 }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    return jsonResponse({ success: false, error: errData.message || res.statusText }, res.status);
  }

  const data = await res.json();
  const items = [];

  for (const page of data.results || []) {
    const p = page.properties;
    const status = getStatus(findProp(p, "状态", "Status", "State"));

    // 发布判定：只要不是归档或废弃，默认均允许展示（支持已发布、准备发布、编辑、起草、创意等）
    const isArchived =
      status.includes("归档") ||
      status.includes("废弃") ||
      status.includes("Trash") ||
      status.includes("Archived");

    if (isArchived) {
      continue;
    }

    const rawDate = getDate(findProp(p, "发布日期", "Date", "日期", "时间")) || page.created_time;
    const title = getText(findProp(p, "文章标题", "Title", "Name", "标题")) || "未命名文章";
    const category = getSelect(findProp(p, "主题/分类", "Category", "分类", "主题")) || "技术";
    const tagsList = getMultiSelect(findProp(p, "主要SEO关键词", "Tags", "Tag", "标签", "关键词"));
    const seoKeywords = getText(findProp(p, "主要SEO关键词", "Keywords", "摘要"));
    const splitKeywords = seoKeywords
      ? seoKeywords.split(/[,，、\s]+/).map((s) => s.trim()).filter(Boolean)
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
  }

  // 并行获取/计算已发布文章的真实阅读时长 (read_time)
  await Promise.all(
    items.map(async (item) => {
      const cleanId = String(item.id).replace(/-/g, "").trim();
      item.read_time = await getOrComputePostReadTime(cleanId, apiKey);
    })
  );

  // 边缘缓存 20 秒，平滑刷新 60 秒
  return jsonResponse({ success: true, data: items }, 200, {
    "Cache-Control": "public, max-age=20, s-maxage=30, stale-while-revalidate=60",
  });
}

async function handleGetPostDetail(pageId, env) {
  const apiKey = env.NOTION_API_KEY;
  if (!apiKey) {
    return jsonResponse({ success: false, error: "Missing NOTION_API_KEY in Worker env" }, 500);
  }

  const cleanId = pageId.replace(/-/g, "").trim();

  // 1. 获取页面元数据与属性
  const pageRes = await fetch(`https://api.notion.com/v1/pages/${cleanId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Notion-Version": NOTION_VERSION,
    },
  });

  if (!pageRes.ok) {
    return jsonResponse({ success: false, error: "Post not found" }, 404);
  }

  const page = await pageRes.json();
  const p = page.properties;

  // 2. 分页递归拉取全部 blocks (支持超 100 块长文，彻底杜绝文章末尾被截断)
  const allBlocks = [];
  let cursor = undefined;
  let hasMore = true;
  while (hasMore) {
    const url = new URL(`https://api.notion.com/v1/blocks/${cleanId}/children`);
    url.searchParams.set("page_size", "100");
    if (cursor) {
      url.searchParams.set("start_cursor", cursor);
    }
    const bRes = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Notion-Version": NOTION_VERSION,
      },
    });
    if (!bRes.ok) break;
    const bData = await bRes.json();
    if (Array.isArray(bData.results)) {
      allBlocks.push(...bData.results);
    }
    hasMore = !!bData.has_more;
    cursor = bData.next_cursor || undefined;
  }

  const rawDate = getDate(findProp(p, "发布日期", "Date", "日期", "时间")) || page.created_time;
  const title = getText(findProp(p, "文章标题", "Title", "Name", "标题")) || "未命名文章";
  const category = getSelect(findProp(p, "主题/分类", "Category", "分类", "主题")) || "技术";
  const tagsList = getMultiSelect(findProp(p, "主要SEO关键词", "Tags", "Tag", "标签", "关键词"));
  const seoKeywords = getText(findProp(p, "主要SEO关键词", "Keywords", "摘要"));
  const splitKeywords = seoKeywords
    ? seoKeywords.split(/[,，、\s]+/).map((s) => s.trim()).filter(Boolean)
    : [];
  const finalTags = Array.from(new Set([...tagsList, ...splitKeywords]));
  const summary = getText(findProp(p, "Summary", "Description", "简介", "摘要")) || seoKeywords || "";
  const status = getStatus(findProp(p, "状态", "Status", "State"));
  const markdownContent = convertBlocksToMarkdown(allBlocks);

  // 解析灵感与创意
  let inspiration = "";
  let inspirationUrl = "";
  const relProp = findProp(p, "灵感与创意", "Inspiration", "Source", "灵感", "创意");
  if (relProp && relProp.type === "relation" && Array.isArray(relProp.relation) && relProp.relation.length > 0) {
    const relId = relProp.relation[0].id;
    try {
      const relRes = await fetch(`https://api.notion.com/v1/pages/${relId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Notion-Version": NOTION_VERSION,
        },
      });
      if (relRes.ok) {
        const relPage = await relRes.json();
        inspiration = getText(findProp(relPage.properties, "Name", "Title", "标题", "灵感")) || "";
        inspirationUrl = getUrl(findProp(relPage.properties, "Url", "URL", "链接", "SourceUrl")) || "";
      }
    } catch {}
  }

  const cleanChars = markdownContent
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]*)\]\(.*?\)/g, "$1")
    .replace(/<[^>]*>/g, "")
    .replace(/[#>*_`~[\]\\]/g, "")
    .replace(/\s+/g, " ")
    .trim().length;
  const detailReadTime = Math.max(1, Math.ceil(cleanChars / 350));
  POSTS_READ_TIME_CACHE.set(cleanId, { readTime: detailReadTime, timestamp: Date.now() });

  const postDetail = {
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
    read_time: detailReadTime,
    inspiration,
    inspiration_url: inspirationUrl,
  };

  return jsonResponse({ success: true, data: postDetail }, 200, {
    "Cache-Control": "public, max-age=20, s-maxage=30, stale-while-revalidate=60",
  });
}

async function handleGetThoughts(env) {
  const thoughtsDbId = env.NOTION_THOUGHTS_DB_ID || "70c9f34b31154bd782dd24a9efba668a";
  const apiKey = env.NOTION_API_KEY;

  if (!apiKey || !thoughtsDbId) {
    return jsonResponse({ success: false, error: "Missing Notion credentials in Worker env" }, 500);
  }

  const cleanDbId = thoughtsDbId.replace(/-/g, "").trim().replace(/https?:\/\/app\.notion\.com\/p\//, "").split("?")[0];
  const res = await fetch(`https://api.notion.com/v1/databases/${cleanDbId}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ page_size: 100 }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    return jsonResponse({ success: false, error: errData.message || res.statusText }, res.status);
  }

  const data = await res.json();
  const items = [];

  for (const page of data.results || []) {
    const p = page.properties;
    const publishedProp = findProp(p, "Published", "公开", "发布");
    if (publishedProp && !getCheckbox(publishedProp)) continue;

    const rawDate = getDate(findProp(p, "Date", "日期", "时间")) || page.created_time;
    const ratingNum = getNumber(findProp(p, "Rating", "评分", "Score"));
    const ratingText = ratingNum !== null ? ratingNum.toString() : getText(findProp(p, "Rating", "评分"));
    const tagsList = getMultiSelect(findProp(p, "Tags", "Tag", "标签", "分类"));

    items.push({
      id: page.id,
      author: getText(findProp(p, "Author", "作者")) || "Vince Ou",
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
  }

  return jsonResponse({ success: true, data: items }, 200, {
    "Cache-Control": "public, max-age=20, s-maxage=30, stale-while-revalidate=60",
  });
}

async function handleGetThoughtDetail(pageId, env) {
  const apiKey = env.NOTION_API_KEY;
  if (!apiKey) {
    return jsonResponse({ success: false, error: "Missing NOTION_API_KEY in Worker env" }, 500);
  }

  const cleanId = pageId.replace(/-/g, "").trim();
  const res = await fetch(`https://api.notion.com/v1/pages/${cleanId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Notion-Version": NOTION_VERSION,
    },
  });

  if (!res.ok) {
    return jsonResponse({ success: false, error: "Thought not found" }, 404);
  }

  const page = await res.json();
  const p = page.properties;

  const rawDate = getDate(findProp(p, "Date", "日期", "时间")) || page.created_time;
  const ratingNum = getNumber(findProp(p, "Rating", "评分", "Score"));
  const ratingText = ratingNum !== null ? ratingNum.toString() : getText(findProp(p, "Rating", "评分"));
  const tagsList = getMultiSelect(findProp(p, "Tags", "Tag", "标签", "分类"));

  const item = {
    id: page.id,
    author: getText(findProp(p, "Author", "作者")) || "Vince Ou",
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
  };

  return jsonResponse({ success: true, data: item }, 200, {
    "Cache-Control": "public, max-age=20, s-maxage=30, stale-while-revalidate=60",
  });
}

/* ========================================================================= */
/* Notion 数据解析工具函数                                                   */
/* ========================================================================= */

function formatThoughtDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const days = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${year}年${month}月${day}日 ${days[date.getDay()]} ${hours}:${minutes}`;
}

function findProp(props, ...keys) {
  if (!props) return null;
  const lowerKeys = keys.map((k) => k.toLowerCase().replace(/[\s_-]/g, ""));
  for (const propKey of Object.keys(props)) {
    const cleanPropKey = propKey.toLowerCase().replace(/[\s_-]/g, "");
    if (lowerKeys.includes(cleanPropKey)) {
      return props[propKey];
    }
  }
  return null;
}

function getText(prop) {
  if (!prop) return "";
  if (prop.type === "title") return prop.title?.[0]?.plain_text || "";
  if (prop.type === "rich_text") return prop.rich_text?.[0]?.plain_text || "";
  return "";
}

function getUrl(prop) {
  if (!prop) return "";
  if (prop.type === "url") return prop.url || "";
  if (prop.type === "files") return prop.files?.[0]?.file?.url || prop.files?.[0]?.external?.url || "";
  return "";
}

function getSelect(prop) {
  if (!prop) return "";
  if (prop.type === "select") return prop.select?.name || "";
  return "";
}

function getMultiSelect(prop) {
  if (!prop) return [];
  if (prop.type === "multi_select") return (prop.multi_select || []).map((item) => item.name);
  return [];
}

function getNumber(prop) {
  if (!prop) return null;
  if (prop.type === "number") return typeof prop.number === "number" ? prop.number : null;
  return null;
}

function getCheckbox(prop) {
  if (!prop) return false;
  if (prop.type === "checkbox") return !!prop.checkbox;
  return false;
}

function getDate(prop) {
  if (!prop) return "";
  if (prop.type === "date") return prop.date?.start || "";
  return "";
}

function getStatus(prop) {
  if (!prop) return "";
  if (prop.type === "status") return prop.status?.name || "";
  if (prop.type === "select") return prop.select?.name || "";
  return "";
}

function richTextToMarkdown(richTextArray) {
  if (!Array.isArray(richTextArray)) return "";
  return richTextArray
    .map((item) => {
      let text = item.plain_text || "";
      const ann = item.annotations;
      if (!ann) return text;
      if (ann.code) text = `\`${text}\``;
      if (ann.bold) text = `**${text}**`;
      if (ann.italic) text = `*${text}*`;
      if (ann.strikethrough) text = `~~${text}~~`;
      if (item.href) text = `[${text}](${item.href})`;
      return text;
    })
    .join("");
}

function convertBlocksToMarkdown(blocks) {
  const lines = [];
  let skipEmptyAfterDivider = false;

  for (const block of blocks) {
    const type = block.type;
    const data = block[type];

    switch (type) {
      case "paragraph": {
        const text = richTextToMarkdown(data?.rich_text);
        if (!text && skipEmptyAfterDivider) {
          break;
        }
        if (text) {
          skipEmptyAfterDivider = false;
        }
        lines.push(text ? text + "\n" : "&nbsp;\n");
        break;
      }
      case "heading_1":
        skipEmptyAfterDivider = false;
        lines.push(`\n# ${richTextToMarkdown(data?.rich_text)}\n`);
        break;
      case "heading_2":
        skipEmptyAfterDivider = false;
        lines.push(`\n## ${richTextToMarkdown(data?.rich_text)}\n`);
        break;
      case "heading_3":
        skipEmptyAfterDivider = false;
        lines.push(`\n### ${richTextToMarkdown(data?.rich_text)}\n`);
        break;
      case "bulleted_list_item":
        skipEmptyAfterDivider = false;
        lines.push(`* ${richTextToMarkdown(data?.rich_text)}`);
        break;
      case "numbered_list_item":
        skipEmptyAfterDivider = false;
        lines.push(`1. ${richTextToMarkdown(data?.rich_text)}`);
        break;
      case "to_do":
        skipEmptyAfterDivider = false;
        lines.push(`* [${data?.checked ? "x" : " "}] ${richTextToMarkdown(data?.rich_text)}`);
        break;
      case "quote":
        skipEmptyAfterDivider = false;
        lines.push(`> ${richTextToMarkdown(data?.rich_text)}\n`);
        break;
      case "code": {
        skipEmptyAfterDivider = false;
        const codeText = (data?.rich_text || []).map((t) => t.plain_text).join("");
        const lang = data?.language || "";
        lines.push(`\n\`\`\`${lang}\n${codeText}\n\`\`\`\n`);
        break;
      }
      case "callout":
        skipEmptyAfterDivider = false;
        lines.push(`> 💡 ${richTextToMarkdown(data?.rich_text)}\n`);
        break;
      case "divider": {
        while (lines.length > 0 && (lines[lines.length - 1] === "&nbsp;\n" || lines[lines.length - 1].trim() === "")) {
          lines.pop();
        }
        lines.push(`\n---\n`);
        skipEmptyAfterDivider = true;
        break;
      }
      case "image": {
        const imgUrl = data?.file?.url || data?.external?.url || "";
        const caption = (data?.caption || []).map((t) => t.plain_text).join("") || "配图";
        if (imgUrl) {
          skipEmptyAfterDivider = false;
          lines.push(`\n![${caption}](${imgUrl})\n`);
        }
        break;
      }
      case "bookmark":
      case "link_preview": {
        const url = data?.url || "";
        if (url) {
          skipEmptyAfterDivider = false;
          lines.push(`\n[${url}](${url})\n`);
        }
        break;
      }
      default:
        if (data?.rich_text) {
          const content = richTextToMarkdown(data.rich_text);
          if (content.trim()) {
            skipEmptyAfterDivider = false;
            lines.push(content + "\n");
          }
        }
        break;
    }
  }
  return lines.join("\n");
}

async function handleGetPlaylists(env) {
  const apiKey = env.NOTION_API_KEY;
  const extractId = (str) => {
    if (!str) return "";
    const m = str.replace(/-/g, "").match(/[a-f0-9]{32}/i);
    return m ? m[0] : str.replace(/-/g, "").trim();
  };
  const playlistDbId = extractId(env.NOTION_PLAYLIST_DB_ID || "adca564c1bc649f887e90102230a00fd");
  const songsDbId = extractId(env.NOTION_SONGS_DB_ID || "f1b05bf2cffb4e71a370f608b16c0e28");

  if (!apiKey) {
    return jsonResponse({ success: false, error: "Missing NOTION_API_KEY in Worker env" }, 500);
  }

  async function queryDb(dbId) {
    let all = [];
    let hasMore = true;
    let cursor = undefined;
    while (hasMore) {
      const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Notion-Version": NOTION_VERSION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ page_size: 100, start_cursor: cursor }),
      });
      if (!res.ok) break;
      const data = await res.json();
      all.push(...(data.results || []));
      hasMore = !!data.has_more;
      cursor = data.next_cursor || undefined;
    }
    return all;
  }

  const [playlistPages, songPages] = await Promise.all([
    queryDb(playlistDbId),
    queryDb(songsDbId),
  ]);

  const allSongs = songPages.map((page) => {
    const p = page.properties;
    const rawCover = getUrl(findProp(p, "Cover", "Pic", "封面"));
    const cleanCover = rawCover
      ? rawCover.split("?")[0] + "?param=800y800"
      : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80";
    return {
      id: page.id,
      playlistKey: getText(findProp(p, "Playlist_Key", "PlaylistKey", "Playlist")),
      title: getText(findProp(p, "Title", "Name", "Song", "歌曲")) || "未知歌曲",
      artist: getText(findProp(p, "Artist", "Singer", "歌手")) || "未知歌手",
      album: getText(findProp(p, "Album", "专辑")),
      duration: getText(findProp(p, "Duration", "时长")) || "03:30",
      audio_url: getUrl(findProp(p, "AudioUrl", "Audio", "音频")),
      cover_url: cleanCover,
      order: getNumber(findProp(p, "Order", "序号", "No")),
    };
  });

  const categories = playlistPages
    .map((page) => {
      const p = page.properties;
      const key = getText(findProp(p, "ID_Key", "IDKey", "ID", "Slug")) || page.id;
      const title = getText(findProp(p, "Title", "Name", "歌单名称", "歌单")) || "精选歌单";
      const rawCover = getUrl(findProp(p, "Cover", "封面图", "Pic"));
      const cleanCover = rawCover
        ? rawCover.split("?")[0] + "?param=800y800"
        : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80";

      const matchedSongs = allSongs
        .filter((s) => s.playlistKey && (s.playlistKey === key || s.playlistKey === title))
        .sort((a, b) => {
          if (a.order !== null && b.order !== null) return a.order - b.order;
          if (a.order !== null) return -1;
          if (b.order !== null) return 1;
          return 0;
        });

      return {
        id: page.id,
        title,
        tag: getSelect(findProp(p, "Tag", "标签", "类型")) || "Apple Music",
        description: getText(findProp(p, "Description", "简介", "描述")) || "",
        curatorNote: getText(findProp(p, "CuratorNote", "手记", "推荐语", "Notes")),
        cover: cleanCover,
        order: getNumber(findProp(p, "Order", "排序", "权重")),
        songs: matchedSongs,
      };
    })
    .sort((a, b) => {
      if (a.order !== null && b.order !== null) return a.order - b.order;
      if (a.order !== null) return -1;
      if (b.order !== null) return 1;
      return 0;
    });

  return jsonResponse(
    { success: true, data: categories },
    200,
    {
      "Cache-Control": "public, max-age=15, s-maxage=30, stale-while-revalidate=60",
    }
  );
}

function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}
