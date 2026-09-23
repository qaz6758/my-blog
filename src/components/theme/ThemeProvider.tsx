// src/components/theme/ThemeProvider.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useSyncExternalStore,
} from "react";

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

/**
 * 严格判断当前交互运行环境是否为移动端设备
 * 结合指针粗细（触屏 pointer: coarse）与屏幕尺寸，准确分流 PC 与手机端
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(hover: none) and (pointer: coarse)").matches ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  );
}

function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;

  try {
    const fromLocal = localStorage.getItem(STORAGE_KEY);
    if (fromLocal === "light" || fromLocal === "dark") {
      return fromLocal;
    }

    const cookieMatch = document.cookie.match(
      /(?:^|;\s*)theme=(light|dark)/
    );
    if (cookieMatch) {
      return cookieMatch[1] as Theme;
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

function updateMetaColorScheme(newTheme: Theme) {
  if (typeof document === "undefined") return;

  try {
    const themeColor = newTheme === "dark" ? "#050505" : "#ffffff";

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

    const root = document.documentElement;

    if (newTheme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
      root.style.colorScheme = "only dark";
      root.style.backgroundColor = "#050505";
      if (document.body) {
        document.body.style.backgroundColor = "#050505";
        document.body.style.color = "#e5e5e5";
      }
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      root.style.colorScheme = "only light";
      root.style.backgroundColor = "#ffffff";
      if (document.body) {
        document.body.style.backgroundColor = "#ffffff";
        document.body.style.color = "#222222";
      }
    }

    setThemeState(newTheme);
    persistTheme(newTheme);
    updateMetaColorScheme(newTheme);
  }, []);

  /*
   * ============================================================
   * 客户端初始化：强制将 DOM 状态与当前主题原子对齐
   * ============================================================
   */
  useEffect(() => {
    const current = getInitialTheme(initialTheme);
    applyThemeDirect(current);
  }, [initialTheme, applyThemeDirect]);

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
   * 主题切换统一调度中心：通过 isMobileDevice() 自动分流平台差异
   * ============================================================
   */
  const toggleTheme = useCallback(
    (
      event?: React.MouseEvent<HTMLElement>,
      options?: ToggleThemeOptions
    ) => {
      if (typeof document === "undefined") return;

      // 互斥防抖锁：如果当前正在播放过渡动效（无论是 PC 扩散还是移动端漫染），
      // 坚决忽略重复连击（彻底根除连击“切两下”导致的 Chromium Blink Compositor 重入与 GPU 崩溃）
      if (isTransitioningRef.current) {
        return;
      }

      isTransitioningRef.current = true;

      // 550ms 兜底安全解锁，防止任何浏览器不可抗力异常导致锁死
      const releaseTimeout = setTimeout(() => {
        isTransitioningRef.current = false;
      }, 550);

      const handleComplete = () => {
        clearTimeout(releaseTimeout);
        isTransitioningRef.current = false;
      };

      const root = document.documentElement;
      const isCurrentlyDark = root.classList.contains("dark");
      const nextTheme: Theme = isCurrentlyDark ? "light" : "dark";

      runThemeTransition(
        {
          nextTheme,
          applyThemeDirect,
          event,
          options,
          onComplete: handleComplete,
        },
        isMobileDevice()
      );
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
