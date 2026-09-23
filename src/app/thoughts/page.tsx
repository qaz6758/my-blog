// app/thoughts/page.tsx
import React from "react";
import { fetchThoughtsFromNotion } from "@/lib/data";
import { ThoughtsClientList } from "@/components/post/ThoughtsClientList";

export const dynamic = "force-static";
export const revalidate = 5;

export const metadata = {
  title: "Thoughts",
  description: "记录随时随地的灵感碎片、折腾记录与生活切片",
};

export default async function ThoughtsPage() {
  const thoughts = await fetchThoughtsFromNotion();

  return (
    <div className="relative w-full bg-transparent min-h-[100vh] px-4 pt-24 pb-28 sm:pb-36 sm:px-6 antialiased flex flex-col">
      <main className="slide-enter-content mx-auto w-full max-w-[520px] flex-1">
        <ThoughtsClientList initialItems={thoughts} />
      </main>
    </div>
  );
}