// app/thoughts/page.tsx
import React from "react";
import { fetchThoughtsFromNotion } from "@/lib/data";
import { RetroThoughtsView } from "@/components/post/RetroThoughtsView";

export const dynamic = "force-static";
export const revalidate = 5;

export const metadata = {
  title: "Thoughts",
  description: "记录随时随地的灵感碎片、折腾记录与生活切片",
};

export default async function ThoughtsPage() {
  const thoughts = await fetchThoughtsFromNotion();

  return <RetroThoughtsView thoughts={thoughts} />;
}