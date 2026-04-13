"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function ForegroundRefresh() {
  const router = useRouter();
  // eslint-disable-next-line no-restricted-syntax
  const lastActive = useRef(Date.now());

  useEffect(() => {
    function refresh() {
      // eslint-disable-next-line no-restricted-syntax
      const elapsed = Date.now() - lastActive.current;
      // Only refresh if backgrounded for at least 3 seconds
      if (elapsed > 3000) {
        router.refresh();
      }
      // eslint-disable-next-line no-restricted-syntax
      lastActive.current = Date.now();
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
