// src/components/post/PostContentWrapper.tsx
"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Copy, Check, Info } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Prism from "prismjs";
import { slugifyHeading } from "@/lib/utils";

// Prism 常用语言语法解析支持
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

const COPY_SVG = `<svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg><span>copy</span>`;
const CHECK_SVG = `<svg class="h-3 w-3 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg><span class="text-emerald-500">copied</span>`;

function processAndOptimizeHtml(rawHtml: string): string {
  if (!rawHtml) return "";
  let cleaned = rawHtml;

  // 1. 如果包含完整的 body 标签，优先提取 body 内部正文
  const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    cleaned = bodyMatch[1];
  }

  // 2. 全面剥离外层 DOCTYPE、html、head、body 及其残存标签（支持跨行与各种 DTD 声明）
  cleaned = cleaned
    .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/?(html|head|body|meta|link)[^>]*>/gi, "")
    .trim();

  // 3. 常见排版字符实体安全转码解码 (消除 don&rsquo;t 等丑陋实体源码)
  cleaned = cleaned
    .replace(/&rsquo;|&#8217;/gi, "'")
    .replace(/&lsquo;|&#8216;/gi, "'")
    .replace(/&rdquo;|&#8221;/gi, '"')
    .replace(/&ldquo;|&#8220;/gi, '"')
    .replace(/&mdash;|&#8212;/gi, "—")
    .replace(/&ndash;|&#8211;/gi, "–")
    .replace(/&hellip;|&#8230;/gi, "…")
    .replace(/&nbsp;/gi, " ");

  // 4. 图片优化 (WebP 代理与懒加载)
  cleaned = cleaned.replace(/<img\b([\s\S]*?)>/gi, (match, attrs) => {
    const srcMatch =
      attrs.match(/\bsrc=["'](.*?)["']/i) ||
      attrs.match(/\bdata-src=["'](.*?)["']/i);

    if (!srcMatch) return match;

    const rawSrc = srcMatch[1];
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

    const cleanAttrs = attrs
      .replace(/\b(src|data-src|srcset|sizes|loading|decoding|referrerpolicy)=["'][^"']*["']/gi, "")
      .trim();

    return `<img ${cleanAttrs} src="${optimizedSrc}" data-original-src="${rawSrc}" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`;
  });

  // 5. 将原生 <pre> 代码块转为 Mac 拟真终端窗口排版 (红黄绿三色控制圆点 + 顶部窗口栏)
  cleaned = cleaned.replace(/<pre\b([^>]*)>([\s\S]*?)<\/pre>/gi, (match, attrs, innerCode) => {
    if (attrs.includes("data-mac-styled")) return match;

    const langMatch =
      innerCode.match(/class=["'][^"']*language-([\w-]+)[^"']*["']/i) ||
      attrs.match(/class=["'][^"']*language-([\w-]+)[^"']*["']/i);
    const lang = langMatch ? langMatch[1] : "";

    return `<div class="mac-code-block group relative my-6 overflow-hidden rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-[#fbfbfb] dark:bg-[#232326] shadow-sm">
  <div class="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] bg-neutral-100/70 dark:bg-[#2c2c2e]/70 px-4 py-2.5 select-none">
    <div class="flex items-center gap-2">
      <span class="inline-block h-3 w-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/50"></span>
      <span class="inline-block h-3 w-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/50"></span>
      <span class="inline-block h-3 w-3 rounded-full bg-[#27c93f] border border-[#1aab29]/50"></span>
    </div>
    <span class="text-[11px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-medium">${lang || "Terminal"}</span>
    <button type="button" data-action="copy-code" aria-label="复制代码" class="flex items-center gap-1 rounded border border-black/[0.06] dark:border-white/[0.08] bg-white/70 dark:bg-neutral-800/70 px-2 py-0.5 text-[11px] font-mono text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer select-none">
      ${COPY_SVG}
    </button>
  </div>
  <pre ${attrs} data-mac-styled="true" class="overflow-x-auto p-4 sm:p-5 text-xs sm:text-[13.5px] leading-relaxed text-neutral-800 dark:text-neutral-200 font-mono">${innerCode}</pre>
</div>`;
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
    <div className="mac-code-block group relative my-6 overflow-hidden rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-[#fbfbfb] dark:bg-[#121214] shadow-sm">
      <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] bg-neutral-100/70 dark:bg-neutral-900/60 px-4 py-2.5 select-none">
        {/* Mac 红黄绿三色控制点 */}
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/50" />
          <span className="inline-block h-3 w-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/50" />
          <span className="inline-block h-3 w-3 rounded-full bg-[#27c93f] border border-[#1aab29]/50" />
        </div>

        {/* 语言标识 */}
        <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-medium">
          {language || "code"}
        </span>

        {/* 复制按钮 */}
        <button
          type="button"
          onClick={handleCopy}
          aria-label="复制代码"
          className="flex items-center gap-1 rounded border border-black/[0.06] dark:border-white/[0.08] bg-white/70 dark:bg-neutral-800/70 px-2 py-0.5 text-[11px] font-mono text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer select-none"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500">copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 text-neutral-400" />
              <span>copy</span>
            </>
          )}
        </button>
      </div>

      <pre
        suppressHydrationWarning
        className="overflow-x-auto p-4 sm:p-5 text-xs sm:text-[13.5px] leading-relaxed text-neutral-800 dark:text-neutral-200 font-mono"
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

  const cleanHtmlContent = useMemo(() => {
    return isHtml ? processAndOptimizeHtml(content) : content;
  }, [content, isHtml]);

  useEffect(() => {
    if (!contentRef.current || !isHtml) return;

    const preElements = contentRef.current.querySelectorAll("pre");

    preElements.forEach((pre) => {
      // 1. 如果没有在 mac-code-block 容器中，动态包裹为 Mac 样式
      if (pre.parentElement && !pre.parentElement.classList.contains("mac-code-block")) {
        const codeEl = pre.querySelector("code");
        const match = (codeEl?.className || pre.className || "").match(/language-(\w+)/);
        const lang = match ? match[1] : "";

        const wrapper = document.createElement("div");
        wrapper.className =
          "mac-code-block group relative my-6 overflow-hidden rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-[#fbfbfb] dark:bg-[#121214] shadow-sm";

        const header = document.createElement("div");
        header.className =
          "flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] bg-neutral-100/70 dark:bg-neutral-900/60 px-4 py-2.5 select-none";
        header.innerHTML = `
          <div class="flex items-center gap-2">
            <span class="inline-block h-3 w-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/50"></span>
            <span class="inline-block h-3 w-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/50"></span>
            <span class="inline-block h-3 w-3 rounded-full bg-[#27c93f] border border-[#1aab29]/50"></span>
          </div>
          <span class="text-[11px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-medium">${lang || "Terminal"}</span>
          <button type="button" data-action="copy-code" aria-label="复制代码" class="flex items-center gap-1 rounded border border-black/[0.06] dark:border-white/[0.08] bg-white/70 dark:bg-neutral-800/70 px-2 py-0.5 text-[11px] font-mono text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer select-none">
            ${COPY_SVG}
          </button>
        `;

        pre.parentNode?.insertBefore(wrapper, pre);
        wrapper.appendChild(header);
        wrapper.appendChild(pre);
        pre.classList.add("overflow-x-auto", "p-4", "sm:p-5", "text-xs", "sm:text-[13.5px]", "leading-relaxed", "text-neutral-800", "dark:text-neutral-200", "font-mono");
      }

      // 2. 语法高亮
      const codeEl = pre.querySelector("code");
      if (codeEl && pre.getAttribute("data-highlighted") !== "true") {
        pre.setAttribute("data-highlighted", "true");
        const match = (codeEl.className || "").match(/language-(\w+)/);
        if (match) {
          Prism.highlightElement(codeEl);
        }
      }
    });
  }, [cleanHtmlContent, isHtml]);

  const handleContentClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    const copyBtn = target.closest<HTMLButtonElement>('button[data-action="copy-code"]');
    if (copyBtn) {
      e.preventDefault();
      e.stopPropagation();

      const block = copyBtn.closest(".mac-code-block") || copyBtn.closest("pre");
      const codeEl = block?.querySelector("code") || block?.querySelector("pre") || block;
      if (!codeEl) return;

      try {
        const textToCopy = (codeEl as HTMLElement).innerText || codeEl.textContent || "";
        await navigator.clipboard.writeText(textToCopy);
        copyBtn.innerHTML = CHECK_SVG;
        setTimeout(() => {
          if (copyBtn) copyBtn.innerHTML = COPY_SVG;
        }, 2000);
      } catch (err) {
        console.error("复制失败:", err);
      }
      return;
    }

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
    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-5 [&_ul]:space-y-2
    [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-5 [&_ol]:space-y-2
    [&_li]:leading-relaxed
    [&_img]:rounded-lg sm:[&_img]:rounded-xl [&_img]:mx-auto [&_img]:my-6 [&_img]:max-w-full [&_img]:cursor-zoom-in [&_img]:transition-transform [&_img]:duration-200 hover:[&_img]:scale-[1.005]
    [&_a]:prose-link
    [&_table]:w-full [&_table]:overflow-x-auto [&_table]:block sm:[&_table]:table [&_table]:border-collapse [&_table]:my-6
    [&_th]:border [&_th]:border-neutral-200 dark:[&_th]:border-neutral-800 [&_th]:px-4 [&_th]:py-2.5 [&_th]:bg-neutral-100/70 dark:[&_th]:bg-neutral-900/70 [&_th]:font-semibold [&_th]:text-neutral-900 dark:[&_th]:text-neutral-100 [&_th]:text-left
    [&_td]:border [&_td]:border-neutral-200 dark:[&_td]:border-neutral-800 [&_td]:px-4 [&_td]:py-2.5 [&_td]:text-neutral-700 dark:[&_td]:text-neutral-300
    [&_tr:nth-child(even)]:bg-neutral-500/[0.02] dark:[&_tr:nth-child(even)]:bg-neutral-800/[0.15]
    [&_hr]:my-10 [&_hr]:border-neutral-200 dark:[&_hr]:border-neutral-800
  `;

  return (
    <>
      <style>{`
        .token.comment, .token.prolog, .token.doctype, .token.cdata { color: #6a737d; font-style: italic; }
        .dark .token.comment, .dark .token.prolog, .dark .token.doctype, .dark .token.cdata { color: #8b949e; }
        .token.punctuation { color: #586069; }
        .dark .token.punctuation { color: #c9d1d9; }
        .token.property, .token.tag, .token.boolean, .token.number, .token.constant, .token.symbol { color: #005cc5; }
        .dark .token.property, .dark .token.tag, .dark .token.boolean, .dark .token.number, .dark .token.constant, .dark .token.symbol { color: #79c0ff; }
        .token.selector, .token.attr-name, .token.string, .token.char, .token.builtin { color: #032f62; }
        .dark .token.selector, .dark .token.attr-name, .dark .token.string, .dark .token.char, .dark .token.builtin { color: #a5d6ff; }
        .token.operator, .token.entity, .token.url { color: #6f42c1; }
        .dark .token.operator, .dark .token.entity, .dark .token.url { color: #d2a8ff; }
        .token.keyword { color: #d73a49; font-weight: 500; }
        .dark .token.keyword { color: #ff7b72; font-weight: 500; }
        .token.function, .token.class-name { color: #6f42c1; }
        .dark .token.function, .dark .token.class-name { color: #d2a8ff; }
        .mac-code-block pre {
          margin: 0 !important;
          background: transparent !important;
          border: none !important;
        }
      `}</style>

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
            remarkPlugins={[remarkGfm]}
            components={{
              // Anthony Fu 风格引用卡片（自动识别 Note 提示框）
              blockquote: ({ children, node, ...props }) => {
                const text = getNodeText(children).trim();
                const isNote = /^(\[!NOTE\]|Note:?|\(i\)\s*Note)/i.test(text);

                if (isNote) {
                  return (
                    <div className="my-6 pl-4 py-1 border-l-2 border-sky-500 text-neutral-800 dark:text-neutral-200">
                      <div className="flex items-center gap-1.5 text-[13.5px] font-medium text-sky-500 dark:text-sky-400 mb-1 select-none">
                        <Info className="h-3.5 w-3.5" />
                        <span>Note</span>
                      </div>
                      <div className="text-[14.5px] sm:text-[15px] leading-relaxed opacity-90 [&>p]:mb-0 [&>p:not(:last-child)]:mb-2">
                        {children}
                      </div>
                    </div>
                  );
                }

                return (
                  <blockquote
                    className="my-6 border-l-2 border-neutral-300 dark:border-neutral-700 pl-4 py-1 text-neutral-600 dark:text-neutral-300 opacity-80"
                    {...props}
                  >
                    {children}
                  </blockquote>
                );
              },
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
                      className="rounded bg-neutral-200/60 px-1.5 py-0.5 text-[13px] text-neutral-800 dark:bg-neutral-800/80 dark:text-neutral-200"
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