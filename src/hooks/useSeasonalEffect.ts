// src/hooks/useSeasonalEffect.ts
"use client";

import { useState, useEffect, useSyncExternalStore, useCallback } from "react";

export type SeasonMode = "auto" | "autumn" | "spring" | "summer" | "winter";
export type ActiveSeason = "autumn" | "spring" | "summer" | "winter";

const STORAGE_KEY_ENABLED = "blog_seasonal_effect_enabled";
const STORAGE_KEY_MODE = "blog_seasonal_effect_mode";

export function getAutoSeason(): ActiveSeason {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

interface SeasonalStoreState {
  enabled: boolean;
  mode: SeasonMode;
}

// 模块级全局共享状态
let storeState: SeasonalStoreState = {
  enabled: true,
  mode: "auto",
};

// 客户端首次运行初始化读取
if (typeof window !== "undefined") {
  try {
    const savedEnabled = localStorage.getItem(STORAGE_KEY_ENABLED);
    if (savedEnabled !== null) {
      storeState.enabled = savedEnabled === "true";
    }
    const savedMode = localStorage.getItem(STORAGE_KEY_MODE) as SeasonMode;
    if (savedMode && ["auto", "autumn", "spring", "summer", "winter"].includes(savedMode)) {
      storeState.mode = savedMode;
    }
  } catch {
    // ignore
  }
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): SeasonalStoreState {
  return storeState;
}

const serverSnapshot: SeasonalStoreState = {
  enabled: true,
  mode: "auto",
};

function getServerSnapshot(): SeasonalStoreState {
  return serverSnapshot;
}

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export function useSeasonalEffect() {
  const [mounted, setMounted] = useState(false);
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleEnabled = useCallback(() => {
    const nextEnabled = !storeState.enabled;
    storeState = { ...storeState, enabled: nextEnabled };
    try {
      localStorage.setItem(STORAGE_KEY_ENABLED, String(nextEnabled));
    } catch {
      // ignore
    }
    notify();
  }, []);

  const setSeasonMode = useCallback((newMode: SeasonMode) => {
    storeState = { ...storeState, mode: newMode };
    try {
      localStorage.setItem(STORAGE_KEY_MODE, newMode);
    } catch {
      // ignore
    }
    notify();
  }, []);

  // 始终根据当前真实自然季节（月份）自动切换粒子效果
  const activeSeason: ActiveSeason = getAutoSeason();

  return {
    mounted,
    enabled: current.enabled,
    mode: "auto" as SeasonMode,
    activeSeason,
    toggleEnabled,
    setSeasonMode,
  };
}
