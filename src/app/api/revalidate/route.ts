import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return handleRevalidate(req);
}

export async function POST(req: NextRequest) {
  return handleRevalidate(req);
}

async function handleRevalidate(req: NextRequest) {
  // 1. 鉴权提取：支持 Bearer Token, Header 与 URL 参数
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  const secret =
    bearerToken ||
    req.headers.get("x-revalidate-secret") ||
    req.nextUrl.searchParams.get("secret");

  const expectedSecret = process.env.REVALIDATION_SECRET || process.env.CRON_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json(
      { success: false, message: "Unauthorized: Invalid or missing secret." },
      { status: 401 }
    );
  }

  // 2. 解析请求体或查询参数
  let event: string | null = req.nextUrl.searchParams.get("event");
  let tag: string | null = req.nextUrl.searchParams.get("tag");
  let path: string | null = req.nextUrl.searchParams.get("path");

  if (req.method === "POST") {
    try {
      const body = await req.json().catch(() => null);
      if (body) {
        if (body.event) event = body.event;
        if (body.tag) tag = body.tag;
        if (body.path) path = body.path;
      }
    } catch {
      // Ignore JSON parse error, fallback to params
    }
  }

  try {
    // 3. 执行定向或全量失效 (兼容 Next.js 16 revalidateTag 签名)
    if (tag) {
      revalidateTag(tag, "max");
      return NextResponse.json({
        success: true,
        revalidated: true,
        type: "tag",
        target: tag,
        now: Date.now(),
      });
    }

    if (path) {
      revalidatePath(path);
      return NextResponse.json({
        success: true,
        revalidated: true,
        type: "path",
        target: path,
        now: Date.now(),
      });
    }

    // 针对 Notion 博客/随想录的主动刷新 (或 event === 'posts')
    revalidateTag("posts", "max");
    revalidateTag("thoughts", "max");
    revalidatePath("/posts");
    revalidatePath("/posts/[slug]", "page");
    revalidatePath("/thoughts");
    revalidatePath("/thoughts/[id]", "page");
    revalidatePath("/sitemap.xml");

    return NextResponse.json({
      success: true,
      revalidated: true,
      event: event || "posts",
      scope: "all-notion-content",
      now: Date.now(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Revalidation failed",
      },
      { status: 500 }
    );
  }
}
