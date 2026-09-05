"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ExternalLink, Loader2 } from "lucide-react";
import type { GalleryImage } from "@/types/gallery";

export default function GalleryClient({ photos }: { photos: GalleryImage[] }) {
  const [isGrid, setIsGrid] = useState(true);
  const [activePhoto, setActivePhoto] = useState<GalleryImage | null>(null);
  const [isHdLoaded, setIsHdLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeIndex = activePhoto
    ? photos.findIndex((p) => p.id === activePhoto.id)
    : -1;

  const showPrev = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (photos.length === 0) return;
      setIsHdLoaded(false);
      if (activeIndex > 0) {
        setActivePhoto(photos[activeIndex - 1]);
      } else {
        setActivePhoto(photos[photos.length - 1]);
      }
    },
    [activeIndex, photos]
  );

  const showNext = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (photos.length === 0) return;
      setIsHdLoaded(false);
      if (activeIndex < photos.length - 1) {
        setActivePhoto(photos[activeIndex + 1]);
      } else {
        setActivePhoto(photos[0]);
      }
    },
    [activeIndex, photos]
  );

  // 键盘快捷键监听 (ESC 退出，左右箭头翻页)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActivePhoto(null);
      } else if (e.key === "ArrowLeft") {
        showPrev();
      } else if (e.key === "ArrowRight") {
        showNext();
      }
    };
    if (activePhoto) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePhoto, showPrev, showNext]);

  // 弹窗开启时锁定底层滚动
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

  const handleOpenPhoto = (photo: GalleryImage) => {
    setIsHdLoaded(false);
    setActivePhoto(photo);
  };

  return (
    <div className="w-full px-5 sm:px-8 md:px-10 lg:px-14 xl:px-16 pt-20 sm:pt-24 pb-16">
      {/* 布局切换按钮 */}
      <div className="mb-3 sm:mb-4 flex items-center">
        <button
          onClick={() => setIsGrid(!isGrid)}
          className="p-1 text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-opacity opacity-70 hover:opacity-100 cursor-pointer"
          title={isGrid ? "切换为原比例瀑布流" : "切换为等方网格"}
          aria-label="Toggle gallery layout"
        >
          {isGrid ? (
            // 6 宫格矩阵图标
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

      {/* 照片画廊网格 */}
      {isGrid ? (
        // 正方形网格
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="relative aspect-square overflow-hidden group bg-neutral-100 dark:bg-[#252528] cursor-pointer focus:outline-none focus:ring-2 focus:ring-neutral-500 rounded-sm"
              onClick={() => handleOpenPhoto(photo)}
              onKeyDown={(e) => e.key === "Enter" && handleOpenPhoto(photo)}
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
              className="relative overflow-hidden group bg-neutral-100 dark:bg-[#252528] cursor-pointer break-inside-avoid mb-3 sm:mb-4 focus:outline-none focus:ring-2 focus:ring-neutral-500 rounded-sm"
              onClick={() => handleOpenPhoto(photo)}
              onKeyDown={(e) => e.key === "Enter" && handleOpenPhoto(photo)}
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

      {/* ========================================================
          全屏 Lightbox 弹窗 (通过 Portal 脱离层级，覆盖全屏并绝对居中)
          ======================================================== */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {activePhoto && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[9999] flex h-screen w-screen items-center justify-center bg-black/90 backdrop-blur-xl p-4 sm:p-8 select-none"
                onClick={() => setActivePhoto(null)}
              >
                {/* 顶部控制栏 (原图链接 + 关闭按钮) */}
                <div
                  className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-2.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <a
                    href={activePhoto.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs backdrop-blur-md transition-colors cursor-pointer border border-white/10"
                    title="新窗口查看未经压缩的高清原图"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">原图</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setActivePhoto(null)}
                    className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white backdrop-blur-md transition-colors cursor-pointer border border-white/10"
                    aria-label="关闭预览"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* 上一张按钮 */}
                {photos.length > 1 && (
                  <button
                    type="button"
                    onClick={showPrev}
                    className="absolute left-3 sm:left-6 z-40 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white/70 hover:text-white backdrop-blur-md transition-all duration-200 cursor-pointer hover:scale-105 border border-white/10"
                    aria-label="上一张图片"
                  >
                    <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                )}

                {/* 下一张按钮 */}
                {photos.length > 1 && (
                  <button
                    type="button"
                    onClick={showNext}
                    className="absolute right-3 sm:right-6 z-40 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white/70 hover:text-white backdrop-blur-md transition-all duration-200 cursor-pointer hover:scale-105 border border-white/10"
                    aria-label="下一张图片"
                  >
                    <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                )}

                {/* 核心大图展示区 (严格屏幕中心对齐) */}
                <motion.div
                  key={activePhoto.id}
                  initial={{ scale: 0.96, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.96, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative flex items-center justify-center max-w-[90vw] max-h-[85vh]"
                >
                  {/* 1. 0ms 瞬间底图：复用已缓存的缩略图，杜绝黑屏等待 */}
                  <img
                    src={activePhoto.thumbnailUrl || activePhoto.url}
                    alt=""
                    aria-hidden="true"
                    className={`max-h-[85vh] max-w-[90vw] object-contain rounded-lg transition-opacity duration-300 pointer-events-none select-none ${
                      isHdLoaded ? "opacity-0 invisible" : "opacity-100 filter blur-[1px]"
                    }`}
                  />

                  {/* 2. 高清大图：2000px WebP 边缘 CDN 秒级加载，加载完成后平滑淡入 */}
                  <img
                    src={activePhoto.hdUrl || activePhoto.url}
                    alt={activePhoto.title || "Gallery photo"}
                    onLoad={() => setIsHdLoaded(true)}
                    className={`absolute inset-0 m-auto max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl transition-opacity duration-300 select-none ${
                      isHdLoaded ? "opacity-100" : "opacity-0"
                    }`}
                  />

                  {/* 高清加载微状态指示器 */}
                  {!isHdLoaded && (
                    <div className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs text-white/80 backdrop-blur-md border border-white/10">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>高清加载中...</span>
                    </div>
                  )}
                </motion.div>

                {/* 底部指示器：页码计数 + 快捷键提示 */}
                <div className="pointer-events-none absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 rounded-full bg-black/50 px-4 py-1.5 text-xs text-white/70 backdrop-blur-md border border-white/10">
                  <span className="font-medium text-white/90">
                    {activeIndex + 1} / {photos.length}
                  </span>
                  <span className="hidden sm:inline text-white/30">|</span>
                  <span className="hidden sm:inline text-white/50">
                    ← → 键翻页 · ESC 退出
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
