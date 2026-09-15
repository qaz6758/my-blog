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
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
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
                  var isDark = saved === 'dark';
                  var themeColor = isDark ? '#111213' : '#ede7dc';
                  var colorScheme = isDark ? 'dark' : 'only light';

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
                --page-bg: #ede7dc;
                --page-text: #1e1b18;
              }
              html.light,
              html.light body {
                background-color: #ede7dc !important;
                color: #1e1b18 !important;
                color-scheme: only light !important;
              }
              html.dark,
              html.dark body {
                background-color: #111213 !important;
                color: #eae5dc !important;
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
        {/* 预连接字体与静态 CDN，消除渲染挂起与排版跳跃 */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
        {/* 预连接并异步非阻塞加载 霞鹜文楷字体，彻底杜绝外部网络请求挂起 HTML 解析与主题脚本 */}
        <link
          rel="preload"
          href="https://cdn.jsdelivr.net/npm/lxgw-wenkai-screen-webfont@1.1.0/style.css"
          as="style"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/lxgw-wenkai-screen-webfont@1.1.0/style.css"
          crossOrigin="anonymous"
          media="print"
          // @ts-ignore
          onLoad="this.media='all'"
        />
        <noscript>
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/lxgw-wenkai-screen-webfont@1.1.0/style.css"
            crossOrigin="anonymous"
          />
        </noscript>
      </head>

      <body className="min-h-screen w-full font-sans selection:bg-[#ded5c4] dark:selection:bg-[#2b2723] overflow-x-hidden antialiased">
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