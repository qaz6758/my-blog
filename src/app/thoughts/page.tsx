// app/thoughts/page.tsx
import React from "react";
import { fetchThoughtsFromNotion } from "@/lib/notion";
import { Footer } from "@/components/layout/Footer";
import { ThoughtsClientList } from "@/components/post/ThoughtsClientList";

export const revalidate = 5;

export const metadata = {
  title: "思考",
  description: "记录随时随地的灵感碎片、折腾记录与生活切片",
};

export default async function ThoughtsPage() {
  const thoughts = await fetchThoughtsFromNotion();

  return (
    // 使用 flex flex-col 让整个页面具备垂直拉伸能力
    <div className="relative flex min-h-screen w-full flex-col justify-between bg-transparent px-4 pt-24 pb-4 sm:px-8 lg:px-12 antialiased">
      {/* flex-1 会自动撑满屏幕剩余的所有空白区域，将页脚推到最底部 */}
      <main className="slide-enter-content mx-auto w-full max-w-[65ch] flex-1">
        <header className="mb-10 pl-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-[#f4f4f5] sm:text-4xl">
              思考
            </h1>
          </div>
          <p className="mt-3 text-sm text-neutral-500 dark:text-[#8e8e93] tracking-widest">
            感君倾耳，辑录成册。
          </p>
        </header>

        <ThoughtsClientList initialItems={thoughts} />
      </main>

      {/* 底部 Footer 容器 */}
      <div className="mt-12 w-full">
        <Footer />
      </div>
    </div>
  );
}