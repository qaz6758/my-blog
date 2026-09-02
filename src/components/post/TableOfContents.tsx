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
      className={`select-none ${className}`}
    >
      {/* 目录小标题 / 极简图标 */}
      <div className="mb-3 flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500 opacity-60">
        <AlignLeft className="h-4 w-4" />
      </div>

      {/* 目录条目列表（Anthony Fu 纯透明度悬停与高亮体系） */}
      <ul className="max-h-[calc(100vh-14rem)] space-y-1.5 overflow-y-auto pr-2 text-[13px] font-normal">
        {list.map((item) => {
          const isActive = currentActiveId === item.id;

          // 层级缩进规范：H1/H2 顶格，H3 缩进 12px，H4 缩进 20px
          const indentPx =
            item.level <= 2 ? 0 : item.level === 3 ? 12 : 20;

          return (
            <li
              key={item.id}
              style={{ paddingLeft: `${indentPx}px` }}
            >
              <a
                href={`#${item.id}`}
                onClick={(e) => handleItemClick(e, item.id)}
                className={`block py-0.5 line-clamp-1 transition-opacity duration-200 ${
                  isActive
                    ? "opacity-100 text-neutral-900 dark:text-white font-medium"
                    : "opacity-45 hover:opacity-100 text-neutral-700 dark:text-neutral-300"
                }`}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default TableOfContents;