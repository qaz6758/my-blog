// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter, Cinzel, Cormorant_Garamond } from "next/font/google";
import "@/app/globals.css";

import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { MusicProvider } from "@/components/playlist/MusicContext";
import { FrontendShell } from "@/components/layout/FrontendShell";
import { siteConfig } from "@/config/site";

// 使用 display: "optional" 消除字体加载完成时文字重排引发的二次“闪烁 (FOUT)”
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "optional",
  variable: "--font-inter",
  preload: true,
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cinzel",
  display: "optional",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "optional",
});

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${inter.variable} ${cinzel.variable} ${cormorant.variable}`.trim()}
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
                --page-bg: #ffffff;
                --page-text: #222222;
              }
              @media (prefers-color-scheme: dark) {
                :root {
                  color-scheme: dark;
                }
                html:not(.light),
                html:not(.light) body {
                  background-color: #050505 !important;
                  color: #e5e5e5 !important;
                }
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
            `,
          }}
        />
        {/* 字体已全面切换为系统本地黑体栈（Inter + 苹方 / 微软雅黑），无需外部 CDN 网络字体 */}
      </head>

      <body className="min-h-screen w-full font-sans selection:bg-[#ded5c4] dark:selection:bg-[#2b2723] overflow-x-hidden antialiased">
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