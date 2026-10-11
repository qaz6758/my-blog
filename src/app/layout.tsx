
import { ThemeScript } from "@/components/theme/ThemeScript";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import {
  Inter,
  DM_Mono,
  DM_Serif_Display,
  Bad_Script,
  Dancing_Script,
} from "next/font/google";
import "@/app/globals.css";

// Anthony Fu 风格字体配置
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

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

const dancingScript = Dancing_Script({
  weight: ["700"],
  subsets: ["latin"],
  variable: "--font-dancing-script",
  display: "swap",
});

import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { MusicProvider } from "@/components/playlist/MusicContext";
import { FrontendShell } from "@/components/layout/FrontendShell";
import { siteConfig } from "@/config/site";
import { SITE_URL, siteUrl } from "@/lib/site";

export const viewport: Viewport = {
  colorScheme: "light dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  alternates: {
    canonical: "./",
  },
  openGraph: {
    title: siteConfig.name,
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
    title: siteConfig.name,
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
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* 预加载 W95FA 经典像素复古字体 */}
        <link
          rel="preload"
          href="/fonts/w95fa.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        {/* 首屏主题脚本 */}
        <ThemeScript />
      </head>

      <body
        className={`${inter.variable} ${dmMono.variable} ${dmSerifDisplay.variable} ${badScript.variable} ${dancingScript.variable} min-h-screen w-full font-sans overflow-x-hidden antialiased`}
      >
        <ThemeProvider>
          {/* 全局播放器 Provider */}
          <MusicProvider>
            <FrontendShell>{children}</FrontendShell>
          </MusicProvider>
        </ThemeProvider>

        {/* Neko.js：经典像素猫，全站追踪鼠标 */}
        <Script
          src="https://louisabraham.github.io/nekojs/neko.js"
          strategy="afterInteractive"
          data-autostart=""
        />
      </body>
    </html>
  );
}

