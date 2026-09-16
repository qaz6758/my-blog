// src/lib/translator.ts
// 通用高可用翻译引擎：支持代码块与 HTML 标签保护、POST 请求突破长文本限制、多级容灾降级与端侧兜底

export function detectIsSourceZh(sample: string): boolean {
  if (!sample) return true;
  const zhMatches = sample.slice(0, 1500).match(/[\u4e00-\u9fa5]/g);
  return (zhMatches?.length || 0) > 20;
}

export function mapTargetLang(locale: string): string {
  if (locale === "zh-CN") return "zh-CN";
  if (locale === "zh-TW") return "zh-TW";
  if (locale === "en") return "en";
  if (locale === "ja") return "ja";
  if (locale === "ko") return "ko";
  return locale;
}

export async function callSingleTranslate(
  text: string,
  targetLang: string,
  sourceLang = "auto"
): Promise<string> {
  if (!text || !text.trim()) return text;
  const tl = mapTargetLang(targetLang);

  // 1. Google Translate GTX (POST 请求：突破 URL 长度限制，保留完整标点)
  try {
    const params = new URLSearchParams();
    params.append("client", "gtx");
    params.append("sl", sourceLang);
    params.append("tl", tl);
    params.append("dt", "t");
    params.append("q", text);

    const res = await fetch("https://translate.googleapis.com/translate_a/single", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        Accept: "*/*",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
      body: params.toString(),
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.[0])) {
        const joined = data[0]
          .map((item: any) => (Array.isArray(item) && typeof item[0] === "string" ? item[0] : ""))
          .join("");
        if (joined && joined.trim()) return joined;
      }
    }
  } catch {}

  // 2. Google Translate GTX (GET 备选降级)
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${tl}&dt=t&q=${encodeURIComponent(
      text.slice(0, 1800)
    )}`;
    const res = await fetch(url, {
      headers: {
        Accept: "*/*",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.[0])) {
        const joined = data[0]
          .map((item: any) => (Array.isArray(item) && typeof item[0] === "string" ? item[0] : ""))
          .join("");
        if (joined && joined.trim()) return joined;
      }
    }
  } catch {}

  // 3. MyMemory Translate API 降级兜底
  try {
    const langpair = `${sourceLang === "auto" ? "autodetect" : sourceLang}|${tl === "zh-CN" ? "zh" : tl}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text.slice(0, 500)
    )}&langpair=${langpair}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (data?.responseData?.translatedText) {
        return data.responseData.translatedText;
      }
    }
  } catch {}

  return text;
}

export async function translateArticleText(
  content: string,
  targetLang: string,
  sourceLang = "auto"
): Promise<string> {
  if (!content || !content.trim()) return "";

  // 1. 保护代码块与原生预格式标签
  const codeBlocks: string[] = [];
  let masked = content.replace(/```[\s\S]*?```/g, (match) => {
    const idx = codeBlocks.length;
    codeBlocks.push(match);
    return `<!--CODEBLOCK_${idx}-->`;
  });

  masked = masked.replace(/<(pre|code)[^>]*>[\s\S]*?<\/\1>/gi, (match) => {
    const idx = codeBlocks.length;
    codeBlocks.push(match);
    return `<!--CODEBLOCK_${idx}-->`;
  });

  // 2. 适中长度：单次 POST，语意与标点连贯性最高
  if (masked.length <= 3200) {
    let translated = await callSingleTranslate(masked, targetLang, sourceLang);
    translated = translated.replace(/<!--\s*CODEBLOCK_(\d+)\s*-->/gi, (_, idx) => {
      return codeBlocks[Number(idx)] || "";
    });
    translated = translated.replace(/^(#{1,6})([^\s#])/gm, "$1 $2");
    return translated;
  }

  // 3. 超长篇幅：按段落切分，并发受控，杜绝机房突发限流
  const sections = masked.split(/\n\n+/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sec of sections) {
    if ((currentChunk + "\n\n" + sec).length > 2200) {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = sec;
    } else {
      currentChunk = currentChunk ? currentChunk + "\n\n" + sec : sec;
    }
  }
  if (currentChunk) chunks.push(currentChunk);

  const translatedChunks: string[] = [];
  for (let i = 0; i < chunks.length; i += 2) {
    const batch = chunks.slice(i, i + 2);
    const results = await Promise.all(
      batch.map((chunk) => callSingleTranslate(chunk, targetLang, sourceLang))
    );
    translatedChunks.push(...results);
  }

  let full = translatedChunks.join("\n\n");
  full = full.replace(/<!--\s*CODEBLOCK_(\d+)\s*-->/gi, (_, idx) => {
    return codeBlocks[Number(idx)] || "";
  });
  full = full.replace(/^(#{1,6})([^\s#])/gm, "$1 $2");

  return full;
}
