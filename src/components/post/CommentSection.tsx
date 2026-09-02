"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { formatRelativeTime, sanitizeWebsiteUrl } from "@/lib/utils";
import { Loader2, CornerDownRight, LogOut, CheckCircle2 } from "lucide-react";
import type { User, Session } from "@supabase/supabase-js";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Comment {
  id: string | number;
  post_id?: string | number;
  thought_id?: string | number;
  author?: string;
  user_name?: string;
  user_avatar?: string;
  avatar_url?: string;
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

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const BG_COLOURS = [
  "#1c1c1e", "#2c2c2e", "#3a3a3c", "#48484a", "#262626", "#383838",
];

function avatarBg(name?: string | null) {
  const safe = (name || "?").trim() || "?";
  let h = 0;
  for (let i = 0; i < safe.length; i++) h = safe.charCodeAt(i) + ((h << 5) - h);
  return BG_COLOURS[Math.abs(h) % BG_COLOURS.length];
}

// ─────────────────────────────────────────────
// Avatar Component
// ─────────────────────────────────────────────

function Avatar({ name, src, size = 28 }: { name?: string | null; src?: string | null; size?: number }) {
  const [err, setErr] = useState(false);
  const safe = (name || "?").trim() || "?";
  const letter = safe.charAt(0).toUpperCase();

  if (src && !err) {
    return (
      <img
        src={src}
        alt={safe}
        width={size}
        height={size}
        onError={() => setErr(true)}
        className="rounded-full object-cover ring-1 ring-black/10 dark:ring-white/10 shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full ring-1 ring-black/10 dark:ring-white/10 text-white font-medium select-none"
      style={{ width: size, height: size, background: avatarBg(safe), fontSize: size * 0.44 }}
    >
      {letter}
    </div>
  );
}

// ─────────────────────────────────────────────
// OAuth Button
// ─────────────────────────────────────────────

function OAuthBtn({
  label, icon, onClick, loading,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white rounded-sm border border-black/[0.08] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20 transition-all duration-200 disabled:opacity-40 cursor-pointer select-none"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
      <span>{label}</span>
    </button>
  );
}

// ─────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────

function IconGitHub() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
    </svg>
  );
}

function IconGoogle() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" />
    </svg>
  );
}

function IconEmail() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-[1.5]" aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 7 10 7 10-7" />
    </svg>
  );
}

// ─────────────────────────────────────────────
// Guest form state (localStorage)
// ─────────────────────────────────────────────

interface GuestDraft {
  name: string;
  email: string;
}

const GUEST_KEY = "blog_guest_v2";

function loadGuest(): GuestDraft {
  try {
    const v = localStorage.getItem(GUEST_KEY);
    if (v) return JSON.parse(v);
  } catch {}
  return { name: "", email: "" };
}

function saveGuest(g: GuestDraft) {
  try { localStorage.setItem(GUEST_KEY, JSON.stringify(g)); } catch {}
}

// ─────────────────────────────────────────────
// CommentSection Component
// ─────────────────────────────────────────────

export function CommentSection({ postId, thoughtId, onCommentAdded }: CommentSectionProps) {
  const targetTable = thoughtId ? "thought_comments" : "comments";
  const targetIdField = thoughtId ? "thought_id" : "post_id";
  const targetId = String(thoughtId ?? postId ?? "");

  // ── Auth ──
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState<"github" | "google" | "email" | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [magicEmail, setMagicEmail] = useState("");
  const [magicSent, setMagicSent] = useState(false);

  // ── Comments ──
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ── Guest fallback (when not OAuth'd) ──
  const [guest, setGuest] = useState<GuestDraft>({ name: "", email: "" });
  const [guestMode, setGuestMode] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 1. Auth session listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  // 2. Restore guest info
  useEffect(() => { setGuest(loadGuest()); }, []);

  // 3. Fetch comments
  const fetchComments = useCallback(async () => {
    if (!targetId) return;
    const { data } = await supabase
      .from(targetTable)
      .select("*")
      .eq(targetIdField, targetId)
      .order("created_at", { ascending: false });
    setComments(data ?? []);
    setCommentsLoading(false);
  }, [targetTable, targetIdField, targetId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  // 4. Realtime subscription
  useEffect(() => {
    if (!targetId) return;
    const ch = supabase
      .channel(`cs-${targetTable}-${targetId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: targetTable,
        filter: `${targetIdField}=eq.${targetId}`,
      }, (payload) => {
        const c = payload.new as Comment;
        setComments(prev => prev.some(x => String(x.id) === String(c.id)) ? prev : [c, ...prev]);
        onCommentAdded?.();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch).catch(() => {}); };
  }, [targetTable, targetIdField, targetId, onCommentAdded]);

  // ── OAuth actions ──
  const signInWith = async (provider: "github" | "google") => {
    setAuthLoading(provider);
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.href },
    });
    setAuthLoading(null);
  };

  const sendMagicLink = async () => {
    if (!magicEmail.trim()) return;
    setAuthLoading("email");
    await supabase.auth.signInWithOtp({
      email: magicEmail.trim(),
      options: { emailRedirectTo: window.location.href },
    });
    setAuthLoading(null);
    setMagicSent(true);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setGuestMode(false);
  };

  // ── Submit with smart schema tolerance ──
  const handleSubmit = async () => {
    setError("");
    const text = content.trim();
    if (!text) { setError("请写点什么再发送吧 :)"); return; }

    // Determine author info
    let author = "";
    let email: string | null = null;
    let website: string | null = null;
    let userAvatarUrl: string | null = null;

    if (session?.user) {
      const user: User = session.user;
      const meta = user.user_metadata;
      author = meta?.full_name || meta?.user_name || meta?.name || user.email?.split("@")[0] || "匿名";
      email = user.email ?? null;
      website = meta?.html_url || null;
      userAvatarUrl = meta?.avatar_url || null;
    } else if (guestMode) {
      author = guest.name.trim() || "游客";
      email = guest.email.trim() || null;
      saveGuest({ name: guest.name.trim(), email: guest.email.trim() });
    } else {
      setError("请先选择登录方式或以游客身份留言");
      return;
    }

    setSubmitting(true);
    try {
      // 基础完整 Payload
      const payload: Record<string, any> = {
        [targetIdField]: targetId,
        author,
        user_name: author,
        content: text,
      };

      if (email) payload.email = email;
      if (website) payload.website = sanitizeWebsiteUrl(website);
      if (userAvatarUrl) {
        payload.user_avatar = userAvatarUrl;
        payload.avatar_url = userAvatarUrl;
      }
      if (session?.user?.id) {
        payload.user_id = session.user.id;
      }

      // 智能插入与 Schema 容错重试机制
      let result = await supabase.from(targetTable).insert([payload]).select().single();

      // 如果提示缺少 user_name 或 user_avatar 等非必须列，自动裁剪重试
      if (result.error) {
        const errMsg = result.error.message || "";
        const fallbackPayload = { ...payload };

        if (errMsg.includes("user_name")) delete fallbackPayload.user_name;
        if (errMsg.includes("user_avatar")) delete fallbackPayload.user_avatar;
        if (errMsg.includes("avatar_url")) delete fallbackPayload.avatar_url;
        if (errMsg.includes("website")) delete fallbackPayload.website;
        if (errMsg.includes("email")) delete fallbackPayload.email;
        if (errMsg.includes("author") && !fallbackPayload.user_name) fallbackPayload.user_name = author;

        result = await supabase.from(targetTable).insert([fallbackPayload]).select().single();
      }

      if (result.error) throw result.error;

      setContent("");
      if (result.data) {
        const newRecord = result.data as Comment;
        setComments(prev => prev.some(x => String(x.id) === String(newRecord.id)) ? prev : [newRecord, ...prev]);
        onCommentAdded?.();
      }
    } catch (e: any) {
      setError(e?.message || "发送失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Derived ──
  const user = session?.user ?? null;
  const userAvatar = user?.user_metadata?.avatar_url ?? null;
  const userName = user
    ? (user.user_metadata?.full_name || user.user_metadata?.user_name || user.user_metadata?.name || user.email?.split("@")[0] || "用户")
    : null;

  return (
    <div className="w-full space-y-7">
      {/* ── Section title ── */}
      <div className="flex items-center gap-2.5 border-b border-black/[0.06] dark:border-white/[0.06] pb-3">
        <span className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">讨论</span>
        <span className="text-xs font-mono text-neutral-400 dark:text-neutral-500">({comments.length})</span>
      </div>

      {/* ── Auth bar ── */}
      {!user && !guestMode ? (
        <div className="space-y-3 rounded-none border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.01] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-600 dark:text-neutral-400">选择参与讨论方式：</span>
            <button
              type="button"
              onClick={() => setGuestMode(true)}
              className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer underline underline-offset-4"
            >
              直接以游客身份留言
            </button>
          </div>

          {!showEmailForm ? (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <OAuthBtn
                label="GitHub 登录"
                icon={<IconGitHub />}
                onClick={() => signInWith("github")}
                loading={authLoading === "github"}
              />
              <OAuthBtn
                label="Google 登录"
                icon={<IconGoogle />}
                onClick={() => signInWith("google")}
                loading={authLoading === "google"}
              />
              <OAuthBtn
                label="邮箱免密登录"
                icon={<IconEmail />}
                onClick={() => setShowEmailForm(true)}
              />
            </div>
          ) : magicSent ? (
            <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 py-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>已发送登录链接至 <strong className="text-neutral-900 dark:text-white">{magicEmail}</strong>，查收邮件点击即可登录。</span>
              <button
                type="button"
                onClick={() => { setMagicSent(false); setShowEmailForm(false); }}
                className="ml-2 text-neutral-500 hover:underline cursor-pointer"
              >
                返回
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="email"
                value={magicEmail}
                onChange={e => setMagicEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 border-b border-black/20 dark:border-white/20 bg-transparent pb-1 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:border-neutral-900 dark:focus:border-neutral-100 focus:outline-none transition-colors"
                onKeyDown={e => e.key === "Enter" && sendMagicLink()}
              />
              <OAuthBtn
                label="发送链接"
                icon={<IconEmail />}
                onClick={sendMagicLink}
                loading={authLoading === "email"}
              />
              <button
                type="button"
                onClick={() => setShowEmailForm(false)}
                className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
              >
                取消
              </button>
            </div>
          )}
        </div>
      ) : null}

      {/* ── Guest identity fields ── */}
      {guestMode && !user && (
        <div className="flex flex-wrap items-center gap-3 rounded-none border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.01] p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">称呼:</span>
            <input
              value={guest.name}
              onChange={e => setGuest(g => ({ ...g, name: e.target.value }))}
              placeholder="你的昵称 (必填)"
              maxLength={40}
              className="w-32 border-b border-black/20 dark:border-white/20 bg-transparent pb-1 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:border-neutral-900 dark:focus:border-white focus:outline-none transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">邮箱:</span>
            <input
              type="email"
              value={guest.email}
              onChange={e => setGuest(g => ({ ...g, email: e.target.value }))}
              placeholder="可选 (接收回复)"
              maxLength={100}
              className="w-44 border-b border-black/20 dark:border-white/20 bg-transparent pb-1 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:border-neutral-900 dark:focus:border-white focus:outline-none transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={() => setGuestMode(false)}
            className="ml-auto text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
          >
            切换为账号登录
          </button>
        </div>
      )}

      {/* ── Logged-in identity bar ── */}
      {user && (
        <div className="flex items-center gap-2.5 rounded-none border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.01] px-3.5 py-2">
          <Avatar name={userName ?? "用户"} src={userAvatar} size={22} />
          <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">{userName}</span>
          <span className="text-[11px] text-neutral-400 dark:text-neutral-500">已登录</span>
          <button
            type="button"
            onClick={signOut}
            className="ml-auto flex items-center gap-1 text-[11px] text-neutral-500 hover:text-rose-500 transition-colors cursor-pointer"
            title="退出登录"
          >
            <LogOut className="h-3 w-3" />
            <span>退出</span>
          </button>
        </div>
      )}

      {/* ── Comment input ── */}
      {(user || guestMode) && (
        <div className="space-y-2.5">
          <div className="border border-black/[0.08] dark:border-white/[0.08] bg-transparent focus-within:border-black/30 dark:focus-within:border-white/30 p-3 transition-colors">
            <textarea
              ref={textareaRef}
              rows={3}
              value={content}
              onChange={e => {
                setContent(e.target.value);
                if (error) setError("");
              }}
              placeholder="发表你的见解与想法..."
              maxLength={1000}
              className="w-full resize-none border-none bg-transparent text-[13.5px] leading-relaxed text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none"
              onKeyDown={e => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>

          {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-neutral-400 dark:text-neutral-600">⌘ + Enter 快速发送</span>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !content.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 disabled:opacity-30 transition-all cursor-pointer select-none"
            >
              {submitting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CornerDownRight className="h-3 w-3" />
              )}
              <span>{submitting ? "发送中..." : "发表评论"}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Comments list ── */}
      <div className="space-y-6 pt-2">
        {commentsLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="h-7 w-7 rounded-full bg-black/5 dark:bg-white/5 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-2.5 w-20 rounded bg-black/5 dark:bg-white/5" />
                  <div className="h-2.5 w-3/4 rounded bg-black/5 dark:bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-xs text-neutral-400 dark:text-neutral-600 py-6 text-center">
            暂无讨论，快来留下第一条想法吧
          </p>
        ) : (
          comments.map(comment => {
            const authorName = comment.author || comment.user_name || "匿名";
            const avatarSrc = comment.user_avatar || comment.avatar_url || null;

            return (
              <div key={comment.id} className="flex gap-3 text-left">
                <Avatar name={authorName} src={avatarSrc} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    {comment.website ? (
                      <a
                        href={sanitizeWebsiteUrl(comment.website) ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-neutral-800 hover:text-neutral-950 dark:text-neutral-200 dark:hover:text-white transition-colors"
                      >
                        {authorName}
                      </a>
                    ) : (
                      <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                        {authorName}
                      </span>
                    )}
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                      {formatRelativeTime(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}