// src/lib/notion.ts
import { getProxyImageUrl } from '@/lib/image-proxy';

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
  is_pinned?: boolean;
  content?: string;
  inspiration?: string;
  inspiration_url?: string;
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
  let url = '';
  if (page.cover?.type === 'external') url = page.cover.external.url || '';
  if (page.cover?.type === 'file') url = page.cover.file.url || '';
  return url ? getProxyImageUrl(url) : '';
}

function getNumber(prop: any): number | null {
  if (!prop) return null;
  if (prop.type === 'number') return typeof prop.number === 'number' ? prop.number : null;
  return null;
}

function getImageFromPage(page: any): string {
  if (!page) return '';
  const p = page.properties;
  if (p) {
    const fileProp = findProp(p, 'Photo', 'Image', 'Cover', '封面', '图片', '照片', 'File', 'Files');
    if (fileProp) {
      if (fileProp.type === 'files' && Array.isArray(fileProp.files) && fileProp.files.length > 0) {
        const f = fileProp.files[0];
        const raw = f?.file?.url || f?.external?.url || '';
        return raw ? getProxyImageUrl(raw) : '';
      }
      if (fileProp.type === 'url') {
        return fileProp.url ? getProxyImageUrl(fileProp.url) : '';
      }
    }
  }
  return getCover(page);
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
 * 严格判断 Notion 页面是否属于已发布状态
 * 绝不把未发布的草稿公开
 */
export function isPagePublished(properties: any): boolean {
  if (!properties) return false;

  // 1. 优先检查 Published 勾选框
  const pubCheckbox = findProp(properties, 'Published', '公开', '发布');
  if (pubCheckbox && pubCheckbox.type === 'checkbox') {
    return Boolean(pubCheckbox.checkbox);
  }

  // 2. 检查状态属性
  const statusProp = findProp(properties, '状态', 'Status', 'State', '阶段');
  if (statusProp) {
    const statusVal = getStatus(statusProp);
    if (!statusVal) return false;
    return (
      statusVal.includes('已发布') ||
      statusVal.includes('Published') ||
      statusVal.includes('🚀') ||
      statusVal.includes('✅')
    );
  }

  return false;
}

/**
 * 获取页面的子块 (Block Children) - 支持超 100 块长文完整分页拉取
 */
async function fetchBlockChildren(blockId: string): Promise<any[]> {
  const cleanId = extractDatabaseId(blockId);
  if (!cleanId || !NOTION_API_KEY) return [];

  const results: any[] = [];
  let cursor: string | undefined = undefined;

  try {
    do {
      const url = new URL(`https://api.notion.com/v1/blocks/${cleanId}/children`);
      url.searchParams.set('page_size', '100');
      if (cursor) {
        url.searchParams.set('start_cursor', cursor);
      }

      const res: Response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': NOTION_VERSION,
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        next: { revalidate: 10 },
      });

      if (!res.ok) break;
      const data: any = await res.json();
      if (Array.isArray(data.results)) {
        results.push(...data.results);
      }
      cursor = data.has_more ? data.next_cursor : undefined;
    } while (cursor);

    return results;
  } catch {
    return results;
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
      case 'paragraph': {
        const text = richTextToMarkdown(data?.rich_text);
        // 若为 Notion 空白段落块（用户按回车留白），输出 &nbsp; 保留物理空行，避免被 Markdown 引擎合并吞掉
        lines.push(text ? text + '\n' : '&nbsp;\n');
        break;
      }
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
        if (imgUrl) {
          const proxiedUrl = getProxyImageUrl(imgUrl);
          lines.push(`\n![${caption}](${proxiedUrl})\n`);
        }
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
 * 从 Notion 抓取全部已发布文章 (严格过滤草稿，注入 ISR 标签)
 */
export async function fetchPostsFromNotion(): Promise<NotionPostItem[]> {
  const postsDbId = extractDatabaseId(process.env.NOTION_POSTS_DB_ID);
  if (!postsDbId || !NOTION_API_KEY) return [];

  const items: NotionPostItem[] = [];
  let cursor: string | undefined = undefined;

  try {
    do {
      const res: Response = await fetch(`https://api.notion.com/v1/databases/${postsDbId}/query`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': NOTION_VERSION,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page_size: 100,
          start_cursor: cursor,
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        next: { revalidate: 10 },
      });

      if (!res.ok) {
        console.warn('[Notion Posts Warning] 查询失败:', res.statusText);
        break;
      }

      const data: any = await res.json();

      for (const page of data.results || []) {
        const p = page.properties;
        
        // 严格检查是否已发布（未勾选或草稿直接跳过）
        if (!isPagePublished(p)) {
          continue;
        }

        const status = getStatus(findProp(p, '状态', 'Status', 'State'));
        const isPinned = getCheckbox(findProp(p, '置顶', 'Pinned', 'Top', 'IsPinned', 'is_pinned', '精选'));
        const rawDate = getDate(findProp(p, '发布日期', 'Date', '日期', '时间')) || page.created_time;
        const title = getText(findProp(p, '文章标题', 'Title', 'Name', '标题')) || '未命名文章';
        const category = getSelect(findProp(p, '主题/分类', 'Category', '分类', '主题')) || '技术';
        let tagsList = getMultiSelect(findProp(p, '主要SEO关键词', 'Tags', 'Tag', '标签', '关键词'));
        if (!tagsList || tagsList.length === 0) {
          const rawTagsText = getText(findProp(p, '主要SEO关键词', 'Tags', 'Tag', '标签', '关键词'));
          if (rawTagsText) {
            tagsList = rawTagsText.split(/[,，、]/).map((s) => s.trim()).filter(Boolean);
          }
        }
        const summary =
          getText(findProp(p, '灵感与创意', 'Summary', 'Description', '简介', '摘要', '文本')) || '';
        
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
          is_pinned: isPinned,
        });
      }

      cursor = data.has_more ? data.next_cursor : undefined;
    } while (cursor);

    // 优先按置顶排前，其次按发布时间倒序
    items.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime();
    });

    return items;
  } catch (error) {
    console.warn('[Notion Posts Warning] 抓取 Notion 博客列表异常:', error);
    return [];
  }
}

/**
 * 获取单篇 Notion 文章详情与正文 (未发布文章拦截返回 null)
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
        next: { revalidate: 10 },
      }),
      fetchBlockChildren(targetPageId),
    ]);

    if (!pageRes.ok) return null;
    const page = await pageRes.json();
    const p = page.properties;

    // 严格校验是否已发布：若为未发布草稿，直接返回 null 触发 404
    if (!isPagePublished(p)) {
      return null;
    }

    const isPinned = getCheckbox(findProp(p, '置顶', 'Pinned', 'Top', 'IsPinned', 'is_pinned', '精选'));
    const rawDate = getDate(findProp(p, '发布日期', 'Date', '日期', '时间')) || page.created_time;
    const title = getText(findProp(p, '文章标题', 'Title', 'Name', '标题')) || '未命名文章';
    const category = getSelect(findProp(p, '主题/分类', 'Category', '分类', '主题')) || '技术';
    let tagsList = getMultiSelect(findProp(p, '主要SEO关键词', 'Tags', 'Tag', '标签', '关键词'));
    if (!tagsList || tagsList.length === 0) {
      const rawTagsText = getText(findProp(p, '主要SEO关键词', 'Tags', 'Tag', '标签', '关键词'));
      if (rawTagsText) {
        tagsList = rawTagsText.split(/[,，、]/).map((s) => s.trim()).filter(Boolean);
      }
    }
    // 1. 严格解析“灵感与创意”独立关联属性 (Inspiration Source)
    let inspiration = '';
    let inspirationUrl = '';
    const relProp = findProp(p, '灵感与创意', 'Inspiration', 'Source', '灵感', '创意');
    if (relProp && relProp.type === 'relation' && Array.isArray(relProp.relation) && relProp.relation.length > 0) {
      const relId = relProp.relation[0].id;
      try {
        const relRes = await fetch(`https://api.notion.com/v1/pages/${relId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${NOTION_API_KEY}`,
            'Notion-Version': NOTION_VERSION,
          },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          next: { revalidate: 10 },
        });
        if (relRes.ok) {
          const relData = await relRes.json();
          const titleProp = findProp(relData.properties, '创意/链接', 'Title', 'Name', '标题', '创意', '灵感');
          if (titleProp) {
            inspiration = getText(titleProp);
          }
          const urlProp = findProp(relData.properties, '来源网址', 'Url', 'URL', '链接');
          if (urlProp) {
            inspirationUrl = getUrl(urlProp);
          }
        }
      } catch (err) {
        console.warn('[Notion Inspiration Warning] 解析灵感关联失败:', err);
      }
    }

    // 2. 解析摘要 (Summary)
    let summary = getText(findProp(p, '文本', 'Summary', 'Description', '简介', '摘要')) || inspiration || '';

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
      is_pinned: isPinned,
      content: markdownContent,
      inspiration,
      inspiration_url: inspirationUrl,
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
      body: JSON.stringify({
        page_size: 100,
        sorts: [
          {
            timestamp: "created_time",
            direction: "descending",
          },
        ],
      }),
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

      const dateProp = findProp(p, 'Date', '日期', '时间');
      const specifiedDate = getDate(dateProp);
      let rawDate = page.created_time || '';
      if (specifiedDate) {
        if (specifiedDate.includes('T')) {
          rawDate = specifiedDate;
        } else if (page.created_time && page.created_time.startsWith(specifiedDate)) {
          rawDate = page.created_time;
        } else if (page.created_time) {
          const timePart = page.created_time.split('T')[1];
          rawDate = `${specifiedDate}T${timePart}`;
        } else {
          rawDate = specifiedDate;
        }
      }
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

    items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    return items;
  } catch {
    return [];
  }
}

export interface NotionPhotoItem {
  id: string;
  title: string;
  url: string;
  created_at: string;
  category?: string | null;
  location?: string | null;
  sort_order?: number | null;
}

/**
 * 抓取 Notion 画廊照片列表
 */
export async function fetchGalleryFromNotion(): Promise<NotionPhotoItem[]> {
  const galleryDbId = extractDatabaseId(process.env.NOTION_GALLERY_DB_ID);
  if (!galleryDbId || !NOTION_API_KEY) return [];

  const items: NotionPhotoItem[] = [];
  let cursor: string | undefined = undefined;

  try {
    do {
      const res: Response = await fetch(`https://api.notion.com/v1/databases/${galleryDbId}/query`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': NOTION_VERSION,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page_size: 100,
          start_cursor: cursor,
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        next: { revalidate: 60 },
      });

      if (!res.ok) {
        console.warn('[Notion Gallery Warning] 查询失败:', res.statusText);
        break;
      }

      const data: any = await res.json();

      for (const page of data.results || []) {
        const p = page.properties;

        // 如果配置了公开勾选框，未勾选的直接跳过
        if (findProp(p, 'Published', '公开', '发布') && !isPagePublished(p)) {
          continue;
        }

        const imgUrl = getImageFromPage(page);
        if (!imgUrl) continue;

        const title = getText(findProp(p, 'Title', 'Name', '标题', '名称')) || '';
        const category = getSelect(findProp(p, 'Category', '分类', '主题', 'Tag')) || null;
        const location = getText(findProp(p, 'Location', '地点', '位置')) || null;
        const rawDate = getDate(findProp(p, 'Date', '日期', '时间')) || page.created_time;
        const sortOrder = getNumber(findProp(p, 'Order', '序号', '排序', 'No'));

        items.push({
          id: page.id,
          title,
          url: imgUrl,
          created_at: new Date(rawDate).toISOString(),
          category,
          location,
          sort_order: sortOrder,
        });
      }

      cursor = data.has_more ? data.next_cursor : undefined;
    } while (cursor);

    // 优先按指定的数字序号从小到大排序；未指定的保持在 Notion 中的排列顺序
    items.sort((a, b) => {
      const orderA = a.sort_order ?? null;
      const orderB = b.sort_order ?? null;
      if (orderA !== null && orderB !== null) return orderA - orderB;
      if (orderA !== null) return -1;
      if (orderB !== null) return 1;
      return 0;
    });

    return items;
  } catch (error) {
    console.warn('[Notion Gallery Warning] 抓取 Notion 画廊异常:', error);
    return [];
  }
}

