"use client";

import { useActionState } from "react";
import { SectionLabel } from "@/components/atoms";
import { TIMEZONES } from "@/lib/timezones";
import { useT } from "@/lib/i18n/useT";
import type { Locale } from "@/lib/i18n";
import { FamilyLocaleSelect } from "./_locale-select";
import { SubmitButton } from "@/components/ui/submit-button";
import { createFamilyAction, type CreateFamilyState } from "./actions";

const inputCls =
  "h-12 w-full rounded-[10px] bg-[color:var(--surface-raised)] border border-[color:var(--border-subtle)] px-4 text-[17px] font-medium text-[color:var(--ink)] outline-none transition-[border-color,background] duration-150";

const hintCls = "text-[11px] font-medium text-[color:var(--ink-placeholder)] tracking-[0.02em]";

const selectCls =
  `${inputCls} appearance-none pr-11 cursor-pointer bg-[length:12px_8px] bg-[position:right_16px_center] bg-no-repeat bg-[url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1.5 1.5l4.5 5 4.5-5' stroke='%239CA3AF' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")]`;

const tzLabelKey: Record<string, "label" | "labelJa" | "labelEn"> = {
  ko: "label",
  ja: "labelJa",
  en: "labelEn",
};

export function CreateFamilyForm({ locale }: { locale: Locale }) {
  const t = useT();
  const [state, formAction] = useActionState<CreateFamilyState, FormData>(
    createFamilyAction,
    null,
  );
  const tzKey = tzLabelKey[locale] ?? "label";
  const v = state?.values;

  const errorMsg = state?.errorCode === "required_missing"
    ? t("auth.error_required_missing")
    : state?.errorCode === "family_create_failed"
    ? t("auth.error_family_create_failed")
    : null;

  return (
    <form action={formAction} className="mt-7 flex flex-col gap-[14px]">
      <label className="flex flex-col gap-2">
        <SectionLabel as="span">{t("auth.family_name_label")}</SectionLabel>
        <input
          type="text"
          name="name"
          autoComplete="organization"
          placeholder={t("auth.family_name_placeholder")}
          defaultValue={v?.name || ""}
          required
          maxLength={40}
          className={inputCls}
        />
      </label>

      <label className="flex flex-col gap-2">
        <SectionLabel as="span">{t("auth.my_name_label")}</SectionLabel>
        <input
          type="text"
          name="display_name"
          autoComplete="name"
          placeholder={t("auth.my_name_placeholder")}
          defaultValue={v?.display_name || ""}
          required
          maxLength={20}
          className={inputCls}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="flex items-baseline gap-2">
          <SectionLabel as="span">{t("auth.invite_code_label")}</SectionLabel>
          <span className={hintCls}>{t("auth.invite_code_optional")}</span>
        </span>
        <input
          type="text"
          name="invite_code"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          placeholder={t("auth.invite_code_example")}
          defaultValue={v?.invite_code || ""}
          maxLength={20}
          className={`${inputCls} uppercase tracking-[0.12em]`}
          style={{ fontFeatureSettings: '"tnum" 1' }}
        />
        {state?.errorCode === "invite_code_min" && (
          <p className="m-0 text-[12px] font-medium text-[color:var(--error)]">
            {t("auth.error_invite_code_min")}
          </p>
        )}
      </label>

      <label className="flex flex-col gap-2">
        <span className="flex items-baseline gap-2">
          <SectionLabel as="span">{t("auth.timezone_label")}</SectionLabel>
          <span className={hintCls}>{t("auth.timezone_hint")}</span>
        </span>
        <select name="timezone" defaultValue={v?.timezone || "Asia/Seoul"} className={selectCls}>
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz[tzKey]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2">
        <SectionLabel as="span">{t("settings.language")}</SectionLabel>
        <FamilyLocaleSelect value={locale} className={selectCls} />
      </label>

      {errorMsg && (
        <div className="text-[color:var(--error)] text-sm text-center mt-1">
          {errorMsg}
        </div>
      )}

      <SubmitButton
        className="mt-[10px] h-12 w-full rounded-[10px] text-[15px] font-bold text-[color:var(--on-accent)] bg-[color:var(--ink)] border-none cursor-pointer tracking-[-0.01em] disabled:opacity-70"
        style={{ boxShadow: "0 1px 2px rgba(10,10,10,0.04), 0 12px 28px -16px rgba(10,10,10,0.4)" }}
      >
        {t("auth.create_family")}
      </SubmitButton>
    </form>
  );
}
