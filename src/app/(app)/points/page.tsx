import { requireUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { t, type Locale } from "@/lib/i18n";
import Link from "next/link";

export default async function PointsPage() {
  const { user, family } = await requireUser();
  const locale = (family.locale || "ko") as Locale;
  const supabase = await createClient();

  const { data: txs } = await supabase
    .from("point_transactions")
    .select("id, amount, reason, kind, created_at, user_id")
    .eq(user.role === "child" ? "user_id" : "family_id", user.role === "child" ? user.id : family.id)
    .order("created_at", { ascending: false })
    .limit(30);

  const { data: members } =
    user.role === "parent"
      ? await supabase
          .from("users")
          .select("id, display_name, current_balance, role")
          .eq("family_id", family.id)
          .eq("role", "child")
          .order("display_name")
      : { data: null };

  type Tx = { id: string; amount: number; reason: string; kind: string; created_at: string; user_id: string };
  const txList = (txs ?? []) as Tx[];
  const kidList = (members ?? []) as Array<{ id: string; display_name: string; current_balance: number }>;
  const nameMap = new Map(kidList.map((k) => [k.id, k.display_name]));

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("points.current", locale)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-5xl font-bold">{user.current_balance.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">{t("points.lifetime", locale)}: {user.lifetime_earned.toLocaleString()}</div>
        </CardContent>
      </Card>

      {user.role === "parent" && members && (
        <Card>
          <CardHeader>
            <CardTitle>{t("points.family_balance", locale)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {(members as Array<{ id: string; display_name: string; current_balance: number }>).map((m) => (
              <div key={m.id} className="flex justify-between">
                <span>{m.display_name}</span>
                <span>{m.current_balance.toLocaleString()}pt</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {user.role === "parent" ? (
        // Parent view: grouped by child
        kidList.map((kid) => {
          const kidTxs = txList.filter((tx) => tx.user_id === kid.id).slice(0, 10);
          return (
            <Card key={kid.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{kid.display_name}</span>
                  <Link
                    href={`/points/history?child=${kid.id}` as never}
                    className="text-sm font-normal text-primary underline"
                  >
                    {t("points.all", locale)}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {kidTxs.map((tx) => (
                  <div key={tx.id} className="flex justify-between border-b py-1 last:border-0">
                    <span>
                      <span className="text-muted-foreground">{tx.created_at.slice(5, 10)}</span>{" "}
                      {tx.reason}
                    </span>
                    <span className={tx.amount >= 0 ? "text-green-600" : "text-red-600"}>
                      {tx.amount >= 0 ? "+" : ""}{tx.amount}
                    </span>
                  </div>
                ))}
                {kidTxs.length === 0 && <p className="text-muted-foreground">{t("points.no_history", locale)}</p>}
              </CardContent>
            </Card>
          );
        })
      ) : (
        // Child view: own history
        <Card>
          <CardHeader>
            <CardTitle>
              {t("points.recent", locale)}{" "}
              <Link href="/points/history" className="text-sm text-primary underline">
                {t("points.all", locale)}
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {txList.map((tx) => (
              <div key={tx.id} className="flex justify-between border-b py-1 last:border-0">
                <span>
                  <span className="text-muted-foreground">{tx.created_at.slice(5, 10)}</span>{" "}
                  {tx.reason}
                </span>
                <span className={tx.amount >= 0 ? "text-green-600" : "text-red-600"}>
                  {tx.amount >= 0 ? "+" : ""}{tx.amount}
                </span>
              </div>
            ))}
            {txList.length === 0 && <p className="text-muted-foreground">{t("points.no_history", locale)}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
