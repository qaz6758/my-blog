// src/components/layout/FrontendShell.tsx
'use client';

import React, { Suspense } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { ArtPlum } from '@/components/effects/ArtPlum';
import { TopProgressBar } from '@/components/layout/TopProgressBar';

export function FrontendShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <TopProgressBar />
      </Suspense>
      <ArtPlum />
      <Navbar />
      <div className="relative z-10 w-full pb-4 sm:pb-6">
        {children}
      </div>
    </>
  );
}