// app/gallery/GalleryLoader.tsx
// ⚡ 客户端桥接 — 图片灯箱 + 网格交互逻辑延迟打包，不进入首屏主 Bundle
"use client";

import dynamic from "next/dynamic";
import type { GalleryImage } from "@/types/gallery";

const GalleryClient = dynamic(() => import("./GalleryClient"), {
  ssr: false,
});

export default function GalleryLoader({ photos }: { photos: GalleryImage[] }) {
  return <GalleryClient photos={photos} />;
}
