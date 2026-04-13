import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { t, type Locale } from "@/lib/i18n";

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
  const list = (data ?? []) as Array<{ id: string; title: string; cost: number }>;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <BackButton fallback="/rewards" />
      <h1 className="text-2xl font-bold">{t("rewards.manage_title", locale)}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t("rewards.new_reward", locale)}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createAction} className="grid gap-3 sm:grid-cols-2">
            <Input name="title" placeholder={t("rewards.title_placeholder", locale)} required />
            <div className="relative">
              <Input
                type="number"
                name="cost"
                placeholder={t("rewards.cost_placeholder", locale)}
                defaultValue={100}
                min={1}
                max={500000}
                required
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">pt</span>
            </div>
            <Button type="submit" className="w-full sm:col-span-2">
              {t("rewards.add", locale)}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("rewards.list", locale)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {list.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded border p-2 text-sm">
              <div>
                {r.title} · {r.cost.toLocaleString()}pt
              </div>
              <form action={deleteAction}>
                <input type="hidden" name="id" value={r.id} />
                <Button type="submit" variant="destructive" size="sm">
                  {t("rewards.delete", locale)}
                </Button>
              </form>
            </div>
          ))}
          {list.length === 0 && <p className="text-sm text-muted-foreground">{t("rewards.none", locale)}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
