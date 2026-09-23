// app/thoughts/[id]/page.tsx
import React from "react";
import { notFound } from "next/navigation";
import { fetchThoughtDetailFromNotion, fetchThoughtsFromNotion } from "@/lib/data";
import { ThoughtDetailClient } from "@/components/post/ThoughtDetailClient";

export const dynamicParams = false;
export const revalidate = 5;

export async function generateStaticParams() {
  try {
    const thoughts = await fetchThoughtsFromNotion();
    return (thoughts || []).map((t) => ({ id: String(t.id) }));
  } catch {
    return [];
  }
}

export default async function ThoughtDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await params;
  const pageId = resolvedParams.id;

  if (!pageId) {
    notFound();
  }

  const item = await fetchThoughtDetailFromNotion(pageId);

  if (!item) {
    notFound();
  }

  return (
    <div className="relative min-h-[100vh] w-full bg-transparent px-4 pt-24 pb-28 sm:pb-36 sm:px-6 antialiased flex flex-col">
      <main className="mx-auto w-full max-w-[520px] flex-1">
        {/* 客户端交互流 (内置自适应中英文 Header 与返回导航) */}
        <ThoughtDetailClient item={item} />
      </main>
    </div>
  );
}