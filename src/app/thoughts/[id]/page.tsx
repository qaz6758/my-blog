// app/thoughts/[id]/page.tsx
import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { fetchThoughtDetailFromNotion } from "@/lib/notion";
import { ThoughtDetailClient } from "@/components/post/ThoughtDetailClient";
import { Footer } from "@/components/layout/Footer";

export const revalidate = 60;

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
    <div className="relative min-h-screen w-full bg-transparent px-4 pt-24 pb-16 sm:px-8 lg:px-12 antialiased">
      <main className="mx-auto w-full max-w-3xl">
        <header className="mb-10 pl-1">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-[#f4f4f5] sm:text-4xl">
            思考
          </h1>
          <p className="mt-3 text-2xl text-neutral-500 dark:text-[#8e8e93] tracking-widest">
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

      <div className="mt-20 w-full">
        <Footer />
      </div>
    </div>
  );
}