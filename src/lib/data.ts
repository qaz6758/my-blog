// src/lib/data.ts
import { supabase } from '@/lib/supabase';
import {
  fetchPostsFromNotion as fetchNotionPosts,
  fetchPostDetailFromNotion as fetchNotionPostDetail,
  fetchThoughtsFromNotion as fetchNotionThoughts,
  NotionPostItem,
  NotionThoughtItem,
} from '@/lib/notion';

export type { NotionPostItem };

// ================= 类型定义 =================
export interface ThoughtMediaItem {
  id: string;
  author: string;
  action: string;
  time: string;
  fullTime?: string;
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

// 辅助函数：解析任意常见格式日期（包含中文字符串格式：2026年8月31日 星期一 00:00）
function parseAnyDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const direct = new Date(dateStr);
  if (!isNaN(direct.getTime())) return direct;

  const m = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日(?:\s+[^\s]+)?(?:\s+(\d{1,2}):(\d{1,2}))?/);
  if (m) {
    const year = m[1];
    const month = m[2].padStart(2, '0');
    const day = m[3].padStart(2, '0');
    const hour = (m[4] || '00').padStart(2, '0');
    const min = (m[5] || '00').padStart(2, '0');
    const parsed = new Date(`${year}-${month}-${day}T${hour}:${min}:00+08:00`);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

// 辅助函数：格式化时间（几天前 + 智能回退为 几年几月几日 星期几）
export function formatThoughtDate(dateStr: string): { relative: string; full: string } {
  if (!dateStr) return { relative: '', full: '' };
  const date = parseAnyDate(dateStr);
  if (!date || isNaN(date.getTime())) return { relative: dateStr, full: dateStr };

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const full = `${year}年${month}月${day}日 ${days[date.getDay()]}`;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  // 未来时间或 5 分钟以内
  if (diffMs < 5 * 60 * 1000) {
    return { relative: '刚刚', full };
  }

  const diffMin = Math.floor(diffMs / (1000 * 60));
  if (diffMin < 60) {
    return { relative: `${diffMin}分钟前`, full };
  }

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    return { relative: `${diffHour}小时前`, full };
  }

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) {
    return { relative: '昨天', full };
  }
  if (diffDay < 7) {
    return { relative: `${diffDay}天前`, full };
  }

  // 超过 7 天，自动回退为完整日期（几年几月几日 星期几）
  return { relative: full, full };
}

// ================= 随想录接口 (Notion CMS 优先 + Supabase 备份) =================

export async function fetchThoughts(): Promise<ThoughtMediaItem[]> {
  try {
    const [notionThoughts, supabaseRes] = await Promise.all([
      fetchNotionThoughts().catch(() => []),
      supabase
        .from('thoughts')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false }),
    ]);

    const supabaseItems: ThoughtMediaItem[] = (supabaseRes.data || []).map((item) => {
      const dateInfo = formatThoughtDate(item.created_at);
      return {
        id: item.id,
        author: item.author || 'Vince Ou',
        action: item.action || '',
        time: dateInfo.relative,
        fullTime: dateInfo.full,
        type: item.type || 'NOTE',
        year: item.year || new Date(item.created_at).getFullYear().toString(),
        title: item.title || '',
        description: item.description || '',
        rating: item.rating || undefined,
        tags: Array.isArray(item.tags) ? item.tags.join(', ') : item.tags,
        sourceUrl: item.source_url || undefined,
        posterUrl: item.poster_url || undefined,
        likes: item.likes || 0,
        upvotes: item.upvotes || 0,
        replies: item.replies || 0,
      };
    });

    if (notionThoughts.length > 0) {
      const formattedNotion: ThoughtMediaItem[] = notionThoughts.map((t) => {
        const dateInfo = formatThoughtDate(t.time);
        return {
          id: t.id,
          author: t.author,
          action: t.action,
          time: dateInfo.relative,
          fullTime: dateInfo.full,
          type: t.type,
          year: t.year,
          title: t.title,
          description: t.description,
          rating: t.rating,
          tags: t.tags,
          sourceUrl: t.sourceUrl,
          posterUrl: t.posterUrl,
          likes: t.likes,
          upvotes: t.upvotes,
          replies: t.replies,
        };
      });

      // 去重逻辑：以 Notion 为准，过滤掉 Supabase 中已有的相同 id 记录
      const notionIds = new Set(formattedNotion.map((t) => t.id));
      const filteredSupabase = supabaseItems.filter((t) => !notionIds.has(t.id));

      return [...formattedNotion, ...filteredSupabase];
    }

    return supabaseItems;
  } catch (err) {
    console.warn('[Fetch Thoughts Error]:', err);
    return [];
  }
}

export async function fetchThoughtDetail(id: string): Promise<ThoughtMediaItem | null> {
  const all = await fetchThoughts();
  const found = all.find((t) => t.id === id);
  if (found) return found;

  const { data, error } = await supabase
    .from('thoughts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;

  const dateInfo = formatThoughtDate(data.created_at);

  return {
    id: data.id,
    author: data.author,
    action: data.action,
    time: dateInfo.relative,
    fullTime: dateInfo.full,
    type: data.type,
    year: data.year,
    title: data.title,
    description: data.description,
    rating: data.rating,
    tags: Array.isArray(data.tags) ? data.tags.join(', ') : data.tags,
    sourceUrl: data.source_url,
    posterUrl: data.poster_url,
    likes: data.likes,
    upvotes: data.upvotes,
    replies: data.replies,
  };
}

// ================= 博客文章接口 (Notion CMS 优先 + Supabase 备份) =================

export async function fetchPosts(): Promise<NotionPostItem[]> {
  try {
    // 1. 并行从 Notion 与 Supabase 拉取文章
    const [notionPosts, supabaseRes] = await Promise.all([
      fetchNotionPosts().catch(() => []),
      supabase
        .from('posts')
        .select('id, slug, title, summary, category, tags, cover_image, status, published_at, created_at')
        .eq('is_published', true)
        .order('published_at', { ascending: false, nullsFirst: false }),
    ]);

    const supabaseItems: NotionPostItem[] = (supabaseRes.data || []).map((item) => ({
      id: item.id,
      slug: item.slug || item.id,
      title: item.title,
      created_at: item.created_at,
      published_at: item.published_at || item.created_at,
      summary: item.summary || '',
      category: item.category || '技术',
      tags: item.tags || [],
      cover_image: item.cover_image || undefined,
      source: item.title?.startsWith('http') ? 'RSS 聚合' : '博客存档',
      source_url: `/posts/${item.slug || item.id}`,
      post_type: 'original',
      status: item.status || '已发布',
    }));

    // 去重逻辑：如果 Notion 和 Supabase 存在相同 slug 或 id，以 Notion 为准
    const notionSlugs = new Set(notionPosts.map((p) => p.slug));
    const filteredSupabase = supabaseItems.filter(
      (p) => !notionSlugs.has(p.slug) && !notionSlugs.has(p.id)
    );

    // Notion 原创文章置顶优先，其后衔接 Supabase 历史内容
    return [...notionPosts, ...filteredSupabase];
  } catch (err) {
    console.warn('[Fetch Posts Error]:', err);
    return [];
  }
}

export async function fetchPostDetail(slugOrId: string): Promise<NotionPostItem | null> {
  // 1. 优先尝试从 Notion 抓取文章（包含完整 Blocks 转换后的 Markdown 正文）
  const notionPost = await fetchNotionPostDetail(slugOrId).catch(() => null);
  if (notionPost && notionPost.content) {
    return notionPost;
  }

  // 2. 若 Notion 未命中，从 Supabase 查询
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
  const query = supabase.from('posts').select('*');
  const { data, error } = isUuid 
    ? await query.or(`slug.eq.${slugOrId},id.eq.${slugOrId}`).single()
    : await query.eq('slug', slugOrId).single();

  if (error || !data) {
    return notionPost || null;
  }

  return {
    id: data.id,
    slug: data.slug || data.id,
    title: data.title,
    created_at: data.created_at,
    published_at: data.published_at || data.created_at,
    summary: data.summary || '',
    category: data.category || '技术',
    tags: data.tags || [],
    cover_image: data.cover_image || undefined,
    source: '原创',
    source_url: `/posts/${data.slug}`,
    post_type: 'original',
    status: data.status || '已发布',
    content: data.content || '',
  };
}

// ================= 向下兼容别名 (防止旧组件报错) =================
export const fetchThoughtsFromNotion = fetchThoughts;
export const fetchThoughtDetailFromNotion = fetchThoughtDetail;
export const fetchPostsFromNotion = fetchPosts;
export const fetchPostDetailFromNotion = fetchPostDetail;

// ================= 歌单与歌曲接口 (100% 保持 Supabase 托管) =================
export interface PlaylistCategoryItem {
  id: string;
  title: string;
  description: string;
  cover: string;
  tag: string;
  curatorNote: string;
  songs: {
    id: string | number;
    title: string;
    artist: string;
    album?: string;
    cover_url: string;
    audio_url: string;
    duration?: number | string;
  }[];
}

export async function fetchPlaylists(): Promise<PlaylistCategoryItem[]> {
  try {
    const { data: playlistsData, error: pErr } = await supabase
      .from('playlists')
      .select('*')
      .order('order_index', { ascending: true });

    if (pErr || !playlistsData || playlistsData.length === 0) {
      return [];
    }

    const { data: songsData } = await supabase
      .from('songs')
      .select('*')
      .eq('is_published', true)
      .order('weight', { ascending: false })
      .order('created_at', { ascending: false });

    const songsList = songsData || [];

    return playlistsData.map((pl) => {
      const plSongs = songsList
        .filter((s) => s.playlist_id === pl.id)
        .map((s) => ({
          id: s.id,
          title: s.title,
          artist: s.artist,
          album: s.album,
          cover_url: s.cover_url,
          audio_url: s.audio_url,
          duration: s.duration,
        }));

      return {
        id: pl.id,
        title: pl.title,
        description: pl.description || '',
        cover: pl.cover || pl.cover_url || '',
        tag: pl.tag || 'Music',
        curatorNote: pl.curator_note || '',
        songs: plSongs,
      };
    });
  } catch (err) {
    console.warn('[Fetch Playlists Error]:', err);
    return [];
  }
}
export const fetchPlaylistsFromNotion = fetchPlaylists;