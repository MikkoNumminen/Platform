import { handlers } from "@/auth";

// Type assertion needed: next-auth resolves against the root Next.js 16
// (hoisted from HRM), while the web app uses Next.js 15.
const GET = handlers.GET as unknown as (...args: unknown[]) => Promise<Response>;
const POST = handlers.POST as unknown as (...args: unknown[]) => Promise<Response>;

export { GET, POST };
