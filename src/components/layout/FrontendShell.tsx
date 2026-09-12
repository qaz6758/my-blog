// src/components/layout/FrontendShell.tsx
'use client';

import React, { Suspense } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { TopProgressBar } from '@/components/layout/TopProgressBar';
import { Footer } from '@/components/layout/Footer';
import { WaterArchiveBackground } from '@/components/effects/WaterArchiveBackground';

export function FrontendShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col justify-between relative bg-inherit">
      <Suspense fallback={null}>
        <TopProgressBar />
      </Suspense>
      {/* 全站统一水墨水晕与水纹等高线背景，彻底替换旧版漂浮火星粒子 */}
      <WaterArchiveBackground />
      <Navbar />
      <div className="flex-1 relative z-10 w-full">
        {children}
      </div>
      <Footer />
    </div>
  );
}