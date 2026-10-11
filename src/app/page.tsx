import { HeroSection } from "@/components/home/HeroSection";
import { fetchPosts, fetchThoughts, fetchPlaylists } from "@/lib/data";
import type { Song } from "@/components/playlist/SongList";

export const dynamic = "force-static";
export const revalidate = 10;

export default async function HomePage() {
  const [posts, thoughts, playlists] = await Promise.all([
    fetchPosts(1),
    fetchThoughts(),
    fetchPlaylists(),
  ]);

  const initialSongs: Song[] = [];
  if (Array.isArray(playlists)) {
    playlists.forEach((cat) => {
      if (Array.isArray(cat.songs)) {
        initialSongs.push(...cat.songs);
      }
    });
  }

  return (
    <HeroSection
      posts={posts}
      thoughts={thoughts.slice(0, 1)}
      initialSongs={initialSongs}
    />
  );
}