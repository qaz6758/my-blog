"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { GalleryImage } from "@/types/gallery";

export default function GalleryClient({ photos }: { photos: GalleryImage[] }) {
  const [isGrid, setIsGrid] = useState(true);
  const [activePhoto, setActivePhoto] = useState<GalleryImage | null>(null);
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
    setActivePhoto(photo);
  };

  return (
    <div className="w-full px-5 pt-24 sm:pt-28 pb-20 select-none">
      {/* 顶部视图切换按钮 (与左侧 Logo 严格左对齐，距左边缘 20px) */}
      <div className="mb-4 flex items-center">
        <button
          onClick={() => setIsGrid(!isGrid)}
          className="p-1 text-neutral-500 dark:text-neutral-400 opacity-40 hover:opacity-100 transition-opacity cursor-pointer focus:outline-none"
          title={isGrid ? "切换为原比例瀑布流" : "切换为等方网格"}
          aria-label="Toggle gallery layout"
        >
          {isGrid ? (
            // 4 宫格网格图标 (Anthony Fu 同款 i-ri-grid-line)
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7.5" height="7.5" rx="1" />
              <rect x="13.5" y="3" width="7.5" height="7.5" rx="1" />
              <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1" />
              <rect x="3" y="13.5" width="7.5" height="7.5" rx="1" />
            </svg>
          ) : (
            // 瀑布流图标
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7.5" height="11" rx="1" />
              <rect x="13.5" y="3" width="7.5" height="6.5" rx="1" />
              <rect x="13.5" y="12.5" width="7.5" height="8.5" rx="1" />
              <rect x="3" y="17" width="7.5" height="4" rx="1" />
            </svg>
          )}
        </button>
      </div>

      {/* 照片网格：极简 4 列，紧凑间距，无边框无白底 */}
      {isGrid ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-[#121212] cursor-pointer group"
              onClick={() => handleOpenPhoto(photo)}
              onKeyDown={(e) => e.key === "Enter" && handleOpenPhoto(photo)}
              tabIndex={0}
              role="button"
              aria-label={`View ${photo.title || "photo"}`}
            >
              <Image
                src={photo.thumbnailUrl || photo.url}
                alt={photo.title || "Gallery image"}
                fill
                className="object-cover transition-opacity duration-300 group-hover:opacity-90"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                priority={index < 8}
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkqAcAAIUAgUCsA+sAAAAASUVORK5CYII="
              />
            </div>
          ))}
        </div>
      ) : (
        // 瀑布流排版
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-3 sm:gap-4">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="relative overflow-hidden bg-neutral-100 dark:bg-[#121212] cursor-pointer group break-inside-avoid mb-3 sm:mb-4"
              onClick={() => handleOpenPhoto(photo)}
              onKeyDown={(e) => e.key === "Enter" && handleOpenPhoto(photo)}
              tabIndex={0}
              role="button"
              aria-label={`View ${photo.title || "photo"}`}
            >
              <Image
                src={photo.thumbnailUrl || photo.url}
                alt={photo.title || "Gallery image"}
                width={photo.width || 800}
                height={photo.height || 800}
                className="w-full h-auto object-cover transition-opacity duration-300 group-hover:opacity-90"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                priority={index < 8}
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkqAcAAIUAgUCsA+sAAAAASUVORK5CYII="
              />
            </div>
          ))}
        </div>
      )}

      {/* ========================================================
          全屏 Lightbox 弹窗 (Anthony Fu 同款：通透虚化背景 + 极简极净呈现)
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
                className="fixed inset-0 z-[9999] flex h-screen w-screen items-center justify-center backdrop-blur-2xl bg-white/75 dark:bg-black/75 p-4 sm:p-10 select-none cursor-zoom-out"
                onClick={() => setActivePhoto(null)}
              >
                {/* 左上角极简返回箭头 (对齐 Anthony Fu 原图图二) */}
                <button
                  type="button"
                  onClick={() => setActivePhoto(null)}
                  className="absolute top-5 left-5 sm:top-6 sm:left-[72px] z-50 flex items-center justify-center p-2 text-neutral-600 dark:text-neutral-300 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                  aria-label="返回画廊"
                  title="返回 (ESC)"
                >
                  <ChevronLeft className="h-6 w-6 stroke-[1.75]" />
                </button>

                {/* 左侧透明翻页触发区 */}
                {photos.length > 1 && (
                  <div
                    className="absolute left-0 top-0 bottom-0 w-[25vw] z-30 cursor-w-resize group flex items-center pl-6"
                    onClick={showPrev}
                  >
                    <div className="opacity-0 group-hover:opacity-40 transition-opacity p-2 text-neutral-800 dark:text-white">
                      <ChevronLeft className="h-8 w-8 stroke-[1.5]" />
                    </div>
                  </div>
                )}

                {/* 右侧透明翻页触发区 */}
                {photos.length > 1 && (
                  <div
                    className="absolute right-0 top-0 bottom-0 w-[25vw] z-30 cursor-e-resize group flex items-center justify-end pr-6"
                    onClick={showNext}
                  >
                    <div className="opacity-0 group-hover:opacity-40 transition-opacity p-2 text-neutral-800 dark:text-white">
                      <ChevronRight className="h-8 w-8 stroke-[1.5]" />
                    </div>
                  </div>
                )}

                {/* 核心大图展示区 (保持原始比例，自然居中高清展现) */}
                <motion.div
                  key={activePhoto.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="relative flex items-center justify-center max-w-[92vw] max-h-[88vh] z-20 pointer-events-none"
                >
                  <img
                    src={activePhoto.hdUrl || activePhoto.url}
                    alt={activePhoto.title || "Gallery photo"}
                    className="max-h-[88vh] max-w-[90vw] object-contain shadow-2xl dark:shadow-black/80 rounded-none select-none"
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
