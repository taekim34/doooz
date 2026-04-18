"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useT } from "@/lib/i18n/useT";
import { useLocale } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n";

const LOCALE_COOKIE = process.env.NEXT_PUBLIC_LOCALE_COOKIE || "doooz_locale";
const FAMILY_STORAGE_KEY = process.env.NEXT_PUBLIC_FAMILY_STORAGE_KEY || "doooz_family_name";

const LOCALES: { v: Locale; label: string }[] = [
  { v: "ko", label: "\ud55c\uad6d\uc5b4" },
  { v: "en", label: "English" },
  { v: "ja", label: "\u65e5\u672c\u8a9e" },
];

const inputStyle: React.CSSProperties = {
  height: 48, width: "100%", borderRadius: 10,
  padding: "0 16px", outline: "none",
  background: "#FAFAFA", border: "1px solid #F0F0F0",
  fontSize: 17, fontWeight: 500, color: "#0A0A0A",
  fontFamily: "inherit",
  transition: "border-color 150ms, background 150ms",
  boxSizing: "border-box",
};

function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = "#0A0A0A";
  e.currentTarget.style.background = "#FFFFFF";
}
function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = "#F0F0F0";
  e.currentTarget.style.background = "#FAFAFA";
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{
        fontSize: 12, fontWeight: 700, textTransform: "uppercase",
        color: "#9CA3AF", letterSpacing: "0.15em",
      }}>{label}</span>
      {children}
    </label>
  );
}

function GlobeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke="#0A0A0A" strokeWidth="1.3"/>
      <path d="M1.5 7h11M7 1.5c1.7 2 1.7 9 0 11M7 1.5c-1.7 2-1.7 9 0 11" stroke="#0A0A0A" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M1.5 10C3 6 6.2 4 10 4s7 2 8.5 6c-1.5 4-4.7 6-8.5 6s-7-2-8.5-6z" stroke="currentColor" strokeWidth="1.6"/>
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 3l14 14M7.2 7.3A3 3 0 0010 13a3 3 0 002.8-1.9M5 6.2C3.2 7.4 2.1 9 1.5 10c1.5 4 4.7 6 8.5 6 1.3 0 2.5-.25 3.6-.7M9 4.05A9.5 9.5 0 0110 4c3.8 0 7 2 8.5 6a10.8 10.8 0 01-2.2 3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

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
  const isPrimary = !!primary;
  return (
    <Link
      href={href as Route}
      style={{
        display: "flex", width: "100%", alignItems: "center", gap: 14,
        padding: "0 16px", height: 60, borderRadius: 14,
        cursor: "pointer", textAlign: "left", fontFamily: "inherit",
        textDecoration: "none",
        background: isPrimary ? "#FF6B7A" : "#FFFFFF",
        color: isPrimary ? "#fff" : "#0A0A0A",
        border: isPrimary ? "none" : "1px solid #E5E5E5",
        boxShadow: isPrimary
          ? "0 10px 22px -10px rgba(255,107,122,0.5)"
          : "0 1px 2px rgba(10,10,10,0.03)",
        transition: "transform 200ms cubic-bezier(0.16,1,0.3,1)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <span style={{
        flexShrink: 0, display: "flex", height: 36, width: 36,
        alignItems: "center", justifyContent: "center", borderRadius: 10,
        background: isPrimary ? "rgba(255,255,255,0.18)" : "#FAFAFA",
        border: isPrimary ? "none" : "1px solid #F0F0F0",
      }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>{title}</span>
        <span style={{
          marginTop: 3, fontSize: 12.5, fontWeight: 500,
          color: isPrimary ? "rgba(255,255,255,0.75)" : "#9CA3AF",
        }}>{subtitle}</span>
      </span>
      <svg width="8" height="14" viewBox="0 0 8 14" fill="none" style={{ flexShrink: 0 }}>
        <path d="M1.5 1.5l5 5.5-5 5.5" stroke={isPrimary ? "rgba(255,255,255,0.85)" : "#9CA3AF"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </Link>
  );
}

export function LoginForm({
  defaultTab,
  error,
  familyLoginAction,
  emailLoginAction,
}: {
  defaultTab: "family" | "email";
  error?: string;
  familyLoginAction: (formData: FormData) => void;
  emailLoginAction: (formData: FormData) => void;
}) {
  const t = useT();
  const currentLocale = useLocale();
  const router = useRouter();

  const [loginType, setLoginType] = useState<"family" | "email">(defaultTab);
  const [showPw, setShowPw] = useState(false);
  const [localeOpen, setLocaleOpen] = useState(false);
  const [onbOpen, setOnbOpen] = useState(false);
  const [loc, setLoc] = useState<Locale>(currentLocale);

  const localeRef = useRef<HTMLDivElement>(null);
  const familyInputRef = useRef<HTMLInputElement>(null);

  // Close locale dropdown on outside click
  useEffect(() => {
    if (!localeOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (localeRef.current && !localeRef.current.contains(e.target as Node)) setLocaleOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [localeOpen]);

  // Restore cached family name
  useEffect(() => {
    if (!familyInputRef.current) return;
    const cached = localStorage.getItem(FAMILY_STORAGE_KEY);
    if (!familyInputRef.current.value && cached) {
      familyInputRef.current.value = cached;
    }
  }, []);

  function selectLocale(v: Locale) {
    setLoc(v);
    setLocaleOpen(false);
    document.cookie = `${LOCALE_COOKIE}=${v};path=/;max-age=31536000`;
    router.refresh();
  }

  return (
    <>
      {/* Top-right locale switcher */}
      <div ref={localeRef} style={{ position: "absolute", top: 20, right: 20, zIndex: 5 }}>
        <button
          type="button"
          onClick={() => setLocaleOpen(v => !v)}
          aria-haspopup="listbox"
          aria-expanded={localeOpen}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 12px", borderRadius: 9999,
            background: "rgba(250,250,250,0.85)",
            border: "1px solid #F0F0F0",
            fontFamily: "inherit", fontSize: 13, fontWeight: 600,
            color: "#0A0A0A", cursor: "pointer",
            backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <GlobeIcon/>
          <span style={{ whiteSpace: "nowrap" }}>
            {LOCALES.find(l => l.v === loc)?.label ?? loc}
          </span>
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none"
            style={{ transition: "transform 200ms", transform: localeOpen ? "rotate(180deg)" : "none" }}>
            <path d="M1 1l4 4 4-4" stroke="#0A0A0A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {localeOpen && (
          <div role="listbox" style={{
            position: "absolute", top: "calc(100% + 6px)", right: 0,
            minWidth: 132, padding: 4,
            background: "#fff", border: "1px solid #F0F0F0",
            borderRadius: 12, boxShadow: "0 14px 30px -10px rgba(10,10,10,0.18)",
            display: "flex", flexDirection: "column", gap: 2,
          }}>
            {LOCALES.map(o => {
              const on = loc === o.v;
              return (
                <button key={o.v} type="button" onClick={() => selectLocale(o.v)}
                  role="option" aria-selected={on}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "8px 12px", borderRadius: 8,
                    background: on ? "#FAFAFA" : "transparent",
                    border: "none", cursor: "pointer", fontFamily: "inherit",
                    fontSize: 14, fontWeight: on ? 700 : 500,
                    color: "#0A0A0A", textAlign: "left",
                  }}>
                  <span>{o.label}</span>
                  {on && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6.5L5 9l4.5-5.5" stroke="#0A0A0A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Brand */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div style={{
          fontSize: 12, fontWeight: 700, textTransform: "uppercase",
          color: "#6366F1", letterSpacing: "0.15em",
        }}>{t("auth.brand_subtitle")}</div>
        <Image
          src="/login-logo.png"
          alt="DOOOZ"
          width={400}
          height={400}
          priority
          style={{ marginTop: 12, width: 200, height: 200, display: "block", objectFit: "contain" }}
        />
      </div>

      {/* Form */}
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Login type segmented control */}
        <div role="tablist" aria-label={t("auth.login_button")} style={{
          position: "relative",
          display: "grid", gridTemplateColumns: "1fr 1fr",
          padding: 3, borderRadius: 10,
          background: "#F5F5F5",
          marginBottom: 4,
        }}>
          <span aria-hidden style={{
            position: "absolute", top: 3, bottom: 3,
            left: loginType === "family" ? 3 : "calc(50% + 0px)",
            width: "calc(50% - 3px)",
            background: "#FFFFFF",
            borderRadius: 8,
            boxShadow: "0 1px 2px rgba(10,10,10,0.06), 0 0 0 0.5px rgba(10,10,10,0.04)",
            transition: "left 240ms cubic-bezier(0.16,1,0.3,1)",
          }}/>
          {([
            { v: "family" as const, label: t("auth.family_tab") },
            { v: "email" as const, label: t("auth.email_tab") },
          ]).map(tab => {
            const on = loginType === tab.v;
            return (
              <button key={tab.v} type="button" role="tab" aria-selected={on}
                onClick={() => setLoginType(tab.v)}
                style={{
                  position: "relative", zIndex: 1,
                  height: 36, border: "none", background: "transparent", cursor: "pointer",
                  fontFamily: "inherit", fontSize: 13,
                  fontWeight: on ? 700 : 500,
                  color: on ? "#0A0A0A" : "#6B7280",
                  letterSpacing: "-0.01em",
                  transition: "color 160ms",
                  whiteSpace: "nowrap",
                }}>{tab.label}</button>
            );
          })}
        </div>

        {/* Family login form */}
        <form
          action={familyLoginAction}
          style={{ display: loginType === "family" ? "flex" : "none", flexDirection: "column", gap: 14 }}
        >
          <Field label={t("auth.family_name_label")}>
            <input
              ref={familyInputRef}
              type="text"
              name="family_name"
              autoComplete="organization"
              placeholder={t("auth.family_name_placeholder")}
              required
              maxLength={40}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onChange={(e) => {
                const v = e.target.value.trim();
                if (v) localStorage.setItem(FAMILY_STORAGE_KEY, v);
              }}
              style={inputStyle}
            />
          </Field>
          <Field label={t("auth.my_name_label")}>
            <input
              type="text"
              name="display_name"
              autoComplete="name"
              placeholder={t("auth.my_name_placeholder")}
              required
              onFocus={handleFocus}
              onBlur={handleBlur}
              style={inputStyle}
            />
          </Field>
          <Field label={t("auth.password")}>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
                onFocus={handleFocus}
                onBlur={handleBlur}
                style={{ ...inputStyle, paddingRight: 48 }}
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? t("auth.password") : t("auth.password")}
                style={{
                  position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                  display: "flex", height: 36, width: 36, alignItems: "center", justifyContent: "center",
                  borderRadius: 6, background: "transparent", border: "none", color: "#9CA3AF", cursor: "pointer",
                }}>
                {showPw ? <EyeOffIcon/> : <EyeIcon/>}
              </button>
            </div>
          </Field>
          {defaultTab !== "email" && error && (
            <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "#EF4444" }}>{error}</p>
          )}
          <button type="submit"
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
            style={{
              marginTop: 6, height: 48, width: "100%", borderRadius: 10,
              fontSize: 15, fontWeight: 600, color: "#fff",
              background: "#0A0A0A", border: "none", cursor: "pointer",
              letterSpacing: "-0.01em",
              boxShadow: "0 1px 2px rgba(10,10,10,0.04)",
              transition: "transform 200ms cubic-bezier(0.16,1,0.3,1)",
              fontFamily: "inherit",
            }}>{t("auth.login_button")}</button>
        </form>

        {/* Email login form */}
        <form
          action={emailLoginAction}
          style={{ display: loginType === "email" ? "flex" : "none", flexDirection: "column", gap: 14 }}
        >
          <Field label={t("auth.email_label")}>
            <input
              type="email"
              name="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@family.com"
              required
              onFocus={handleFocus}
              onBlur={handleBlur}
              style={inputStyle}
            />
          </Field>
          <Field label={t("auth.password")}>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
                onFocus={handleFocus}
                onBlur={handleBlur}
                style={{ ...inputStyle, paddingRight: 48 }}
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? t("auth.password") : t("auth.password")}
                style={{
                  position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                  display: "flex", height: 36, width: 36, alignItems: "center", justifyContent: "center",
                  borderRadius: 6, background: "transparent", border: "none", color: "#9CA3AF", cursor: "pointer",
                }}>
                {showPw ? <EyeOffIcon/> : <EyeIcon/>}
              </button>
            </div>
          </Field>
          {defaultTab === "email" && error && (
            <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "#EF4444" }}>{error}</p>
          )}
          <button type="submit"
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
            style={{
              marginTop: 6, height: 48, width: "100%", borderRadius: 10,
              fontSize: 15, fontWeight: 600, color: "#fff",
              background: "#0A0A0A", border: "none", cursor: "pointer",
              letterSpacing: "-0.01em",
              boxShadow: "0 1px 2px rgba(10,10,10,0.04)",
              transition: "transform 200ms cubic-bezier(0.16,1,0.3,1)",
              fontFamily: "inherit",
            }}>{t("auth.login_button")}</button>
        </form>
      </div>

      {/* Forgot password */}
      <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Link href="/login?forgot=1" style={{
          background: "transparent", border: "none",
          fontFamily: "inherit", fontSize: 14, fontWeight: 500,
          color: "#6366F1", padding: 0, whiteSpace: "nowrap",
          textDecoration: "none",
        }}>{t("auth.forgot_password")}</Link>
      </div>

      {/* Onboarding trigger */}
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <button type="button" onClick={() => setOnbOpen(true)}
          aria-expanded={onbOpen} aria-haspopup="dialog"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 4, padding: "8px 12px",
            background: "transparent", border: "none", cursor: "pointer",
            fontFamily: "inherit", fontSize: 14, fontWeight: 600,
            color: "#6B7280",
          }}>
          <span style={{ whiteSpace: "nowrap" }}>{t("auth.first_time")}</span>
          <span style={{ color: "#0A0A0A", textDecoration: "underline", textUnderlineOffset: 3, textDecorationThickness: 1, whiteSpace: "nowrap" }}>
            {t("auth.start_trigger")}
          </span>
        </button>
      </div>

      <div style={{ flex: 1 }}/>

      {/* Bottom sheet backdrop */}
      <div
        aria-hidden={!onbOpen}
        onClick={() => setOnbOpen(false)}
        style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: onbOpen ? "rgba(10,10,10,0.32)" : "rgba(10,10,10,0)",
          pointerEvents: onbOpen ? "auto" : "none",
          transition: "background 240ms cubic-bezier(0.16,1,0.3,1)",
        }}
      />

      {/* Bottom sheet */}
      <div role="dialog" aria-modal="true" aria-label={t("auth.start_title")}
        style={{
          position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 51,
          background: "#FFFFFF",
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          boxShadow: "0 -20px 40px -12px rgba(10,10,10,0.18)",
          transform: onbOpen ? "translateY(0)" : "translateY(105%)",
          visibility: onbOpen ? "visible" : "hidden",
          transition: onbOpen
            ? "transform 360ms cubic-bezier(0.22,1,0.36,1), visibility 0ms"
            : "transform 360ms cubic-bezier(0.22,1,0.36,1), visibility 0ms 360ms",
          padding: "10px 20px 28px",
          maxWidth: 480,
          marginLeft: "auto",
          marginRight: "auto",
        }}>
        {/* Grabber */}
        <div style={{ display: "flex", justifyContent: "center", padding: "6px 0 10px" }}>
          <span style={{ width: 40, height: 4, borderRadius: 9999, background: "#E5E5E5" }}/>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", color: "#0A0A0A" }}>
            {t("auth.start_title")}
          </h2>
          <button type="button" onClick={() => setOnbOpen(false)} aria-label={t("auth.start_close")}
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: "#9CA3AF", padding: "4px 6px",
            }}>{t("auth.start_close")}</button>
        </div>
        <p style={{ margin: "0 0 16px", fontSize: 13.5, fontWeight: 500, color: "#6B7280", letterSpacing: "-0.01em", lineHeight: 1.5 }}>
          {t("auth.start_desc")}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <OnboardCard primary
            href="/join"
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M10 14l-3 3a3.2 3.2 0 11-4.5-4.5l3.5-3.5a3.2 3.2 0 014.5 0M14 10l3-3a3.2 3.2 0 114.5 4.5L18 15a3.2 3.2 0 01-4.5 0" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
            title={t("auth.join_family")}
            subtitle={t("auth.join_family_sub")}
          />
          <OnboardCard
            href="/signup"
            icon={<span style={{ fontSize: 22 }} aria-hidden>&#x1F468;&#x200D;&#x1F469;&#x200D;&#x1F467;&#x200D;&#x1F466;</span>}
            title={t("auth.signup_create_link")}
            subtitle={t("auth.create_family_sub")}
          />
        </div>
      </div>
    </>
  );
}
