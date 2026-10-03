import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const KUGOU_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
};

function normalizeMatchText(value: string): string {
  return value.toLocaleLowerCase().replace(/[\s\p{P}\p{S}]/gu, "");
}

async function fetchKugouKrc(title: string, artist: string): Promise<string | null> {
  const keyword = `${title} ${artist}`.trim();
  const searchUrl = new URL("https://mobilecdn.kugou.com/api/v3/search/song");
  searchUrl.search = new URLSearchParams({
    format: "json",
    keyword,
    page: "1",
    pagesize: "20",
    showtype: "1",
  }).toString();

  const searchResponse = await fetch(searchUrl, {
    headers: KUGOU_HEADERS,
    signal: AbortSignal.timeout(8000),
  });
  if (!searchResponse.ok) {
    throw new Error(`Kugou song search failed: ${searchResponse.status}`);
  }

  const searchData = await searchResponse.json() as {
    data?: { info?: Array<{ hash?: string; songname?: string; singername?: string }> };
  };
  const targetTitle = normalizeMatchText(title);
  const targetArtist = normalizeMatchText(artist);
  const match = searchData.data?.info?.find((song) => {
    if (!song.hash || !song.songname || !song.singername) return false;
    const candidateTitle = normalizeMatchText(song.songname);
    const candidateArtist = normalizeMatchText(song.singername);
    return candidateTitle === targetTitle && (
      candidateArtist === targetArtist ||
      candidateArtist.includes(targetArtist) ||
      targetArtist.includes(candidateArtist)
    );
  });
  if (!match?.hash) return null;

  const lyricSearchUrl = new URL("https://lyrics.kugou.com/search");
  lyricSearchUrl.search = new URLSearchParams({
    ver: "1",
    man: "yes",
    client: "pc",
    keyword: "",
    duration: "",
    hash: match.hash,
    album_audio_id: "",
  }).toString();
  const candidateResponse = await fetch(lyricSearchUrl, {
    headers: KUGOU_HEADERS,
    signal: AbortSignal.timeout(8000),
  });
  if (!candidateResponse.ok) {
    throw new Error(`Kugou lyric search failed: ${candidateResponse.status}`);
  }

  const candidateData = await candidateResponse.json() as {
    candidates?: Array<{ id?: string | number; accesskey?: string }>;
  };
  const candidate = candidateData.candidates?.find(
    (item) => item.id !== undefined && item.accesskey
  );
  if (!candidate?.id || !candidate.accesskey) return null;

  const downloadUrl = new URL("https://lyrics.kugou.com/download");
  downloadUrl.search = new URLSearchParams({
    ver: "1",
    client: "pc",
    id: String(candidate.id),
    accesskey: candidate.accesskey,
    fmt: "krc",
    charset: "utf8",
  }).toString();
  const downloadResponse = await fetch(downloadUrl, {
    headers: KUGOU_HEADERS,
    signal: AbortSignal.timeout(8000),
  });
  if (!downloadResponse.ok) {
    throw new Error(`Kugou lyric download failed: ${downloadResponse.status}`);
  }

  const downloadData = await downloadResponse.json() as { content?: string };
  return downloadData.content || null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || searchParams.get("netease_id");
  const customUrl = searchParams.get("url");
  const provider = searchParams.get("provider");

  // 1. 如果提供了自定义歌词直链（如 R2 托管的 .lrc 文件）
  if (customUrl) {
    try {
      const parsedUrl = new URL(customUrl);
      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        return NextResponse.json({ success: false, error: "Invalid URL protocol" }, { status: 400 });
      }

      const res = await fetch(customUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        return NextResponse.json({ success: false, error: "Failed to fetch custom LRC" }, { status: 502 });
      }

      const lrc = await res.text();
      return NextResponse.json(
        { success: true, lrc, tlyric: "" },
        {
          headers: {
            "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
          },
        }
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error fetching custom LRC";
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  }

  if (provider === "kugou") {
    const title = searchParams.get("title")?.trim() || "";
    const artist = searchParams.get("artist")?.trim() || "";
    if (!title || !artist || title.length > 200 || artist.length > 200) {
      return NextResponse.json(
        { success: false, error: "Kugou lyrics require a valid title and artist" },
        { status: 400 }
      );
    }

    try {
      const krc = await fetchKugouKrc(title, artist);
      return NextResponse.json(
        { success: true, provider: "kugou", krc },
        {
          headers: {
            "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
          },
        }
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error fetching Kugou lyrics";
      return NextResponse.json({ success: false, error: msg }, { status: 502 });
    }
  }

  // 2. 如果提供了网易云歌曲 ID
  if (id && /^\d+$/.test(id)) {
    try {
      const neteaseUrl = `https://music.163.com/api/song/lyric?id=${id}&lv=-1&kv=-1&tv=-1&rv=-1&yv=-1&ytv=-1&yrv=-1`;
      const res = await fetch(neteaseUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://music.163.com",
        },
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) {
        return NextResponse.json({ success: false, error: "NetEase API error" }, { status: 502 });
      }

      const data = await res.json();
      const lrc = data?.lrc?.lyric || "";
      const yrc = data?.yrc?.lyric || "";
      const tlyric = data?.tlyric?.lyric || "";

      return NextResponse.json(
        {
          success: true,
          id,
          lrc,
          yrc,
          tlyric,
          isInstrumental: data?.nolyric === true || (lrc && lrc.includes("纯音乐，请欣赏")),
        },
        {
          headers: {
            "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
          },
        }
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error fetching NetEase lyrics";
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  }

  return NextResponse.json(
    { success: false, error: "Missing song 'id' or 'url' query parameter" },
    { status: 400 }
  );
}
