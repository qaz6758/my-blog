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
      className={`bordered-box relative w-full overflow-hidden ${className}`}
    >
      {title && (
        <div className="bordered-box-header select-none">
          <div
            className={`header-text ${
              titleAlign === "center" ? "justify-center" : "justify-between"
            }`}
          >
            <div className="header-left flex items-center gap-1.5 min-w-0">
              <h2
                data-card-title
                className={`font-bold leading-[1.2] cursor-default transition-colors text-inherit ${titleClassName || ""}`}
              >
                {title}
              </h2>
            </div>
            {rightText && titleAlign !== "center" && (
              <div className="header-right-wrapper text-[12px] sm:text-[13px] font-mono font-medium text-[#656d76] dark:text-[#a1a1aa] tracking-tight">
                {rightText}
              </div>
            )}
          </div>
          <div className="header-divider" />
        </div>
      )}
      <div className={`bordered-box-content padded text-[13px] leading-relaxed text-[#1f2328] dark:text-white ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
}

