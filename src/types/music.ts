// types/music.ts

export type MusicMood =
  | "all"
  | "favorites"
  | "japanese"
  | "chinese"
  | "night"
  | "instrumental";

export interface Track {
  id: string | number;
  title: string;
  artist: string;
  album?: string | null;
  year: number;
  duration?: string | null;       // 如 "04:13"
  cover_url: string;              // 封面图直链
  audio_url?: string | null;      // 试听音频直链（留空则不触发播放）
  external_url?: string | null;   // 第三方平台跳转（网易云/B站/Spotify）
  mood?: string[];                // 分类标签：["night", "favorites"]
  note?: string | null;           // 个人短评/感悟
  created_at?: string;
}