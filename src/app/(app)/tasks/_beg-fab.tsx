"use client";

/**
 * Kid Tasks FAB — triggers the Beg flow by scrolling to the beg form section
 * and focusing the first input. Mockup: `더 조르기` (Beg More).
 */

type Props = {
  label: string;
  targetId: string;
};

export function BegFab({ label, targetId }: Props) {
  function onClick() {
    if (typeof document === "undefined") return;
    const el = document.getElementById(targetId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    // Focus the first input/textarea within the beg form card
    const input = el.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      'input, textarea',
    );
    // Defer focus until the smooth scroll starts to avoid fighting browser behavior.
    if (input) setTimeout(() => input.focus(), 250);
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center">
      <button
        type="button"
        onClick={onClick}
        className="pointer-events-auto flex items-center gap-2 rounded-full border-none text-white"
        style={{
          padding: "8px 8px 8px 24px",
          background: "#1A0F26",
          boxShadow:
            "0 18px 36px -12px rgba(26,15,38,0.55), inset 0 1px 0 rgba(255,255,255,0.08)",
          cursor: "pointer",
        }}
      >
        <span className="text-base">✨</span>
        <span
          className="text-base font-bold"
          style={{ letterSpacing: "-0.2px" }}
        >
          {label}
        </span>
        <span
          className="ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{
            background: "linear-gradient(135deg,#FF6B9D,#FFA07A)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M3.5 8h9m0 0L8.5 4m4 4l-4 4"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
    </div>
  );
}
