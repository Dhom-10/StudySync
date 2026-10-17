import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "studysync_token";

// Presence-only check: the backend is the source of truth and verifies the
// JWT signature/expiry on every API call. Only page right now that cares
// about session state is /login — bounce a logged-in visitor back to "/".
export function proxy(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get(COOKIE_NAME)?.value);

  if (hasSession && request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
