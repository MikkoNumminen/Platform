export { auth as middleware } from "@/auth";

export const config = {
  matcher: [
    // Protect all routes except public ones
    "/((?!api/auth|auth/signin|survey|_next/static|_next/image|favicon.ico).*)",
  ],
};
