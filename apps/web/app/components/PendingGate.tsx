"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const ALLOWED_PATHS = ["/survey", "/setup-alias", "/auth", "/api"];

export default function PendingGate() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated") return;
    if (session?.user?.role !== "pending") return;
    if (ALLOWED_PATHS.some((p) => pathname.startsWith(p))) return;

    router.replace("/survey");
  }, [session, status, pathname, router]);

  return null;
}
