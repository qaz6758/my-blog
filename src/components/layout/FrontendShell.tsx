// src/components/layout/FrontendShell.tsx
'use client';

import React, { Suspense } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { TopProgressBar } from '@/components/layout/TopProgressBar';
import { Footer } from '@/components/layout/Footer';
import { SeasonalBackground } from '@/components/effects/SeasonalBackground';
import { InkMountainBackground } from '@/components/layout/InkMountainBackground';

export function FrontendShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col justify-between relative bg-transparent overflow-x-clip">
      <Suspense fallback={null}>
        <TopProgressBar />
      </Suspense>
      {/* 四季动态粒子特效（春樱/夏萤/秋枫/冬雪） */}
      <SeasonalBackground />
      {/* 浪客行（Vagabond）水墨意境真迹：独立背景氛围层，破界呈现深邃张力 */}
      <InkMountainBackground />
      <Navbar />
      <div className="flex-1 relative z-10 w-full">
        {children}
      </div>
      <Footer />
    </div>
  );
}