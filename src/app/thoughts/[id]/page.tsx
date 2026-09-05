// app/thoughts/[id]/page.tsx
import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { fetchThoughtDetailFromNotion, fetchThoughtsFromNotion } from "@/lib/data";
import { ThoughtDetailClient } from "@/components/post/ThoughtDetailClient";

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
        <header className="mb-8 pl-1">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-[#f4f4f5] sm:text-3xl">
            思考
          </h1>
          <p className="mt-2 text-xs text-neutral-500 dark:text-[#8e8e93] tracking-widest">
            感君倾耳。
          </p>
        </header>

        <div className="mb-6 pl-1">
          <Link
            href="/thoughts"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 dark:text-[#71717a] dark:hover:text-[#f4f4f5] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            返回
          </Link>
        </div>

        {/* 客户端交互流 */}
        <ThoughtDetailClient item={item} />
      </main>
    </div>
  );
}