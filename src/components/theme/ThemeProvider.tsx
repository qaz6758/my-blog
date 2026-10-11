// src/components/theme/ThemeProvider.tsx
"use client";

import React, {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
  useCallback,
  useSyncExternalStore,
} from "react";
import { flushSync } from "react-dom";

import {
  Theme,
  ToggleThemeOptions,
  ThemeContextType,
} from "./types";
import { runThemeTransition } from "./drivers/themeTransitionDriver";

export type { Theme, ToggleThemeOptions, ThemeContextType };

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "theme";

function subscribeEmpty() {
  return () => {};
}

function getClientMounted() {
  return true;
}

function getServerMounted() {
  return false;
}

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark";
}


function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;

  try {
    const fromLocal = localStorage.getItem(STORAGE_KEY);
    if (isTheme(fromLocal)) {
      return fromLocal;
    }

    const cookieMatch = document.cookie.match(
      /(?:^|;\s*)theme=(light|dark)/
    );
    const fromCookie = cookieMatch?.[1];
    if (fromCookie && isTheme(fromCookie)) {
      return fromCookie;
    }
  } catch {}

  return null;
}

function getInitialTheme(defaultFallback: Theme = "light"): Theme {
  if (typeof window === "undefined") {
    return defaultFallback;
  }

  try {
    const search = window.location.search;
    if (search.includes("theme=light")) return "light";
    if (search.includes("theme=dark")) return "dark";

    const stored = getStoredTheme();
    if (stored) return stored;

    const root = document.documentElement;
    if (root.classList.contains("dark")) return "dark";
    if (root.classList.contains("light")) return "light";
  } catch {}

  return defaultFallback;
}

function persistTheme(target: Theme) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, target);
    document.cookie = `theme=${target}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {}
}

function applyThemeToDocument(newTheme: Theme) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const rootBackgroundColor = newTheme === "dark" ? "#000000" : "#f7f2ed";
  const bodyBackgroundColor = newTheme === "dark" ? "#000000" : "#f7f2ed";
  const textColor = newTheme === "dark" ? "#f1f1f1" : "#222222";

  root.classList.toggle("dark", newTheme === "dark");
  root.classList.toggle("light", newTheme === "light");
  root.setAttribute("data-theme", newTheme);
  root.style.colorScheme = newTheme === "dark" ? "only dark" : "only light";
  root.style.backgroundColor = rootBackgroundColor;
  if (document.body) {
    document.body.style.backgroundColor = bodyBackgroundColor;
    document.body.style.color = textColor;
  }

  persistTheme(newTheme);
  updateMetaColorScheme(newTheme);
}

function updateMetaColorScheme(newTheme: Theme) {
  if (typeof document === "undefined") return;

  try {
    const themeColor = newTheme === "dark" ? "#000000" : "#f7f2ed";

    // 仅原地更新属性，坚决不从 DOM 树中 remove() 节点，保护 React 19 HostHoistable (tag 26) 虚拟 DOM 树完整性
    const themeColorMetas = document.querySelectorAll('meta[name="theme-color"]');
    themeColorMetas.forEach((m) => {
      m.removeAttribute("media");
      m.setAttribute("content", themeColor);
    });

    const colorSchemeMetas = document.querySelectorAll('meta[name="color-scheme"]');
    colorSchemeMetas.forEach((m) => {
      m.setAttribute("content", "light dark");
    });
  } catch {}
}

export function ThemeProvider({
  children,
  initialTheme = "light",
}: {
  children: React.ReactNode;
  initialTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(() =>
    getInitialTheme(initialTheme)
  );

  const mounted = useSyncExternalStore(
    subscribeEmpty,
    getClientMounted,
    getServerMounted
  );

  /*
   * ============================================================
   * 基础主题底层应用：原子更新 DOM class、colorScheme 与 root 背景
   * ============================================================
   */
  const applyThemeDirect = useCallback((newTheme: Theme) => {
    if (typeof document === "undefined") return;
    applyThemeToDocument(newTheme);
    try {
      flushSync(() => {
        setThemeState(newTheme);
      });
    } catch {
      setThemeState(newTheme);
    }
  }, []);

  /*
   * ============================================================
   * 客户端初始化：强制将 DOM 状态与当前主题原子对齐
   * ============================================================
   */
  useEffect(() => {
    const current = getInitialTheme(initialTheme);
    applyThemeToDocument(current);
    if (current !== theme) {
      startTransition(() => setThemeState(current));
    }
  }, [initialTheme, theme]);

  /*
   * ============================================================
   * 监听系统深色模式偏好变化：仅在用户未手动选择主题时跟随系统
   * ============================================================
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = (e: MediaQueryListEvent) => {
      // 用户已通过手动切换显式选择了主题 → 不跟随系统
      const stored = getStoredTheme();
      if (!stored) {
        applyThemeDirect(e.matches ? "dark" : "light");
      }
    };
    mq.addEventListener("change", handleSystemChange);
    return () => mq.removeEventListener("change", handleSystemChange);
  }, [applyThemeDirect]);

  const isTransitioningRef = React.useRef(false);

  /*
   * ============================================================
   * 主题切换统一调度中心：全端统一羽化涟漪 View Transition
   * ============================================================
   */
  const toggleTheme = useCallback(
    (
      event?: React.MouseEvent<HTMLElement>,
      options?: ToggleThemeOptions
    ) => {
      if (typeof document === "undefined") return;

      // 互斥防抖锁：如果当前正在播放过渡动效，忽略重复连击
      if (isTransitioningRef.current) {
        return;
      }

      isTransitioningRef.current = true;

      // 1050ms 兜底安全解锁，与动画时长及看门狗对齐
      const releaseTimeout = setTimeout(() => {
        isTransitioningRef.current = false;
      }, 1050);

      const handleComplete = () => {
        clearTimeout(releaseTimeout);
        isTransitioningRef.current = false;
      };

      const root = document.documentElement;
      const isCurrentlyDark = root.classList.contains("dark");
      const nextTheme: Theme = isCurrentlyDark ? "light" : "dark";

      runThemeTransition({
        nextTheme,
        applyThemeDirect,
        event,
        options,
        onComplete: handleComplete,
      });
    },
    [applyThemeDirect]
  );

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === "dark",
        mounted,
        toggleTheme,
        setTheme: applyThemeDirect,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme 必须在 ThemeProvider 内使用");
  }
  return context;
}
