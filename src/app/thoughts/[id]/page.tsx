// app/thoughts/[id]/page.tsx
import React from "react";
import type { Metadata } from "next";
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}): Promise<Metadata> {
  const resolvedParams = await params;
  const pageId = resolvedParams.id;
  if (!pageId) return { title: "Thought" };

  try {
    const item = await fetchThoughtDetailFromNotion(pageId);
    if (!item) return { title: "Thought" };
    const title = item.title?.trim() || "Thought";
    return {
      title,
      description: item.description?.slice(0, 160) || title,
    };
  } catch {
    return { title: "Thought" };
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
  <div className="w-full flex-1 min-h-0">
    <ThoughtDetailClient item={item} />
  </div>
);
}