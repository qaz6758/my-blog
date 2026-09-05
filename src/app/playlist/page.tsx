import React, { Suspense } from "react";
import { fetchPlaylists } from "@/lib/data";
import PlaylistClient from "./PlaylistClient";
import { PlaylistSkeleton } from "@/components/playlist/PlaylistSkeleton";

export const metadata = {
  title: "Playlist",
  description: "Curated playlists & music collection",
};

export const dynamic = "force-static";
export const revalidate = 60;

export default async function PlaylistPage() {
  let initialPlaylists: any[] = [];
  try {
    initialPlaylists = await fetchPlaylists();
  } catch (err) {
    console.warn("[Playlist Server Error] 服务端预取降级:", err);
  }

  return (
    <div className="relative w-full overflow-hidden min-h-[100vh] flex flex-col">
      <main className="relative z-10 w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 pt-20 sm:pt-24 pb-28 sm:pb-36 flex-1">
        <div className="slide-enter-content">
          <Suspense fallback={<PlaylistSkeleton />}>
            <PlaylistClient initialPlaylists={initialPlaylists} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}