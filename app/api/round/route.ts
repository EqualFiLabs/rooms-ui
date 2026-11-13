import { NextResponse, type NextRequest } from "next/server";
import { readLiveRoomView } from "@/lib/rooms-live";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const selected = Number(request.nextUrl.searchParams.get("room") ?? 3);
  const quantity = Number(request.nextUrl.searchParams.get("quantity") ?? 2);
  if (!Number.isInteger(selected) || selected < 0 || selected > 23 || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    return NextResponse.json({ error: "Invalid room or quantity" }, { status: 400 });
  }

  try {
    const view = await readLiveRoomView(selected, quantity);
    if (!view) return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
    return NextResponse.json(view, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Live round data is unavailable. Check the RPC and deployment settings." }, {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
