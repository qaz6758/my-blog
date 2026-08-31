// components/playlist/lazy.ts
// 歌单相关重型组件懒加载注册中心

import dynamic from "next/dynamic";

// ─── 底部悬浮播放器 ───────────────────────────────────────────
// 含 framer-motion 动画 + 音频时间进度轮询，仅在用户开始播放后渲染
export const MusicPlayer = dynamic(
  () => import("@/components/playlist/MusicPlayer").then((m) => m.MusicPlayer),
  { ssr: false }
);

// ─── 歌单完整内容（左侧分类 + 右侧曲目网格）──────────────────
// 歌单页面核心内容，服务端无法访问 Notion API 时显示骨架屏
export const Playlist = dynamic(
  () => import("@/components/playlist/Playlist").then((m) => m.Playlist),
  { ssr: false }
);
