import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "@/app/globals.css";

import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { MusicProvider } from "@/components/playlist/MusicContext";
import { FrontendShell } from "@/components/layout/FrontendShell";
import { siteConfig } from "@/config/site";

export const viewport: Viewport = {
  colorScheme: "light dark",
};

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name}'s Blog`,
    template: `%s | ${siteConfig.name}'s Blog`,
  },
  description: siteConfig.description,
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("theme")?.value;
  // 默认使用 dark，确保首次访问或未携带 cookie 时 100% 保持深色水墨基调，杜绝白屏闪烁
  const isDark = themeCookie ? themeCookie === "dark" : true;
  const themeClass = isDark ? "dark" : "light";
  const bgColor = isDark ? "#050505" : "#ffffff";
  const textColor = isDark ? "#e5e5e5" : "#222222";

  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={themeClass}
      style={{ colorScheme: isDark ? "dark" : "light", backgroundColor: bgColor }}
    >
      <head>
        {/* 1. 首屏零毫秒同步锁定主题脚本（置于最顶端，解析最先执行） */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var docEl = document.documentElement;
                  docEl.classList.add('no-transitions');
                  var queryTheme = window.location.search.indexOf('theme=light') !== -1 ? 'light' : (window.location.search.indexOf('theme=dark') !== -1 ? 'dark' : null);
                  var saved = queryTheme || localStorage.getItem('theme') || (document.cookie.match(/(?:^|;\\s*)theme=([^;]+)/) || [])[1];
                  var systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var isDark = saved ? saved === 'dark' : systemDark;
                  var themeColor = isDark ? '#050505' : '#ffffff';
                  var colorScheme = isDark ? 'dark' : 'light';

                  if (isDark) {
                    docEl.classList.add('dark');
                    docEl.classList.remove('light');
                  } else {
                    docEl.classList.remove('dark');
                    docEl.classList.add('light');
                  }
                  docEl.style.colorScheme = colorScheme;
                  docEl.style.backgroundColor = themeColor;

                  // 净化与同步所有 theme-color meta，杜绝深色 media query 劫持 Chrome 原生清屏画布
                  var themeMetas = document.querySelectorAll('meta[name="theme-color"]');
                  themeMetas.forEach(function(m) {
                    m.removeAttribute('media');
                    m.setAttribute('content', themeColor);
                  });
                  var csMeta = document.querySelector('meta[name="color-scheme"]');
                  if (csMeta) {
                    csMeta.setAttribute('content', colorScheme);
                  }

                  // 零延迟同步 cookie，保证后续每次刷新服务端 100% 字节直出
                  if (saved && !document.cookie.includes('theme=')) {
                    document.cookie = 'theme=' + saved + '; path=/; max-age=31536000; SameSite=Lax';
                  }

                  function removeNoTransitions() {
                    requestAnimationFrame(function() {
                      requestAnimationFrame(function() {
                        docEl.classList.remove('no-transitions');
                      });
                    });
                  }
                  if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', removeNoTransitions);
                  } else {
                    removeNoTransitions();
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        {/* 2. 首屏关键样式：0ms 消除 FOUC 与刷新白屏/黑底闪烁 */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --page-bg: #050505;
                --page-text: #e5e5e5;
                color-scheme: dark;
              }
              html.light,
              html.light body {
                background-color: #ffffff !important;
                color: #222222 !important;
                color-scheme: light !important;
              }
              html.dark,
              html.dark body {
                background-color: #050505 !important;
                color: #e5e5e5 !important;
                color-scheme: dark !important;
              }
              /* 首屏刷新加载阻断过渡动画，消除补间闪烁 */
              html.no-transitions,
              html.no-transitions *,
              html.no-transitions *::before,
              html.no-transitions *::after {
                -webkit-transition: none !important;
                -moz-transition: none !important;
                -o-transition: none !important;
                -ms-transition: none !important;
                transition: none !important;
              }
              /* 同步直出关键动画规则，杜绝 Frame 0 元素先满不透明度绘制后隐藏的跳闪 */
              @keyframes slide-enter {
                0% { opacity: 0; transform: translateY(4px); }
                to { opacity: 1; transform: translateY(0); }
              }
              @media (prefers-reduced-motion: no-preference) {
                .slide-enter,
                .slide-enter-content > * {
                  --enter-stage: 0;
                  --enter-step: 70ms;
                  --enter-initial: 0ms;
                  animation: slide-enter 0.45s cubic-bezier(0.16, 1, 0.3, 1) both 1;
                  animation-delay: calc(var(--enter-initial) + var(--enter-stage) * var(--enter-step));
                }
                .slide-enter-content > *:nth-child(1) { --enter-stage: 1 !important; }
                .slide-enter-content > *:nth-child(2) { --enter-stage: 2 !important; }
                .slide-enter-content > *:nth-child(3) { --enter-stage: 3 !important; }
                .slide-enter-content > *:nth-child(4) { --enter-stage: 4 !important; }
                .slide-enter-content > *:nth-child(5) { --enter-stage: 5 !important; }
                .slide-enter-content > *:nth-child(6) { --enter-stage: 6 !important; }
                .slide-enter-content > *:nth-child(7) { --enter-stage: 7 !important; }
                .slide-enter-content > *:nth-child(8) { --enter-stage: 8 !important; }
                .slide-enter-content > *:nth-child(9) { --enter-stage: 9 !important; }
                .slide-enter-content > *:nth-child(10) { --enter-stage: 10 !important; }
              }
            `,
          }}
        />
        {/* 字体已全面切换为系统本地黑体栈（Inter + 苹方 / 微软雅黑），无需外部 CDN 网络字体 */}
      </head>

      <body className="min-h-screen w-full font-sans selection:bg-[#ded5c4] dark:selection:bg-[#2b2723] overflow-x-hidden antialiased bg-[#050505] text-[#e5e5e5]">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var docEl = document.documentElement;
                  var queryTheme = window.location.search.indexOf('theme=light') !== -1 ? 'light' : (window.location.search.indexOf('theme=dark') !== -1 ? 'dark' : null);
                  var saved = queryTheme || localStorage.getItem('theme') || (document.cookie.match(/(?:^|;\\s*)theme=([^;]+)/) || [])[1];
                  var systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var isDark = saved ? saved === 'dark' : systemDark;
                  if (isDark) {
                    docEl.classList.add('dark');
                    docEl.classList.remove('light');
                    docEl.style.backgroundColor = '#050505';
                    docEl.style.colorScheme = 'dark';
                  } else {
                    docEl.classList.remove('dark');
                    docEl.classList.add('light');
                    docEl.style.backgroundColor = '#ffffff';
                    docEl.style.colorScheme = 'light';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <ThemeProvider>
          {/* 包裹全局播放器 Provider */}
          <MusicProvider>
            <FrontendShell>
              {children}
            </FrontendShell>
          </MusicProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}