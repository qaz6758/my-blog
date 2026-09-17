// src/app/about/page.tsx
"use client";
// 1. 签下合同：规定一张名片必须有哪些属性
interface HackerCard {
  nickname: string; // 昵称
  level: number;    // 等级（必须是数字）
  skill?: string;   // 技能（选填）
}

// 2. 按照合同造一个名片
const myCard: HackerCard = {
  nickname: "Vince Ou",
  level: 99, // 👈 故意把数字写成汉字！
};
import React, { useState } from "react";

export default function AboutPage() {
  const [apiData, setApiData] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // 前端用代码主动呼叫后端的函数
  const callMyBackend = async () => {
    setLoading(true);
    try {
      // 1. 发起网络请求，敲响 /api/hello 的大门
      const res = await fetch("/api/hello");
      // 2. 把返回的二进制数据解析成 JSON 对象
      const data = await res.json();
      // 3. 把后端传回来的 message 塞给前端状态展示
      setApiData(data.message + " (服务器时间: " + data.timestamp + ")");
    } catch (e) {
      setApiData("呼叫失败！");
    } finally {
      setLoading(false);
    }
  };

  return (
    
    <div className="relative w-full overflow-hidden pt-28 sm:pt-36 pb-24 px-6 sm:px-8">
      <main className="relative z-10 mx-auto w-full max-w-[660px] flex flex-col items-start text-left">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-6 font-serif">
          关于我 · About Me
        </h1>

        <div className="space-y-4 text-neutral-700 dark:text-neutral-300 text-[15px] sm:text-[16px] leading-[1.8] mb-8">
          <p>大道至简，衍化至繁。这里是我的个人数字花园与技术自留地。</p>
        </div>

        {/* ===================== 前后端握手体验区 ===================== */}
        <div className="w-full p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
          <p className="text-xs font-mono text-neutral-500 mb-2">⚡ 前后端通信实战实验台：</p>
          <button
            onClick={callMyBackend}
            disabled={loading}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-lg text-xs font-medium transition-all active:scale-95 cursor-pointer"
          >
            {loading ? "正在呼叫后端机房..." : "👉 点击用 fetch() 呼叫 /api/hello 接口"}
          </button>

          {apiData && (
            <div className="mt-3 p-3 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-mono">
              {apiData}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}