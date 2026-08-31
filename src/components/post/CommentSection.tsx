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
  post_id?: string | number;
  thought_id?: string | number;
  author: string;
  email?: string | null;
  website?: string | null;
  content: string;
  created_at: string;
}

interface CommentSectionProps {
  postId?: string | number;
  thoughtId?: string | number;
  onCommentAdded?: () => void;
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
 * 根据作者名称哈希生成统一的渐变头像底色
 */
function getAvatarGradient(name: string): string {
  const gradients = [
    "from-pink-500 to-rose-500",
    "from-purple-500 to-indigo-500",
    "from-cyan-500 to-blue-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-violet-500 to-fuchsia-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

export function CommentSection({
  postId,
  thoughtId,
  onCommentAdded,
}: CommentSectionProps) {
  const isThought = Boolean(thoughtId);
  const targetTable = isThought ? "thought_comments" : "comments";
  const targetIdField = isThought ? "thought_id" : "post_id";
  const targetId = isThought ? String(thoughtId) : String(postId || "");

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
    if (!targetId) return;
    try {
      const { data, error } = await supabase
        .from(targetTable)
        .select("*")
        .eq(targetIdField, targetId)
        .order("created_at", { ascending: sortBy === "asc" });

      if (!error && data) {
        setComments(data);
      }
    } catch (err) {
      console.warn("⚠️ 获取评论失败:", err);
    } finally {
      setLoading(false);
    }
  }, [targetTable, targetIdField, targetId, sortBy]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // 3. Supabase Realtime 实时增量监听当前文章/思考新留言
  useEffect(() => {
    if (!targetId) return;
    const channelName = `comments-${targetTable}-${targetId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: targetTable,
          filter: `${targetIdField}=eq.${targetId}`,
        },
        (payload) => {
          const newComment = payload.new as Comment;
          setComments((prev) => {
            if (prev.some((c) => String(c.id) === String(newComment.id))) {
              return prev;
            }
            return sortBy === "desc"
              ? [newComment, ...prev]
              : [...prev, newComment];
          });
          onCommentAdded?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel).catch(() => {});
    };
  }, [targetTable, targetIdField, targetId, sortBy, onCommentAdded]);

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

      const payload: Record<string, any> = {
        [targetIdField]: targetId,
        author: author.trim(),
        email: email.trim() || null,
        website: safeWebsite,
        content: content.trim(),
      };

      const { data, error } = await supabase
        .from(targetTable)
        .insert([payload])
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

      // 本地乐观更新
      if (data) {
        setComments((prev) => {
          if (prev.some((c) => String(c.id) === String(data.id))) return prev;
          return sortBy === "desc" ? [data, ...prev] : [...prev, data];
        });
        onCommentAdded?.();
      }

      setContent("");
    } catch (err: any) {
      console.error("提交评论失败:", err);
      setErrorMessage(err.message || "评论发布失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  const commentCount = comments.length;

  return (
    <div className="w-full space-y-10">
      {/* 顶部标题与排序 */}
      <div className="flex items-center justify-between border-b border-black/[0.06] pb-4 dark:border-white/[0.08]">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-neutral-400" />
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            评论
          </h3>
          <span className="rounded-full bg-black/[0.04] px-2 py-0.5 text-xs text-neutral-500 dark:bg-white/[0.06] dark:text-neutral-400">
            {commentCount}
          </span>
        </div>

        {commentCount > 1 && (
          <div className="flex items-center gap-1 text-xs text-neutral-400">
            <button
              type="button"
              onClick={() => setSortBy("desc")}
              className={`cursor-pointer transition-colors ${
                sortBy === "desc"
                  ? "text-neutral-900 font-medium dark:text-white"
                  : "hover:text-neutral-700 dark:hover:text-neutral-300"
              }`}
            >
              最新
            </button>
            <span>/</span>
            <button
              type="button"
              onClick={() => setSortBy("asc")}
              className={`cursor-pointer transition-colors ${
                sortBy === "asc"
                  ? "text-neutral-900 font-medium dark:text-white"
                  : "hover:text-neutral-700 dark:hover:text-neutral-300"
              }`}
            >
              最早
            </button>
          </div>
        )}
      </div>

      {/* 评论输入表单 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-neutral-500 dark:text-neutral-400">
              昵称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="您的称呼"
              maxLength={50}
              className="w-full rounded-xl border border-black/[0.08] bg-black/[0.02] px-3.5 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-100 dark:focus:border-white dark:focus:bg-black/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-neutral-500 dark:text-neutral-400">
              邮箱 <span className="text-neutral-400 text-[10px]">(保密)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              maxLength={100}
              className="w-full rounded-xl border border-black/[0.08] bg-black/[0.02] px-3.5 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-100 dark:focus:border-white dark:focus:bg-black/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-neutral-500 dark:text-neutral-400">
              网址 <span className="text-neutral-400 text-[10px]">(选填)</span>
            </label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              maxLength={200}
              className="w-full rounded-xl border border-black/[0.08] bg-black/[0.02] px-3.5 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-100 dark:focus:border-white dark:focus:bg-black/20"
            />
          </div>
        </div>

        <div>
          <textarea
            required
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="写下你的想法或评论..."
            maxLength={1000}
            className="w-full resize-y rounded-2xl border border-black/[0.08] bg-black/[0.02] p-4 text-xs leading-relaxed text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-100 dark:focus:border-white dark:focus:bg-black/20"
          />
        </div>

        {errorMessage && (
          <div className="flex items-center gap-1.5 text-xs text-red-500">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-neutral-400">
            支持友好交流，请勿发布广告信息
          </span>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 cursor-pointer"
          >
            {submitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            <span>{submitting ? "发布中..." : "发表评论"}</span>
          </button>
        </div>
      </form>

      {/* 评论列表 */}
      <div className="space-y-4 pt-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulse space-y-2 rounded-2xl border border-black/[0.04] p-4 dark:border-white/[0.05]"
              >
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                  <div className="h-3 w-20 rounded bg-neutral-200 dark:bg-neutral-800" />
                </div>
                <div className="h-3 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="py-8 text-center">
            <Sparkles className="mx-auto h-5 w-5 text-neutral-300 dark:text-neutral-700" />
            <p className="mt-2 text-xs text-neutral-400">
              暂无评论，快来抢沙发吧～
            </p>
          </div>
        ) : (
          comments.map((comment) => {
            const initial = (comment.author || "A").charAt(0).toUpperCase();
            const avatarGradient = getAvatarGradient(comment.author || "A");
            const hasWebsite = Boolean(comment.website);

            return (
              <div
                key={comment.id}
                className="group rounded-2xl border border-black/[0.05] bg-black/[0.01] p-4 transition hover:border-black/[0.1] dark:border-white/[0.06] dark:bg-white/[0.01] dark:hover:border-white/[0.12]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {/* 头像 */}
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr ${avatarGradient} text-[11px] font-bold text-white shadow-xs`}
                    >
                      {initial}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        {hasWebsite ? (
                          <a
                            href={comment.website!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-neutral-800 transition hover:underline dark:text-neutral-200"
                          >
                            <span>{comment.author}</span>
                            <Globe className="h-2.5 w-2.5 text-neutral-400" />
                          </a>
                        ) : (
                          <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                            {comment.author}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-400">
                        {formatRelativeTime(comment.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
                  {comment.content}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}