// app/api/playlist/route.ts
import { NextResponse } from "next/server";
import { fetchPlaylists } from "@/lib/data";

export const dynamic = "force-static";

export async function GET() {
  try {
    const data = await fetchPlaylists();
    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (error: any) {
    console.error("❌ Notion API 错误:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "未知错误",
      },
      { status: 500 }
    );
  }
}