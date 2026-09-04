// src/components/post/TableOfContents.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Menu } from "lucide-react";

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
  const propList = tocList || items;
  const [domList, setDomList] = useState<TocItem[]>([]);
  const [internalActiveId, setInternalActiveId] = useState<string>("");

  const list = propList && propList.length > 0 ? propList : domList;
  const currentActiveId = externalActiveId ?? internalActiveId;

  // 1. 异步自动扫描正文中的 h1~h4 标题
  useEffect(() => {
    if (propList && propList.length > 0) return;

    const extractHeadings = () => {
      const articleEl =
        document.querySelector(".post-article") ||
        document.querySelector("article");
      if (!articleEl) return false;

      const elements = articleEl.querySelectorAll("h1, h2, h3, h4");
      if (elements.length === 0) return false;

      const extracted: TocItem[] = [];
      elements.forEach((el, index) => {
        let id = el.getAttribute("id");
        const text = (el.textContent || "").trim();
        const level = Number(el.tagName.replace("H", "")) || 2;
        if (!text) return;

        // 若标题无原生 id（如 RSS HTML），自动生成拼音/英文 slug 赋给元素
        if (!id) {
          const slug = text
            .toLowerCase()
            .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 40);
          id = slug ? `heading-${index}-${slug}` : `heading-${index}`;
          el.setAttribute("id", id);
        }

        extracted.push({ id, text, level });
      });

      if (extracted.length > 0) {
        setDomList(extracted);
        return true;
      }
      return false;
    };

    if (!extractHeadings()) {
      const t1 = setTimeout(extractHeadings, 80);
      const t2 = setTimeout(extractHeadings, 250);
      const t3 = setTimeout(extractHeadings, 600);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [propList]);

  // 2. 监听阅读滚动进度
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

  // 3. 点击平滑跳转并同步锚点
  const handleItemClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (!element) return;

    const y = element.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top: y, behavior: "smooth" });

    window.history.pushState(null, "", `#${id}`);
    if (externalActiveId === undefined) {
      setInternalActiveId(id);
    }
  };

  return (
    <nav aria-label="文章目录大纲" className={`select-none ${className}`}>
      {/* 极简汉堡菜单图标 */}
      <div className="mb-3.5 flex items-center text-neutral-400 dark:text-neutral-500 opacity-60">
        <Menu className="h-4 w-4" />
      </div>

      {/* 目录列表：下划线与层级透明度 */}
      <ul className="max-h-[calc(100vh-14rem)] space-y-2 overflow-y-auto pr-2 text-[13px]">
        {list.map((item) => {
          const isActive = currentActiveId === item.id;
          const indentClass =
            item.level <= 2 ? "" : item.level === 3 ? "pl-3" : "pl-5";

          return (
            <li key={item.id} className={indentClass}>
              <a
                href={`#${item.id}`}
                onClick={(e) => handleItemClick(e, item.id)}
                className={`inline-block py-0.5 leading-snug underline underline-offset-4 decoration-1 transition-all duration-200 ${
                  isActive
                    ? "opacity-100 text-neutral-900 dark:text-neutral-100 font-medium decoration-neutral-900 dark:decoration-neutral-100"
                    : "opacity-45 hover:opacity-100 text-neutral-700 dark:text-neutral-300 decoration-neutral-300/70 dark:decoration-neutral-700/80 hover:decoration-neutral-800 dark:hover:decoration-neutral-200"
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