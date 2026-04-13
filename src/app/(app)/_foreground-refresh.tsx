"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { now } from "@/lib/datetime/clock";

export function ForegroundRefresh() {
  const router = useRouter();
  const lastActive = useRef(now());

  useEffect(() => {
    function refresh() {
      const elapsed = now() - lastActive.current;
      if (elapsed > 3000) {
        router.refresh();
      }
      lastActive.current = now();
    }

    // visibilitychange: works on most browsers + Android PWA
    function onVisible() {
      if (document.visibilityState === "visible") refresh();
    }

    // pageshow: works on iOS Safari/PWA (bfcache resume)
    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) refresh();
    }

    // focus: fallback for iOS PWA foreground restore
    function onFocus() {
      refresh();
    }

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("focus", onFocus);
    };
  }, [router]);

  return null;
}
