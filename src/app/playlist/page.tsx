import React, { Suspense } from "react";
import { fetchPlaylists } from "@/lib/data";
import { RetroPlaylistView } from "@/components/playlist/RetroPlaylistView";
import type { PlaylistCategory } from "@/components/playlist/SongList";

export const metadata = {
  title: "Playlist",
  description: "Curated playlists & music collection",
};

export const dynamic = "force-static";
export const revalidate = 60;

export default async function PlaylistPage() {
  let initialPlaylists: PlaylistCategory[] = [];
  try {
    initialPlaylists = await fetchPlaylists();
  } catch (err) {
    console.warn("[Playlist Server Error] 服务端预取降级:", err);
  }

  return (
    <Suspense fallback={null}>
      <RetroPlaylistView playlists={initialPlaylists} />
    </Suspense>
  );
}