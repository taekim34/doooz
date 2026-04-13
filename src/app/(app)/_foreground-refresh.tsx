"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { now } from "@/lib/datetime/clock";
import { useLoading } from "./_navigation-loading";

function isIOSStandalone() {
  if (typeof window === "undefined") return false;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = "standalone" in window.navigator &&
    (window.navigator as { standalone?: boolean }).standalone === true;
  return isIOS && isStandalone;
}

export function ForegroundRefresh() {
  const router = useRouter();
  const { show, hide } = useLoading();
  const lastActive = useRef(now());
  const [pullY, setPullY] = useState(0);
  const touchStartY = useRef(0);
  const pulling = useRef(false);

  const doRefresh = useCallback(() => {
    show();
    router.refresh();
    setTimeout(hide, 800);
  }, [router, show, hide]);

  // Foreground restore
  useEffect(() => {
    function refresh() {
      const elapsed = now() - lastActive.current;
      if (elapsed > 3000) doRefresh();
      lastActive.current = now();
    }

    function onVisible() {
      if (document.visibilityState === "visible") refresh();
    }
    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) refresh();
    }
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
  }, [doRefresh]);

  // Pull-to-refresh: iOS standalone PWA only
  useEffect(() => {
    if (!isIOSStandalone()) return;

    const THRESHOLD = 80;

    function onTouchStart(e: TouchEvent) {
      if (window.scrollY === 0 && e.touches[0]) {
        touchStartY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (!pulling.current || !e.touches[0]) return;
      const dy = e.touches[0].clientY - touchStartY.current;
      if (dy > 0 && window.scrollY === 0) {
        e.preventDefault();
        setPullY(Math.min(dy * 0.4, THRESHOLD + 20));
      } else {
        pulling.current = false;
        setPullY(0);
      }
    }

    function onTouchEnd() {
      if (pulling.current && pullY >= THRESHOLD * 0.4) {
        doRefresh();
      }
      pulling.current = false;
      setPullY(0);
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [doRefresh, pullY]);

  // Pull indicator only (overlay is handled by NavigationLoading)
  if (pullY <= 0) return null;
  return (
    <div
      className="fixed left-0 right-0 top-0 z-50 flex justify-center"
      style={{ transform: `translateY(${pullY - 40}px)` }}
    >
      <div className="rounded-full bg-primary/20 p-2">
        <svg
          className="h-5 w-5 text-primary"
          style={{ transform: `rotate(${Math.min(pullY * 3, 360)}deg)` }}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <path d="M21 12a9 9 0 1 1-6.22-8.56" />
        </svg>
      </div>
    </div>
  );
}
