import type { Metadata, Viewport } from "next";
import { DM_Mono, DM_Serif_Display, Bad_Script } from "next/font/google";
import "@/app/globals.css";

// Anthony Fu (antfu.me) 同款字体配置：正文 100% 走原生系统字体栈（0ms 秒开无 FOUT），仅特色功能采用精简字体
const dmMono = DM_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-dm-mono",
  display: "swap",
});

const dmSerifDisplay = DM_Serif_Display({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
});

const badScript = Bad_Script({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-bad-script",
  display: "swap",
});

import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { MusicProvider } from "@/components/playlist/MusicContext";
import { I18nProvider } from "@/lib/i18n/I18nContext";
import { FrontendShell } from "@/components/layout/FrontendShell";
import { siteConfig } from "@/config/site";
import { SITE_URL, siteUrl } from "@/lib/site";

export const viewport: Viewport = {
  colorScheme: "light dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${siteConfig.name}'s Blog`,
    template: `%s | ${siteConfig.name}'s Blog`,
  },
  description: siteConfig.description,
  alternates: {
    canonical: "./",
  },
  openGraph: {
    title: `${siteConfig.name}'s Blog`,
    description: siteConfig.description,
    url: siteUrl("/"),
    siteName: siteConfig.name,
    images: [
      {
        url: "/og-cover.png",
        width: 1200,
        height: 630,
        alt: `${siteConfig.name}'s Blog Cover`,
      },
    ],
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name}'s Blog`,
    description: siteConfig.description,
    images: ["/og-cover.png"],
  },
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
      className={`${dmMono.variable} ${dmSerifDisplay.variable} ${badScript.variable}`}
      suppressHydrationWarning
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
                  var colorScheme = isDark ? 'only dark' : 'only light';

                  if (isDark) {
                    docEl.classList.add('dark');
                    docEl.classList.remove('light');
                  } else {
                    docEl.classList.remove('dark');
                    docEl.classList.add('light');
                  }
                  docEl.style.colorScheme = colorScheme;
                  docEl.style.backgroundColor = themeColor;

                  // 歌单详情直达 0ms 阻断：若带 ?id= 或 ?playlist=，预先隐藏歌单网格避免闪烁
                  if (window.location.pathname.indexOf('/playlist') !== -1 && (window.location.search.indexOf('id=') !== -1 || window.location.search.indexOf('playlist=') !== -1)) {
                    docEl.classList.add('hide-playlist-grid');
                  }

                  // 净化与同步所有 theme-color meta，杜绝深色 media query 劫持 Chrome 原生清屏画布
                  var themeMetas = document.querySelectorAll('meta[name="theme-color"]');
                  themeMetas.forEach(function(m) {
                    m.removeAttribute('media');
                    m.setAttribute('content', themeColor);
                  });
                  var csMeta = document.querySelector('meta[name="color-scheme"]');
                  if (csMeta) {
                    csMeta.setAttribute('content', 'light dark');
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
                  color-scheme: only dark;
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
                color-scheme: only light !important;
              }
              html.dark,
              html.dark body {
                background-color: #050505 !important;
                color: #e5e5e5 !important;
                color-scheme: only dark !important;
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
              /* 歌单直达预阻断：0ms 杜绝刷新时由于客户端状态未就绪导致的歌单列表闪现 */
              html.hide-playlist-grid [data-playlist-grid] {
                display: none !important;
                visibility: hidden !important;
                animation: none !important;
                opacity: 0 !important;
              }
              /* 同步直出关键动画规则，杜绝 Frame 0 元素先满不透明度绘制后隐藏的跳闪 */
              @keyframes slide-enter {
                0% { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: none; }
              }
              @media (prefers-reduced-motion: no-preference) {
                :is(.slide-enter, .slide-enter-content > *) {
                  --enter-stage: 0;
                  --enter-step: 90ms;
                  --enter-initial: 0s;
                  animation: 1s both slide-enter;
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
                .slide-enter-content > *:nth-child(11) { --enter-stage: 11 !important; }
                .slide-enter-content > *:nth-child(12) { --enter-stage: 12 !important; }
                .slide-enter-content > *:nth-child(13) { --enter-stage: 13 !important; }
                .slide-enter-content > *:nth-child(14) { --enter-stage: 14 !important; }
                .slide-enter-content > *:nth-child(15) { --enter-stage: 15 !important; }
                .slide-enter-content > *:nth-child(16) { --enter-stage: 16 !important; }
                .slide-enter-content > *:nth-child(17) { --enter-stage: 17 !important; }
                .slide-enter-content > *:nth-child(18) { --enter-stage: 18 !important; }
                .slide-enter-content > *:nth-child(19) { --enter-stage: 19 !important; }
                .slide-enter-content > *:nth-child(20) { --enter-stage: 20 !important; }
              }
            `,
          }}
        />
        {/* Anthony Fu (antfu.me) 同款字体（由 Next.js 本地零延迟自托管，零运行时请求） */}
      </head>

      <body className="min-h-screen w-full font-sans overflow-x-hidden antialiased">
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

                  if (window.location.search && (window.location.search.indexOf('id=') !== -1 || window.location.search.indexOf('playlist=') !== -1)) {
                    docEl.classList.add('hide-playlist-grid');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <ThemeProvider>
          {/* 全局国际化 Provider */}
          <I18nProvider>
            {/* 包裹全局播放器 Provider */}
            <MusicProvider>
              <FrontendShell>
                {children}
              </FrontendShell>
            </MusicProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}