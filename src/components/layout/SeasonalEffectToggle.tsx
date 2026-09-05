// src/components/layout/SeasonalEffectToggle.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSeasonalEffect, SeasonMode } from "@/hooks/useSeasonalEffect";
import { Sparkles } from "lucide-react";

const SEASON_OPTIONS: { mode: SeasonMode; label: string; icon: string }[] = [
  { mode: "auto", label: "随季轮换 (自动)", icon: "🔄" },
  { mode: "autumn", label: "秋枫飘落 (秋季)", icon: "🍁" },
  { mode: "winter", label: "静谧初雪 (冬季)", icon: "❄️" },
  { mode: "spring", label: "春樱漫舞 (春季)", icon: "🌸" },
  { mode: "summer", label: "夏夜流萤 (夏季)", icon: "✨" },
];

export function SeasonalEffectToggle() {
  const { mounted, enabled, mode, activeSeason, toggleEnabled, setSeasonMode } =
    useSeasonalEffect();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // 点击外部收起下拉菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  if (!mounted) {
    return (
      <div className="h-7 w-28 rounded-full bg-white/[0.04] animate-pulse" />
    );
  }

  const seasonIcon =
    activeSeason === "autumn"
      ? "🍁"
      : activeSeason === "spring"
      ? "🌸"
      : activeSeason === "summer"
      ? "✨"
      : "❄️";

  const seasonName =
    activeSeason === "autumn"
      ? "秋枫"
      : activeSeason === "spring"
      ? "春樱"
      : activeSeason === "summer"
      ? "夏萤"
      : "冬雪";

  return (
    <div className="relative flex items-center select-none" ref={menuRef}>
      {/* 胶囊控制按钮 */}
      <div className="flex items-center rounded-full border border-white/10 bg-neutral-900/90 p-0.5 shadow-sm backdrop-blur-md transition-colors hover:border-white/20">
        {/* 点击切换季节模式 */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-neutral-300 hover:text-white transition-colors cursor-pointer"
          title="点击切换四季特效"
          aria-label="选择季节特效"
        >
          <span className="text-xs leading-none">{seasonIcon}</span>
          <span className="font-medium tracking-tight">
            {seasonName}
            {mode === "auto" && <span className="text-[10px] text-neutral-500 ml-0.5">·律</span>}
          </span>
        </button>

        {/* 分隔线 */}
        <div className="h-3 w-[1px] bg-white/10" />

        {/* 开关拨片 */}
        <button
          type="button"
          onClick={toggleEnabled}
          className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium transition-all duration-200 cursor-pointer rounded-full ${
            enabled
              ? "text-amber-400 hover:text-amber-300"
              : "text-neutral-500 hover:text-neutral-400"
          }`}
          title={enabled ? "点击关闭背景特效" : "点击开启背景特效"}
          aria-label={enabled ? "关闭特效" : "开启特效"}
        >
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full transition-all duration-300 ${
              enabled ? "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" : "bg-neutral-600"
            }`}
          />
          <span>{enabled ? "开" : "关"}</span>
        </button>
      </div>

      {/* 季节选择下拉弹窗 */}
      {menuOpen && (
        <div className="absolute right-0 bottom-full z-50 mb-2 w-36 rounded-xl border border-neutral-800 bg-[#1a1a1a] p-1.5 shadow-2xl backdrop-blur-xl">
          <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-neutral-500 border-b border-white/5 mb-1 flex items-center justify-between">
            <span>四季特效</span>
            <Sparkles className="h-2.5 w-2.5" />
          </div>
          <div className="flex flex-col gap-0.5">
            {SEASON_OPTIONS.map((opt) => {
              const isSelected = mode === opt.mode;
              return (
                <button
                  key={opt.mode}
                  type="button"
                  onClick={() => {
                    setSeasonMode(opt.mode);
                    setMenuOpen(false);
                  }}
                  className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-white/10 text-white font-medium"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </span>
                  {isSelected && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
