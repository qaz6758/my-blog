"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { LayoutGrid } from "lucide-react";
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
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [activePhoto]);

  return (
    <div className="mx-auto max-w-[1800px] px-4 sm:px-8 lg:px-12 pt-28">
      {/* 布局切换按钮 */}
      <div className="mb-6 flex items-center">
        <button
          onClick={() => setIsGrid(!isGrid)}
          className={`p-2 rounded-md transition-colors ${
            !isGrid 
              ? "bg-neutral-200 dark:bg-white/10 text-neutral-900 dark:text-white" 
              : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5"
          }`}
          title="Toggle Layout"
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
      </div>

      {/* 照片画廊 */}
      {isGrid ? (
        // 紧凑正方形网格
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
          {photos.map((photo) => (
            <div 
              key={photo.id} 
              className="relative aspect-square overflow-hidden group bg-neutral-100 dark:bg-[#0a0a0a] cursor-pointer focus:outline-none focus:ring-2 focus:ring-neutral-500"
              onClick={() => setActivePhoto(photo)}
              onKeyDown={(e) => e.key === 'Enter' && setActivePhoto(photo)}
              tabIndex={0}
              role="button"
              aria-label={`View ${photo.title || 'image'}`}
            >
              <Image
                src={photo.url}
                alt={photo.title || "Gallery image"}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
                priority={false}
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkqAcAAIUAgUCsA+sAAAAASUVORK5CYII="
              />
            </div>
          ))}
        </div>
      ) : (
        // 原比例错落排版 (Masonry / Columns)
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-8">
          {photos.map((photo) => (
            <div 
              key={photo.id} 
              className="relative overflow-hidden group bg-neutral-100 dark:bg-[#0a0a0a] cursor-pointer break-inside-avoid mb-8 focus:outline-none focus:ring-2 focus:ring-neutral-500"
              onClick={() => setActivePhoto(photo)}
              onKeyDown={(e) => e.key === 'Enter' && setActivePhoto(photo)}
              tabIndex={0}
              role="button"
              aria-label={`View ${photo.title || 'image'}`}
            >
              <Image
                src={photo.url}
                alt={photo.title || "Gallery image"}
                width={photo.width || 800}
                height={photo.height || 800}
                className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                priority={false}
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md cursor-pointer opacity-100 transition-opacity duration-300"
          onClick={() => setActivePhoto(null)}
        >
          <div 
            className="relative w-[90vw] h-[90vh] max-w-7xl max-h-[90vh] flex items-center justify-center cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={activePhoto.url}
              alt={activePhoto.title || "Gallery image"}
              fill
              className="object-contain"
              quality={100}
              priority
            />
          </div>
        </div>
      )}
    </div>
  );
}
