import { requireUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { t, type Locale } from "@/lib/i18n";
import Link from "next/link";
import type { Route } from "next";
import { BackButton } from "@/components/ui/back-button";

const PAGE_SIZE = 50;

export default async function PointsHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ before?: string; child?: string }>;
}) {
  const sp = await searchParams;
  const { user, family } = await requireUser();
  const locale = ((family as unknown as Record<string, unknown>).locale as string || "ko") as Locale;
  const supabase = await createClient();

  // Parents may filter by child. Children see only their own.
  const { data: kids } =
    user.role === "parent"
      ? await supabase
          .from("users")
          .select("id, display_name")
          .eq("family_id", family.id)
          .eq("role", "child")
          .order("display_name")
      : { data: null };
  const kidList = ((kids ?? []) as Array<{ id: string; display_name: string }>);

  const selectedChild = user.role === "parent" ? (sp.child ?? "") : user.id;

  let q = supabase
    .from("point_transactions")
    .select("id, amount, reason, kind, created_at, user_id")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (user.role === "child") {
    q = q.eq("user_id", user.id);
  } else if (selectedChild) {
    q = q.eq("user_id", selectedChild);
  } else {
    q = q.eq("family_id", family.id);
  }

  if (sp.before) q = q.lt("created_at", sp.before);

  const { data } = await q;
  const rows = (data ?? []) as Array<{
    id: string;
    amount: number;
    reason: string;
    kind: string;
    created_at: string;
    user_id: string;
  }>;
  const last = rows[rows.length - 1];

  const nameMap = new Map(kidList.map((k) => [k.id, k.display_name]));

  function buildQuery(before?: string) {
    const p = new URLSearchParams();
    if (selectedChild) p.set("child", selectedChild);
    if (before) p.set("before", before);
    const s = p.toString();
    return s ? `?${s}` : "";
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <BackButton fallback="/points" />
      <h1 className="text-2xl font-bold">{t("points.title", locale)}</h1>

      {user.role === "parent" && (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-2 p-3 text-sm">
            <span className="text-muted-foreground">{t("points.filter", locale)}</span>
            <Link
              href={"/points/history" as Route}
              className={`rounded-full border px-3 py-1 ${
                !selectedChild ? "bg-primary text-primary-foreground" : ""
              }`}
            >
              {t("points.all", locale)}
            </Link>
            {kidList.map((k) => (
              <Link
                key={k.id}
                href={(`/points/history?child=${k.id}`) as Route}
                className={`rounded-full border px-3 py-1 ${
                  selectedChild === k.id ? "bg-primary text-primary-foreground" : ""
                }`}
              >
                {k.display_name}
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("points.detail", locale)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {rows.map((tx) => {
            const isPenalty = tx.kind === "penalty";
            const isAdjustment = tx.kind === "adjustment";
            const label =
              (isPenalty ? t("points.missed_chore", locale) + " · " : "") +
              (isAdjustment ? t("points.adjustment", locale) + " · " : "") +
              tx.reason;
            const amountClass = isPenalty
              ? "text-red-600 font-semibold"
              : tx.amount >= 0
                ? "text-green-600"
                : "text-red-600";
            return (
              <div
                key={tx.id}
                className="flex justify-between gap-2 border-b py-1 last:border-0"
              >
                <span>
                  <span className="text-muted-foreground">
                    {tx.created_at.slice(0, 10)}
                  </span>{" "}
                  {user.role === "parent" && !selectedChild && nameMap.get(tx.user_id) && (
                    <span className="text-xs text-muted-foreground">
                      [{nameMap.get(tx.user_id)}]{" "}
                    </span>
                  )}
                  {label}
                </span>
                <span className={amountClass}>
                  {tx.amount >= 0 ? "+" : ""}
                  {tx.amount}
                </span>
              </div>
            );
          })}
          {rows.length === 0 && <p className="text-muted-foreground">{t("points.no_history", locale)}</p>}
        </CardContent>
      </Card>

      {rows.length === PAGE_SIZE && last && (
        <Link
          href={(`/points/history${buildQuery(last.created_at)}`) as Route}
          className="block text-center text-sm text-primary underline"
        >
          {t("points.more", locale)}
        </Link>
      )}
    </div>
  );
}
