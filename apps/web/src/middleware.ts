import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Next.js server-action ids are long hex hashes, not scanner probes like "x" / "0" / "action". */
const SERVER_ACTION_ID = /^[0-9a-f]{32,}([:#].+)?$/i;

export function middleware(req: NextRequest) {
  const action = req.headers.get("next-action") ?? req.headers.get("Next-Action");
  if (action && !SERVER_ACTION_ID.test(action.trim())) {
    return new NextResponse(null, { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|audio/|api/).*)"],
};
