import Link from "next/link";
import { BackButton, SectionLabel } from "@/components/atoms";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { t, type Locale } from "@/lib/i18n";
import { RewardManageInput } from "./_input";

import { emojiForTitle } from "@/features/rewards/emoji";

async function createAction(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const { data: me } = await supabase
    .from("users")
    .select("family_id, role")
    .eq("id", authUser.id)
    .single();
  if (!me || me.role !== "parent") redirect("/rewards");

  await supabase.from("rewards").insert({
    family_id: me.family_id,
    title: String(formData.get("title") || ""),
    cost: Number(formData.get("cost") || 100),
    active: true,
    created_by: authUser.id,
  });
  revalidatePath("/rewards/manage");
}

async function deleteAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "");
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");
  const { data: me } = await supabase
    .from("users")
    .select("role")
    .eq("id", authUser.id)
    .single();
  if (!me || me.role !== "parent") redirect("/rewards");
  await supabase.from("rewards").update({ active: false }).eq("id", id);
  revalidatePath("/rewards/manage");
}

export default async function RewardsManagePage() {
  const { user, family } = await requireUser();
  const locale = (family.locale || "ko") as Locale;
  if (user.role !== "parent") redirect("/rewards");
  const supabase = await createClient();
  const { data } = await supabase
    .from("rewards")
    .select("id, title, cost")
    .eq("family_id", family.id)
    .eq("active", true)
    .order("cost");
  const list = (data ?? []) as Array<{
    id: string;
    title: string;
    cost: number;
  }>;


  return (
    <div
      className="mx-auto max-w-2xl"
      style={{        background: "var(--bg)",
        color: "var(--ink)",
        padding: "12px 20px 28px",
      }}
    >
      <div
        style={{
          marginBottom: 4,
          display: "flex",
          alignItems: "center",
          marginLeft: -8,
        }}
      >
        <BackButton href="/rewards" />
      </div>

      <h1
        style={{
          margin: "0 0 6px",
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: "var(--ink)",
        }}
      >
        {t("rewards.manage_title", locale)}
      </h1>
      <p
        style={{
          margin: "0 0 24px",
          fontSize: 14,
          fontWeight: 500,
          color: "var(--ink-subtle)",
          letterSpacing: "-0.01em",
          lineHeight: 1.45,
        }}
      >
        {t("rewards.manage_subtitle", locale)}
      </p>

      {/* Create form */}
      <div style={{ marginBottom: 10 }}>
        <SectionLabel as="span">{t("rewards.create_form_label", locale)}</SectionLabel>
      </div>

      <form action={createAction}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <RewardManageInput
            type="text"
            name="title"
            placeholder={t("rewards.title_placeholder_short", locale)}
            required
            maxLength={40}
            style={{
              flex: "1.6 1 0",
              minWidth: 0,
            }}
          />
          <RewardManageInput
            type="number"
            name="cost"
            placeholder={t("rewards.cost_placeholder", locale)}
            defaultValue={100}
            min={1}
            max={500000}
            required
            inputMode="numeric"
            style={{
              flex: "1 1 0",
              minWidth: 0,
              fontFeatureSettings: '"tnum" 1',
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            width: "100%",
            height: 48,
            borderRadius: 10,
            border: "none",
            background: "var(--ink)",
            color: "var(--on-accent)",
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            cursor: "pointer",
            transition:
              "transform 180ms cubic-bezier(0.16,1,0.3,1), background 180ms ease",
          }}
        >
          {t("rewards.add", locale)}
        </button>
      </form>

      {/* Divider */}
      <div
        style={{ height: 1, background: "var(--surface-sunken)", margin: "26px 0 18px" }}
      />

      {/* List */}
      <div style={{ marginBottom: 10 }}>
        <SectionLabel as="span">
          {t("rewards.list", locale)} · {list.length}
        </SectionLabel>
      </div>

      {list.length === 0 ? (
        <div
          className="text-center"
          style={{
            padding: "28px 16px",
            borderRadius: 14,
            background: "var(--surface-raised)",
            color: "var(--ink-subtle)",
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: "-0.01em",
          }}
        >
          {t("rewards.manage_empty", locale)}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {list.map((r) => (
            <div
              key={r.id}
              className="flex items-center"
              style={{
                gap: 12,
                padding: 16,
                borderRadius: 14,
                background: "var(--surface-raised)",
              }}
            >
              <span
                aria-hidden
                style={{ fontSize: 32, lineHeight: 1, flexShrink: 0 }}
              >
                {emojiForTitle(r.title)}
              </span>
              <div
                className="flex min-w-0 flex-1 flex-col"
                style={{ gap: 2 }}
              >
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--ink)",
                    letterSpacing: "-0.01em",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.title}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--ink)",
                    fontFeatureSettings: '"tnum" 1',
                    letterSpacing: "-0.01em",
                  }}
                >
                  {r.cost.toLocaleString()} pt
                </div>
              </div>
              <form action={deleteAction}>
                <input type="hidden" name="id" value={r.id} />
                <button
                  type="submit"
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--error)",
                    letterSpacing: "-0.01em",
                    padding: "8px 4px",
                    flexShrink: 0,
                  }}
                >
                  {t("rewards.delete", locale)}
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
