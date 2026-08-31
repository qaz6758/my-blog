// components/post/Comments.tsx
"use client";

import React, { useState, useEffect } from "react";

import { supabase } from "@/lib/supabase";


// 日期格式化工具
function formatCommentDate(dateStr: string) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const days = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  return `${year}年${month}月${day}日${days[date.getDay()]}`;
}

// 社交图标组件
const GithubIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.662 3.999-5.445 3.999-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866.549 3.921 1.453l2.814-2.814C17.503 2.988 15.139 2 12.545 2 7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.761h-9.426z" />
  </svg>
);

const AppleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.36 14.53c-.62.3-1.42.54-2.26.54-2.12 0-3.66-1.52-3.66-3.8 0-2.3 1.54-3.76 3.61-3.76.84 0 1.5.21 2.05.47l-.54 1.39c-.43-.22-.97-.42-1.56-.42-1.25 0-1.95.89-1.95 2.29 0 1.45.8 2.37 2.05 2.37.58 0 1.15-.22 1.63-.49l.63 1.41z" />
  </svg>
);

export default function Comments({
  thoughtId,
  onCommentAdded,
}: {
  thoughtId: string;
  onCommentAdded?: () => void;
}) {
  const [user, setUser] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });

    const fetchComments = async () => {
      const { data } = await supabase
        .from("thought_comments")
        .select("*")
        .eq("thought_id", thoughtId)
        .order("created_at", { ascending: false });
      if (data) setComments(data);
    };

    fetchComments();
    return () => authListener.subscription.unsubscribe();
  }, [thoughtId]);

  const handleLogin = async (provider: "github" | "google" | "apple") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/thoughts/${thoughtId}` },
    });
  };

  const submitComment = async () => {
    if (!newComment.trim() || !user) return;
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("thought_comments")
        .insert([
          {
            thought_id: thoughtId,
            user_id: user.id,
            user_name: user.user_metadata?.user_name || user.user_metadata?.full_name || "匿名读者",
            avatar_url: user.user_metadata?.avatar_url || "",
            provider: user.app_metadata?.provider || "unknown",
            content: newComment,
          },
        ])
        .select();

      if (error) {
        console.error("❌ Supabase 插入失败:", error);
      } else if (data) {
        setComments([data[0], ...comments]);
        setNewComment("");
        if (onCommentAdded) {
          onCommentAdded();
        }
      }
    } catch (err) {
      console.error("❌ 提交异常:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-[#f4f4f5]">评论</h2>
        {user && (
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors cursor-pointer"
          >
            退出登录
          </button>
        )}
      </div>

      {/* 登录/输入区 */}
      {!user ? (
        <div className="mb-10 flex flex-col items-center justify-center rounded-none border border-black/[0.05] bg-[#fafafa] py-12 dark:border-white/[0.05] dark:bg-[#18181a]">
          <span className="mb-5 text-[13px] text-neutral-600 dark:text-[#a1a1aa]">
            使用社交账号登录
          </span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleLogin("github")}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.04] text-neutral-700 transition-colors hover:bg-black/[0.08] dark:bg-white/[0.06] dark:text-[#d4d4d8] dark:hover:bg-white/[0.1] cursor-pointer"
            >
              <GithubIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleLogin("google")}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.04] text-neutral-700 transition-colors hover:bg-black/[0.08] dark:bg-white/[0.06] dark:text-[#d4d4d8] dark:hover:bg-white/[0.1] cursor-pointer"
            >
              <GoogleIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleLogin("apple")}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.04] text-neutral-700 transition-colors hover:bg-black/[0.08] dark:bg-white/[0.06] dark:text-[#d4d4d8] dark:hover:bg-white/[0.1] cursor-pointer"
            >
              <AppleIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-10 flex flex-col items-end gap-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="写下你的想法..."
            className="w-full min-h-[100px] resize-none rounded-none border border-black/[0.1] bg-transparent p-4 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none dark:border-white/[0.1] dark:text-[#f4f4f5] dark:focus:border-white transition-colors"
          />
          <button
            type="button"
            onClick={submitComment}
            disabled={isSubmitting || !newComment.trim()}
            className="rounded-none bg-neutral-900 px-5 py-2 text-[13px] text-white disabled:opacity-50 dark:bg-[#f4f4f5] dark:text-black transition-opacity cursor-pointer"
          >
            {isSubmitting ? "发布中..." : "发表评论"}
          </button>
        </div>
      )}

      {/* 排序工具栏 */}
      <div className="mb-8 flex items-center justify-between text-xs text-neutral-600 dark:text-[#a1a1aa]">
        <span>共 {comments.length} 条评论</span>
        <div className="flex items-center gap-1 font-mono">
          <button
            type="button"
            className="flex items-center gap-1 rounded-none bg-black/[0.05] px-2.5 py-1 text-neutral-900 transition-colors dark:bg-white/[0.1] dark:text-white cursor-pointer"
          >
            <span className="text-[10px]">⚑</span> 默认
          </button>
          <button
            type="button"
            className="flex items-center gap-1 rounded-none px-2.5 py-1 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.05] cursor-pointer"
          >
            ↓ 最新
          </button>
        </div>
      </div>

      {/* 评论列表 */}
      <div className="space-y-8">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-4">
            <div className="relative h-10 w-10 shrink-0">
              <img
                src={comment.avatar_url || "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&q=80"}
                alt={comment.user_name}
                className="h-full w-full rounded-full object-cover"
              />
              <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-[#121214]">
                {comment.provider === "github" ? (
                  <GithubIcon className="h-2.5 w-2.5 text-neutral-800 dark:text-white" />
                ) : (
                  <GoogleIcon className="h-2 w-2 text-neutral-800 dark:text-white" />
                )}
              </div>
            </div>

            <div className="flex-1 pt-1">
              <div className="mb-2 flex items-baseline gap-3">
                <span className="text-[13px] font-bold text-neutral-900 dark:text-[#f4f4f5]">
                  {comment.user_name}
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-[#71717a]">
                  {formatCommentDate(comment.created_at)}
                </span>
              </div>
              <div className="inline-block rounded-none border border-black/[0.05] bg-black/[0.03] px-4 py-2.5 text-[14px] leading-relaxed text-neutral-800 dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-[#d4d4d8] whitespace-pre-line">
                {comment.content}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}