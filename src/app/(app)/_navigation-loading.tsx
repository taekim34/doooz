"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useCallback, createContext, useContext } from "react";

const LoadingContext = createContext<{
  show: () => void;
  hide: () => void;
}>({ show: () => {}, hide: () => {} });

export function useLoading() {
  return useContext(LoadingContext);
}

export function NavigationLoading({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const prevKey = useRef(`${pathname}?${searchParams}`);

  const show = useCallback(() => {
    setLoading(true);
    clearTimeout(timerRef.current);
    // Auto-hide after 8s (safety net)
    timerRef.current = setTimeout(() => setLoading(false), 8000);
  }, []);

  const hide = useCallback(() => {
    setLoading(false);
    clearTimeout(timerRef.current);
  }, []);

  // Hide on route change complete
  useEffect(() => {
    const key = `${pathname}?${searchParams}`;
    if (key !== prevKey.current) {
      hide();
      prevKey.current = key;
    }
  }, [pathname, searchParams, hide]);

  // Intercept link clicks to show overlay immediately
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#") || anchor.target === "_blank") return;
      // Internal navigation — show loading
      show();
    }
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [show]);

  return (
    <LoadingContext.Provider value={{ show, hide }}>
      {children}
      {loading && (
        <div className="fixed inset-0 bottom-[env(safe-area-inset-bottom,0px)] z-40 flex items-center justify-center bg-background/60 pb-16 md:pb-0">
          <div className="rounded-full bg-background p-3 shadow-lg">
            <svg
              className="h-7 w-7 animate-spin text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 12a9 9 0 1 1-6.22-8.56" />
            </svg>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}
