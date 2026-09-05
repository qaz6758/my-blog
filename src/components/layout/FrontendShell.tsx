// src/components/layout/FrontendShell.tsx
'use client';

import React, { Suspense } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { TopProgressBar } from '@/components/layout/TopProgressBar';
import { Footer } from '@/components/layout/Footer';
import { SeasonalBackground } from '@/components/effects/SeasonalBackground';

export function FrontendShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col justify-between relative bg-inherit">
      <Suspense fallback={null}>
        <TopProgressBar />
      </Suspense>
      <SeasonalBackground />
      <Navbar />
      <div className="flex-1 relative z-10 w-full">
        {children}
      </div>
      <Footer />
    </div>
  );
}