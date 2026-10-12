// src/components/layout/FrontendShell.tsx
'use client';

import React, { useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { CctvTimestamp } from '@/components/layout/CctvTimestamp';
import { NightSkyCanvas } from '@/components/effects/NightSkyCanvas';
import { SiteWindowHeader } from '@/components/layout/SiteWindowHeader';

export function FrontendShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 页面切换时，框内滚动条自动平滑重置至顶部（确保与普通页面跳转体感一致）并锁定水平偏移
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, [pathname]);

  const handleScroll = () => {
    if (scrollContainerRef.current && scrollContainerRef.current.scrollLeft !== 0) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-transparent overflow-x-clip">
      <NightSkyCanvas />
      {/* 门外监控视角左上角 OSD 时间戳 */}
      <CctvTimestamp />
      <Navbar />

      {/* 复古主画框全站视窗 (对标 Dane .content-window 与 .content-area 规范) */}
      <div className="home-page-layout relative w-full flex flex-col items-center px-4 sm:px-6">
        <main className="night-sky-target home-main-content relative z-10 w-full max-w-[900px] flex flex-col items-center">
          <div
            data-home-main-panel
            className="w-full h-full rounded-[6px] border-2 border-[#d0d7de] bg-white shadow-[0_0_0_1px_rgba(208,215,222,0.8)] transition-all dark:rounded-[7px] dark:border-2 dark:border-white dark:bg-transparent dark:shadow-none flex flex-col overflow-hidden"
          >
            {/* 1. 顶部 Header 栏与基准线 (固定且跟随全站所有页面) */}
            <SiteWindowHeader />

            {/* 2. 内部独立滚动区域 (全站页面跳转只存在于此框内) */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="home-panel-scroll w-full flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3.5 pb-3.5 pt-1.5 sm:px-4 sm:pb-4 sm:pt-2 overscroll-contain flex flex-col"
            >
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}