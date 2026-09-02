// components/theme/ThemeProvider.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
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

export function ThemeProvider({
  children,
  initialTheme = "light",
}: {
  children: React.ReactNode;
  initialTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [mounted, setMounted] = useState(false);
  const isTransitioningRef = useRef(false);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. 客户端挂载标记与系统主题偏好监听
  useEffect(() => {
    setMounted(true);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      // 检查 Cookie 中是否已有用户显式手动设定的主题，若无则跟随系统
      const hasCookieTheme = document.cookie.includes("theme=");
      if (!hasCookieTheme) {
        const nextSystemTheme = e.matches ? "dark" : "light";
        applyThemeDirect(nextSystemTheme);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const saveTheme = (newTheme: Theme) => {
    document.cookie = `theme=${newTheme}; path=/; max-age=31536000; SameSite=Lax`;
  };

  // 2. 移动端/降级平滑色彩过渡
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
    saveTheme(newTheme);

    transitionTimerRef.current = setTimeout(() => {
      root.classList.remove("theme-smooth-transition");
      isTransitioningRef.current = false;
    }, 260);
  }, []);

  // 3. 基础直接切换（更新 DOM Class、React 状态与持久化 Cookie）
  const applyThemeDirect = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (newTheme === "dark") {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.remove("dark");
        root.classList.add("light");
      }
      saveTheme(newTheme);
    }
  }, []);

  // 4. 主题切换核心逻辑（支持 View Transitions 扩散圆动效）
  const toggleTheme = useCallback(
    (
      event?: React.MouseEvent<HTMLElement>,
      options?: ToggleThemeOptions
    ) => {
      if (isTransitioningRef.current) return;

      const nextTheme = theme === "dark" ? "light" : "dark";

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

      let transition: any;
      try {
        transition = (document as any).startViewTransition(() => {
          flushSync(() => {
            applyThemeDirect(nextTheme);
          });
        });
      } catch {
        isTransitioningRef.current = false;
        applyThemeWithSmoothTransition(nextTheme);
        return;
      }

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