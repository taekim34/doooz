import Link from "next/link";
import { BackButton, SectionLabel } from "@/components/atoms";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { t, type Locale } from "@/lib/i18n";
import { RewardManageInput } from "./_input";
import { SubmitButton } from "@/components/ui/submit-button";

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
    <div className="mx-auto max-w-2xl bg-[color:var(--bg)] text-[color:var(--ink)] px-5 pt-3 pb-7">
      <div className="mb-1 flex items-center -ml-2">

        <BackButton href="/rewards" />
      </div>

      <h1 className="mb-1.5 text-2xl font-extrabold tracking-tight text-[color:var(--ink)]">
        {t("rewards.manage_title", locale)}
      </h1>
      <p className="mb-6 text-sm font-medium text-[color:var(--ink-subtle)] tracking-[-0.01em] leading-[1.45]">
        {t("rewards.manage_subtitle", locale)}
      </p>

      {/* Create form */}
      <div className="mb-2.5">
        <SectionLabel as="span">{t("rewards.create_form_label", locale)}</SectionLabel>
      </div>

      <form action={createAction}>
        <div className="flex gap-2 mb-2.5">
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
        <SubmitButton
          className="w-full h-12 rounded-[10px] border-none bg-[color:var(--ink)] text-[color:var(--on-accent)] text-[15px] font-bold tracking-[-0.01em] cursor-pointer"
          style={{
            transition:
              "transform 180ms var(--ease-spring), background 180ms ease",
          }}
        >
          {t("rewards.add", locale)}
        </SubmitButton>
      </form>

      {/* Divider */}
      <div className="h-px bg-[color:var(--surface-sunken)] my-5 mt-6" />

      {/* List */}
      <div className="mb-2.5">
        <SectionLabel as="span">
          {t("rewards.list", locale)} · {list.length}
        </SectionLabel>
      </div>

      {list.length === 0 ? (
        <div className="text-center px-4 py-7 rounded-[14px] bg-[color:var(--surface-raised)] text-[color:var(--ink-subtle)] text-[13px] font-medium tracking-[-0.01em]">

          {t("rewards.manage_empty", locale)}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 p-4 rounded-[14px] bg-[color:var(--surface-raised)]"
            >
              <span
                aria-hidden
                className="text-[32px] leading-none shrink-0"
              >
                {emojiForTitle(r.title)}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="text-[15px] font-semibold text-[color:var(--ink)] tracking-[-0.01em] truncate">
                  {r.title}
                </div>
                <div className="text-sm font-bold text-[color:var(--ink)] tracking-[-0.01em]" style={{ fontFeatureSettings: '"tnum" 1' }}>
                  {r.cost.toLocaleString()} pt
                </div>
              </div>
              <form action={deleteAction}>
                <input type="hidden" name="id" value={r.id} />
                <SubmitButton className="border-none bg-transparent cursor-pointer text-[13px] font-medium text-[color:var(--error)] tracking-[-0.01em] px-1 py-2 shrink-0">
                  {t("rewards.delete", locale)}
                </SubmitButton>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
