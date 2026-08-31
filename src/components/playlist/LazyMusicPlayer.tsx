// components/playlist/LazyMusicPlayer.tsx
// ⚡ 客户端桥接组件 — 播放器仅在用户点击播放后加载，所有页面生效
"use client";

import dynamic from "next/dynamic";

export const LazyMusicPlayer = dynamic(
  () => import("@/components/playlist/MusicPlayer").then((m) => m.MusicPlayer),
  { ssr: false }
);
