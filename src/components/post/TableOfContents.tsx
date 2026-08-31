"use client";

import React, { useEffect, useState } from "react";
import { AlignLeft } from "lucide-react";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  tocList?: TocItem[];
  items?: TocItem[];
  activeId?: string;
  className?: string;
}

export function TableOfContents({
  tocList,
  items,
  activeId: externalActiveId,
  className = "",
}: TableOfContentsProps) {
  const list = tocList || items || [];
  const [internalActiveId, setInternalActiveId] = useState<string>("");

  const currentActiveId = externalActiveId ?? internalActiveId;

  // 1. 内置 IntersectionObserver 自动监听正文阅读进度
  useEffect(() => {
    if (externalActiveId !== undefined || list.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          setInternalActiveId(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: "0px 0px -65% 0px",
        threshold: 0,
      }
    );

    list.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [list, externalActiveId]);

  if (list.length === 0) return null;

  // 2. 点击平滑跳转并同步地址栏 Hash
  const handleItemClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (!element) return;

    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    window.history.pushState(null, "", `#${id}`);
    if (externalActiveId === undefined) {
      setInternalActiveId(id);
    }
  };

  return (
    <nav
      aria-label="文章目录大纲"
      className={`rounded-2xl border border-black/[0.06] bg-white/70 p-4 shadow-sm backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#111318]/70 ${className}`}
    >
      {/* 目录小标题 */}
      <div className="mb-3 flex items-center gap-2 border-b border-black/[0.05] pb-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:border-white/[0.06] dark:text-neutral-400">
        <AlignLeft className="h-3.5 w-3.5" />
        <span>目录</span>
      </div>

      {/* 目录条目列表 */}
      <ul className="max-h-[calc(100vh-12rem)] space-y-1 overflow-y-auto pr-1 text-[13px]">
        {list.map((item) => {
          const isActive = currentActiveId === item.id;

          // 层级缩进规范：H1 无缩进，H2 缩进 12px，H3 缩进 24px
          const indentPx =
            item.level <= 1 ? 0 : item.level === 2 ? 12 : 24;

          return (
            <li
              key={item.id}
              className="relative"
              style={{ paddingLeft: `${indentPx}px` }}
            >
              <a
                href={`#${item.id}`}
                onClick={(e) => handleItemClick(e, item.id)}
                className={`group flex items-center py-1 transition-all duration-200 ${
                  isActive
                    ? "font-medium text-sky-600 dark:text-sky-400"
                    : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
                }`}
              >
                {/* 活跃指示竖线 */}
                {isActive && (
                  <span className="absolute left-0 top-1 bottom-1 w-[2px] rounded-full bg-sky-500 dark:bg-sky-400" />
                )}
                <span className="line-clamp-1 pl-2">{item.text}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default TableOfContents;