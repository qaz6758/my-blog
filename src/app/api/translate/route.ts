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

  // 2. MyMemory Translate API 降级保障
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text
    )}&langpair=zh|${targetLang}`;
    const res = await fetch(url);
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

// 分块翻译 Markdown，保护代码块与格式
async function translateMarkdown(md: string, targetLang: string): Promise<string> {
  if (!md) return "";

  // 按代码块与双换行切分段落
  const chunks = md.split(/(\n```[\s\S]*?```\n|\n\n+)/g);

  const translatedChunks = await Promise.all(
    chunks.map(async (chunk) => {
      // 保持换行与空格
      if (!chunk.trim()) return chunk;

      // 代码块直接透传，严禁破坏代码与注释语法
      if (chunk.trim().startsWith("```") && chunk.trim().endsWith("```")) {
        return chunk;
      }

      // Markdown 标题行处理（# 标题）
      const headingMatch = chunk.match(/^(\s*#{1,6}\s+)(.+)$/);
      if (headingMatch) {
        const prefix = headingMatch[1];
        const content = headingMatch[2];
        const trans = await callSingleTranslate(content, targetLang);
        return prefix + trans;
      }

      // 普通段落
      return await callSingleTranslate(chunk, targetLang);
    })
  );

  return translatedChunks.join("");
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

    cache.set(cacheKey, JSON.stringify(result));

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[Translate API Error]:", err);
    return NextResponse.json(
      { error: "Translation failed", message: err.message },
      { status: 500 }
    );
  }
}
