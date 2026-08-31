import React from "react";
import { getGalleryImages } from "@/lib/gallery";
import GalleryClient from "./GalleryClient";

export const metadata = {
  title: "Gallery",
  description: "Photography Gallery",
};

export default async function GalleryPage() {
  const photos = await getGalleryImages();

  return <GalleryClient photos={photos} />;
}