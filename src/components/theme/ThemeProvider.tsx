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
      return fromLocal;
    }

    const cookieMatch = document.cookie.match(
      /(?:^|;\s*)theme=(light|dark)/
    );

    if (cookieMatch) {
      return cookieMatch[1] as Theme;
    }
  } catch {
    // 忽略异常
  }

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

    if (stored) {
      return stored;
    }

    const root = document.documentElement;

    if (root.classList.contains("dark")) {
      return "dark";
    }

    if (root.classList.contains("light")) {
      return "light";
    }

    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  } catch {
    // 忽略异常
  }

  return defaultFallback;
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

function updateMetaColorScheme(newTheme: Theme) {
  if (typeof document === "undefined") return;

  try {
    let themeColorMeta = document.querySelector(
      'meta[name="theme-color"]'
    );

    if (!themeColorMeta) {
      themeColorMeta = document.createElement("meta");
      themeColorMeta.setAttribute("name", "theme-color");
      document.head.appendChild(themeColorMeta);
    }

    themeColorMeta.setAttribute(
      "content",
      newTheme === "dark" ? "#111213" : "#ede7dc"
    );
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
  const [theme, setThemeState] = useState<Theme>(() =>
    getInitialTheme(initialTheme)
  );

  const mounted = useSyncExternalStore(
    subscribeEmpty,
    getClientMounted,
    getServerMounted
  );

  const transitionTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  /*
   * ============================================================
   * 基础主题切换
   * ============================================================
   */

  const applyThemeDirect = useCallback((newTheme: Theme) => {
    const root = document.documentElement;

    /*
     * DOM class 与 root.style.colorScheme 严格同步原子更新。
     * 确保移动端浏览器与操作系统级画布底层永远与当前日间/夜间模式保持 100% 一致，
     * 彻底根治深色画布残留导致的“双重穿透”黑底闪屏漏洞。
     */
    if (newTheme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      root.style.colorScheme = "light";
    }

    setThemeState(newTheme);

    persistTheme(newTheme);
    updateMetaColorScheme(newTheme);
  }, []);

  /*
   * ============================================================
   * 无 View Transition 时的平滑降级
   * ============================================================
   */

  const applyThemeWithSmoothTransition = useCallback(
    (newTheme: Theme) => {
      if (typeof document === "undefined") return;

      const root = document.documentElement;

      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }

      /*
       * 只负责骨干容器平滑渐变。
       *
       * 不依赖 View Transition，因此移动端或旧设备切换时依然柔和自然。
       */
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
      updateMetaColorScheme(newTheme);

      transitionTimerRef.current = setTimeout(() => {
        root.classList.remove("theme-smooth-transition");
        transitionTimerRef.current = null;
      }, 260);
    },
    []
  );

  /*
   * ============================================================
   * 客户端初始化 + 系统主题监听
   * ============================================================
   */

  useEffect(() => {
    const current = getInitialTheme(initialTheme);

    setThemeState(current);
    applyThemeDirect(current);

    const mediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    const handleChange = (event: MediaQueryListEvent) => {
      /*
       * 用户已经手动设置过主题后，不再跟随系统主题。
       */
      const currentStored = getStoredTheme();

      if (!currentStored) {
        const nextSystemTheme: Theme = event.matches
          ? "dark"
          : "light";

        applyThemeDirect(nextSystemTheme);
      }
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);

      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, [initialTheme, applyThemeDirect]);

  /*
   * ============================================================
   * 主题切换核心逻辑
   *
   * View Transition：
   *   1. 记录按钮位置
   *   2. 开始 View Transition
   *   3. 同步修改主题
   *   4. 等待 snapshot ready
   *   5. 对 ::view-transition-new(root) 做圆形展开
   *
   * 兼容重点：
   *   - 不改变 View Transition snapshot 的 transform
   *   - 不使用 viewport center 作为默认圆心
   *   - 尽可能在 ready 后再执行 clip-path
   *   - 对异常设备自动降级
   * ============================================================
   */

  const toggleTheme = useCallback(
    (
      event?: React.MouseEvent<HTMLElement>,
      options?: ToggleThemeOptions
    ) => {
      if (typeof document === "undefined") return;

      const root = document.documentElement;

      /*
       * 直接从 DOM 判断当前实际主题。
       *
       * 防止 React state 与 DOM 在快速点击时出现不同步。
       */
      const isCurrentlyDark = root.classList.contains("dark");

      const nextTheme: Theme = isCurrentlyDark
        ? "light"
        : "dark";

      /*
       * 检查浏览器是否支持 View Transition。
       */
      const hasViewTransitions =
        "startViewTransition" in document &&
        typeof (
          document as Document & {
            startViewTransition?: unknown;
          }
        ).startViewTransition === "function" &&
        !window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;

      const isMobile =
        typeof window !== "undefined" &&
        (window.innerWidth < 768 ||
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
          ) ||
          ("ontouchstart" in window && window.innerWidth < 1024));

      /*
       * 移动端（iOS/Android WebView）：直接使用极速原子切换 (applyThemeDirect)。
       * 彻底消除移动端多 DOM 节点全局样式重算与 color transition（根除“异常卡顿”与掉帧），
       * 并保证背景色与文本对比度同帧零毫秒翻转，绝无反色相撞的“整页闪屏”。
       * 桌面端用户关闭动画或不支持 View Transition 时，亦采用极速原子切换。
       */
      if (options?.disableAnimation || !hasViewTransitions || isMobile) {
        applyThemeDirect(nextTheme);
        return;
      }

      /*
       * ========================================================
       * 计算动画圆心
       * ========================================================
       *
       * 关键点：
       *
       * currentTarget 的 getBoundingClientRect() 返回的是
       * viewport 坐标。
       *
       * View Transition root 也应该以 viewport 为参考。
       *
       * 这里不再使用 clientX/clientY 作为主要来源，避免
       * 小米部分浏览器在事件坐标与 snapshot 坐标之间产生偏移。
       */

      let x = window.innerWidth / 2;
      let y = window.innerHeight / 2;

      const target = event?.currentTarget;

      if (target instanceof HTMLElement) {
        const rect = target.getBoundingClientRect();

        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      }

      /*
       * 防止极端情况下坐标跑出 viewport。
       */
      x = Math.max(0, Math.min(window.innerWidth, x));
      y = Math.max(0, Math.min(window.innerHeight, y));

      /*
       * 计算覆盖整个 viewport 所需要的最大半径。
       */
      const endRadius = Math.ceil(
        Math.max(
          Math.hypot(x, y),
          Math.hypot(
            window.innerWidth - x,
            y
          ),
          Math.hypot(
            x,
            window.innerHeight - y
          ),
          Math.hypot(
            window.innerWidth - x,
            window.innerHeight - y
          )
        )
      );

      try {
        const transitionDoc = document as Document & {
          startViewTransition: (
            callback: () => void
          ) => {
            ready: Promise<void>;
            finished: Promise<void>;
          };
        };

        /*
         * 在 View Transition 期间锁定全页面子元素的 CSS 过渡与复杂重绘，
         * 消除文章列表等海量 DOM 节点上的 transition-all 引发的大面积掉帧。
         */
        root.classList.add("view-transition-active");

        const transition = transitionDoc.startViewTransition(() => {
          flushSync(() => {
            applyThemeDirect(nextTheme);
          });
        });

        transition.finished
          .finally(() => {
            root.classList.remove("view-transition-active");
          })
          .catch(() => {});

        /*
         * ======================================================
         * 等待新 View Transition snapshot 准备完成
         * ======================================================
         *
         * 不在 startViewTransition() 同步阶段操作 clip-path。
         *
         * 这样可以避免部分移动端浏览器在 snapshot 尚未完成
         * 时建立错误的 clip-path 合成层。
         */
        transition.ready
          .then(() => {
            /*
             * 获取真正的 View Transition new root。
             *
             * 通过 documentElement.animate + pseudoElement
             * 让动画只作用于新主题快照。
             */
            const animation = document.documentElement.animate(
              {
                clipPath: [
                  `circle(0px at ${x}px ${y}px)`,
                  `circle(${endRadius}px at ${x}px ${y}px)`,
                ],
              },
              {
                duration: 400,
                easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                fill: "both",
                pseudoElement:
                  "::view-transition-new(root)",
              }
            );

            /*
             * 如果浏览器拒绝 pseudoElement 动画，
             * 不让异常影响主题状态。
             */
            animation.finished.catch(() => {
              // 忽略动画异常
            });
          })
          .catch(() => {
            /*
             * View Transition 创建成功，但 ready 阶段失败时，
             * 主题已经被切换，因此这里只确保 DOM 状态正确。
             */
            applyThemeDirect(nextTheme);
          });

        /*
         * finished 只是用于兜底清理。
         *
         * 不在这里操作动画本身，避免影响 View Transition
         * 的生命周期。
         */
        transition.finished.catch(() => {
          // 忽略异常
        });
      } catch {
        /*
         * 某些浏览器虽然存在 startViewTransition，
         * 但实际执行可能失败。
         *
         * 这种情况下直接降级到极速原子切换。
         */
        applyThemeDirect(nextTheme);
      }
    },
    [
      applyThemeDirect,
    ]
  );

  /*
   * ============================================================
   * Context
   * ============================================================
   */

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
    throw new Error(
      "useTheme 必须在 ThemeProvider 内使用"
    );
  }

  return context;
}