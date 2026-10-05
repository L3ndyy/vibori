import { NextResponse } from "next/server";
import { getPollState } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const voterId = searchParams.get("voterId") || undefined;

    const data = await getPollState(voterId);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        "CDN-Cache-Control": "no-store",
        "Vercel-CDN-Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error fetching poll state:", error);
    return NextResponse.json(
      { error: "Failed to fetch poll status" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache",
        },
      }
    );
  }
}
