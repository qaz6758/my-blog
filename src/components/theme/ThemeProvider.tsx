// components/theme/ThemeProvider.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useSyncExternalStore,
} from "react";
import { flushSync } from "react-dom";

type Theme = "light" | "dark";

export interface ToggleThemeOptions {
  disableAnimation?: boolean;
}

export interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  mounted: boolean;
  toggleTheme: (
    event?: React.MouseEvent<HTMLElement>,
    options?: ToggleThemeOptions
  ) => void;
  setTheme: (theme: Theme) => void;
}

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

function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    const fromLocal = localStorage.getItem(STORAGE_KEY);
    if (fromLocal === "light" || fromLocal === "dark") {
      return fromLocal as Theme;
    }
    const cookieMatch = document.cookie.match(/(?:^|;\s*)theme=(light|dark)/);
    if (cookieMatch) {
      return cookieMatch[1] as Theme;
    }
  } catch {
    // 忽略异常
  }
  return null;
}

function persistTheme(target: Theme) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, target);
    document.cookie = `theme=${target}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {
    // 忽略异常
  }
}

export function ThemeProvider({
  children,
  initialTheme = "light",
}: {
  children: React.ReactNode;
  initialTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const mounted = useSyncExternalStore(
    subscribeEmpty,
    getClientMounted,
    getServerMounted
  );
  const isTransitioningRef = useRef(false);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. 基础直接切换（更新 DOM Class、React 状态与持久化双写）
  const applyThemeDirect = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    persistTheme(newTheme);
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (newTheme === "dark") {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.remove("dark");
        root.classList.add("light");
      }
    }
  }, []);

  // 2. 移动端平滑色彩过渡
  const applyThemeWithSmoothTransition = useCallback((newTheme: Theme) => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;

    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }

    root.classList.add("theme-smooth-transition");
    if (newTheme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }
    setThemeState(newTheme);
    persistTheme(newTheme);

    transitionTimerRef.current = setTimeout(() => {
      root.classList.remove("theme-smooth-transition");
      isTransitioningRef.current = false;
    }, 260);
  }, []);

  // 3. 客户端挂载初始化与系统主题偏好监听
  useEffect(() => {
    const stored = getStoredTheme();
    if (stored) {
      applyThemeDirect(stored);
    } else {
      const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      applyThemeDirect(isSystemDark ? "dark" : "light");
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      // 只要 localStorage 或 Cookie 中已有用户手动设定的主题，一律不跟随系统突变
      const currentStored = getStoredTheme();
      if (!currentStored) {
        const nextSystemTheme = e.matches ? "dark" : "light";
        applyThemeDirect(nextSystemTheme);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [applyThemeDirect]);

  // 4. 主题切换核心逻辑（支持 View Transitions 扩散圆动效）
  const toggleTheme = useCallback(
    (
      event?: React.MouseEvent<HTMLElement>,
      options?: ToggleThemeOptions
    ) => {
      if (isTransitioningRef.current) return;

      const nextTheme: Theme = theme === "dark" ? "light" : "dark";

      const isMobile =
        typeof window !== "undefined" &&
        window.matchMedia("(max-width: 768px)").matches;

      // 移动端、用户开启减弱动态效果或不支持 View Transitions 时平滑降级
      if (
        options?.disableAnimation ||
        isMobile ||
        typeof document === "undefined" ||
        !("startViewTransition" in document) ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        isTransitioningRef.current = true;
        applyThemeWithSmoothTransition(nextTheme);
        return;
      }

      isTransitioningRef.current = true;

      // 计算点击坐标中心点
      let x = window.innerWidth / 2;
      let y = window.innerHeight / 2;

      if (event?.currentTarget) {
        const rect = event.currentTarget.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      } else if (event && event.clientX > 0 && event.clientY > 0) {
        x = event.clientX;
        y = event.clientY;
      }

      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      try {
        const transitionDoc = document as unknown as {
          startViewTransition: (callback: () => void) => {
            ready: Promise<void>;
            finished: Promise<void>;
          };
        };

        const transition = transitionDoc.startViewTransition(() => {
          flushSync(() => {
            applyThemeDirect(nextTheme);
          });
        });

        transition.ready
          .then(() => {
            document.documentElement.animate(
              {
                clipPath: [
                  `circle(0px at ${x}px ${y}px)`,
                  `circle(${endRadius}px at ${x}px ${y}px)`,
                ],
              },
              {
                duration: 450,
                easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                pseudoElement: "::view-transition-new(root)",
              }
            );
          })
          .catch(() => {
            applyThemeDirect(nextTheme);
          })
          .finally(() => {
            isTransitioningRef.current = false;
          });
      } catch {
        isTransitioningRef.current = false;
        applyThemeWithSmoothTransition(nextTheme);
      }
    },
    [theme, applyThemeDirect, applyThemeWithSmoothTransition]
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