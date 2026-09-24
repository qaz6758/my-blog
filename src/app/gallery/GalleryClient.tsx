"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { GalleryImage } from "@/types/gallery";
import { getGalleryImages } from "@/lib/gallery";
import { supabase } from "@/lib/supabase";

export default function GalleryClient({ photos: initialPhotos = [] }: { photos: GalleryImage[] }) {
  const [photos, setPhotos] = useState<GalleryImage[]>(initialPhotos);
  const [isGrid, setIsGrid] = useState(true);
  const [activePhoto, setActivePhoto] = useState<GalleryImage | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 后台静默实时同步 Supabase 最新画廊照片 (免构建部署，即时响应增删改)
  useEffect(() => {
    let isSubscribed = true;

    const refreshPhotos = async () => {
      try {
        const fresh = await getGalleryImages();
        if (isSubscribed && fresh) {
          setPhotos((prev) => {
            if (
              prev.length === fresh.length &&
              prev.every(
                (p, idx) =>
                  p.id === fresh[idx]?.id &&
                  p.url === fresh[idx]?.url &&
                  p.title === fresh[idx]?.title
              )
            ) {
              return prev;
            }
            return fresh;
          });
        }
      } catch (err) {
        console.warn("[Gallery] 客户端后台静默同步照片失败:", err);
      }
    };

    // 1. 进入画廊即刻在后台静默抓取最新数据
    refreshPhotos();

    // 2. 订阅 Supabase Postgres 实时推送 (在 Supabase 控制台增删改时无需刷新网页即刻同步)
    let channel: any = null;
    try {
      channel = supabase
        .channel("realtime_photos_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "photos" },
          () => {
            refreshPhotos();
          }
        )
        .subscribe();
    } catch (e) {
      console.warn("[Gallery] 实时频道订阅异常:", e);
    }

    return () => {
      isSubscribed = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // 若弹窗中的照片在后台已被删除，则自动关闭弹窗
  useEffect(() => {
    if (activePhoto && !photos.some((p) => p.id === activePhoto.id)) {
      setActivePhoto(null);
    }
  }, [photos, activePhoto]);

  // 键盘快捷键监听 (ESC 退出)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActivePhoto(null);
      }
    };
    if (activePhoto) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePhoto]);

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
          全屏 Lightbox 弹窗：点击图片展开，点击图片以外区域关闭 (PC 与移动端统一)
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
                {/* 核心大图展示区 (阻止冒泡，点击图片本身不关闭，点击图片外区域关闭) */}
                <motion.div
                  key={activePhoto.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="relative flex items-center justify-center max-w-[92vw] max-h-[88vh] z-20 cursor-default"
                  onClick={(e) => e.stopPropagation()}
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
