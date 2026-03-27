"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const EXCLUDED_PATHS = ["/setup-alias", "/auth/signin", "/api"];

export default function AliasGuard() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated") return;
    if (EXCLUDED_PATHS.some((p) => pathname.startsWith(p))) return;
    if (session?.user && !session.user.alias) {
      router.replace("/setup-alias");
    }
  }, [session, status, pathname, router]);

  return null;
}
