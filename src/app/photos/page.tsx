// app/photos/page.tsx
import React, { Suspense } from "react";
import { getGalleryImages } from "@/lib/gallery";
import { RetroPhotosView } from "@/components/gallery/RetroPhotosView";

export const dynamic = "force-static";
export const revalidate = 60;

export const metadata = {
  title: "Photos",
  description: "Photography Photos",
};

export default async function PhotosPage() {
  const photos = await getGalleryImages();

  return (
    <Suspense fallback={null}>
      <RetroPhotosView photos={photos} />
    </Suspense>
  );
}
