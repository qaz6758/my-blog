// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";  
import "@/app/globals.css";  

import { ThemeProvider } from "@/components/theme/ThemeProvider";  
import { Navbar } from "@/components/layout/Navbar";  
import { BackgroundImage } from "@/components/layout/BackgroundImage";  
import { MusicProvider } from "@/components/playlist/MusicContext";

// 仅加载极速英文字体 Inter (体积仅 ~15KB)，中文由系统原生高清字体库接管 (0ms 阻塞)
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
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

import { NoiseOverlay } from "@/components/effects/NoiseOverlay";

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
      className={`${inter.variable} ${initialTheme}`}  
    >
      <body className="min-h-screen w-full font-sans bg-[#ffffff] text-neutral-900 selection:bg-neutral-200 dark:bg-[#050505] dark:text-neutral-100 dark:selection:bg-neutral-800 overflow-x-hidden antialiased">  
        <ThemeProvider initialTheme={initialTheme}>  
          {/* 包裹全局播放器 Provider */}
          <MusicProvider>
            <BackgroundImage />  
            <NoiseOverlay />
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