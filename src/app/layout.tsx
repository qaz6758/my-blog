// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";  
import "@/app/globals.css";  

export const runtime = "edge";  

import { Suspense } from "react";
import { ThemeProvider } from "@/components/theme/ThemeProvider";  
import { Navbar } from "@/components/layout/Navbar";  
import { MusicProvider } from "@/components/playlist/MusicContext";
import { ArtPlum } from "@/components/effects/ArtPlum";
import { TopProgressBar } from "@/components/layout/TopProgressBar";

// 使用 display: "optional" 彻底消除字体加载完成时文字重排引发的二次“闪烁 (FOUT)”
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "optional",
  variable: "--font-inter",
  preload: true,
});  

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#050505" },
  ],
  colorScheme: "light dark",
};  

import { siteConfig } from "@/config/site";

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
  const savedTheme = cookieStore.get("theme")?.value;  
  const initialTheme: "light" | "dark" =
    savedTheme === "light" ? "light" : "dark";  

  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={inter.variable}  
    >
      <head>
        {/* 
          首屏零毫秒同步锁定主题脚本：在浏览器绘制任何像素前极速生效，
          彻底终结刷新时因主题/背景不匹配导致的瞬间黑白亮闪！
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme') || (document.cookie.match(/(?:^|;\\s*)theme=([^;]+)/) || [])[1];
                  var isDark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var cl = document.documentElement.classList;
                  if (isDark) {
                    cl.add('dark');
                    cl.remove('light');
                  } else {
                    cl.remove('dark');
                    cl.add('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>

      <body className="min-h-screen w-full font-sans bg-[#ffffff] text-neutral-900 selection:bg-neutral-200 dark:bg-[#050505] dark:text-neutral-100 dark:selection:bg-neutral-800 overflow-x-hidden antialiased">  
        <ThemeProvider initialTheme={initialTheme}>  
          {/* 全局极简顶部流体进度指示条 */}
          <Suspense fallback={null}>
            <TopProgressBar />
          </Suspense>

          {/* 包裹全局播放器 Provider */}
          <MusicProvider>
            <ArtPlum />
            <Navbar />  
            <div className="relative z-10 w-full pb-4 sm:pb-6">
              {children}  
            </div>
          </MusicProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}