// src/app/api/translate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { callSingleTranslate, translateArticleText } from "@/lib/translator";

export const runtime = "edge";

// 服务端内存缓存，防止重复请求外部翻译服务
const cache = new Map<string, string>();

export async function POST(req: NextRequest) {
  try {
    const { text, title, targetLang = "en", sourceLang = "auto" } = await req.json();

    if (!text && !title) {
      return NextResponse.json({ error: "Missing text or title" }, { status: 400 });
    }

    const cacheKey = `${sourceLang}:${targetLang}:${title || ""}:${(text || "").slice(0, 100)}:${(text || "").length}`;
    if (cache.has(cacheKey)) {
      return NextResponse.json(JSON.parse(cache.get(cacheKey)!));
    }

    let translatedTitle = title;
    if (title && typeof title === "string") {
      translatedTitle = await callSingleTranslate(title, targetLang, sourceLang);
    }

    let translatedText = text;
    if (text && typeof text === "string") {
      translatedText = await translateArticleText(text, targetLang, sourceLang);
    }

    const result = {
      translatedTitle,
      translated: translatedText,
      from: sourceLang,
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
