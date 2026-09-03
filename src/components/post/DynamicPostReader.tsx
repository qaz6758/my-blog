// components/post/DynamicPostReader.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ExternalLink, Tag as TagIcon, ArrowLeft } from "lucide-react";
import { LazyPostContent } from "@/components/post/LazyPostContent";
import { ThoughtDetailClient } from "@/components/post/ThoughtDetailClient";
import { ThoughtMediaItem } from "@/lib/notion";
import { formatDate, calculateReadTime } from "@/lib/utils";

interface PostDetail {
  id: string;
  title: string;
  content?: string;
  summary?: string;
  created_at?: string;
  published_at?: string;
  category?: string;
  tags?: string[];
  source?: string;
  source_url?: string;
}

export function DynamicPostReader() {
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<PostDetail | null>(null);
  const [thought, setThought] = useState<ThoughtMediaItem | null>(null);
  const [mode, setMode] = useState<"post" | "thought" | "404">("404");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const pathname = window.location.pathname;
    const matchPost = pathname.match(/\/posts\/([^\/\?#]+)/);
    const matchThought = pathname.match(/\/thoughts\/([^\/\?#]+)/);

    const workerUrl =
      process.env.NEXT_PUBLIC_NOTION_WORKER_URL ||
      "https://notion-api.dedeboki123.workers.dev";

    if (matchPost) {
      const id = matchPost[1];
      setMode("post");
      fetch(`${workerUrl}/api/posts/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Not found");
          return res.json();
        })
        .then((data) => {
          if (data?.success && data.data) {
            setPost(data.data);
          } else {
            setPost(null);
          }
        })
        .catch(() => setPost(null))
        .finally(() => setLoading(false));
    } else if (matchThought) {
      const id = matchThought[1];
      setMode("thought");
      fetch(`${workerUrl}/api/thoughts/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Not found");
          return res.json();
        })
        .then((data) => {
          if (data?.success && data.data) {
            setThought(data.data);
          } else {
            setThought(null);
          }
        })
        .catch(() => setThought(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
      setMode("404");
    }
  }, []);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[65ch] px-6 pt-28 pb-20 sm:pt-32">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded-md w-3/4" />
          <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3" />
          <div className="space-y-3 pt-8">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-full" />
            <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-5/6" />
            <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  // 1. 随想录渲染
  if (mode === "thought" && thought) {
    return (
      <div className="relative min-h-screen w-full bg-transparent px-4 pt-24 pb-16 sm:px-8 lg:px-12 antialiased">
        <main className="mx-auto w-full max-w-[65ch]">
          <header className="mb-10 pl-1">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-[#f4f4f5] sm:text-4xl">
              思考
            </h1>
            <p className="mt-3 text-2xl text-neutral-500 dark:text-[#8e8e93] tracking-widest">
              感君倾耳。
            </p>
          </header>

          <div className="mb-6 pl-1">
            <Link
              href="/thoughts"
              className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 dark:text-[#71717a] dark:hover:text-[#f4f4f5] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              返回
            </Link>
          </div>

          <ThoughtDetailClient item={thought} />
        </main>
      </div>
    );
  }

  // 2. 博客文章渲染
  if (mode === "post" && post) {
    const publishDate = formatDate(post.published_at || post.created_at);
    const readTime = calculateReadTime(post.content || post.summary || "");

    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        <main className="relative z-10 px-6 pt-24 pb-20 sm:px-8 sm:pt-28">
          <div className="slide-enter-content mx-auto w-full max-w-[65ch]">
            <header className="mb-10">
              <h1 className="text-3xl sm:text-4xl lg:text-[38px] font-bold tracking-tight text-neutral-900 dark:text-white leading-[1.25]">
                {post.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-neutral-400 dark:text-[#888888]">
                {publishDate && <span>{publishDate}</span>}
                {publishDate && readTime && <span className="opacity-40">·</span>}
                <span>{readTime} min read</span>

                {post.category && (
                  <>
                    <span className="opacity-40">·</span>
                    <Link
                      href={`/posts?category=${encodeURIComponent(post.category)}`}
                      className="hover:text-neutral-900 dark:hover:text-white transition-colors"
                    >
                      {post.category}
                    </Link>
                  </>
                )}

                {post.source_url && (
                  <>
                    <span className="opacity-40">·</span>
                    <a
                      href={post.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-neutral-900 dark:hover:text-white transition-colors inline-flex items-center gap-1"
                    >
                      <span>{post.source || "Source"}</span>
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  </>
                )}
              </div>
            </header>

            <article className="post-article min-w-0">
              <LazyPostContent
                content={post.content || post.summary || ""}
                isHtml={false}
              />
            </article>

            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-neutral-200 dark:border-neutral-800/80 pt-6">
                <TagIcon className="h-3.5 w-3.5 text-neutral-400 opacity-60" />
                {post.tags.map((tag, index) => (
                  <Link
                    key={`${tag}-${index}`}
                    href={`/posts?tag=${encodeURIComponent(tag)}`}
                    className="text-xs text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // 3. 默认 404
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <h1 className="text-4xl font-mono font-bold text-neutral-900 dark:text-white">
        404
      </h1>
      <p className="mt-2 text-sm text-neutral-500">Page Not Found</p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>返回首页</span>
      </Link>
    </div>
  );
}
