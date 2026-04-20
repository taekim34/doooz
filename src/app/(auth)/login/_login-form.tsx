"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useT } from "@/lib/i18n/useT";
const FAMILY_STORAGE_KEY = process.env.NEXT_PUBLIC_FAMILY_STORAGE_KEY || "doooz_family_name";

const inputCls =
  "h-12 w-full rounded-[10px] bg-[color:var(--surface-raised)] border border-[color:var(--border-subtle)] px-4 text-[17px] font-medium text-[color:var(--ink)] outline-none transition-[border-color,background] duration-150";

function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = "var(--ink)";
  e.currentTarget.style.background = "var(--bg)";
}
function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = "var(--border-subtle)";
  e.currentTarget.style.background = "var(--surface-raised)";
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-bold uppercase text-[color:var(--ink-subtle)] tracking-[0.15em]">{label}</span>
      {children}
    </label>
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
      className="flex w-full items-center gap-[14px] px-4 h-[60px] rounded-[14px] no-underline"
      style={{
        background: isPrimary ? "#FF6B7A" : "var(--bg)",
        color: isPrimary ? "var(--on-accent)" : "var(--ink)",
        border: isPrimary ? "none" : "1px solid var(--border)",
        boxShadow: isPrimary
          ? "0 10px 22px -10px rgba(255,107,122,0.5)"
          : "0 1px 2px rgba(10,10,10,0.03)",
        transition: "transform 200ms var(--ease-spring)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <span className="shrink-0 flex h-9 w-9 items-center justify-center rounded-[10px]"
        style={{
          background: isPrimary ? "rgba(255,255,255,0.18)" : "var(--surface-raised)",
          border: isPrimary ? "none" : "1px solid var(--border-subtle)",
        }}>{icon}</span>
      <span className="flex-1 min-w-0 flex flex-col leading-[1.15]">
        <span className="text-[15px] font-bold tracking-[-0.01em]">{title}</span>
        <span className="mt-[3px] text-[12.5px] font-medium"
          style={{ color: isPrimary ? "rgba(255,255,255,0.75)" : "var(--ink-subtle)" }}>{subtitle}</span>
      </span>
      <svg width="8" height="14" viewBox="0 0 8 14" fill="none" className="shrink-0">
        <path d="M1.5 1.5l5 5.5-5 5.5" stroke={isPrimary ? "rgba(255,255,255,0.85)" : "var(--ink-subtle)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
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

  const [loginType, setLoginType] = useState<"family" | "email">(defaultTab);
  const [showPw, setShowPw] = useState(false);
  const [onbOpen, setOnbOpen] = useState(false);

  const familyInputRef = useRef<HTMLInputElement>(null);

  // Restore cached family name
  useEffect(() => {
    if (!familyInputRef.current) return;
    const cached = localStorage.getItem(FAMILY_STORAGE_KEY);
    if (!familyInputRef.current.value && cached) {
      familyInputRef.current.value = cached;
    }
  }, []);

  return (
    <>
      {/* Brand — logo only */}
      <div className="flex justify-center">
        <Image
          src="/login-logo.png"
          alt="DOOOZ"
          width={400}
          height={400}
          priority
          className="block h-auto w-[140px] sm:w-[200px] object-contain"
        />
      </div>

      {/* Form */}
      <div className="mt-5 flex flex-col gap-[14px]">
        {/* Login type segmented control */}
        <div role="tablist" aria-label={t("auth.login_button")} className="relative grid grid-cols-2 p-[3px] rounded-[10px] bg-[color:var(--surface-sunken)] mb-1">
          <span aria-hidden className="absolute top-[3px] bottom-[3px] w-[calc(50%-3px)] rounded-lg bg-[color:var(--bg)]"
            style={{
              left: loginType === "family" ? 3 : "calc(50% + 0px)",
              boxShadow: "0 1px 2px rgba(10,10,10,0.06), 0 0 0 0.5px rgba(10,10,10,0.04)",
              transition: "left 240ms var(--ease-spring)",
            }}/>
          {([
            { v: "family" as const, label: t("auth.family_tab") },
            { v: "email" as const, label: t("auth.email_tab") },
          ]).map(tab => {
            const on = loginType === tab.v;
            return (
              <button key={tab.v} type="button" role="tab" aria-selected={on}
                onClick={() => setLoginType(tab.v)}
                className="relative z-[1] h-9 border-none bg-transparent cursor-pointer text-[13px] tracking-[-0.01em] transition-colors duration-[160ms] whitespace-nowrap"
                style={{
                  fontWeight: on ? 700 : 500,
                  color: on ? "var(--ink)" : "var(--ink-muted)",
                }}>{tab.label}</button>
            );
          })}
        </div>

        {/* Family login form */}
        <form
          action={familyLoginAction}
          className="flex-col gap-[14px]"
          style={{ display: loginType === "family" ? "flex" : "none" }}
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
              className={inputCls}
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
              className={inputCls}
            />
          </Field>
          <Field label={t("auth.password")}>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
                onFocus={handleFocus}
                onBlur={handleBlur}
                className={inputCls} style={{ paddingRight: 48 }}
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? t("auth.password") : t("auth.password")}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-md bg-transparent border-none text-[color:var(--ink-subtle)] cursor-pointer">
                {showPw ? <EyeOffIcon/> : <EyeIcon/>}
              </button>
            </div>
          </Field>
          {defaultTab !== "email" && error && (
            <p className="m-0 text-sm font-medium text-[color:var(--error)]">{error}</p>
          )}
          <button type="submit"
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
            className="mt-[6px] h-12 w-full rounded-[10px] text-[15px] font-semibold text-[color:var(--on-accent)] bg-[color:var(--ink)] border-none cursor-pointer tracking-[-0.01em]"
            style={{
              boxShadow: "var(--shadow-card-parent)",
              transition: "transform 200ms var(--ease-spring)",
            }}>{t("auth.login_button")}</button>
        </form>

        {/* Email login form */}
        <form
          action={emailLoginAction}
          className="flex-col gap-[14px]"
          style={{ display: loginType === "email" ? "flex" : "none" }}
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
              className={inputCls}
            />
          </Field>
          <Field label={t("auth.password")}>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
                onFocus={handleFocus}
                onBlur={handleBlur}
                className={inputCls} style={{ paddingRight: 48 }}
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? t("auth.password") : t("auth.password")}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-md bg-transparent border-none text-[color:var(--ink-subtle)] cursor-pointer">
                {showPw ? <EyeOffIcon/> : <EyeIcon/>}
              </button>
            </div>
          </Field>
          {defaultTab === "email" && error && (
            <p className="m-0 text-sm font-medium text-[color:var(--error)]">{error}</p>
          )}
          <button type="submit"
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
            className="mt-[6px] h-12 w-full rounded-[10px] text-[15px] font-semibold text-[color:var(--on-accent)] bg-[color:var(--ink)] border-none cursor-pointer tracking-[-0.01em]"
            style={{
              boxShadow: "var(--shadow-card-parent)",
              transition: "transform 200ms var(--ease-spring)",
            }}>{t("auth.login_button")}</button>
        </form>
      </div>

      {/* Forgot password */}
      <div className="mt-4 flex items-center justify-center">
        <Link href="/login?forgot=1" className="bg-transparent border-none text-sm font-medium text-[color:var(--accent)] p-0 whitespace-nowrap no-underline">{t("auth.forgot_password")}</Link>
      </div>

      {/* Onboarding trigger */}
      <div className="mt-3 flex flex-col items-center">
        <button type="button" onClick={() => setOnbOpen(true)}
          aria-expanded={onbOpen} aria-haspopup="dialog"
          className="flex items-center justify-center gap-1 py-2 px-3 bg-transparent border-none cursor-pointer text-sm font-semibold text-[color:var(--ink-muted)]">
          <span className="whitespace-nowrap">{t("auth.first_time")}</span>
          <span className="whitespace-nowrap" style={{ color: "var(--ink)", textDecoration: "underline", textUnderlineOffset: 3, textDecorationThickness: 1 }}>
            {t("auth.start_trigger")}
          </span>
        </button>
      </div>

      <div className="flex-1"/>

      {/* Bottom sheet backdrop */}
      <div
        aria-hidden={!onbOpen}
        onClick={() => setOnbOpen(false)}
        className="fixed inset-0 z-50"
        style={{
          background: onbOpen ? "rgba(10,10,10,0.32)" : "rgba(10,10,10,0)",
          pointerEvents: onbOpen ? "auto" : "none",
          transition: "background 240ms var(--ease-spring)",
        }}
      />

      {/* Bottom sheet */}
      <div role="dialog" aria-modal="true" aria-label={t("auth.start_title")}
        className="fixed left-0 right-0 bottom-0 z-[51] rounded-t-3xl bg-[color:var(--bg)] px-5 pt-[10px] pb-7 max-w-[480px] mx-auto"
        style={{
          boxShadow: "0 -20px 40px -12px rgba(10,10,10,0.18)",
          transform: onbOpen ? "translateY(0)" : "translateY(105%)",
          visibility: onbOpen ? "visible" : "hidden",
          transition: onbOpen
            ? "transform 360ms cubic-bezier(0.22,1,0.36,1), visibility 0ms"
            : "transform 360ms cubic-bezier(0.22,1,0.36,1), visibility 0ms 360ms",
        }}>
        {/* Grabber */}
        <div className="flex justify-center py-[6px] pb-[10px]">
          <span className="w-10 h-1 rounded-full bg-[color:var(--border)]"/>
        </div>
        <div className="flex items-baseline justify-between mb-[14px]">
          <h2 className="m-0 text-[19px] font-extrabold tracking-[-0.02em] text-[color:var(--ink)]">
            {t("auth.start_title")}
          </h2>
          <button type="button" onClick={() => setOnbOpen(false)} aria-label={t("auth.start_close")}
            className="bg-transparent border-none cursor-pointer text-[13px] font-semibold text-[color:var(--ink-subtle)] py-1 px-[6px]">{t("auth.start_close")}</button>
        </div>
        <p className="m-0 mb-4 text-[13.5px] font-medium text-[color:var(--ink-muted)] tracking-[-0.01em] leading-[1.5]">
          {t("auth.start_desc")}
        </p>
        <div className="flex flex-col gap-[10px]">
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
