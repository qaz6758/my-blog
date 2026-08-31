// app/gallery/page.tsx
import React from "react";
import { Suspense } from "react";
import { getGalleryImages } from "@/lib/gallery";
import GalleryLoader from "./GalleryLoader";

export const metadata = {
  title: "Gallery",
  description: "Photography Gallery",
};

export default async function GalleryPage() {
  const photos = await getGalleryImages();
  return (
    <Suspense fallback={null}>
      <GalleryLoader photos={photos} />
    </Suspense>
  );
}