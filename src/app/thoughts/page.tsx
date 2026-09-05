// app/thoughts/page.tsx
import React from "react";
import { fetchThoughtsFromNotion } from "@/lib/data";
import { ThoughtsClientList } from "@/components/post/ThoughtsClientList";

export const revalidate = 5;

export const metadata = {
  title: "思考",
  description: "记录随时随地的灵感碎片、折腾记录与生活切片",
};

export default async function ThoughtsPage() {
  const thoughts = await fetchThoughtsFromNotion();

  return (
    <div className="relative w-full bg-transparent min-h-[100vh] px-4 pt-24 pb-28 sm:pb-36 sm:px-6 antialiased flex flex-col">
      <main className="slide-enter-content mx-auto w-full max-w-[520px] flex-1">
        <header className="mb-8 pl-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-[#f4f4f5] sm:text-3xl">
              思考
            </h1>
          </div>
          <p className="mt-2 text-xs text-neutral-500 dark:text-[#8e8e93] tracking-widest">
            感君倾耳，辑录成册。
          </p>
        </header>

        <ThoughtsClientList initialItems={thoughts} />
      </main>
    </div>
  );
}