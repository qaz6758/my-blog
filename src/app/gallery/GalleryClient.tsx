"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import type { GalleryImage } from "@/types/gallery";

export default function GalleryClient({ photos }: { photos: GalleryImage[] }) {
  const [isGrid, setIsGrid] = useState(true);
  const [activePhoto, setActivePhoto] = useState<GalleryImage | null>(null);

  // Close lightbox on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActivePhoto(null);
    };
    if (activePhoto) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePhoto]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (activePhoto) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [activePhoto]);

  return (
    <div className="w-full px-5 sm:px-8 md:px-10 lg:px-14 xl:px-16 pt-20 sm:pt-24 pb-16">
      {/* 布局切换按钮 (参考 Anthony Fu 极简无框半透明图标) */}
      <div className="mb-3 sm:mb-4 flex items-center">
        <button
          onClick={() => setIsGrid(!isGrid)}
          className="p-1 text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-opacity opacity-70 hover:opacity-100 cursor-pointer"
          title={isGrid ? "切换为原比例瀑布流" : "切换为等方网格"}
          aria-label="Toggle gallery layout"
        >
          {isGrid ? (
            // 6 宫格矩阵图标 (参考图二原生样式)
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <rect x="3" y="4" width="4.5" height="6.5" rx="0.75" />
              <rect x="9.75" y="4" width="4.5" height="6.5" rx="0.75" />
              <rect x="16.5" y="4" width="4.5" height="6.5" rx="0.75" />
              <rect x="3" y="13.5" width="4.5" height="6.5" rx="0.75" />
              <rect x="9.75" y="13.5" width="4.5" height="6.5" rx="0.75" />
              <rect x="16.5" y="13.5" width="4.5" height="6.5" rx="0.75" />
            </svg>
          ) : (
            // 错落瀑布流图标
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <rect x="3" y="3" width="7.5" height="11" rx="0.75" />
              <rect x="13.5" y="3" width="7.5" height="6.5" rx="0.75" />
              <rect x="13.5" y="12" width="7.5" height="9" rx="0.75" />
              <rect x="3" y="16.5" width="7.5" height="4.5" rx="0.75" />
            </svg>
          )}
        </button>
      </div>

      {/* 照片画廊 */}
      {isGrid ? (
        // 正方形网格 (gap-3 sm:gap-4，完美复刻图二通透呼吸感)
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="relative aspect-square overflow-hidden group bg-neutral-100 dark:bg-[#252528] cursor-pointer focus:outline-none focus:ring-2 focus:ring-neutral-500"
              onClick={() => setActivePhoto(photo)}
              onKeyDown={(e) => e.key === "Enter" && setActivePhoto(photo)}
              tabIndex={0}
              role="button"
              aria-label={`View ${photo.title || "image"}`}
            >
              <Image
                src={photo.thumbnailUrl || photo.url}
                alt={photo.title || "Gallery image"}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
                priority={index < 4}
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkqAcAAIUAgUCsA+sAAAAASUVORK5CYII="
              />
            </div>
          ))}
        </div>
      ) : (
        // 原比例错落排版 (Masonry / Columns)
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-3 sm:gap-4">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="relative overflow-hidden group bg-neutral-100 dark:bg-[#252528] cursor-pointer break-inside-avoid mb-3 sm:mb-4 focus:outline-none focus:ring-2 focus:ring-neutral-500"
              onClick={() => setActivePhoto(photo)}
              onKeyDown={(e) => e.key === "Enter" && setActivePhoto(photo)}
              tabIndex={0}
              role="button"
              aria-label={`View ${photo.title || "image"}`}
            >
              <Image
                src={photo.thumbnailUrl || photo.url}
                alt={photo.title || "Gallery image"}
                width={photo.width || 800}
                height={photo.height || 800}
                className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                priority={index < 4}
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkqAcAAIUAgUCsA+sAAAAASUVORK5CYII="
              />
            </div>
          ))}
        </div>
      )}

      {/* Lightbox 效果 */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md cursor-pointer opacity-100 transition-opacity duration-300 p-4 select-none touch-none"
          onClick={() => setActivePhoto(null)}
        >


          {/* 图片展示区：手机端点击背景或直接点击浮层任意位置即可关闭 */}
          <div
            className="relative w-full h-full max-w-7xl max-h-[88vh] flex items-center justify-center pointer-events-none"
          >
            <Image
              src={activePhoto.url}
              alt={activePhoto.title || "Gallery image"}
              fill
              className="object-contain pointer-events-auto cursor-pointer"
              quality={100}
              priority
              onClick={() => setActivePhoto(null)}
            />
          </div>


        </div>
      )}
    </div>
  );
}
