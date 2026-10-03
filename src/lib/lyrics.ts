import type { Song } from "@/components/playlist/SongList";
import {
  parseLrc as parseAmllLrc,
  parseQrc as parseAmllQrc,
  parseYrc as parseAmllYrc,
  type LyricLine as AmllLyricLine,
} from "@applemusic-like-lyrics/lyric";

export interface LyricWord {
  startTime: number;
  endTime?: number;
  text: string;
}

export interface LyricLine {
  id: number;
  time: number; // in seconds
  text: string;
  trText?: string;
  endTime?: number;
  words?: LyricWord[];
}

export interface LyricResult {
  lines: LyricLine[];
  credits?: string[];
  isInstrumental?: boolean;
  hasTranslation?: boolean;
  hasWordTimings?: boolean;
}

// 客户端内存缓存，避免切歌重复网络请求
const lyricsCache = new Map<string, LyricResult>();

// 识别非歌词的制作团队/创作者/歌手元数据标签行
const CREDIT_LINE_REGEX =
  /^(作\s*词|作\s*曲|编\s*曲|词\s*曲|原\s*曲|词\s*[:：]|曲\s*[:：]|制\s*作|监\s*制|企\s*划|统\s*筹|混\s*音|母\s*带|录\s*音|和\s*声|吉\s*他|贝\s*斯|鼓\s*手|键\s*盘|弦\s*乐|编写|演\s*唱|歌\s*手|原\s*唱|翻\s*唱|发\s*行|出\s*品|录音室|混音室|母带室|版权|Written\s+by|Lyrics?\s+by|Music\s+by|Composed\s+by|Produced\s+by|Arranged\s+by|Mixed\s+by|Mastered\s+by|Recorded\s+by|Vocals?\s+by|Singer\s*[:：]|Artist\s*[:：]|OP\s*[:：]|SP\s*[:：])/i;

/**
 * 解析普通/增强 LRC、网易云 YRC 和明文 QQ QRC。
 * 优先使用逐字精度更高的专用来源，普通 LRC 作为兼容回退。
 */
export function parseLrc(
  lrcStr: string,
  tlrcStr?: string,
  yrcStr?: string
): LyricResult {
  if (
    (!lrcStr || typeof lrcStr !== "string") &&
    (!yrcStr || typeof yrcStr !== "string")
  ) {
    return { lines: [], credits: [] };
  }
  const sourceLrc = typeof lrcStr === "string" ? lrcStr : "";
  const offsetMatch = sourceLrc.match(/\[offset:\s*(-?\d+)\s*\]/i);
  const lrcGlobalOffsetSec = offsetMatch
    ? parseInt(offsetMatch[1], 10) / 1000
    : 0;

  const translationMap = new Map<number, string>();
  const extractedCredits: string[] = [];
  if (tlrcStr && typeof tlrcStr === "string") {
    for (const line of parseAmllLrc(tlrcStr)) {
      const text = line.words.map((word) => word.word).join("").trim();
      const time = line.startTime / 1000 - lrcGlobalOffsetSec;
      if (text) translationMap.set(Math.round(time * 10) / 10, text);
    }
  }

  const isPureMusic =
    sourceLrc.includes("纯音乐，请欣赏") || sourceLrc.includes("没有填词");
  const hasYrc =
    Boolean(yrcStr?.trim()) ||
    sourceLrc.split(/\r?\n/).some((line) =>
      /^\[\d+,\d+\]\s*\(\d+,\d+,0\)/.test(line.trim())
    );
  const detectedYrc =
    yrcStr?.trim() ||
    (sourceLrc.split(/\r?\n/).some((line) => /^\[\d+,\d+\]/.test(line.trim()))
      ? sourceLrc
      : "");
  const hasQrc =
    !hasYrc &&
    sourceLrc.split(/\r?\n/).some((line) => {
      const trimmed = line.trim();
      return /^\[\d+,\d+\]/.test(trimmed) && /\(\d+,\d+\)/.test(trimmed);
    });

  const lyricSourceLines: string[] = [];
  for (const rawLine of sourceLrc.split(/\r?\n/)) {
    const text = rawLine
      .replace(/\[(?:\d{1,3}:\d{1,2}(?:[.:]\d{1,6})?|\d+,\d+)\]/g, "")
      .replace(/<\d{1,3}:\d{1,2}(?:[.:]\d{1,6})?>/g, "")
      .replace(/\(\d+,\d+,0\)/g, "")
      .trim();
    if (CREDIT_LINE_REGEX.test(text)) {
      if (!extractedCredits.includes(text)) extractedCredits.push(text);
    } else {
      lyricSourceLines.push(rawLine);
    }
  }

  const lyricSource = lyricSourceLines.join("\n");
  const parsed: AmllLyricLine[] = hasYrc
    ? parseAmllYrc(detectedYrc)
    : hasQrc
      ? parseAmllQrc(lyricSource)
      : parseAmllLrc(lyricSource);
  const timeOffsetSec = hasYrc || hasQrc ? 0 : lrcGlobalOffsetSec;
  const finalTimedSourceLine = [...lyricSourceLines]
    .reverse()
    .find((line) => /^\[(?:\d{1,3}:\d{1,2}(?:[.:]\d{1,6})?|\d+,\d+)\]/.test(line.trim()));
  const hasExplicitFinalEnd =
    !finalTimedSourceLine ||
    /^\[(?:\d{1,3}:\d{1,2}(?:[.:]\d{1,6})?|\d+,\d+)\]\s*$/.test(
      finalTimedSourceLine.trim()
    ) ||
    /(?:\[\d{1,3}:\d{1,2}(?:[.:]\d{1,6})?\]|<\d{1,3}:\d{1,2}(?:[.:]\d{1,6})?>)\s*$/.test(
      finalTimedSourceLine.trim()
    );

  const lines: LyricLine[] = parsed.flatMap((line, idx) => {
    const text = line.words.map((word) => word.word).join("").trim();
    if (!text) return [];

    const time = line.startTime / 1000 - timeOffsetSec;
    const nextLine = parsed[idx + 1];
    const isUnspecifiedLastEnd =
      idx === parsed.length - 1 &&
      !hasYrc &&
      !hasQrc &&
      !hasExplicitFinalEnd;
    const rawEndTime = line.endTime / 1000 - timeOffsetSec;
    const hasExplicitEnd =
      !isUnspecifiedLastEnd &&
      (hasYrc || hasQrc || rawEndTime < 59_999.999) &&
      Number.isFinite(rawEndTime) &&
      rawEndTime >= time;
    const endTime = hasExplicitEnd
      ? rawEndTime
      : nextLine && nextLine.startTime > line.startTime
        ? nextLine.startTime / 1000 - timeOffsetSec
        : undefined;

    const words = line.words.map((word, wordIndex) => {
      const nextWord = line.words[wordIndex + 1];
      const wordStartTime = word.startTime / 1000 - timeOffsetSec;
      const rawWordEnd = word.endTime / 1000 - timeOffsetSec;
      const wordEndTime = isUnspecifiedLastEnd && !nextWord
        ? undefined
        :
        Number.isFinite(rawWordEnd) && rawWordEnd < 59_999.999
          ? Math.max(wordStartTime, rawWordEnd)
          : nextWord?.startTime !== undefined
            ? nextWord.startTime / 1000 - timeOffsetSec
            : endTime;
      return {
        startTime: wordStartTime,
        endTime: wordEndTime,
        text: word.word,
      };
    });

    return [{
      id: idx,
      time,
      text,
      trText: translationMap.get(Math.round(time * 10) / 10),
      endTime,
      words,
    }];
  });

  const hasTranslation = lines.some((l) => !!l.trText);

  return {
    lines,
    credits: extractedCredits,
    isInstrumental: isPureMusic || lines.length === 0,
    hasTranslation,
    hasWordTimings: lines.some((line) => (line.words?.length || 0) > 1),
  };
}

function parseKrc(krc: string): LyricResult {
  const yrc = krc.replace(/<(\d+,\d+,\d+)>/g, "($1)");
  return parseLrc("", "", yrc);
}

async function decodeKugouKrc(content: string): Promise<string> {
  if (content.length > 2_000_000) {
    throw new Error("Kugou KRC response is too large");
  }

  // KRC wraps an XOR-obfuscated zlib stream in a four-byte "krc1" header.
  const binary = atob(content);
  if (binary.length <= 4 || !binary.startsWith("krc1")) {
    throw new Error("Invalid Kugou KRC payload");
  }

  const key = [64, 71, 97, 119, 94, 50, 116, 71, 81, 54, 49, 45, 206, 210, 110, 105];
  const compressed = new Uint8Array(binary.length - 4);
  for (let i = 4; i < binary.length; i++) {
    compressed[i - 4] = binary.charCodeAt(i) ^ key[(i - 4) % key.length];
  }

  const compressedBuffer = new Uint8Array(compressed.length);
  compressedBuffer.set(compressed);
  const decompressor = new DecompressionStream("deflate");
  const writer = decompressor.writable.getWriter();
  await writer.write(compressedBuffer.buffer);
  await writer.close();
  return new Response(decompressor.readable).text();
}

/**
 * 提取歌曲关联的网易云 ID
 */
export function extractSongNeteaseId(song: Song): string | null {
  if (song.netease_id && /^\d+$/.test(String(song.netease_id))) {
    return String(song.netease_id);
  }
  if (song.audio_url) {
    const match = song.audio_url.match(/(\d+)\.mp3/);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * 获取歌曲完整歌词（自动多级降级：缓存 -> 自定义链接 -> 网易云接口）
 */
export async function fetchSongLyrics(song: Song): Promise<LyricResult | null> {
  const cacheKey = String(song.id || song.audio_url || "");
  if (cacheKey && lyricsCache.has(cacheKey)) {
    return lyricsCache.get(cacheKey)!;
  }

  let fallbackResult: LyricResult | null = null;
  const keepAsFallback = (result: LyricResult) => {
    if (!fallbackResult || result.hasWordTimings) fallbackResult = result;
  };
  const cacheAndReturn = (result: LyricResult) => {
    if (cacheKey) lyricsCache.set(cacheKey, result);
    return result;
  };

  // 1. 优先保留 Notion 中手工维护的增强歌词。
  if (song.lyric) {
    const result = parseLrc(song.lyric);
    if (
      result.hasWordTimings ||
      /纯音乐，请欣赏|没有填词/.test(song.lyric)
    ) {
      return cacheAndReturn(result);
    }
    keepAsFallback(result);
  }

  // 2. 自定义歌词链接可能提供增强 LRC。
  if (song.lyric_url) {
    try {
      const res = await fetch(`/api/lyrics?url=${encodeURIComponent(song.lyric_url)}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.lrc || data?.yrc) {
          const result = parseLrc(data.lrc, data.tlyric, data.yrc);
          if (result.hasWordTimings) return cacheAndReturn(result);
          keepAsFallback(result);
        }
      }
    } catch (e) {
      console.warn("[Lyrics] 自定义歌词拉取失败:", e);
    }
  }

  // 3. 网易云 YRC 仍是首选的远端逐字歌词来源。
  const neteaseId = extractSongNeteaseId(song);
  if (neteaseId) {
    try {
      const res = await fetch(`/api/lyrics?id=${neteaseId}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.lrc || data?.yrc) {
          const result = parseLrc(data.lrc, data.tlyric, data.yrc);
          if (data.isInstrumental) {
            result.isInstrumental = true;
          }
          if (result.hasWordTimings) return cacheAndReturn(result);
          keepAsFallback(result);
        }
      }
    } catch (e) {
      console.warn("[Lyrics] 网易云歌词拉取失败:", e);
    }
  }

  // 4. Use community Kugou KRC as a word-timed fallback when metadata is available.
  if (song.title?.trim() && song.artist?.trim()) {
    try {
      const params = new URLSearchParams({
        provider: "kugou",
        title: song.title,
        artist: song.artist,
      });
      const res = await fetch(`/api/lyrics?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (typeof data?.krc === "string" && data.krc) {
          const krcText = await decodeKugouKrc(data.krc);
          const result = parseKrc(krcText);
          if (result.lines.length && result.hasWordTimings) {
            return cacheAndReturn(result);
          }
        }
      }
    } catch (e) {
      console.warn("[Lyrics] Kugou KRC fallback failed:", e);
    }
  }

  return fallbackResult ? cacheAndReturn(fallbackResult) : null;
}
