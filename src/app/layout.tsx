// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_SC } from "next/font/google";
import { cookies } from "next/headers";  
import "@/app/globals.css";  

import { ThemeProvider } from "@/components/theme/ThemeProvider";  
import { Navbar } from "@/components/layout/Navbar";  
import { BackgroundImage } from "@/components/layout/BackgroundImage";  
import { MusicProvider } from "@/components/playlist/MusicContext";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
});  

const notoSansSC = Noto_Sans_SC({
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
  variable: "--font-noto-sans-sc",
});  

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#050505" },
  ],
  colorScheme: "light dark",
};  

export const metadata: Metadata = {
  title: {
    default: "theyole's Blog",
    template: "%s | theyole's Blog",
  },
  description: "Personal Blog & Portfolio - 记录技术探索、折腾过程与生活碎片",
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
  const isDark = initialTheme === "dark";  

  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${inter.variable} ${notoSansSC.variable} ${initialTheme}`}  
    >
      <head>
        {isDark && (
          <link
            rel="preload"
            href="/home-bg.webp"
            as="image"
            type="image/webp"
          />
        )}  
      </head>

      <body className="min-h-screen w-full font-sans bg-[#ffffff] text-neutral-900 selection:bg-neutral-200 dark:bg-[#050505] dark:text-neutral-100 dark:selection:bg-neutral-800 overflow-x-hidden antialiased">  
        <ThemeProvider initialTheme={initialTheme}>  
          {/* 包裹全局播放器 Provider */}
          <MusicProvider>
            <BackgroundImage />  
            <Navbar />  
            <div className="relative z-10 w-full pb-20">
              {children}  
            </div>
          </MusicProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}