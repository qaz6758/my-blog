// src/components/common/ContentCard.tsx
import React from "react";

export function ContentCard({
  title,
  rightText,
  children,
  className = "",
  bodyClassName = "",
  titleClassName = "",
  titleAlign = "left",
}: {
  title?: React.ReactNode;
  rightText?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  titleClassName?: string;
  titleAlign?: "left" | "center";
}) {
  return (
    <div
      data-home-content-card
      className={`rounded-[4px] border-2 border-[#d0d7de] dark:border-white bg-transparent p-3 shadow-[0_1px_2px_rgba(27,31,36,0.08)] dark:shadow-none transition-colors ${className}`}
    >
      {title && (
        <div
          className={`flex items-center ${
            titleAlign === "center" ? "justify-center" : "justify-between"
          } pb-1.5 mb-2 border-b-2 border-[#d0d7de] dark:border-white select-none`}
        >
          <h2 className={`font-bold tracking-wide leading-[1.2] font-['W95FA',sans-serif] ${titleClassName || "text-[15px] sm:text-[16px] text-[#24292f] dark:text-white"}`}>
            {title}
          </h2>
          {rightText && titleAlign !== "center" && (
            <div className="text-[12px] sm:text-[13px] font-mono font-medium text-[#57606a] dark:text-[#a1a1aa] tracking-tight">
              {rightText}
            </div>
          )}
        </div>
      )}
      <div className={`text-[13px] leading-relaxed text-[#24292f] dark:text-white ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
}
