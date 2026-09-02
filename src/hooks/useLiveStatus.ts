// hooks/useLiveStatus.ts

"use client";

import { useSyncExternalStore } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

/* ============================================================
 * 配置
 * ============================================================ */

const STATUS_CHECK_INTERVAL = 5_000;
const SITE_STATUS_ID = "admin";

/* ============================================================
 * 类型定义
 * ============================================================ */

export interface LiveMusicStatus {
  title: string | null;
  artist: string | null;
  cover: string | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
}

export interface LiveAppStatus {
  name: string;
  title: string | null;
  icon: string | null;
}

export interface LiveStatus {
  activity: "music" | "app" | "idle" | "offline";
  lastSeenAt: string | null;
  music: LiveMusicStatus | null;
  app: LiveAppStatus | null;
}

/* ============================================================
 * 默认状态与映射
 * ============================================================ */

const DEFAULT_STATUS: LiveStatus = {
  activity: "offline",
  lastSeenAt: null,
  music: null,
  app: null,
};

function isStatusExpired(lastSeenAt: string | null): boolean {
  if (!lastSeenAt) return true;
  const timestamp = new Date(lastSeenAt).getTime();
  if (!Number.isFinite(timestamp)) return true;
  // 120 秒无心跳才认为掉线
  return Date.now() - timestamp > 120_000;
}

function mapRow(row: any): LiveStatus {
  if (!row) return DEFAULT_STATUS;

  const lastSeenAt = row.last_seen_at ?? null;

  if (isStatusExpired(lastSeenAt)) {
    return {
      activity: "offline",
      lastSeenAt,
      music: null,
      app: null,
    };
  }

  const isMusic = Boolean(row.music_title);
  const isApp = Boolean(row.app_name);

  return {
    // 这里只要在线就视为 app 或 music，activity字段可以弱化
    activity: isMusic ? "music" : isApp ? "app" : "idle",
    lastSeenAt,
    music: isMusic
      ? {
          title: row.music_title ?? null,
          artist: row.music_artist ?? null,
          cover: row.music_cover ?? null,
          currentTime: Number(row.music_current_time) || 0,
          duration: Number(row.music_duration) || 0,
          isPlaying: Boolean(row.music_is_playing),
        }
      : null,
    app: isApp
      ? {
          name: row.app_name ?? "Desktop",
          title: row.app_title ?? null,
          icon: row.app_icon ?? null,
        }
      : null,
  };
}

/* ============================================================
 * 全局单例管理器（跨所有组件共享唯一 WebSocket）
 * ============================================================ */

let globalStatus: LiveStatus = DEFAULT_STATUS;
const listeners = new Set<() => void>();
let activeChannel: RealtimeChannel | null = null;
let expirationTimer: ReturnType<typeof setInterval> | null = null;
let isStarted = false;

function updateStatus(newStatus: LiveStatus) {
  globalStatus = newStatus;
  listeners.forEach((listener) => listener());
}

async function fetchInitialStatus() {
  try {
    const { data, error } = await supabase
      .from("site_status")
      .select(
        "id, last_seen_at, activity, music_title, music_artist, music_cover, music_current_time, music_duration, music_is_playing, app_name, app_title, app_icon"
      )
      .eq("id", SITE_STATUS_ID)
      .maybeSingle();

    if (error) {
      console.warn("⚠️ [LiveStatus] 获取初始状态失败:", error.message);
      return;
    }

    updateStatus(mapRow(data));
  } catch (err) {
    console.warn("⚠️ [LiveStatus] 网络异常，无法读取状态:", err);
  }
}

function startRealtime() {
  if (isStarted) return;
  isStarted = true;

  fetchInitialStatus();

  // 1. 创建独立通道并先注册 .on() 再执行 .subscribe()
  const channelName = `site-status-live-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  activeChannel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "site_status",
        filter: `id=eq.${SITE_STATUS_ID}`,
      },
      (payload) => {
        updateStatus(mapRow(payload.new));
      }
    )
    .subscribe((status, err) => {
      if (status === "SUBSCRIBED") {
        console.log("🟢 [LiveStatus] 实时通道已建立");
      } else if (status === "CHANNEL_ERROR") {
        console.warn("⚠️ [LiveStatus] 通道错误:", err?.message || err);
      }
    });

  // 2. 启动心跳超时检测
  expirationTimer = setInterval(() => {
    if (globalStatus.activity === "offline" && globalStatus.music === null) {
      return;
    }

    if (isStatusExpired(globalStatus.lastSeenAt)) {
      updateStatus({
        activity: "offline",
        lastSeenAt: globalStatus.lastSeenAt,
        music: null,
        app: null,
      });
    }
  }, STATUS_CHECK_INTERVAL);
}

function stopRealtime() {
  if (!isStarted) return;
  isStarted = false;

  if (expirationTimer) {
    clearInterval(expirationTimer);
    expirationTimer = null;
  }

  if (activeChannel) {
    supabase.removeChannel(activeChannel).catch(() => {});
    activeChannel = null;
  }
}

// 订阅事件中心
function subscribe(callback: () => void) {
  listeners.add(callback);

  if (listeners.size === 1) {
    startRealtime();
  }

  return () => {
    listeners.delete(callback);
    if (listeners.size === 0) {
      stopRealtime();
    }
  };
}

function getSnapshot() {
  return globalStatus;
}

function getServerSnapshot() {
  return DEFAULT_STATUS;
}

/* ============================================================
 * Hook 主入口
 * ============================================================ */

export function useLiveStatus(): LiveStatus {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}