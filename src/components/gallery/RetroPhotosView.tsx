// src/components/gallery/RetroPhotosView.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { TypewriterTitle } from "@/components/common/TypewriterTitle";
import type { GalleryImage } from "@/types/gallery";

export function RetroPhotosView({ photos }: { photos: GalleryImage[] }) {
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryImage | null>(null);

  return (
 <div className="flex flex-col w-full flex-1 min-h-0 pt-0">
  <div className="flex items-center justify-center pb-1 mb-2.5 sm:mb-3 border-b-2 border-[#d0d7de] dark:border-white select-none">
    <h2 className="font-bold tracking-[0.12em] font-['W95FA',sans-serif] leading-none text-[19px] sm:text-[22px] text-[#24292f] dark:text-white">
      <TypewriterTitle text="Photos" />
    </h2>
  </div>

      <div className="flex flex-col flex-1">
        {photos && photos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 pt-1">
            {photos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="group relative cursor-pointer overflow-hidden rounded-[3px] border border-[#d0d7de] dark:border-white/40 bg-[#eaeef2] dark:bg-transparent aspect-4/3 transition-all hover:border-black dark:hover:border-white shadow-sm"
              >
                <Image
                  src={photo.thumbnailUrl || photo.url}
                  alt={photo.title || "Photo"}
                  fill
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-neutral-400 font-['W95FA',sans-serif]">
            No photos uploaded yet.
          </div>
        )}
      </div>

      {/* 放大预览弹窗：保留复古白边方框，仅展示纯净照片，与顶部悬浮 Dock 保持舒适间距，点击任意位置直接关闭 */}
      {selectedPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-40 bg-black/85 backdrop-blur-xs flex items-center justify-center pt-24 sm:pt-28 pb-8 px-4 sm:px-6 cursor-pointer select-none animate-in fade-in duration-150"
        >
          <div className="relative inline-flex items-center justify-center max-w-[90vw] max-h-[calc(100vh-140px)] bg-[#0a0a0a] border-2 border-white rounded-[4px] p-1.5 sm:p-2 shadow-[0_16px_50px_rgba(0,0,0,0.85)] overflow-hidden">
            <img
              src={selectedPhoto.hdUrl || selectedPhoto.url}
              alt={selectedPhoto.title || "Full photo"}
              className="max-h-[calc(100vh-160px)] max-w-[calc(90vw-20px)] w-auto h-auto object-contain rounded-[2px] block select-none pointer-events-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
