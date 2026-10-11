// src/components/layout/SiteWindowHeader.tsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/config/site";

function Emote({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={19}
      height={19}
      unoptimized
      className={`inline-block w-auto align-[-3px] mx-0.5 select-none object-contain pointer-events-none ${className || "h-[18px]"}`}
    />
  );
}

export function SiteWindowHeader() {
  const { name } = siteConfig;

  return (
    <div className="shrink-0 w-full px-3.5 pt-3.5 sm:px-4 sm:pt-4 bg-[#f6f8fa] dark:bg-transparent select-none z-10">
      {/* 居中标题与微表情（头像已按要求去除） */}
      <div className="flex w-full items-center justify-center pb-2 pt-1">
        <Link href="/" className="inline-flex items-center group">
          <h1 className="home-element-enter home-element-enter--2 text-[22px] sm:text-[26px] font-bold tracking-tight text-[#24292f] dark:text-white flex items-center group-hover:text-[#33FF33] dark:group-hover:text-[#33FF33] transition-colors">
            <Emote src="/emotes/agahi.webp" alt="wave" className="h-6 sm:h-7 mr-1.5" />
            <span>I&apos;m {name}.</span>
            <Emote src="/emotes/clouds.webp" alt="clouds" className="h-5 sm:h-6 ml-1.5" />
          </h1>
        </Link>
      </div>

      {/* 像素终端风格欢迎语 (固定基准线) */}
      <div className="my-3 sm:my-3.5 flex w-full items-center gap-2.5 sm:gap-3.5">
        <div className="h-px flex-1 bg-[#d0d7de] dark:bg-white" />
        <p
          aria-label="WELCOME TO MY DIGITAL CORNER! [>_<]"
          className="welcome-typewriter shrink-0 font-['W95FA',monospace] text-[13px] sm:text-[15px] font-bold uppercase tracking-[0.05em] text-[#e5484d] dark:text-[#ff626b]"
        >
          <span aria-hidden="true">WELCOME TO MY DIGITAL CORNER! [&gt;_&lt;]</span>
        </p>
        <div className="h-px flex-1 bg-[#d0d7de] dark:bg-white" />
      </div>
    </div>
  );
}
