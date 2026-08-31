"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import Prism from "prismjs";

// 常用语言语法支持
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-css";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/components/prism-python";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-markdown";

const COPY_SVG = `<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
const CHECK_SVG = `<svg class="h-3.5 w-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

/**
 * 清洗并优化 HTML 正文：剥离外壳标签，将 <img> 转换为 WebP 代理格式
 */
function processAndOptimizeHtml(rawHtml: string): string {
  if (!rawHtml) return "";
  let cleaned = rawHtml;

  // 1. 提取 body 内容
  const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) cleaned = bodyMatch[1];

  // 2. 清除外层多余的 HTML 容器标签
  cleaned = cleaned
    .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
    .replace(/<\/?(html|head|body)[^>]*>/gi, "")
    .trim();

  // 3. 重构 <img> 标签：去除原生干扰属性，注入 WebP 代理与防盗链配置
  cleaned = cleaned.replace(/<img\b([\s\S]*?)>/gi, (match, attrs) => {
    const srcMatch =
      attrs.match(/\bsrc=["'](.*?)["']/i) ||
      attrs.match(/\bdata-src=["'](.*?)["']/i);

    if (!srcMatch) return match;

    const rawSrc = srcMatch[1];
    let optimizedSrc = rawSrc;

    // 仅对外链且未被代理的图片进行 CDN WebP 优化
    if (
      (rawSrc.startsWith("http://") || rawSrc.startsWith("https://")) &&
      !rawSrc.includes("wsrv.nl")
    ) {
      optimizedSrc = `https://wsrv.nl/?url=${encodeURIComponent(rawSrc)}&w=900&output=webp&q=80`;
    }

    // 彻底剔除 srcset、sizes 等干扰属性
    const cleanAttrs = attrs
      .replace(/\b(src|data-src|srcset|sizes|loading|decoding|referrerpolicy)=["'][^"']*["']/gi, "")
      .trim();

    return `<img ${cleanAttrs} src="${optimizedSrc}" data-original-src="${rawSrc}" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`;
  });

  return cleaned;
}

interface PostContentWrapperProps {
  content: string;
  isHtml: boolean;
}

export function PostContentWrapper({ content, isHtml }: PostContentWrapperProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeImg, setActiveImg] = useState<{ src: string; alt: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 缓存清洗与格式化后的 HTML 内容
  const cleanHtmlContent = useMemo(() => {
    return isHtml ? processAndOptimizeHtml(content) : content;
  }, [content, isHtml]);

  // =======================================================
  // 1. Prism.js 语法高亮与代码块顶栏注入
  // =======================================================
  useEffect(() => {
    if (!contentRef.current) return;

    const preElements = contentRef.current.querySelectorAll("pre");

    preElements.forEach((pre) => {
      if (pre.getAttribute("data-code-ready") === "true") return;
      pre.setAttribute("data-code-ready", "true");
      pre.classList.add("relative", "group");

      const codeEl = pre.querySelector("code");
      let lang = "";

      if (codeEl) {
        const match = (codeEl.className || "").match(/language-(\w+)/);
        lang = match ? match[1] : "";
        Prism.highlightElement(codeEl);
      }

      // 构建工具栏 DOM
      const toolbar = document.createElement("div");
      toolbar.className =
        "absolute right-3 top-3 z-10 flex items-center gap-2 select-none pointer-events-auto";

      if (lang) {
        const langBadge = document.createElement("span");
        langBadge.className =
          "font-mono text-[10px] uppercase tracking-wider text-neutral-400 opacity-60";
        langBadge.innerText = lang;
        toolbar.appendChild(langBadge);
      }

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.setAttribute("data-action", "copy-code");
      copyBtn.setAttribute("aria-label", "复制代码");
      copyBtn.className =
        "flex h-7 w-7 items-center justify-center rounded-md border border-neutral-700/60 bg-neutral-800/80 text-neutral-400 backdrop-blur-sm transition-all duration-200 hover:border-neutral-600 hover:text-neutral-100 hover:bg-neutral-700 opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer";
      copyBtn.innerHTML = COPY_SVG;

      toolbar.appendChild(copyBtn);
      pre.appendChild(toolbar);
    });
  }, [cleanHtmlContent, isHtml]);

  // =======================================================
  // 2. 统一事件委托处理（代码复制与图片灯箱）
  // =======================================================
  const handleContentClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // A. 处理复制按钮点击
    const copyBtn = target.closest<HTMLButtonElement>('button[data-action="copy-code"]');
    if (copyBtn) {
      e.preventDefault();
      e.stopPropagation();

      const pre = copyBtn.closest("pre");
      const codeEl = pre?.querySelector("code") || pre;
      if (!codeEl) return;

      try {
        await navigator.clipboard.writeText(codeEl.innerText);
        copyBtn.innerHTML = CHECK_SVG;
        setTimeout(() => {
          if (copyBtn) copyBtn.innerHTML = COPY_SVG;
        }, 2000);
      } catch (err) {
        console.error("复制失败:", err);
      }
      return;
    }

    // B. 处理正文图片点击展开灯箱
    if (target.tagName === "IMG") {
      e.preventDefault();
      e.stopPropagation();
      const img = target as HTMLImageElement;
      const originalSrc = img.getAttribute("data-original-src") || img.src;
      setActiveImg({
        src: originalSrc,
        alt: img.alt || "文章配图",
      });
    }
  };

  // =======================================================
  // 3. 灯箱交互：ESC 键监听与页面滚动锁定
  // =======================================================
  const closeLightbox = useCallback(() => setActiveImg(null), []);

  useEffect(() => {
    if (!activeImg) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeImg, closeLightbox]);

  return (
    <>
      {/* 语法高亮配色主题 */}
      <style>{`
        .token.comment, .token.prolog, .token.doctype, .token.cdata { color: #8b949e; font-style: italic; }
        .token.punctuation { color: #c9d1d9; }
        .token.property, .token.tag, .token.boolean, .token.number, .token.constant, .token.symbol { color: #79c0ff; }
        .token.selector, .token.attr-name, .token.string, .token.char, .token.builtin { color: #a5d6ff; }
        .token.operator, .token.entity, .token.url { color: #d2a8ff; }
        .token.atrule, .token.attr-value, .token.keyword { color: #ff7b72; }
        .token.function, .token.class-name { color: #d2a8ff; }
        .token.regex, .token.important, .token.variable { color: #ffa657; }
      `}</style>

      {/* 正文渲染容器 */}
      {isHtml ? (
        <div
          ref={contentRef}
          onClick={handleContentClick}
          suppressHydrationWarning
          className="
            text-[14.5px] sm:text-[16px] leading-[1.8] text-neutral-800 dark:text-[#cbd5e1]
            [&_p]:mb-4 sm:[&_p]:mb-5
            [&_h1]:text-xl sm:[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 sm:[&_h1]:mt-8 [&_h1]:mb-3
            [&_h2]:text-lg sm:[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-2.5 [&_h2]:pb-1 [&_h2]:border-b [&_h2]:border-neutral-200 dark:[&_h2]:border-white/[0.06]
            [&_h3]:text-sm sm:[&_h3]:text-base [&_h3]:font-bold [&_h3]:mt-5 [&_h3]:mb-2
            [&_blockquote]:border-l-2 [&_blockquote]:border-neutral-300 dark:[&_blockquote]:border-neutral-700 [&_blockquote]:pl-3.5 [&_blockquote]:my-4 [&_blockquote]:italic
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4
            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4
            [&_img]:rounded-lg sm:[&_img]:rounded-xl [&_img]:mx-auto [&_img]:my-4 [&_img]:max-w-full [&_img]:cursor-zoom-in [&_img]:transition-transform [&_img]:duration-200 hover:[&_img]:scale-[1.01]
            [&_pre]:bg-[#0d1117] [&_pre]:border [&_pre]:border-white/[0.08] [&_pre]:p-4 sm:[&_pre]:p-5 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:my-5 [&_pre]:text-xs sm:[&_pre]:text-[13px] [&_pre]:leading-relaxed [&_pre]:font-mono
            [&_code]:font-mono [&_code]:text-neutral-200
            [&_a]:text-sky-600 dark:[&_a]:text-sky-400 [&_a]:underline
            [&_table]:w-full [&_table]:overflow-x-auto [&_table]:block [&_table]:whitespace-nowrap sm:[&_table]:whitespace-normal
            [&_th]:border [&_th]:border-neutral-300 dark:[&_th]:border-neutral-700 [&_th]:px-4 [&_th]:py-2
            [&_td]:border [&_td]:border-neutral-300 dark:[&_td]:border-neutral-700 [&_td]:px-4 [&_td]:py-2
          "
          dangerouslySetInnerHTML={{ __html: cleanHtmlContent }}
        />
      ) : (
        <div
          ref={contentRef}
          onClick={handleContentClick}
          className="text-[14.5px] sm:text-[16px] leading-[1.8] text-neutral-800 dark:text-[#cbd5e1] whitespace-pre-wrap [&_img]:cursor-zoom-in"
        >
          {content}
        </div>
      )}

      {/* 全屏大图灯箱 */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {activeImg && (
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="图片全屏预览"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={closeLightbox}
                className="fixed inset-0 z-[9999] flex h-screen w-screen items-center justify-center bg-black/90 p-4 sm:p-8"
              >
                <motion.div
                  initial={{ scale: 0.94, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.94, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative flex h-full w-full items-center justify-center"
                >
                  <button
                    type="button"
                    onClick={closeLightbox}
                    aria-label="关闭预览"
                    className="absolute right-0 top-0 z-20 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:scale-105 hover:bg-white/20 sm:right-2 sm:top-2"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  <img
                    src={activeImg.src}
                    alt={activeImg.alt}
                    referrerPolicy="no-referrer"
                    className="max-h-[90vh] max-w-[92vw] rounded-lg object-contain shadow-2xl shadow-black/60"
                  />
                </motion.div>

                <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] text-white/60 backdrop-blur-md">
                  点击空白处关闭 · ESC
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}