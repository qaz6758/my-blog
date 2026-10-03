import { NextRequest, NextResponse } from "next/server";
import { getOptionalRequestContext } from "@cloudflare/next-on-pages";

export const dynamic = "force-dynamic";
export const runtime = "edge";

const KUGOU_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
};
const KUGOU_LITE_APP_ID = "3116";
const KUGOU_LITE_CLIENT_VERSION = "11440";

declare global {
  interface CloudflareEnv {
    KUGOU_CONCEPT_COOKIE?: string;
  }
}

function getKugouConceptCookie(): string | null {
  const cookie =
    getOptionalRequestContext()?.env.KUGOU_CONCEPT_COOKIE ||
    process.env.KUGOU_CONCEPT_COOKIE ||
    "";
  const trimmedCookie = cookie.trim();
  if (!trimmedCookie) return null;
  if (/[\r\n]/.test(trimmedCookie)) {
    console.error("[Lyrics] KUGOU_CONCEPT_COOKIE contains invalid line breaks");
    return null;
  }
  return trimmedCookie;
}

function normalizeMatchText(value: string): string {
  return value.toLocaleLowerCase().replace(/[\s\p{P}\p{S}]/gu, "");
}

async function fetchKugouSongHash(title: string, artist: string): Promise<string | null> {
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
  return match?.hash || null;
}

async function fetchKugouKrc(hash: string): Promise<string | null> {
  const lyricSearchUrl = new URL("https://lyrics.kugou.com/search");
  lyricSearchUrl.search = new URLSearchParams({
    ver: "1",
    man: "yes",
    client: "pc",
    keyword: "",
    duration: "",
    hash,
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

async function fetchKugouConceptKrc(
  hash: string | null,
  title: string,
  artist: string,
  cookie: string
): Promise<string | null> {
  const lyricSearchUrl = new URL("https://lyrics.kugou.com/v1/search");
  lyricSearchUrl.search = new URLSearchParams({
    album_audio_id: "0",
    appid: KUGOU_LITE_APP_ID,
    clientver: KUGOU_LITE_CLIENT_VERSION,
    duration: "0",
    hash: hash || "",
    keyword: hash ? "" : `${title} ${artist}`,
    lrctxt: "1",
    man: "no",
  }).toString();

  const headers = { ...KUGOU_HEADERS, Cookie: cookie };
  const candidateResponse = await fetch(lyricSearchUrl, {
    headers,
    signal: AbortSignal.timeout(8000),
  });
  if (!candidateResponse.ok) {
    throw new Error(`Kugou Concept lyric search failed: ${candidateResponse.status}`);
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
    client: "android",
    id: String(candidate.id),
    accesskey: candidate.accesskey,
    fmt: "krc",
    charset: "utf8",
  }).toString();
  const downloadResponse = await fetch(downloadUrl, {
    headers,
    signal: AbortSignal.timeout(8000),
  });
  if (!downloadResponse.ok) {
    throw new Error(`Kugou Concept lyric download failed: ${downloadResponse.status}`);
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
      const hash = await fetchKugouSongHash(title, artist);
      const conceptCookie = getKugouConceptCookie();
      let krc: string | null = null;
      if (hash) {
        try {
          krc = await fetchKugouKrc(hash);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Error fetching Kugou lyrics";
          console.warn("[Lyrics] Standard Kugou KRC lookup failed:", msg);
          if (!conceptCookie) throw err;
        }
      }
      return NextResponse.json(
        {
          success: true,
          provider: "kugou",
          krc,
          hash,
          conceptAvailable: Boolean(conceptCookie),
        },
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

  if (provider === "kugou-concept") {
    const rawHash = searchParams.get("hash")?.trim() || "";
    const hash = /^[\da-f]{32}$/i.test(rawHash) ? rawHash : null;
    const title = searchParams.get("title")?.trim() || "";
    const artist = searchParams.get("artist")?.trim() || "";
    if (!hash && (!title || !artist || title.length > 200 || artist.length > 200)) {
      return NextResponse.json(
        { success: false, error: "Kugou Concept lyrics require a valid song hash or title and artist" },
        { status: 400 }
      );
    }

    const cookie = getKugouConceptCookie();
    if (!cookie) {
      return NextResponse.json(
        { success: false, error: "Kugou Concept lyrics are not configured" },
        { status: 503, headers: { "Cache-Control": "no-store" } }
      );
    }

    try {
      const krc = await fetchKugouConceptKrc(hash, title, artist, cookie);
      return NextResponse.json(
        { success: true, provider: "kugou-concept", krc },
        { headers: { "Cache-Control": "private, no-store" } }
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error fetching Kugou Concept lyrics";
      console.error("[Lyrics] Kugou Concept fallback failed:", msg);
      return NextResponse.json(
        { success: false, error: "Kugou Concept lyrics request failed" },
        { status: 502, headers: { "Cache-Control": "no-store" } }
      );
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
