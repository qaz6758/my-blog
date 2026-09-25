// src/components/post/PostContentWrapper.tsx
"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Copy,
  Check,
  Info,
  Lightbulb,
  Flame,
  AlertTriangle,
  AlertOctagon,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Prism from "prismjs";
import { slugifyHeading } from "@/lib/utils";
import { getProxyImageUrl } from "@/lib/image-proxy";
import { useI18n } from "@/lib/i18n/I18nContext";

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

const COPY_SVG = `<svg class="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
const CHECK_SVG = `<svg class="h-3.5 w-3.5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

function processAndOptimizeHtml(rawHtml: string): string {
  if (!rawHtml) return "";
  let cleaned = rawHtml;

  // 1. 如果包含完整的 body 标签，优先提取 body 内部正文
  const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    cleaned = bodyMatch[1];
  }

  // 2. 全面剥离危险与外层标签 (防范存储型 XSS 注入并规范 HTML 结构)
  cleaned = cleaned
    .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[\s\S]*?<\/embed>/gi, "")
    .replace(/<form[\s\S]*?<\/form>/gi, "")
    .replace(/<\/?(html|head|body|meta|link|base|script|iframe|object|embed|form|input|button)[^>]*>/gi, "")
    // 剥离所有内联 on* 事件处理器 (例如 onerror, onload, onclick)
    .replace(/\s+on[a-zA-Z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    // 剥离 href/src 危险伪协议 (javascript:, vbscript:)
    .replace(/\b(href|src)\s*=\s*(["'])\s*(?:javascript|vbscript):[\s\S]*?\2/gi, '$1="#"')
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

    if (isNotionOrAws) {
      optimizedSrc = getProxyImageUrl(rawSrc);
    } else if (
      (rawSrc.startsWith("http://") || rawSrc.startsWith("https://")) &&
      !rawSrc.includes("wsrv.nl")
    ) {
      optimizedSrc = getProxyImageUrl(`https://wsrv.nl/?url=${encodeURIComponent(rawSrc)}&w=900&output=webp&q=80`);
    }

    const cleanAttrs = attrs
      .replace(/\b(src|data-src|srcset|sizes|loading|decoding|referrerpolicy)=["'][^"']*["']/gi, "")
      .trim();

    return `<img ${cleanAttrs} src="${optimizedSrc}" data-original-src="${isNotionOrAws ? optimizedSrc : rawSrc}" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`;
  });

  // 5. 将原生 <pre> 代码块转为现代极简代码块 (纯净无顶栏、无红黄绿圆点、无多余横线)
  cleaned = cleaned.replace(/<pre\b([^>]*)>([\s\S]*?)<\/pre>/gi, (match, attrs, innerCode) => {
    if (attrs.includes("data-styled")) return match;

    return `<div class="code-block-wrapper group relative my-6 overflow-hidden rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-[#f8f8fa] dark:bg-[#0c0c0e]">
  <button type="button" data-action="copy-code" aria-label="复制代码" class="absolute top-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-md border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-800/80 text-neutral-500 dark:text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-neutral-900 dark:hover:text-white transition-opacity duration-200 cursor-pointer select-none">
    ${COPY_SVG}
  </button>
  <pre ${attrs} data-styled="true" class="overflow-x-auto p-4 sm:p-5 text-[13px] sm:text-[14px] leading-relaxed text-neutral-800 dark:text-neutral-200 font-mono">${innerCode}</pre>
</div>`;
  });

  // 6. 将原生 <blockquote> 转为高质感 GitHub Alert / Note 引用卡片（方案 B：无论是否有 [!NOTE]，所有引用块全部变成 Note 提示卡片）
  cleaned = cleaned.replace(/<blockquote\b([^>]*)>([\s\S]*?)<\/blockquote>/gi, (match, attrs, inner) => {
    const textOnly = inner.replace(/<[^>]+>/g, "").trim();
    const alertMatch = textOnly.match(/^(\[!?(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]|(Note|Tip|Important|Warning|Caution):|\(i\)\s*Note|ℹ️\s*(Note|提示|注意|说明)?|💡\s*(Tip|提示|注意)?|⚠️\s*(Warning|警告|注意)?)/i);

    const configMap: Record<string, { title: string; border: string; color: string; svg: string }> = {
      note: {
        title: "笔记",
        border: "border-l-[#0969da] dark:border-l-[#2f81f7]",
        color: "text-[#0969da] dark:text-[#2f81f7]",
        svg: `<svg class="h-4 w-4 stroke-[2.2] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
      },
      tip: {
        title: "提示",
        border: "border-l-[#1a7f37] dark:border-l-[#3fb950]",
        color: "text-[#1a7f37] dark:text-[#3fb950]",
        svg: `<svg class="h-4 w-4 stroke-[2.2] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
      },
      important: {
        title: "重要",
        border: "border-l-[#8250df] dark:border-l-[#a371f7]",
        color: "text-[#8250df] dark:text-[#a371f7]",
        svg: `<svg class="h-4 w-4 stroke-[2.2] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
      },
      warning: {
        title: "警告",
        border: "border-l-[#9a6700] dark:border-l-[#d29922]",
        color: "text-[#9a6700] dark:text-[#d29922]",
        svg: `<svg class="h-4 w-4 stroke-[2.2] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
      },
      caution: {
        title: "注意",
        border: "border-l-[#cf222e] dark:border-l-[#f85149]",
        color: "text-[#cf222e] dark:text-[#f85149]",
        svg: `<svg class="h-4 w-4 stroke-[2.2] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>`,
      },
    };

    let typeKey = "note";
    let cleanedInner = inner;

    if (!alertMatch) {
      return `<blockquote ${attrs} class="my-4 border-l-[3.5px] border-neutral-300 dark:border-neutral-700 pl-4 py-1 text-neutral-600 dark:text-neutral-400 not-italic select-text font-sans"><div class="text-[14.5px] sm:text-[15px] leading-[1.75] [&>p]:mb-0 [&>p:not(:last-child)]:mb-2.5">${inner}</div></blockquote>`;
    }

    const rawKey = (alertMatch[2] || alertMatch[3] || "note").toLowerCase();
    typeKey = rawKey.includes("warn") ? "warning" : rawKey.includes("tip") ? "tip" : rawKey.includes("import") ? "important" : rawKey.includes("caut") ? "caution" : "note";

    cleanedInner = inner.replace(
      /^\s*(<p[^>]*>)?\s*(\[!?(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]|(Note|Tip|Important|Warning|Caution):|\(i\)\s*Note|ℹ️\s*(Note|提示|注意|说明)?|💡\s*(Tip|提示|注意)?|⚠️\s*(Warning|警告|注意)?)\s*(<br\s*\/?>)?/i,
      "$1"
    );

    const c = configMap[typeKey] || configMap.note;

    return `<div class="my-4 border-l-[3.5px] ${c.border} pl-4 py-1 bg-transparent not-italic select-text">
  <div class="flex items-center gap-1.5 text-[14px] sm:text-[14.5px] font-medium ${c.color} mb-1 select-none">
    ${c.svg}
    <span>${c.title}</span>
  </div>
  <div class="text-[14.5px] sm:text-[15px] leading-[1.75] text-neutral-700 dark:text-[#c9d1d9] font-sans [&>p]:mb-0 [&>p:not(:last-child)]:mb-2.5">
    ${cleanedInner}
  </div>
</div>`;
  });

  return cleaned;
}

interface PostContentWrapperProps {
  content: string;
  isHtml: boolean;
  locale?: string;
}

const ALERT_MAP: Record<
  string,
  {
    key: string;
    title: string;
    borderColor: string;
    titleColor: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  note: {
    key: "note",
    title: "笔记",
    borderColor: "border-l-[#0969da] dark:border-l-[#2f81f7]",
    titleColor: "text-[#0969da] dark:text-[#2f81f7]",
    icon: Info,
  },
  tip: {
    key: "tip",
    title: "提示",
    borderColor: "border-l-[#1a7f37] dark:border-l-[#3fb950]",
    titleColor: "text-[#1a7f37] dark:text-[#3fb950]",
    icon: Lightbulb,
  },
  important: {
    key: "important",
    title: "重要",
    borderColor: "border-l-[#8250df] dark:border-l-[#a371f7]",
    titleColor: "text-[#8250df] dark:text-[#a371f7]",
    icon: Flame,
  },
  warning: {
    key: "warning",
    title: "警告",
    borderColor: "border-l-[#9a6700] dark:border-l-[#d29922]",
    titleColor: "text-[#9a6700] dark:text-[#d29922]",
    icon: AlertTriangle,
  },
  caution: {
    key: "caution",
    title: "注意",
    borderColor: "border-l-[#cf222e] dark:border-l-[#f85149]",
    titleColor: "text-[#cf222e] dark:text-[#f85149]",
    icon: AlertOctagon,
  },
};

const ALERT_TITLES: Record<string, Record<string, string>> = {
  note: {
    "zh-CN": "笔记",
    "zh-TW": "筆記",
    en: "Note",
    ja: "ノート",
    ko: "메모",
  },
  tip: {
    "zh-CN": "提示",
    "zh-TW": "提示",
    en: "Tip",
    ja: "ヒント",
    ko: "팁",
  },
  important: {
    "zh-CN": "重要",
    "zh-TW": "重要",
    en: "Important",
    ja: "重要",
    ko: "중요",
  },
  warning: {
    "zh-CN": "警告",
    "zh-TW": "警告",
    en: "Warning",
    ja: "警告",
    ko: "경고",
  },
  caution: {
    "zh-CN": "注意",
    "zh-TW": "注意",
    en: "Caution",
    ja: "注意",
    ko: "주의",
  },
};

function getAlertConfig(text: string) {
  const trimmed = text.trim();
  const gfmMatch = trimmed.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
  if (gfmMatch) {
    const key = gfmMatch[1].toLowerCase();
    return ALERT_MAP[key] || ALERT_MAP.note;
  }
  const prefixMatch = trimmed.match(/^(Note|Tip|Important|Warning|Caution):/i);
  if (prefixMatch) {
    const key = prefixMatch[1].toLowerCase();
    return ALERT_MAP[key] || ALERT_MAP.note;
  }
  if (/^(\(i\)|ℹ️|💡)\s*(Note|提示|注意|说明)?/i.test(trimmed)) {
    return ALERT_MAP.note;
  }
  if (/^⚠️\s*(Warning|警告|注意)?/i.test(trimmed)) {
    return ALERT_MAP.warning;
  }
  return null;
}

function stripAlertPrefix(children: React.ReactNode): React.ReactNode {
  const childArray = React.Children.toArray(children);
  if (childArray.length === 0) return children;

  const regex =
    /^\s*(\[!?(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]|(Note|Tip|Important|Warning|Caution):|\(i\)\s*Note|ℹ️\s*(Note|提示|注意|说明)?|💡\s*(Tip|提示|注意)?|⚠️\s*(Warning|警告|注意)?)\s*/i;

  const firstChild = childArray[0];

  if (React.isValidElement(firstChild)) {
    const pProps = firstChild.props as { children?: React.ReactNode };
    if (pProps && pProps.children) {
      const pChildrenArray = React.Children.toArray(pProps.children);
      if (pChildrenArray.length > 0) {
        const firstPChild = pChildrenArray[0];
        if (typeof firstPChild === "string") {
          const stripped = firstPChild.replace(regex, "");
          let nextPChildren: React.ReactNode[];
          if (!stripped.trim()) {
            nextPChildren = pChildrenArray.slice(1);
            if (
              nextPChildren.length > 0 &&
              React.isValidElement(nextPChildren[0]) &&
              ((nextPChildren[0] as any).type === "br" ||
                (nextPChildren[0] as any)?.type?.name === "br")
            ) {
              nextPChildren = nextPChildren.slice(1);
            }
          } else {
            nextPChildren = [stripped, ...pChildrenArray.slice(1)];
          }

          if (nextPChildren.length === 0) {
            return childArray.slice(1);
          }

          return [
            React.cloneElement(
              firstChild as React.ReactElement<{ children?: React.ReactNode }>,
              {
                ...pProps,
                children: nextPChildren,
              }
            ),
            ...childArray.slice(1),
          ];
        }
      }
    }
  } else if (typeof firstChild === "string") {
    const stripped = firstChild.replace(regex, "");
    if (!stripped.trim()) {
      return childArray.slice(1);
    }
    return [stripped, ...childArray.slice(1)];
  }

  return children;
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
    <div className="code-block-wrapper group relative my-6 overflow-hidden rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-[#f8f8fa] dark:bg-[#0c0c0e]">
      {/* 悬停浮现的极简复制按钮 (右上角绝对定位，不占任何独立顶栏) */}
      <button
        type="button"
        onClick={handleCopy}
        aria-label="复制代码"
        className="absolute top-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-md border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-800/80 text-neutral-500 dark:text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-neutral-900 dark:hover:text-white transition-opacity duration-200 cursor-pointer select-none"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-neutral-400" />
        )}
      </button>

      <pre
        suppressHydrationWarning
        className="overflow-x-auto p-4 sm:p-5 text-[13px] sm:text-[14px] leading-relaxed text-neutral-800 dark:text-neutral-200 font-mono"
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

function PostContentWrapperInternal({ content, isHtml, locale: propLocale }: PostContentWrapperProps) {
  const { locale: contextLocale } = useI18n();
  const locale = propLocale || contextLocale;
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
      // 1. 如果没有在 code-block-wrapper 容器中，动态包裹为极简样式
      if (pre.parentElement && !pre.parentElement.classList.contains("code-block-wrapper")) {
        const wrapper = document.createElement("div");
        wrapper.className =
          "code-block-wrapper group relative my-6 overflow-hidden rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-[#f8f8fa] dark:bg-[#0c0c0e]";

        const copyBtn = document.createElement("button");
        copyBtn.type = "button";
        copyBtn.setAttribute("data-action", "copy-code");
        copyBtn.setAttribute("aria-label", "复制代码");
        copyBtn.className =
          "absolute top-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-md border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-800/80 text-neutral-500 dark:text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-neutral-900 dark:hover:text-white transition-opacity duration-200 cursor-pointer select-none";
        copyBtn.innerHTML = COPY_SVG;

        pre.parentNode?.insertBefore(wrapper, pre);
        wrapper.appendChild(copyBtn);
        wrapper.appendChild(pre);
        pre.classList.add("overflow-x-auto", "p-4", "sm:p-5", "text-[13px]", "sm:text-[14px]", "leading-relaxed", "text-neutral-800", "dark:text-neutral-200", "font-mono");
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

      const block = copyBtn.closest(".code-block-wrapper") || copyBtn.closest("pre");
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
      const rawOriginal = img.getAttribute("data-original-src") || img.src;
      const isNotionOrAws =
        rawOriginal.includes("amazonaws.com") ||
        rawOriginal.includes("notion.so") ||
        rawOriginal.includes("notion-static.com");
      const originalSrc = isNotionOrAws ? (img.currentSrc || img.src) : rawOriginal;
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
    text-[15.5px] sm:text-[16px] leading-[1.75] text-[#555] dark:text-[#bbb] font-sans tracking-normal
    [&_p]:mb-[1.05rem]
    [&_h1]:scroll-mt-24 [&_h1]:text-2xl sm:[&_h1]:text-[32px] [&_h1]:font-extrabold [&_h1]:font-sans [&_h1]:mt-14 [&_h1]:mb-6 [&_h1]:text-black dark:[&_h1]:text-white [&_h1]:leading-[1.15] [&_h1]:tracking-tight
    [&_h2]:scroll-mt-24 [&_h2]:text-[22px] sm:[&_h2]:text-[26px] [&_h2]:font-bold [&_h2]:font-sans [&_h2]:mt-16 [&_h2]:mb-6 [&_h2]:text-black dark:[&_h2]:text-white [&_h2]:leading-[1.3] [&_h2]:tracking-tight
    [&_h3]:scroll-mt-24 [&_h3]:text-[20px] sm:[&_h3]:text-[23px] [&_h3]:font-bold [&_h3]:font-sans [&_h3]:mt-14 [&_h3]:mb-5 [&_h3]:text-black dark:[&_h3]:text-white [&_h3]:leading-[1.33] [&_h3]:tracking-tight
    [&_h4]:scroll-mt-24 [&_h4]:text-[17px] sm:[&_h4]:text-[18px] [&_h4]:font-bold [&_h4]:font-sans [&_h4]:mt-10 [&_h4]:mb-4 [&_h4]:text-[#222] dark:[&_h4]:text-[#ddd] [&_h4]:leading-[1.4]
    [&_strong]:font-semibold [&_strong]:text-[#222] dark:[&_strong]:text-white
    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-[1.3rem] [&_ul]:space-y-2
    [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-[1.3rem] [&_ol]:space-y-2
    [&_li]:leading-[1.75]
    [&_img]:rounded-md [&_img]:mx-auto [&_img]:my-10 [&_img]:max-w-full [&_img]:cursor-zoom-in [&_img]:transition-transform [&_img]:duration-200 hover:[&_img]:scale-[1.005] [&_img]:shadow-sm
    [&_a]:prose-link
    [&_table]:w-full [&_table]:overflow-x-auto [&_table]:block sm:[&_table]:table [&_table]:border-collapse [&_table]:my-8
    [&_th]:border-b [&_th]:border-neutral-200 dark:[&_th]:border-neutral-800 [&_th]:px-4 [&_th]:py-3 [&_th]:bg-transparent [&_th]:font-semibold [&_th]:text-[#222] dark:[&_th]:text-[#ddd] [&_th]:text-left
    [&_td]:border-b [&_td]:border-neutral-200 dark:[&_td]:border-neutral-800 [&_td]:px-4 [&_td]:py-3 [&_td]:text-[#555] dark:[&_td]:text-[#bbb]
    [&_tr:nth-child(even)]:bg-transparent
    [&_hr]:my-12 [&_hr]:border-neutral-200 dark:[&_hr]:border-neutral-800
  `;

  return (
    <>
      <style>{`
        .token.comment, .token.prolog, .token.doctype, .token.cdata { color: #8c857b; font-style: italic; }
        .dark .token.comment, .dark .token.prolog, .dark .token.doctype, .dark .token.cdata { color: #767067; font-style: italic; }
        .token.punctuation { color: #586069; }
        .dark .token.punctuation { color: #9d9589; }
        .token.property, .token.tag, .token.boolean, .token.number, .token.constant, .token.symbol { color: #b45309; }
        .dark .token.property, .dark .token.tag, .dark .token.boolean, .dark .token.number, .dark .token.constant, .dark .token.symbol { color: #e59866; }
        .token.selector, .token.attr-name, .token.string, .token.char, .token.builtin { color: #991b1b; }
        .dark .token.selector, .dark .token.attr-name, .dark .token.string, .dark .token.char, .dark .token.builtin { color: #e06c75; }
        .token.operator, .token.entity, .token.url { color: #7c3aed; }
        .dark .token.operator, .dark .token.entity, .dark .token.url { color: #c678dd; }
        .token.keyword { color: #b91c1c; font-weight: 500; }
        .dark .token.keyword { color: #e06c75; font-weight: 500; }
        .token.function, .token.class-name { color: #0284c7; }
        .dark .token.function, .dark .token.class-name { color: #61afef; }
        .code-block-wrapper pre {
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
          className={`${proseClassName} slide-enter-content`}
          dangerouslySetInnerHTML={{ __html: cleanHtmlContent }}
        />
      ) : (
        <div
          ref={contentRef}
          onClick={handleContentClick}
          suppressHydrationWarning
          className={`${proseClassName} slide-enter-content`}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // 引用块渲染：普通引用（如名人名言、对话、副标题导言）保持极简高雅引用；带 [!NOTE]/[!TIP] 标识时渲染为 Note/Tip 提示卡片
              blockquote: ({ children, node, ...props }) => {
                const text = getNodeText(children).trim();
                const alertConfig = getAlertConfig(text);

                // 普通引用（无 [!NOTE] 标识），保持 Anthony Fu 原生优雅极简引用样式（纯净左竖线 + 无 Note 图标与大标题）
                if (!alertConfig) {
                  return (
                    <blockquote className="my-4 border-l-[3.5px] border-neutral-300 dark:border-neutral-700 pl-4 py-1 text-neutral-600 dark:text-neutral-400 not-italic select-text font-sans">
                      <div className="text-[14.5px] sm:text-[15px] leading-[1.75] [&>p]:mb-0 [&>p:not(:last-child)]:mb-2.5">
                        {children}
                      </div>
                    </blockquote>
                  );
                }

                const AlertIcon = alertConfig.icon;
                const cleanChildren = stripAlertPrefix(children);
                const alertTitle =
                  ALERT_TITLES[alertConfig.key]?.[locale] ||
                  ALERT_TITLES[alertConfig.key]?.["zh-CN"] ||
                  alertConfig.title;

                return (
                  <div
                    className={`my-4 border-l-[3.5px] ${alertConfig.borderColor} pl-4 py-1 bg-transparent not-italic select-text transition-colors`}
                  >
                    <div className={`flex items-center gap-1.5 text-[14px] sm:text-[14.5px] font-medium ${alertConfig.titleColor} mb-1 select-none`}>
                      <AlertIcon className="h-4 w-4 shrink-0 stroke-[2.2]" />
                      <span>{alertTitle}</span>
                    </div>
                    <div className="text-[14.5px] sm:text-[15px] leading-[1.75] text-[#555] dark:text-[#bbb] font-sans [&>p]:mb-0 [&>p:not(:last-child)]:mb-2.5">
                      {cleanChildren}
                    </div>
                  </div>
                );
              },
              h1: ({ children, node, ...props }) => {
                const id = slugifyHeading(getNodeText(children));
                return (
                  <h2 id={id} className="text-[22px] sm:text-[26px] font-bold mt-16 mb-6 text-black dark:text-white font-sans tracking-tight leading-[1.3]" {...props}>
                    {children}
                  </h2>
                );
              },
              h2: ({ children, node, ...props }) => {
                const id = slugifyHeading(getNodeText(children));
                return (
                  <h2 id={id} className="text-[22px] sm:text-[26px] font-bold mt-16 mb-6 text-black dark:text-white font-sans tracking-tight leading-[1.3]" {...props}>
                    {children}
                  </h2>
                );
              },
              h3: ({ children, node, ...props }) => {
                const id = slugifyHeading(getNodeText(children));
                return (
                  <h3 id={id} className="text-[20px] sm:text-[23px] font-bold mt-14 mb-5 text-black dark:text-white font-sans tracking-tight leading-[1.33]" {...props}>
                    {children}
                  </h3>
                );
              },
              h4: ({ children, node, ...props }) => {
                const id = slugifyHeading(getNodeText(children));
                return (
                  <h4 id={id} className="text-[17px] sm:text-[18px] font-bold mt-10 mb-4 text-[#222] dark:text-[#ddd] font-sans tracking-tight leading-[1.4]" {...props}>
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
                      className="rounded bg-[#aaaaaa18] dark:bg-[#ffffff15] px-1.5 py-0.5 text-[13px] sm:text-[13.5px] font-mono font-medium text-[#222] dark:text-[#ddd]"
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

                if (isNotionOrAws) {
                  optimizedSrc = getProxyImageUrl(rawSrc);
                } else if (
                  (rawSrc.startsWith("http://") || rawSrc.startsWith("https://")) &&
                  !rawSrc.includes("wsrv.nl")
                ) {
                  optimizedSrc = getProxyImageUrl(`https://wsrv.nl/?url=${encodeURIComponent(rawSrc)}&w=900&output=webp&q=80`);
                }
                return (
                  <img
                    src={optimizedSrc}
                    alt={alt || "文章配图"}
                    data-original-src={isNotionOrAws ? optimizedSrc : rawSrc}
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
                className="fixed inset-0 z-[9999] flex h-screen w-screen cursor-zoom-out items-center justify-center bg-black/90 p-4 sm:p-8"
              >
                <motion.div
                  initial={{ scale: 0.94, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.94, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="relative flex items-center justify-center cursor-default"
                >
                  <img
                    src={getProxyImageUrl(activeImg.src)}
                    alt={activeImg.alt}
                    onClick={(e) => e.stopPropagation()}
                    referrerPolicy="no-referrer"
                    className="max-h-[90vh] max-w-[92vw] select-none rounded-lg object-contain shadow-2xl shadow-black/60"
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}

export const PostContentWrapper = React.memo(PostContentWrapperInternal);