import React, { Suspense } from "react";
import { fetchPlaylists } from "@/lib/data";
import PlaylistClient from "./PlaylistClient";
import { PlaylistSkeleton } from "@/components/playlist/PlaylistSkeleton";
import { Footer } from "@/components/layout/Footer";

export const metadata = {
  title: "Playlist",
  description: "Curated playlists & music collection",
};

export default async function PlaylistPage() {
  let initialPlaylists: any[] = [];
  try {
    initialPlaylists = await fetchPlaylists();
  } catch (err) {
    console.warn("[Playlist Server Error] 服务端预取降级:", err);
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <main className="relative z-10 w-full min-h-[85vh] px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 pt-20 sm:pt-24 pb-16">
        <div className="slide-enter-content">
          <Suspense fallback={<PlaylistSkeleton />}>
            <PlaylistClient initialPlaylists={initialPlaylists} />
          </Suspense>
        </div>
      </main>

      {/* 页脚分割线与内容大幅下移至视口下方 */}
      <div className="relative z-10 mt-48 sm:mt-64 w-full">
        <Footer />
      </div>
    </div>
  );
}