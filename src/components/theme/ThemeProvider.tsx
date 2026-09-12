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
import { runDesktopThemeTransition } from "./drivers/desktopThemeDriver";
import { runMobileThemeTransition } from "./drivers/mobileThemeDriver";

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
    window.innerWidth < 768 ||
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

    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
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
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
      themeColorMeta = document.createElement("meta");
      themeColorMeta.setAttribute("name", "theme-color");
      document.head.appendChild(themeColorMeta);
    }

    themeColorMeta.setAttribute(
      "content",
      newTheme === "dark" ? "#111213" : "#ede7dc"
    );
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
      root.style.colorScheme = "dark";
      root.style.backgroundColor = "#111213";
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      root.style.colorScheme = "light";
      root.style.backgroundColor = "#ede7dc";
    }

    setThemeState(newTheme);
    persistTheme(newTheme);
    updateMetaColorScheme(newTheme);
  }, []);

  /*
   * ============================================================
   * 客户端初始化 + 系统主题实时监听
   * ============================================================
   */
  useEffect(() => {
    const current = getInitialTheme(initialTheme);
    setThemeState(current);
    applyThemeDirect(current);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (event: MediaQueryListEvent) => {
      const currentStored = getStoredTheme();
      if (!currentStored) {
        const nextSystemTheme: Theme = event.matches ? "dark" : "light";
        applyThemeDirect(nextSystemTheme);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [initialTheme, applyThemeDirect]);

  const isTransitioningRef = React.useRef(false);

  /*
   * ============================================================
   * 主题切换分流调度中心：PC 归 PC，手机端归手机端，各司其职
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

      if (isMobileDevice()) {
        // [手机端通道]：满血日光波纹（与 PC 端完全一致的以触控点为中心的扩散）
        runMobileThemeTransition({
          nextTheme,
          applyThemeDirect,
          event,
          options,
          onComplete: handleComplete,
        });
      } else {
        // [PC 桌面端通道]：调用专属精准指针日光波纹引擎
        runDesktopThemeTransition({
          nextTheme,
          applyThemeDirect,
          event,
          options,
          onComplete: handleComplete,
        });
      }
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
