import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import { getAuthLocale } from "@/lib/i18n/auth-locale";
import Link from "next/link";
import type { Route } from "next";
import { CopyButton } from "./_copy-button";

export default async function OnboardingFinishPage() {
  const locale = await getAuthLocale();
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const { data: user } = await supabase
    .from("users")
    .select("character_id, family_id")
    .eq("id", authUser.id)
    .single();

  if (!user?.family_id) redirect("/onboarding/create-family");

  const { data: family } = await supabase
    .from("families")
    .select("name, invite_code")
    .eq("id", user.family_id)
    .single();

  if (!family) redirect("/");

  const inviteCode = family.invite_code ?? "---";

  return (
    <div className="relative min-h-[100dvh] bg-[color:var(--bg)] px-7 pt-16 pb-8 flex flex-col items-center overflow-hidden">

      {/* Decorative blob – large radial */}
      <div
        aria-hidden="true"
        className="absolute -top-[180px] left-1/2 -translate-x-1/2 w-[520px] h-[520px] opacity-75 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(closest-side, #FFE4E9 0%, #FFF5EC 45%, rgba(255,245,236,0) 72%)",
        }}
      />

      {/* Decorative blob – small glow */}
      <div
        aria-hidden="true"
        className="absolute -top-10 left-1/2 -translate-x-1/2 w-[220px] h-[220px] opacity-50 rounded-full pointer-events-none"
        style={{
          filter: "blur(24px)",
          background:
            "radial-gradient(closest-side, #FFB4C6 0%, transparent 70%)",
        }}
      />

      {/* Content */}
      <div className="relative z-[1] flex flex-col items-center w-full max-w-[400px]">

        {/* Check icon */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: "var(--accent-gradient)",
            boxShadow:
              "0 8px 20px -6px rgba(255,107,157,0.45), inset 0 1px 0 rgba(255,255,255,0.45)",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* Step label */}
        <p className="mt-5 text-xs font-bold uppercase text-[color:var(--accent)] tracking-[0.15em]">
          STEP 3 of 3 {t("auth.setup_complete", locale)}
        </p>

        {/* Title */}
        <h1 className="mt-3 text-[40px] font-extrabold leading-[1.15] tracking-[-0.03em] text-[color:var(--ink)] text-center whitespace-pre-line">
          {t("auth.family_created", locale)}
        </h1>

        {/* Description */}
        <p className="mt-3 text-[17px] font-medium text-[color:var(--ink-muted)] text-center leading-[1.5]">
          <span className="font-bold text-[color:var(--ink)]">
            {family.name}
          </span>{" "}
          {t("auth.invite_family_desc", locale)}
        </p>

        {/* Invite code section */}
        <div className="mt-8 w-full flex flex-col items-center">
          {/* Invite code label */}
          <p className="text-xs font-bold uppercase text-[color:var(--ink-subtle)] tracking-[0.15em] mb-3">
            {t("auth.invite_code_label", locale)}
          </p>

          {/* Code box */}
          <div className="w-full rounded-[14px] py-4 px-5 bg-[color:var(--surface-raised)] border-[1.5px] border-dashed border-[color:var(--border)] flex items-center justify-between">
            <span className="text-2xl font-extrabold tracking-[0.08em] text-[#FF6B9D]" style={{ fontVariantNumeric: "tabular-nums" }}>
              {inviteCode}
            </span>

            <CopyButton
              code={inviteCode}
              copyLabel={t("family.copy", locale)}
              copiedLabel={t("family.copied", locale)}
            />
          </div>
        </div>

        {/* CTA section */}
        <div className="mt-8 w-full flex flex-col gap-3 items-center">
          {/* Primary CTA — create child account (per mockup) */}
          <Link
            href={"/signup" as Route}
            className="w-full h-14 rounded-[10px] bg-[color:var(--bg)] border border-[color:var(--border)] text-[color:var(--ink)] text-base font-bold flex items-center justify-center gap-2 no-underline cursor-pointer"
          >
            <span>{t("auth.create_child_account", locale)}</span>
            <span className="text-[color:var(--ink-subtle)]">→</span>
          </Link>

          {/* Secondary CTA — Kakao invite */}
          <a
            href={`https://sharer.kakao.com/talk/friends/picker/shorturl?url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/join?code=${inviteCode}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-12 rounded-[10px] bg-[color:var(--bg)] border border-[color:var(--border)] text-[color:var(--ink)] text-[15px] font-bold flex items-center justify-center gap-2 no-underline cursor-pointer"
          >
            💬 카카오톡으로 초대
          </a>

          {/* Skip link */}
          <Link
            href={"/" as Route}
            className="mt-2 text-[13px] font-medium text-[color:var(--ink-subtle)] underline"
            style={{ textUnderlineOffset: 4 }}
          >
            {t("auth.skip_for_now", locale)} →
          </Link>
        </div>
      </div>
    </div>
  );
}
