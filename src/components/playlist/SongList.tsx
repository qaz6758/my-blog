// src/components/playlist/SongList.tsx
// 统一歌曲与歌单数据类型规范与封面解析工具

export interface Song {
  id: string | number;
  title: string;
  artist: string;
  album?: string;
  cover_url: string;
  cover?: string;
  picUrl?: string;
  coverUrl?: string;
  audio_url: string;
  netease_id?: string | number;
  duration?: number | string;
  explicit?: boolean;
}

export interface PlaylistCategory {
  id: string;
  title: string;
  description?: string;
  songs?: Song[];
}

export const FALLBACK_SONG_COVER =
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80";

export function getSongCover(song: Song): string {
  return song.cover_url || song.cover || song.picUrl || song.coverUrl || "";
}