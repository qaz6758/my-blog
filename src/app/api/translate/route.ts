// src/app/api/translate/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// 服务端内存缓存，防止重复请求外部翻译服务
const cache = new Map<string, string>();

async function callSingleTranslate(text: string, targetLang: string): Promise<string> {
  if (!text || !text.trim()) return text;

  // 1. Google Translate (gtx 移动端/轻量端)
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=${targetLang}&dt=t&q=${encodeURIComponent(
      text
    )}`;
    const res = await fetch(url, {
      headers: {
        Accept: "*/*",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.[0])) {
        const joined = data[0].map((item: any) => item[0]).join("");
        if (joined) return joined;
      }
    }
  } catch {
    // fallback
  }

  // 2. MyMemory Translate API 降级保障（切片至 500 字符内，避免 403 字符数超限）
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text.slice(0, 500)
    )}&langpair=zh|${targetLang}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (data?.responseData?.translatedText) {
        return data.responseData.translatedText;
      }
    }
  } catch {
    // fallback
  }

  return text;
}

// 保护代码块与 Markdown 格式的高保真翻译
async function translateMarkdown(md: string, targetLang: string): Promise<string> {
  if (!md) return "";

  // 1. 保护代码块：将代码块抽离为占位符，防止代码语法与注释被误翻译
  const codeBlocks: string[] = [];
  const withPlaceholders = md.replace(/```[\s\S]*?```/g, (match) => {
    const idx = codeBlocks.length;
    codeBlocks.push(match);
    return `<!--CODEBLOCK_${idx}-->`;
  });

  // 2. 篇幅适中文章：单次整体翻译，语意连贯性最高，大幅降低网络开销与频控风险
  if (withPlaceholders.length <= 2500) {
    let translated = await callSingleTranslate(withPlaceholders, targetLang);
    // 还原代码块
    translated = translated.replace(/<!--\s*CODEBLOCK_(\d+)\s*-->/gi, (_, idx) => {
      return codeBlocks[Number(idx)] || "";
    });
    // 规范化标题语法（如 #Title 规范化为 # Title，###01. 规范化为 ### 01.）
    translated = translated.replace(/^(#{1,6})([^\s#])/gm, "$1 $2");
    return translated;
  }

  // 3. 超长文章：按双换行切分成若干大段（每段 1800 字以内），而非逐句切碎
  const sections = withPlaceholders.split(/\n\n+/);
  const batchedChunks: string[] = [];
  let currentChunk = "";

  for (const sec of sections) {
    if ((currentChunk + "\n\n" + sec).length > 1800) {
      if (currentChunk) batchedChunks.push(currentChunk);
      currentChunk = sec;
    } else {
      currentChunk = currentChunk ? currentChunk + "\n\n" + sec : sec;
    }
  }
  if (currentChunk) batchedChunks.push(currentChunk);

  const translatedSections = await Promise.all(
    batchedChunks.map(async (chunk) => {
      return await callSingleTranslate(chunk, targetLang);
    })
  );

  let fullTranslated = translatedSections.join("\n\n");
  fullTranslated = fullTranslated.replace(/<!--\s*CODEBLOCK_(\d+)\s*-->/gi, (_, idx) => {
    return codeBlocks[Number(idx)] || "";
  });
  fullTranslated = fullTranslated.replace(/^(#{1,6})([^\s#])/gm, "$1 $2");

  return fullTranslated;
}

export async function POST(req: NextRequest) {
  try {
    const { text, title, targetLang = "en" } = await req.json();

    if (!text && !title) {
      return NextResponse.json({ error: "Missing text or title" }, { status: 400 });
    }

    const cacheKey = `${targetLang}:${title || ""}:${(text || "").slice(0, 100)}:${(text || "").length}`;
    if (cache.has(cacheKey)) {
      return NextResponse.json(JSON.parse(cache.get(cacheKey)!));
    }

    let translatedTitle = title;
    if (title && typeof title === "string") {
      translatedTitle = await callSingleTranslate(title, targetLang);
    }

    let translatedText = text;
    if (text && typeof text === "string") {
      translatedText = await translateMarkdown(text, targetLang);
    }

    const result = {
      translatedTitle,
      translated: translatedText,
      from: "zh-CN",
      to: targetLang,
    };

    // 仅在翻译切实生效时缓存
    if (translatedTitle !== title || translatedText !== text) {
      cache.set(cacheKey, JSON.stringify(result));
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[Translate API Error]:", err);
    return NextResponse.json(
      { error: "Translation failed", message: err.message },
      { status: 500 }
    );
  }
}
