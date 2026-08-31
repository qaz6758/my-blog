"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  Send,
  Loader2,
  Globe,
  Sparkles,
  MessageSquare,
  AlertCircle,
} from "lucide-react";

interface Comment {
  id: string | number;
  post_id: string | number;
  author: string;
  email?: string | null;
  website?: string | null;
  content: string;
  created_at: string;
}

interface CommentSectionProps {
  postId: string | number;
}

const STORAGE_KEY = "blog_comment_profile";

/**
 * 安全校验网址链接，防止 javascript: 伪协议 XSS
 */
function sanitizeWebsiteUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return null;
}

/**
 * 友好相对时间转换
 */
function formatRelativeTime(dateString: string): string {
  try {
    const timestamp = new Date(dateString).getTime();
    if (Number.isNaN(timestamp)) return "";

    const diff = (Date.now() - timestamp) / 1000;
    if (diff < 60) return "刚刚";
    if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} 天前`;

    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

/**
 * 根据作者昵称生成稳定的渐变色头像
 */
function getAvatarGradient(name: string) {
  const gradients = [
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-purple-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-red-600",
    "from-cyan-500 to-blue-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

export function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [author, setAuthor] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [content, setContent] = useState("");
  const [sortBy, setSortBy] = useState<"asc" | "desc">("desc");

  // 1. 初始化读取本地缓存的用户身份
  useEffect(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.author) setAuthor(parsed.author);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.website) setWebsite(parsed.website);
      }
    } catch {}
  }, []);

  // 2. 加载评论列表
  const fetchComments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", String(postId))
        .order("created_at", { ascending: sortBy === "asc" });

      if (!error && data) {
        setComments(data);
      }
    } catch (err) {
      console.warn("⚠️ 获取评论失败:", err);
    } finally {
      setLoading(false);
    }
  }, [postId, sortBy]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // 3. Supabase Realtime 实时增量监听当前文章新留言
  useEffect(() => {
    const channelName = `comments-post-${postId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          const newComment = payload.new as Comment;
          setComments((prev) => {
            // 防重复插入
            if (prev.some((c) => String(c.id) === String(newComment.id))) {
              return prev;
            }
            return sortBy === "desc"
              ? [newComment, ...prev]
              : [...prev, newComment];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel).catch(() => {});
    };
  }, [postId, sortBy]);

  // 4. 提交评论
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!author.trim()) {
      setErrorMessage("请填写您的昵称");
      return;
    }
    if (!content.trim()) {
      setErrorMessage("请输入评论内容");
      return;
    }

    setSubmitting(true);

    try {
      const safeWebsite = sanitizeWebsiteUrl(website);

      const { data, error } = await supabase
        .from("comments")
        .insert([
          {
            post_id: String(postId),
            author: author.trim(),
            email: email.trim() || null,
            website: safeWebsite,
            content: content.trim(),
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // 缓存用户信息到本地
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            author: author.trim(),
            email: email.trim(),
            website: website.trim(),
          })
        );
      } catch {}

      // 清空输入框并乐观更新
      setContent("");
      if (data) {
        setComments((prev) =>
          sortBy === "desc" ? [data, ...prev] : [...prev, data]
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || "评论提交失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="w-full">
      {/* 评论框外壳 */}
      <form
        onSubmit={handleSubmit}
        className="w-full rounded-2xl border border-black/[0.08] bg-white/60 p-4 shadow-sm backdrop-blur-md transition-all focus-within:border-sky-500/40 focus-within:ring-2 focus-within:ring-sky-500/10 dark:border-white/[0.08] dark:bg-[#12141a]/60 sm:p-5"
      >
        {/* 三栏访客信息输入区 */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <input
            type="text"
            placeholder="昵称 *"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full rounded-lg border border-black/[0.06] bg-black/[0.02] px-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:bg-[#181a20]"
            required
          />
          <input
            type="email"
            placeholder="邮箱 (选填，保密)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-black/[0.06] bg-black/[0.02] px-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:bg-[#181a20]"
          />
          <input
            type="text"
            placeholder="网址 (https://...)"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="w-full rounded-lg border border-black/[0.06] bg-black/[0.02] px-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:bg-[#181a20]"
          />
        </div>

        {/* 评论内容编辑区 */}
        <div className="mt-3">
          <textarea
            rows={3}
            placeholder="写下你的想法..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full rounded-xl border border-black/[0.06] bg-black/[0.02] p-3 text-xs leading-relaxed text-neutral-900 placeholder:text-neutral-400 resize-none focus:bg-white focus:outline-none dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:bg-[#181a20] sm:text-[13px]"
            required
          />
        </div>

        {/* 错误提示栏 */}
        {errorMessage && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-500">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 底部工具条与提交 */}
        <div className="mt-3 flex items-center justify-between border-t border-black/[0.04] pt-3 dark:border-white/[0.04]">
          <span className="font-mono text-[11px] text-neutral-400">
            {content.length} 字符
          </span>

          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 px-4 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-95 disabled:pointer-events-none disabled:opacity-40 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 cursor-pointer"
          >
            {submitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            <span>发送</span>
          </button>
        </div>
      </form>

      {/* 评论列表头部与排序切换 */}
      <div className="mt-8 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-neutral-400" />
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            全部评论
          </h3>
          <span className="font-mono text-xs text-neutral-400">
            ({comments.length})
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-black/[0.03] p-0.5 text-xs dark:bg-white/[0.04]">
          <button
            type="button"
            onClick={() => setSortBy("desc")}
            className={`rounded-md px-2.5 py-1 transition-all ${
              sortBy === "desc"
                ? "bg-white font-medium text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-white"
                : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
            }`}
          >
            最新
          </button>
          <button
            type="button"
            onClick={() => setSortBy("asc")}
            className={`rounded-md px-2.5 py-1 transition-all ${
              sortBy === "asc"
                ? "bg-white font-medium text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-white"
                : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
            }`}
          >
            最早
          </button>
        </div>
      </div>

      {/* 评论列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-10 text-xs text-neutral-400">
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-neutral-500" />
          <span>正在同步评论...</span>
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/[0.08] py-12 text-center text-xs text-neutral-400 dark:border-white/[0.08] dark:text-neutral-500">
          暂无评论，留下第一条见解吧
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((item) => {
            const initialLetter = (item.author || "A").slice(0, 1).toUpperCase();
            const avatarGrad = getAvatarGradient(item.author || "");
            const safeWeb = sanitizeWebsiteUrl(item.website);

            return (
              <div
                key={item.id}
                className="group rounded-2xl border border-black/[0.04] bg-white/40 p-4 transition-all hover:border-black/[0.08] hover:bg-white/70 dark:border-white/[0.04] dark:bg-white/[0.02] dark:hover:border-white/[0.08] dark:hover:bg-white/[0.03]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {/* 渐变几何头像 */}
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br ${avatarGrad} text-[11px] font-bold text-white shadow-sm`}
                    >
                      {initialLetter}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {safeWeb ? (
                        <a
                          href={safeWeb}
                          target="_blank"
                          rel="nofollow noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-800 transition-colors hover:text-sky-600 dark:text-neutral-200 dark:hover:text-sky-400"
                        >
                          <span>{item.author}</span>
                          <Globe className="h-3 w-3 opacity-60" />
                        </a>
                      ) : (
                        <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                          {item.author}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                    {formatRelativeTime(item.created_at)}
                  </span>
                </div>

                <p className="mt-2.5 pl-9 text-xs leading-relaxed text-neutral-700 whitespace-pre-wrap dark:text-neutral-300 sm:text-[13px]">
                  {item.content}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}