"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";

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
        cursor: "pointer",
        textAlign: "left",
        background: primary ? "#FF6B7A" : "#FFFFFF",
        color: primary ? "#fff" : "#0A0A0A",
        border: primary ? "none" : "1px solid #E5E5E5",
        boxShadow: primary
          ? "0 10px 22px -10px rgba(255,107,122,0.5)"
          : "0 1px 2px rgba(10,10,10,0.03)",
        textDecoration: "none",
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
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>{title}</span>
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
      <svg width="8" height="14" viewBox="0 0 8 14" fill="none" className="shrink-0" aria-hidden>
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

export function OnboardingAccordion({
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

  return (
    <div className="flex flex-col items-center" style={{ marginTop: 20 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center justify-center cursor-pointer"
        style={{
          gap: 6,
          padding: "8px 12px",
          background: "transparent",
          border: "none",
          fontSize: 14,
          fontWeight: 600,
          color: "#9CA3AF",
        }}
      >
        <span className="whitespace-nowrap">{"\ucc98\uc74c\uc774\uc2e0\uac00\uc694?"}</span>
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          aria-hidden
          style={{
            transition: "transform 240ms cubic-bezier(0.16,1,0.3,1)",
            transform: open ? "rotate(180deg)" : "none",
          }}
        >
          <path
            d="M1 1l4 4 4-4"
            stroke="#9CA3AF"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div
        className="w-full"
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          transition: "grid-template-rows 280ms cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <div
            className="flex flex-col"
            style={{
              paddingTop: 10,
              gap: 10,
              opacity: open ? 1 : 0,
              transform: open ? "translateY(0)" : "translateY(-4px)",
              transition: "opacity 240ms 40ms, transform 240ms 40ms",
            }}
          >
            <OnboardCard
              primary
              href="/join"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
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
              icon={<span style={{ fontSize: 22 }} aria-hidden>&#x1F468;&#x200D;&#x1F469;&#x200D;&#x1F467;&#x200D;&#x1F466;</span>}
              title={createLabel}
              subtitle={createSub}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
