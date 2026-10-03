"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { formatRelativeTime, sanitizeWebsiteUrl } from "@/lib/utils";
import { Loader2, CornerDownRight, LogOut } from "lucide-react";
import type { User, Session } from "@supabase/supabase-js";
import { useI18n } from "@/lib/i18n/I18nContext";
import { DICTIONARIES, type Locale, type TranslationKey } from "@/lib/i18n/locales";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Comment {
  id: string | number;
  thought_id?: string | number;
  author?: string | null;
  user_name?: string | null;
  user_avatar?: string | null;
  avatar_url?: string;
  website?: string | null;
  content: string;
  created_at: string | null;
}

type CommentPayload = Record<string, string | null>;

interface CommentSectionProps {
  thoughtId: string | number;
  onCommentAdded?: () => void;
  locale?: Locale;
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

function normalizeComment(row: Comment): Comment {
  return {
    ...row,
    created_at: row.created_at ?? new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────
// Avatar Component
// ─────────────────────────────────────────────

function Avatar({ name, src, size = 32 }: { name?: string | null; src?: string | null; size?: number }) {
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
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full text-white font-medium select-none"
      style={{ width: size, height: size, background: avatarBg(safe), fontSize: size * 0.4 }}
    >
      {letter}
    </div>
  );
}

// ─────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────

function IconGitHub() {
  return (
    <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] fill-current" aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
    </svg>
  );
}

function IconGoogle() {
  return (
    <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" />
    </svg>
  );
}

// ─────────────────────────────────────────────
// Guest form state (localStorage)
// ─────────────────────────────────────────────

interface GuestDraft {
  name: string;
}

const GUEST_KEY = "blog_guest_minimal";

function loadGuest(): GuestDraft {
  try {
    const v = localStorage.getItem(GUEST_KEY);
    if (v) return JSON.parse(v);
  } catch {}
  return { name: "" };
}

function saveGuest(g: GuestDraft) {
  try { localStorage.setItem(GUEST_KEY, JSON.stringify(g)); } catch {}
}

// ─────────────────────────────────────────────
// CommentSection Component
// ─────────────────────────────────────────────

export function CommentSection({
  thoughtId,
  onCommentAdded,
  locale: propLocale,
}: CommentSectionProps) {
  const { locale: contextLocale, convertText } = useI18n();
  const currentLocale = propLocale || contextLocale;

  const ct = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      const fallback = DICTIONARIES["zh-CN"];
      const dict =
        currentLocale === "en"
          ? (DICTIONARIES.en as Partial<Record<TranslationKey, string>>)
          : fallback;
      let val = dict[key] || fallback[key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          val = val.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        });
      }
      return val;
    },
    [currentLocale]
  );

  const targetId = String(thoughtId ?? "");
  const insertComment = (payload: CommentPayload) =>
    supabase
      .from("thought_comments")
      .insert([payload])
      .select("id,thought_id,user_name,user_avatar,author,website,content,created_at")
      .single();

  // ── Auth ──
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState<"github" | "google" | null>(null);

  // ── Comments ──
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ── Guest fallback (when not OAuth'd) ──
  const [guest, setGuest] = useState<GuestDraft>(() =>
    typeof window === "undefined" ? { name: "" } : loadGuest()
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 1. Auth session listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  // 3. Fetch comments
  useEffect(() => {
    let active = true;

    async function loadComments() {
      if (!targetId) {
        setCommentsLoading(false);
        return;
      }

      const result = await supabase
        .from("thought_comments")
        .select("id,thought_id,user_name,user_avatar,author,website,content,created_at")
        .eq("thought_id", targetId)
        .order("created_at", { ascending: false });

      if (!active) return;
      if (result.error) {
        console.error("读取评论失败:", result.error);
        setCommentsLoading(false);
        return;
      }
      setComments((result.data ?? []).map(normalizeComment));
      setCommentsLoading(false);
    }

    void loadComments();
    return () => {
      active = false;
    };
  }, [targetId]);

  // 4. Realtime subscription
  useEffect(() => {
    if (!targetId) return;
    const ch = supabase
      .channel(`cs-thought_comments-${targetId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "thought_comments",
        filter: `thought_id=eq.${targetId}`,
      }, (payload) => {
        const c = payload.new as Comment;
        setComments(prev => prev.some(x => String(x.id) === String(c.id)) ? prev : [c, ...prev]);
        onCommentAdded?.();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch).catch(() => {}); };
  }, [targetId, onCommentAdded]);

  // ── OAuth actions ──
  const signInWith = async (provider: "github" | "google") => {
    setAuthLoading(provider);
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.href },
    });
    setAuthLoading(null);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // ── Submit with smart schema tolerance ──
  const handleSubmit = async () => {
    setError("");
    const text = content.trim();
    if (!text) { setError(ct("comments.empty_error")); return; }

    let author = "";
    let website: string | null = null;
    let userAvatarUrl: string | null = null;

    if (session?.user) {
      const user: User = session.user;
      const meta = user.user_metadata;
      author = meta?.full_name || meta?.user_name || meta?.name || user.email?.split("@")[0] || ct("comments.anonymous");
      website = meta?.html_url || null;
      userAvatarUrl = meta?.avatar_url || null;
    } else {
      author = guest.name.trim() || ct("comments.guest");
      saveGuest({ name: guest.name.trim() });
    }

    setSubmitting(true);
    try {
      const payload: CommentPayload = {
        thought_id: targetId,
        author,
        user_name: author,
        content: text,
      };

      if (website) payload.website = sanitizeWebsiteUrl(website);
      if (userAvatarUrl) {
        payload.user_avatar = userAvatarUrl;
        payload.avatar_url = userAvatarUrl;
      }
      if (session?.user?.id) {
        payload.user_id = session.user.id;
      }

      let result = await insertComment(payload);

      if (result.error) {
        const errMsg = result.error.message || "";
        const fallbackPayload = { ...payload };

        if (errMsg.includes("user_name")) delete fallbackPayload.user_name;
        if (errMsg.includes("user_avatar")) delete fallbackPayload.user_avatar;
        if (errMsg.includes("avatar_url")) delete fallbackPayload.avatar_url;
        if (errMsg.includes("website")) delete fallbackPayload.website;
        if (errMsg.includes("author") && !fallbackPayload.user_name) fallbackPayload.user_name = author;

        result = await insertComment(fallbackPayload);
      }

      if (result.error) throw result.error;

      setContent("");
      if (result.data) {
        const newRecord = normalizeComment(result.data);
        setComments(prev => prev.some(x => String(x.id) === String(newRecord.id)) ? prev : [newRecord, ...prev]);
        onCommentAdded?.();
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : ct("comments.send_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const user = session?.user ?? null;
  const userAvatar = user?.user_metadata?.avatar_url ?? null;
  const userName = user
    ? (user.user_metadata?.full_name || user.user_metadata?.user_name || user.user_metadata?.name || user.email?.split("@")[0] || ct("comments.anonymous"))
    : null;

  return (
    <div className="w-full mt-8">
      {/* ── Comment Input Area ── */}
      <div className="group relative">
        <textarea
          ref={textareaRef}
          rows={3}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (error) setError("");
          }}
          placeholder={ct("comments.placeholder")}
          className="w-full resize-none bg-transparent border-none p-0 text-[14px] leading-relaxed text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-0"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />

        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 mt-1 border-t border-black/5 dark:border-white/5 opacity-40 focus-within:opacity-100 hover:opacity-100 transition-opacity">
          {user ? (
            <div className="flex items-center gap-2.5">
              <Avatar name={userName ?? ct("comments.anonymous")} src={userAvatar} size={20} />
              <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{userName}</span>
              <button
                type="button"
                onClick={signOut}
                className="text-xs text-neutral-400 hover:text-rose-500 transition-colors"
                title={ct("comments.sign_out")}
              >
                <LogOut className="h-[14px] w-[14px]" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={guest.name}
                onChange={e => setGuest(g => ({ ...g, name: e.target.value }))}
                placeholder={ct("comments.name_placeholder")}
                className="w-28 bg-transparent border-none p-0 text-[13px] text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none focus:ring-0"
              />
              <span className="text-neutral-200 dark:text-neutral-800 select-none">|</span>
              <div className="flex items-center gap-2.5">
                <button type="button" onClick={() => signInWith("github")} disabled={authLoading === "github"} className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                  {authLoading === "github" ? <Loader2 className="h-[15px] w-[15px] animate-spin" /> : <IconGitHub />}
                </button>
                <button type="button" onClick={() => signInWith("google")} disabled={authLoading === "google"} className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                  {authLoading === "google" ? <Loader2 className="h-[15px] w-[15px] animate-spin" /> : <IconGoogle />}
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            {error && <span className="text-[12px] text-rose-500">{error}</span>}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !content.trim()}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-neutral-400 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white disabled:opacity-30 transition-colors cursor-pointer select-none"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CornerDownRight className="h-4 w-4" />}
              <span>{ct("comments.send")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Comments list ── */}
      <div className="space-y-8 pt-10">
        {commentsLoading ? (
          <div className="space-y-6">
            {[1, 2].map(i => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-black/5 dark:bg-white/5 shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 w-24 rounded bg-black/5 dark:bg-white/5" />
                  <div className="h-3 w-3/4 rounded bg-black/5 dark:bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-[13px] text-neutral-400 dark:text-neutral-600 py-4 text-center select-none">
            {ct("comments.empty")}
          </p>
        ) : (
          comments.map(comment => {
            const authorName = comment.author || comment.user_name || ct("comments.anonymous");
            const avatarSrc = comment.user_avatar || comment.avatar_url || null;

            return (
              <div key={comment.id} className="group flex gap-4 text-left">
                <Avatar name={authorName} src={avatarSrc} size={32} />
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    {comment.website ? (
                      <a
                        href={sanitizeWebsiteUrl(comment.website) ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] font-medium text-neutral-800 hover:text-neutral-950 dark:text-neutral-200 dark:hover:text-white transition-colors"
                      >
                        {authorName}
                      </a>
                    ) : (
                      <span className="text-[13px] font-medium text-neutral-800 dark:text-neutral-200">
                        {authorName}
                      </span>
                    )}
                    <span className="text-[11px] text-neutral-400 dark:text-neutral-500 tabular-nums">
                      {formatRelativeTime(comment.created_at, currentLocale)}
                    </span>
                  </div>
                  <p className="text-[14px] leading-relaxed text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap break-words">
                    {currentLocale === "zh-TW" ? convertText(comment.content) : comment.content}
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