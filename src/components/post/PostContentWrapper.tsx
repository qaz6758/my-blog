"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Prism from "prismjs";
import clsx from "clsx";
import { slugifyHeading } from "@/lib/utils";

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
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-go";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";

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

    // 仅对外链且未被代理的图片进行 CDN WebP 优化（跳过 AWS S3 / Notion 原生签名图，防止签名损坏）
    const isNotionOrAws =
      rawSrc.includes("amazonaws.com") ||
      rawSrc.includes("notion.so") ||
      rawSrc.includes("notion-static.com");

    if (
      (rawSrc.startsWith("http://") || rawSrc.startsWith("https://")) &&
      !rawSrc.includes("wsrv.nl") &&
      !isNotionOrAws
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

function getNodeText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getNodeText).join("");
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    return props && props.children ? getNodeText(props.children) : "";
  }
  return "";
}

/**
 * 独立的 React 代码块组件（支持多语言语法高亮、顶栏 Mac 风格徽标、一键复制）
 */
function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const highlighted = useMemo(() => {
    if (!code) return "";
    const cleanLang = (language || "").toLowerCase().trim();
    const langMap: Record<string, string> = {
      ts: "typescript",
      js: "javascript",
      py: "python",
      sh: "bash",
      shell: "bash",
      yml: "yaml",
      html: "markup",
      xml: "markup",
      md: "markdown",
    };
    const targetLang = langMap[cleanLang] || cleanLang;
    const grammar = Prism.languages[targetLang] || Prism.languages.javascript;

    if (grammar) {
      try {
        return Prism.highlight(code, grammar, targetLang);
      } catch {
        return "";
      }
    }
    return "";
  }, [code, language]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("复制失败:", err);
    }
  };

  return (
    <div className="group relative my-6 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800 bg-[#0a0a0a] shadow-sm">
      {/* 顶栏信息与复制按钮 */}
      <div className="flex items-center justify-between border-b border-neutral-200/60 dark:border-neutral-800/80 bg-neutral-100/60 dark:bg-neutral-900/60 px-4 py-2 select-none backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            {language || "code"}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          aria-label="copy"
          className="flex items-center gap-1.5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-200/50 dark:bg-neutral-800/80 px-2 py-0.5 text-[11px] font-mono text-neutral-600 dark:text-neutral-300 transition-all duration-200 hover:border-neutral-400 dark:hover:border-neutral-500 hover:text-black dark:hover:text-white cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-neutral-400" />
              <span>copy</span>
            </>
          )}
        </button>
      </div>

      {/* 代码内容 */}
      <pre
        suppressHydrationWarning
        className="overflow-x-auto p-4 sm:p-5 font-mono text-xs sm:text-[13.5px] leading-relaxed text-neutral-200"
      >
        {highlighted ? (
          <code
            suppressHydrationWarning
            className={`language-${language}`}
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        ) : (
          <code suppressHydrationWarning className={`language-${language}`}>
            {code}
          </code>
        )}
      </pre>
    </div>
  );
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
  // 1. Prism.js 语法高亮与代码块顶栏注入（针对 HTML 模式）
  // =======================================================
  useEffect(() => {
    if (!contentRef.current || !isHtml) return;

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

    // A. 处理 HTML 模式下的复制按钮点击
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

  const proseClassName = `
    text-[15px] sm:text-[16px] leading-[1.8] text-neutral-750 dark:text-[#a3a3a3]
    [&_p]:mb-5
    [&_h1]:text-2xl sm:[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-10 [&_h1]:mb-4 [&_h1]:text-neutral-900 dark:[&_h1]:text-neutral-100 [&_h1]:tracking-tight
    [&_h2]:text-xl sm:[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-neutral-900 dark:[&_h2]:text-neutral-100 [&_h2]:tracking-tight
    [&_h3]:text-lg sm:[&_h3]:text-lg [&_h3]:font-bold [&_h3]:mt-7 [&_h3]:mb-3 [&_h3]:text-neutral-900 dark:[&_h3]:text-neutral-100 [&_h3]:tracking-tight
    [&_h4]:text-base [&_h4]:font-semibold [&_h4]:mt-6 [&_h4]:mb-2 [&_h4]:text-neutral-900 dark:[&_h4]:text-neutral-100
    [&_strong]:font-semibold [&_strong]:text-neutral-950 dark:[&_strong]:text-white
    [&_blockquote]:border-l-2 [&_blockquote]:border-neutral-300 dark:[&_blockquote]:border-neutral-700 [&_blockquote]:bg-neutral-500/[0.03] dark:[&_blockquote]:bg-neutral-800/[0.15] [&_blockquote]:px-4 [&_blockquote]:py-2.5 [&_blockquote]:my-6 [&_blockquote]:rounded-r-md [&_blockquote]:text-neutral-600 dark:[&_blockquote]:text-neutral-300
    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-5 [&_ul]:space-y-2
    [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-5 [&_ol]:space-y-2
    [&_li]:leading-relaxed
    [&_img]:rounded-lg sm:[&_img]:rounded-xl [&_img]:mx-auto [&_img]:my-6 [&_img]:max-w-full [&_img]:cursor-zoom-in [&_img]:transition-transform [&_img]:duration-200 hover:[&_img]:scale-[1.005]
    [&_a]:prose-link
    [&_table]:w-full [&_table]:overflow-x-auto [&_table]:block [&_table]:whitespace-nowrap sm:[&_table]:whitespace-normal [&_table]:my-6
    [&_th]:border [&_th]:border-neutral-300 dark:[&_th]:border-neutral-800 [&_th]:px-4 [&_th]:py-2 [&_th]:bg-neutral-50 dark:[&_th]:bg-neutral-900/50
    [&_td]:border [&_td]:border-neutral-300 dark:[&_td]:border-neutral-800 [&_td]:px-4 [&_td]:py-2
    [&_hr]:my-10 [&_hr]:border-neutral-200 dark:[&_hr]:border-neutral-800
  `;

  return (
    <>
      {/* 语法高亮配色主题 */}
      <style>{`
        .token.comment, .token.prolog, .token.doctype, .token.cdata { color: #8b949e; font-style: italic; }
        .token.punctuation { color: #c9d1d9; }
        .token.property, .token.tag, .token.boolean, .token.number, .token.constant, .token.symbol { color: #79c0ff; }
        .token.selector, .token.attr-name, .token.string, .token.char, .token.builtin { color: #a5d6ff; }
        .token.operator, .token.entity, .token.url { color: #d2a8ff; }
        .token.atrule, .token.attr-value, .token.keyword { color: #ff7b72; font-weight: 500; }
        .token.function, .token.class-name { color: #d2a8ff; }
        .token.regex, .token.important, .token.variable { color: #ffa657; }
      `}</style>

      {/* 正文渲染容器 */}
      {isHtml ? (
        <div
          ref={contentRef}
          onClick={handleContentClick}
          suppressHydrationWarning
          className={proseClassName}
          dangerouslySetInnerHTML={{ __html: cleanHtmlContent }}
        />
      ) : (
        <div
          ref={contentRef}
          onClick={handleContentClick}
          suppressHydrationWarning
          className={proseClassName}
        >
          <ReactMarkdown
            components={{
              h1: ({ children, node, ...props }) => {
                const id = slugifyHeading(getNodeText(children));
                return (
                  <h1 id={id} {...props}>
                    {children}
                  </h1>
                );
              },
              h2: ({ children, node, ...props }) => {
                const id = slugifyHeading(getNodeText(children));
                return (
                  <h2 id={id} {...props}>
                    {children}
                  </h2>
                );
              },
              h3: ({ children, node, ...props }) => {
                const id = slugifyHeading(getNodeText(children));
                return (
                  <h3 id={id} {...props}>
                    {children}
                  </h3>
                );
              },
              h4: ({ children, node, ...props }) => {
                const id = slugifyHeading(getNodeText(children));
                return (
                  <h4 id={id} {...props}>
                    {children}
                  </h4>
                );
              },
              pre: ({ children }) => <>{children}</>,
              code: ({ className, children, node, ...props }) => {
                const match = /language-(\w+)/.exec(className || "");
                const codeString = String(children).replace(/\n$/, "");
                const isInline = !match && !codeString.includes("\n");

                if (isInline) {
                  return (
                    <code
                      className="rounded bg-neutral-200/60 px-1.5 py-0.5 font-mono text-[13px] text-neutral-800 dark:bg-neutral-800/80 dark:text-neutral-200"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }

                return (
                  <CodeBlock
                    language={match ? match[1] : "text"}
                    code={codeString}
                  />
                );
              },
              img: ({ src, alt, node, ...props }) => {
                const rawSrc = typeof src === "string" ? src : "";
                let optimizedSrc = rawSrc;
                const isNotionOrAws =
                  rawSrc.includes("amazonaws.com") ||
                  rawSrc.includes("notion.so") ||
                  rawSrc.includes("notion-static.com");

                if (
                  (rawSrc.startsWith("http://") || rawSrc.startsWith("https://")) &&
                  !rawSrc.includes("wsrv.nl") &&
                  !isNotionOrAws
                ) {
                  optimizedSrc = `https://wsrv.nl/?url=${encodeURIComponent(rawSrc)}&w=900&output=webp&q=80`;
                }
                return (
                  <img
                    src={optimizedSrc}
                    alt={alt || "文章配图"}
                    data-original-src={rawSrc}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="mx-auto my-5 max-w-full cursor-zoom-in rounded-lg transition-transform duration-200 hover:scale-[1.01] sm:rounded-xl"
                    {...props}
                  />
                );
              },
              a: ({ href, children, node, ...props }) => {
                const isExternal = href?.startsWith("http://") || href?.startsWith("https://");
                return (
                  <a
                    href={href}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                    className="text-sky-600 underline underline-offset-4 transition-colors hover:text-sky-500 dark:text-sky-400"
                    {...props}
                  >
                    {children}
                  </a>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
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