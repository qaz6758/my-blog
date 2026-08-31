// components/ui/Skeleton.tsx
import React from "react";

export function Skeleton({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-neutral-200/70 dark:bg-neutral-800/60 ${className}`}
      {...props}
    />
  );
}
