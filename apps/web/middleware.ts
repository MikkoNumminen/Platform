import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decode } from "next-auth/jwt";

const ADMIN_ROLES = ["superuser", "vuohi", "admin"];

export async function middleware(request: NextRequest) {
  const tokenValue =
    request.cookies.get("authjs.session-token")?.value ??
    request.cookies.get("__Secure-authjs.session-token")?.value;

  if (!tokenValue) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(signInUrl);
  }

  // For admin routes, verify the user has an admin-level role
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!process.env.AUTH_SECRET) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }

    try {
      const token = await decode({
        token: tokenValue,
        secret: process.env.AUTH_SECRET,
        salt:
          request.cookies.get("__Secure-authjs.session-token") != null
            ? "__Secure-authjs.session-token"
            : "authjs.session-token",
      });

      if (!token?.role || !ADMIN_ROLES.includes(token.role as string)) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
