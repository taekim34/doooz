"use client";
import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useT } from "@/lib/i18n/useT";

function OnboardCard({
  primary,
  icon,
  title,
  subtitle,
  href,
}: {
  primary?: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  href: string;
}) {
  return (
    <Link
      href={href as Route}
      className="flex w-full items-center transition-transform hover:translate-y-[-1px]"
      style={{
        gap: 14,
        padding: "0 16px",
        height: 60,
        borderRadius: 14,
        textAlign: "left",
        textDecoration: "none",
        background: primary ? "#FF6B7A" : "#FFFFFF",
        color: primary ? "#fff" : "#0A0A0A",
        border: primary ? "none" : "1px solid #E5E5E5",
        boxShadow: primary
          ? "0 10px 22px -10px rgba(255,107,122,0.5)"
          : "0 1px 2px rgba(10,10,10,0.03)",
      }}
    >
      <span
        className="flex shrink-0 items-center justify-center"
        style={{
          height: 36,
          width: 36,
          borderRadius: 10,
          background: primary ? "rgba(255,255,255,0.18)" : "#FAFAFA",
          border: primary ? "none" : "1px solid #F0F0F0",
        }}
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col" style={{ lineHeight: 1.15 }}>
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>
          {title}
        </span>
        <span
          style={{
            marginTop: 3,
            fontSize: 12.5,
            fontWeight: 500,
            color: primary ? "rgba(255,255,255,0.75)" : "#9CA3AF",
          }}
        >
          {subtitle}
        </span>
      </span>
      <svg
        width="8"
        height="14"
        viewBox="0 0 8 14"
        fill="none"
        className="shrink-0"
        aria-hidden
      >
        <path
          d="M1.5 1.5l5 5.5-5 5.5"
          stroke={primary ? "rgba(255,255,255,0.85)" : "#9CA3AF"}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}

export function StartSheet({
  joinLabel,
  joinSub,
  createLabel,
  createSub,
}: {
  joinLabel: string;
  joinSub: string;
  createLabel: string;
  createSub: string;
}) {
  const [open, setOpen] = useState(false);
  const t = useT();

  return (
    <>
      {/* Trigger */}
      <div className="flex flex-col items-center" style={{ marginTop: 12 }}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex cursor-pointer items-center justify-center"
          style={{
            gap: 4,
            padding: "8px 12px",
            background: "transparent",
            border: "none",
            fontSize: 14,
            fontWeight: 600,
            color: "#6B7280",
          }}
        >
          <span className="whitespace-nowrap">{t("auth.first_time")}</span>
          <span
            style={{
              color: "#0A0A0A",
              textDecoration: "underline",
              textUnderlineOffset: 3,
              textDecorationThickness: 1,
              whiteSpace: "nowrap",
            }}
          >
            {t("auth.start_trigger")}
          </span>
        </button>
      </div>

      {/* Backdrop */}
      <div
        aria-hidden={!open}
        onClick={() => setOpen(false)}
        className="fixed inset-0 z-50"
        style={{
          background: open ? "rgba(10,10,10,0.32)" : "rgba(10,10,10,0)",
          pointerEvents: open ? "auto" : "none",
          transition: "background 240ms cubic-bezier(0.16,1,0.3,1)",
        }}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("auth.start_title")}
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: "#FFFFFF",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          boxShadow: "0 -20px 40px -12px rgba(10,10,10,0.18)",
          transform: open ? "translateY(0)" : "translateY(110%)",
          visibility: open ? "visible" : "hidden",
          transition: open
            ? "transform 360ms cubic-bezier(0.22,1,0.36,1), visibility 0ms"
            : "transform 360ms cubic-bezier(0.22,1,0.36,1), visibility 0ms 360ms",
          padding: "10px 20px 28px",
          maxWidth: 480,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        {/* Grabber */}
        <div className="flex justify-center" style={{ padding: "6px 0 10px" }}>
          <span
            style={{
              width: 40,
              height: 4,
              borderRadius: 9999,
              background: "#E5E5E5",
            }}
          />
        </div>
        <div
          className="flex items-baseline justify-between"
          style={{ marginBottom: 14 }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 19,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "#0A0A0A",
            }}
          >
            {t("auth.start_title")}
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t("auth.start_close")}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              color: "#9CA3AF",
              padding: "4px 6px",
            }}
          >
            {t("auth.start_close")}
          </button>
        </div>
        <p
          style={{
            margin: "0 0 16px",
            fontSize: 13.5,
            fontWeight: 500,
            color: "#6B7280",
            letterSpacing: "-0.01em",
            lineHeight: 1.5,
          }}
        >
          {t("auth.start_desc")}
        </p>
        <div className="flex flex-col" style={{ gap: 10 }}>
          <OnboardCard
            primary
            href="/join"
            icon={
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M10 14l-3 3a3.2 3.2 0 11-4.5-4.5l3.5-3.5a3.2 3.2 0 014.5 0M14 10l3-3a3.2 3.2 0 114.5 4.5L18 15a3.2 3.2 0 01-4.5 0"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
            title={joinLabel}
            subtitle={joinSub}
          />
          <OnboardCard
            href="/signup"
            icon={
              <span style={{ fontSize: 22 }} aria-hidden>
                &#x1F468;&#x200D;&#x1F469;&#x200D;&#x1F467;&#x200D;&#x1F466;
              </span>
            }
            title={createLabel}
            subtitle={createSub}
          />
        </div>
      </div>
    </>
  );
}
