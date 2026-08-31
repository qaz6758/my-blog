"use client";

import React from "react";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="slide-enter-content w-full flex-1">
      {children}
    </div>
  );
}
