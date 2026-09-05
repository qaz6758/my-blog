// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
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

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ede7dc" },
    { media: "(prefers-color-scheme: dark)", color: "#181614" },
  ],
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
      className={inter.variable}
    >
      <head>
        {/* 引入 霞鹜文楷 (LXGW WenKai Screen) 水墨国风字体 */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/lxgw-wenkai-screen-webfont@1.1.0/style.css"
          crossOrigin="anonymous"
        />
        {/* 首屏零毫秒同步锁定主题脚本 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var queryTheme = window.location.search.indexOf('theme=light') !== -1 ? 'light' : (window.location.search.indexOf('theme=dark') !== -1 ? 'dark' : null);
                  var saved = queryTheme || localStorage.getItem('theme') || (document.cookie.match(/(?:^|;\s*)theme=([^;]+)/) || [])[1];
                  var isDark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var docEl = document.documentElement;
                  var cl = docEl.classList;
                  if (isDark) {
                    cl.add('dark');
                    cl.remove('light');
                    docEl.style.colorScheme = 'dark';
                  } else {
                    cl.remove('dark');
                    cl.add('light');
                    docEl.style.colorScheme = 'only light';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>

      <body className="min-h-screen w-full font-sans bg-[#ede7dc] text-[#1e1b18] selection:bg-[#ded5c4] dark:bg-[#181614] dark:text-[#eae5dc] dark:selection:bg-[#2b2723] overflow-x-hidden antialiased">
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