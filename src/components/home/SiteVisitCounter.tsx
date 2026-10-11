"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

// ⚡ 全局单例缓存：驻留于浏览器 JS 运行时
// 只要不按 F5 刷新网页，站内无论怎么跳转，这两个变量都会一直保持在内存中！
let globalVisitCount: number | null = null;
let hasRecordedThisVisit = false;
let ongoingVisitPromise: Promise<number> | null = null;

function recordVisit(): Promise<number> {
  return Promise.resolve(supabase.rpc("increment_site_visit_count"))
    .then(({ data, error }) => {
      if (error) throw error;

      const visitCount = Number(data);
      if (!Number.isSafeInteger(visitCount) || visitCount < 1) {
        throw new Error(`Invalid site visit count returned: ${String(data)}`);
      }

      return visitCount;
    })
    .catch((error: unknown) => {
      console.error("记录站点访问失败:", error);
      throw error;
    });
}

export function SiteVisitCounter() {
  const [count, setCount] = useState<number | null>(globalVisitCount);
  const [displayCount, setDisplayCount] = useState<number | null>(
    globalVisitCount !== null ? globalVisitCount : 0
  );
  const [hasError, setHasError] = useState(false);
  const displayCountRef = useRef(displayCount ?? 0);
  displayCountRef.current = displayCount ?? 0;

  useEffect(() => {
    let isActive = true;
    let animationFrame = 0;

    // 🎯 动态数字缓动滚动函数
    const animateTo = (target: number, duration = 1200) => {
      cancelAnimationFrame(animationFrame);
      const start = displayCountRef.current;
      if (start === target) return;

      const startedAt = performance.now();
      const animate = (now: number) => {
        if (!isActive) return;
        const progress = Math.min((now - startedAt) / duration, 1);
        // 四次方缓动：开头快速变化，末尾精准锁死停驻
        const easedProgress = 1 - Math.pow(1 - progress, 4);
        const current = Math.round(start + (target - start) * easedProgress);
        setDisplayCount(current);

        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        } else {
          setDisplayCount(target);
        }
      };
      animationFrame = requestAnimationFrame(animate);
    };

    // 📡 1. 建立 Supabase WebSocket 实时互联广播频道
    const channel = supabase.channel("site-visits-sync", {
      config: { broadcast: { self: false } },
    });

    channel
      .on(
        "broadcast",
        { event: "visit_count_update" },
        ({ payload }: { payload: { count?: number } }) => {
          if (!isActive || typeof payload?.count !== "number") return;
          const remoteCount = payload.count;
          globalVisitCount = remoteCount;
          setCount(remoteCount);
          // 手机端刷新加 1 时，电脑端无感接收，并以 450ms 轻快翻滚跳到新数字！
          animateTo(remoteCount, 450);
        }
      )
      .subscribe();

    // 🎯 2. 判断当前操作：是站内跳转还是真实刷新 (F5)
    if (hasRecordedThisVisit && globalVisitCount !== null) {
      // 站内跳转：直接使用当前数字，绝不重复加 1！
      setCount(globalVisitCount);
      setDisplayCount(globalVisitCount);
    } else {
      // 首次加载或真实刷新网页：执行数据库 +1 并向全网广播最新值
      if (!ongoingVisitPromise) {
        ongoingVisitPromise = recordVisit()
          .then((newCount) => {
            hasRecordedThisVisit = true;
            globalVisitCount = newCount;

            // 📣 广播给所有同时打开网页的设备（让电脑端即时响应手机端的自增）
            channel.send({
              type: "broadcast",
              event: "visit_count_update",
              payload: { count: newCount },
            });

            return newCount;
          })
          .finally(() => {
            ongoingVisitPromise = null;
          });
      }

      void ongoingVisitPromise.then(
        (visitCount) => {
          if (!isActive) return;
          setCount(visitCount);
          animateTo(visitCount, 1200);
        },
        () => {
          if (isActive) setHasError(true);
        }
      );
    }

    return () => {
      isActive = false;
      cancelAnimationFrame(animationFrame);
      supabase.removeChannel(channel);
    };
  }, []);

  if (hasError && count === null) {
    return <span className="text-[#8b949e]">暂不可用</span>;
  }

  // 始终以 6 位辉光管外壳渲染（杜绝文字闪烁引起的跳变）
  const currentNum = displayCount ?? count ?? 0;
  const digits = String(currentNum).padStart(6, "0");

  return (
    <span
      aria-label={`累计访问 ${count ?? 0} 次`}
      className="nixie-display select-none"
    >
      {Array.from(digits, (digit, index) => (
        <span
          key={`${index}-${digits.length}`}
          aria-hidden="true"
          className="nixie-tube"
        >
          {digit}
        </span>
      ))}
    </span>
  );
}