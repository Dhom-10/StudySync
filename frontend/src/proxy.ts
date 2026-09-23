import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "studysync_token";
const PUBLIC_PATHS = ["/login", "/signup"];

// Presence-only check: fast redirect for the common case. The backend is the
// source of truth and verifies the JWT signature/expiry on every API call —
// a client that spoofs this cookie still gets 401s and is bounced by the
// app shell's auth query.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(COOKIE_NAME)?.value);
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  if (!hasSession && !isPublicPath && pathname !== "/") {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (hasSession && isPublicPath) {
    return NextResponse.redirect(new URL("/record", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
