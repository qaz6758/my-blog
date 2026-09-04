// src/lib/notion.ts

const NOTION_API_KEY = process.env.NOTION_API_KEY?.trim();
const NOTION_VERSION = '2022-06-28';
const REQUEST_TIMEOUT_MS = 10000;

export interface NotionPostItem {
  id: string;
  slug: string;
  title: string;
  created_at: string;
  published_at: string;
  summary: string;
  category: string;
  tags: string[];
  source: string;
  source_url?: string;
  cover_image?: string;
  post_type: 'original' | 'notion' | 'rss';
  status: string;
  content?: string;
}

export interface NotionThoughtItem {
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

/**
 * 从 URL 或纯字符提取 32 位干净的 Notion 数据库/页面 ID
 */
export function extractDatabaseId(input?: string): string {
  if (!input) return '';
  const clean = input.replace(/-/g, '').trim();
  const match = clean.match(/[a-f0-9]{32}/i);
  return match ? match[0] : '';
}

/**
 * 属性模糊匹配辅助函数
 */
function findProp(props: any, ...keys: string[]) {
  if (!props) return null;
  const lowerKeys = keys.map((k) => k.toLowerCase().replace(/[\s_/-]/g, ''));
  for (const propKey of Object.keys(props)) {
    const cleanPropKey = propKey.toLowerCase().replace(/[\s_/-]/g, '');
    if (lowerKeys.includes(cleanPropKey)) {
      return props[propKey];
    }
  }
  return null;
}

function getText(prop: any): string {
  if (!prop) return '';
  if (prop.type === 'title') return prop.title?.[0]?.plain_text || '';
  if (prop.type === 'rich_text') {
    return (prop.rich_text || []).map((t: any) => t.plain_text).join('') || '';
  }
  return '';
}

function getUrl(prop: any): string {
  if (!prop) return '';
  if (prop.type === 'url') return prop.url || '';
  if (prop.type === 'rich_text') return prop.rich_text?.[0]?.plain_text || '';
  return '';
}

function getSelect(prop: any): string {
  if (!prop) return '';
  if (prop.type === 'select') return prop.select?.name || '';
  if (prop.type === 'status') return prop.status?.name || '';
  return '';
}

function getMultiSelect(prop: any): string[] {
  if (!prop) return [];
  if (prop.type === 'multi_select') {
    return (prop.multi_select || []).map((s: any) => s.name);
  }
  return [];
}

function getDate(prop: any): string {
  if (!prop) return '';
  if (prop.type === 'date') return prop.date?.start || '';
  if (prop.type === 'created_time') return prop.created_time || '';
  return '';
}

function getStatus(prop: any): string {
  if (!prop) return '';
  if (prop.type === 'status') return prop.status?.name || '';
  if (prop.type === 'select') return prop.select?.name || '';
  return '';
}

function getCheckbox(prop: any): boolean {
  if (!prop) return false;
  if (prop.type === 'checkbox') return Boolean(prop.checkbox);
  return false;
}

function getCover(page: any): string {
  if (!page) return '';
  if (page.cover?.type === 'external') return page.cover.external.url || '';
  if (page.cover?.type === 'file') return page.cover.file.url || '';
  return '';
}

/**
 * 递归转换 Notion RichText 为 Markdown 格式
 */
function richTextToMarkdown(richTexts: any[] = []): string {
  return richTexts
    .map((rt) => {
      let text = rt.plain_text || '';
      if (!text) return '';
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
    .join('');
}

/**
 * 获取页面的子块 (Block Children)
 */
async function fetchBlockChildren(blockId: string): Promise<any[]> {
  const cleanId = extractDatabaseId(blockId);
  if (!cleanId || !NOTION_API_KEY) return [];

  try {
    const res = await fetch(`https://api.notion.com/v1/blocks/${cleanId}/children?page_size=100`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': NOTION_VERSION,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      next: { revalidate: 60 },
    });

    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

/**
 * 将 Notion Blocks 转换为标准 Markdown
 */
async function convertBlocksToMarkdown(blocks: any[]): Promise<string> {
  const lines: string[] = [];

  for (const block of blocks) {
    const type = block.type;
    const data = block[type];

    switch (type) {
      case 'paragraph':
        lines.push(richTextToMarkdown(data?.rich_text) + '\n');
        break;
      case 'heading_1':
        lines.push(`\n# ${richTextToMarkdown(data?.rich_text)}\n`);
        break;
      case 'heading_2':
        lines.push(`\n## ${richTextToMarkdown(data?.rich_text)}\n`);
        break;
      case 'heading_3':
        lines.push(`\n### ${richTextToMarkdown(data?.rich_text)}\n`);
        break;
      case 'bulleted_list_item':
        lines.push(`* ${richTextToMarkdown(data?.rich_text)}`);
        break;
      case 'numbered_list_item':
        lines.push(`1. ${richTextToMarkdown(data?.rich_text)}`);
        break;
      case 'to_do':
        lines.push(`* [${data?.checked ? 'x' : ' '}] ${richTextToMarkdown(data?.rich_text)}`);
        break;
      case 'quote':
        lines.push(`> ${richTextToMarkdown(data?.rich_text)}\n`);
        break;
      case 'code':
        const codeText = (data?.rich_text || []).map((t: any) => t.plain_text).join('');
        const lang = data?.language || '';
        lines.push(`\n\`\`\`${lang}\n${codeText}\n\`\`\`\n`);
        break;
      case 'callout':
        const icon = data?.icon?.emoji || '💡';
        lines.push(`> ${icon} ${richTextToMarkdown(data?.rich_text)}\n`);
        break;
      case 'divider':
        lines.push(`\n---\n`);
        break;
      case 'image':
        const imgUrl = data?.file?.url || data?.external?.url || '';
        const caption = (data?.caption || []).map((t: any) => t.plain_text).join('') || '配图';
        if (imgUrl) lines.push(`\n![${caption}](${imgUrl})\n`);
        break;
      case 'bookmark':
      case 'link_preview':
        const url = data?.url || '';
        if (url) lines.push(`\n[${url}](${url})\n`);
        break;
      default:
        if (data?.rich_text) {
          lines.push(richTextToMarkdown(data.rich_text) + '\n');
        }
        break;
    }
  }

  return lines.join('\n');
}

/**
 * 从 Notion 抓取全部已发布文章
 */
export async function fetchPostsFromNotion(): Promise<NotionPostItem[]> {
  const postsDbId = extractDatabaseId(process.env.NOTION_POSTS_DB_ID);
  if (!postsDbId || !NOTION_API_KEY) return [];

  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${postsDbId}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ page_size: 100 }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.warn('[Notion Posts Warning] 查询失败:', res.statusText);
      return [];
    }

    const data = await res.json();
    const items: NotionPostItem[] = [];

    for (const page of data.results || []) {
      const p = page.properties;
      const status = getStatus(findProp(p, '状态', 'Status', 'State'));
      const isCheckboxPublished = getCheckbox(findProp(p, 'Published', '公开', '发布'));

      // 仅展示已发布或准备发布的文章
      const isPublished =
        isCheckboxPublished ||
        status.includes('已发布') ||
        status.includes('准备发布') ||
        status.includes('Published') ||
        status.includes('🚀') ||
        status.includes('✅');

      if (status && !isPublished) {
        continue;
      }

      const rawDate = getDate(findProp(p, '发布日期', 'Date', '日期', '时间')) || page.created_time;
      const title = getText(findProp(p, '文章标题', 'Title', 'Name', '标题')) || '未命名文章';
      const category = getSelect(findProp(p, '主题/分类', 'Category', '分类', '主题')) || '技术';
      const tagsList = getMultiSelect(findProp(p, '主要SEO关键词', 'Tags', 'Tag', '标签', '关键词'));
      const summary =
        getText(findProp(p, '灵感与创意', 'Summary', 'Description', '简介', '摘要')) || '';
      
      // 提取自定义网址 slug，若无则使用干净的 page id
      const customUrl = getUrl(findProp(p, '发布网址', 'Url', 'Slug', '路径'));
      const cleanSlug = customUrl
        ? customUrl.replace(/^https?:\/\/[^/]+\/posts\//, '').replace(/^\/posts\//, '').replace(/^\//, '').trim()
        : page.id.replace(/-/g, '');

      items.push({
        id: page.id,
        slug: cleanSlug,
        title,
        created_at: new Date(rawDate).toISOString(),
        published_at: new Date(rawDate).toISOString(),
        summary,
        category,
        tags: tagsList,
        cover_image: getCover(page),
        source: 'Notion 原创',
        source_url: `/posts/${cleanSlug}`,
        post_type: 'notion',
        status: status || '已发布 🚀',
      });
    }

    return items;
  } catch (error) {
    console.warn('[Notion Posts Warning] 抓取 Notion 博客列表异常:', error);
    return [];
  }
}

/**
 * 获取单篇 Notion 文章详情与正文
 */
export async function fetchPostDetailFromNotion(slugOrId: string): Promise<NotionPostItem | null> {
  if (!NOTION_API_KEY) return null;

  try {
    const cleanTarget = extractDatabaseId(slugOrId);
    let targetPageId = cleanTarget;

    // 如果传入的不是 32 位 ID，而是自定义 Slug，则先检索对应的 Page
    if (!cleanTarget || cleanTarget.length < 32) {
      const allPosts = await fetchPostsFromNotion();
      const matched = allPosts.find((p) => p.slug === slugOrId || p.id === slugOrId);
      if (matched) {
        targetPageId = extractDatabaseId(matched.id);
      }
    }

    if (!targetPageId) return null;

    const [pageRes, blocks] = await Promise.all([
      fetch(`https://api.notion.com/v1/pages/${targetPageId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': NOTION_VERSION,
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        next: { revalidate: 60 },
      }),
      fetchBlockChildren(targetPageId),
    ]);

    if (!pageRes.ok) return null;
    const page = await pageRes.json();
    const p = page.properties;

    const rawDate = getDate(findProp(p, '发布日期', 'Date', '日期', '时间')) || page.created_time;
    const title = getText(findProp(p, '文章标题', 'Title', 'Name', '标题')) || '未命名文章';
    const category = getSelect(findProp(p, '主题/分类', 'Category', '分类', '主题')) || '技术';
    const tagsList = getMultiSelect(findProp(p, '主要SEO关键词', 'Tags', 'Tag', '标签', '关键词'));
    const summary =
      getText(findProp(p, '灵感与创意', 'Summary', 'Description', '简介', '摘要')) || '';
    const status = getStatus(findProp(p, '状态', 'Status', 'State'));
    const customUrl = getUrl(findProp(p, '发布网址', 'Url', 'Slug', '路径'));
    const cleanSlug = customUrl
      ? customUrl.replace(/^https?:\/\/[^/]+\/posts\//, '').replace(/^\/posts\//, '').replace(/^\//, '').trim()
      : page.id.replace(/-/g, '');

    const markdownContent = await convertBlocksToMarkdown(blocks);

    return {
      id: page.id,
      slug: cleanSlug,
      title,
      created_at: new Date(rawDate).toISOString(),
      published_at: new Date(rawDate).toISOString(),
      summary,
      category,
      tags: tagsList,
      cover_image: getCover(page),
      source: 'Notion 原创',
      source_url: `/posts/${cleanSlug}`,
      post_type: 'notion',
      status: status || '已发布 🚀',
      content: markdownContent,
    };
  } catch (error) {
    console.warn('[Notion PostDetail Warning] 获取 Notion 文章详情异常:', error);
    return null;
  }
}

/**
 * 抓取 Notion Thoughts 随想录
 */
export async function fetchThoughtsFromNotion(): Promise<NotionThoughtItem[]> {
  const thoughtsDbId = extractDatabaseId(process.env.NOTION_THOUGHTS_DB_ID);
  if (!thoughtsDbId || !NOTION_API_KEY) return [];

  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${thoughtsDbId}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ page_size: 100 }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      next: { revalidate: 60 },
    });

    if (!res.ok) return [];
    const data = await res.json();
    const items: NotionThoughtItem[] = [];

    for (const page of data.results || []) {
      const p = page.properties;
      const isPublished = getCheckbox(findProp(p, 'Published', '公开', '发布'));
      if (!isPublished && findProp(p, 'Published')) continue;

      const rawDate = getDate(findProp(p, 'Date', '日期', '时间')) || page.created_time;
      const title = getText(findProp(p, 'Title', '标题', 'Name')) || '';
      const content = getText(findProp(p, 'Content', 'Description', '内容', '正文')) || title;
      const tags = getText(findProp(p, 'Tags', '标签'));
      const type = getSelect(findProp(p, 'Type', '类型')) || 'NOTE';

      items.push({
        id: page.id,
        author: 'Vince Ou',
        action: getText(findProp(p, 'Action', '动态')) || '',
        time: rawDate,
        type,
        year: new Date(rawDate).getFullYear().toString(),
        title,
        description: content,
        rating: getText(findProp(p, 'Rating', '评分')),
        tags,
        sourceUrl: getUrl(findProp(p, 'SourceUrl', '链接')),
        posterUrl: getUrl(findProp(p, 'Poster', '封面')),
        likes: 0,
        upvotes: 0,
        replies: 0,
      });
    }

    return items;
  } catch {
    return [];
  }
}
