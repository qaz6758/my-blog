// components/playlist/AMLLLyricPlayerInner.tsx
"use client";

import React, { useMemo, useRef, useEffect } from "react";
import {
  LyricPlayer,
  LayoutAlignAnchor,
  LayoutReason,
  type LyricLine as AMLLLyricLine,
  type LyricLineMouseEvent,
} from "@applemusic-like-lyrics/core";
import "@applemusic-like-lyrics/core/style.css";
import { LyricResult } from "@/lib/lyrics";

interface AMLLLyricPlayerInnerProps {
  lyricsData: LyricResult;
  duration: number;
  onSeekTime?: (time: number) => void;
  className?: string;
}

export function AMLLLyricPlayerInner({
  lyricsData,
  duration,
  onSeekTime,
  className = "",
}: AMLLLyricPlayerInnerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<LyricPlayer | null>(null);
  const onSeekTimeRef = useRef(onSeekTime);

  useEffect(() => {
    onSeekTimeRef.current = onSeekTime;
  }, [onSeekTime]);

  // 普通 LRC 只提供行起点；使用下一行时间作为行级区间，不伪造逐字时间。
  const amllLines = useMemo<AMLLLyricLine[]>(() => {
    const rawLines = lyricsData.lines;
    if (!rawLines || rawLines.length === 0) return [];

    return rawLines.map((line, idx) => {
      const startTime = Math.round(line.time * 1000);
      const nextLine = rawLines[idx + 1];
      const nextStart = nextLine ? Math.round(nextLine.time * 1000) : null;
      const songEnd = Number.isFinite(duration) && duration > line.time
        ? Math.round(duration * 1000)
        : startTime + 1000;
      const inferredEnd = nextStart === null ? songEnd : Math.max(startTime, nextStart);
      const endTime = line.endTime !== undefined
        ? Math.round(line.endTime * 1000)
        : inferredEnd;
      const words = line.words?.length
        ? line.words.map((word) => ({
            startTime: Math.round(word.startTime * 1000),
            endTime:
              word.endTime !== undefined
                ? Math.round(word.endTime * 1000)
                : endTime,
            word: word.text,
          }))
        : [{ startTime, endTime, word: line.text }];

      return {
        startTime,
        endTime,
        words,
        translatedLyric: line.trText || "",
        romanLyric: "",
        isBG: false,
        isDuet: false,
      };
    });
  }, [duration, lyricsData]);

  // 2. 初始化核心原生渲染器并挂载至 DOM
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const player = new LyricPlayer();
    playerRef.current = player;

    // 配置 Apple Music 原生黄金比例参数
    player.setAlignAnchor(LayoutAlignAnchor.Center);
    // 黄金比例 0.38：上方留白 38% 供上一句优雅虚化淡出，下方留白 62% 沉浸展现后续歌词与律动
    player.setAlignPosition(0.38);
    player.setEnableSpring(true);
    player.setEnableBlur(true);
    player.setEnableScale(true);
    player.setWordFadeWidth(0.5);

    // 严选物理弹簧刚度与阻尼：兼顾 120Hz 极速跟随与有机丝滑惯性
    player.setLinePosYSpringParams({
      mass: 1.0,
      damping: 24,
      stiffness: 85,
    });
    player.setLineScaleSpringParams({
      mass: 1.1,
      damping: 22,
      stiffness: 85,
    });

    // 挂载至真实容器
    const playerEl = player.getElement();
    playerEl.style.setProperty("--amll-lp-font-size", "clamp(26px, 3.2vw, 42px)");
    playerEl.style.setProperty("--amll-lp-color", "#ffffff");
    playerEl.style.setProperty("--amll-lp-line-padding-x", "0.5rem");
    playerEl.style.setProperty("--amll-lp-line-width-aspect", "0.9");
    playerEl.style.setProperty("--amll-lp-hover-bg-color", "transparent");
    playerEl.style.setProperty("--lyric-line-padding-x", "0.5rem");
    container.appendChild(playerEl);

    // 监听歌词行点击交互进行音频跳转
    const handleLineClick = (evt: Event) => {
      const lineEvt = evt as LyricLineMouseEvent;
      if (typeof lineEvt.lineIndex === "number") {
        const lines = player.getLyricLines();
        if (lines[lineEvt.lineIndex]) {
          const targetMs = lines[lineEvt.lineIndex].startTime;
          onSeekTimeRef.current?.(targetMs / 1000);
        }
      }
    };
    player.addEventListener("line-click", handleLineClick);

    // 响应式尺寸监听，在视口或容器伸缩时实时触发重排与基准字体计算
    const ro = new ResizeObserver(() => {
      player.onResize();
      player.calcLayout(LayoutReason.Resize);
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      player.removeEventListener("line-click", handleLineClick);
      player.dispose();
      playerRef.current = null;
      if (container.contains(playerEl)) {
        container.removeChild(playerEl);
      }
    };
  }, []);

  // 3. 歌词数据或元数据变更时更新视图与底栏信息
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    player.setLyricLines(amllLines);

    // 将剥离出的制作信息（作词/作曲等）注入 Apple Music 官方底栏（歌词滑至底部时显现）
    const bottomEl = player.getBottomLineElement();
    if (bottomEl) {
      if (lyricsData.credits && lyricsData.credits.length > 0) {
        const credits = document.createElement("div");
        credits.style.padding = "4.5rem 0 8rem";
        credits.style.opacity = "0.65";
        credits.style.fontSize = "var(--amll-lp-font-size, clamp(26px, 3.2vw, 42px))";
        credits.style.fontWeight = "700";
        credits.style.lineHeight = "1.55";
        credits.style.letterSpacing = "-0.015em";
        credits.style.whiteSpace = "pre-line";
        credits.textContent = lyricsData.credits.join("\n");
        bottomEl.replaceChildren(credits);
      } else {
        bottomEl.replaceChildren();
      }
    }

    player.onResize();
    player.rebuildLyricView();
  }, [amllLines, lyricsData.credits]);

  // Drive AMLL from the persistent audio element's media clock.
  useEffect(() => {
    let animId: number;
    let lastTimestamp = performance.now();
    let lastAudioTime = -1;
    let lastPaused: boolean | null = null;
    const audio =
      document.querySelector<HTMLAudioElement>("[data-music-audio]");

    const tick = (now: number) => {
      const deltaMs = Math.min(Math.max(now - lastTimestamp, 1), 50);
      lastTimestamp = now;

      const player = playerRef.current;

      if (player && audio) {
        const currentSec = audio.currentTime;
        const isPaused = audio.paused;

        // 同步播放 / 暂停状态
        if (isPaused !== lastPaused) {
          lastPaused = isPaused;
          if (isPaused) {
            player.pause();
          } else {
            player.resume();
          }
        }

        const syncTimeMs = Math.round(currentSec * 1000);

        // 判定用户是否执行了 Seek 拖动（时间突变 > 0.35s）
        const isSeeking =
          lastAudioTime >= 0 && Math.abs(currentSec - lastAudioTime) > 0.35;
        lastAudioTime = currentSec;

        player.setCurrentTime(syncTimeMs, isSeeking);
        player.update(deltaMs);
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full min-h-0 relative overflow-hidden select-none antialiased ${className}`}
      style={{
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 12%, black 85%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 12%, black 85%, transparent 100%)",
      }}
    />
  );
}
