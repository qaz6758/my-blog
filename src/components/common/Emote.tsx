// src/components/common/Emote.tsx
import React from "react";
import Image from "next/image";

interface EmoteProps {
  src: string;
  alt: string;
  className?: string;
}

export function Emote({ src, alt, className = "" }: EmoteProps) {
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
