// app/gallery/page.tsx
import React from "react";
import { Suspense } from "react";
import { getGalleryImages } from "@/lib/gallery";
import GalleryClient from "./GalleryClient";

export const dynamic = "force-static";
export const revalidate = 60;

export const metadata = {
  title: "Gallery",
  description: "Photography Gallery",
};

export default async function GalleryPage() {
  const photos = await getGalleryImages();
  return (
    <Suspense fallback={null}>
      <GalleryClient photos={photos} />
    </Suspense>
  );
}