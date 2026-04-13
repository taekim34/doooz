"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n/useT";

export function BegActions({ id }: { id: string }) {
  const router = useRouter();
  const t = useT();
  const [points, setPoints] = useState("");
  const [loading, setLoading] = useState(false);

  async function approve() {
    const pts = Number(points);
    if (!pts || pts < 1) return;
    setLoading(true);
    await fetch(`/api/tasks/beg/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points: pts }),
    });
    router.refresh();
    setLoading(false);
  }

  async function reject() {
    setLoading(true);
    await fetch(`/api/tasks/beg/${id}/reject`, { method: "POST" });
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-1">
      <div className="relative">
        <Input
          type="number"
          min={1}
          max={10000}
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          placeholder={t("tasks.points_label")}
          className="w-24 pr-7 text-sm"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">pt</span>
      </div>
      <Button size="sm" onClick={approve} disabled={loading || !points}>
        {t("common.approve")}
      </Button>
      <Button size="sm" variant="outline" onClick={reject} disabled={loading}>
        {t("common.reject")}
      </Button>
    </div>
  );
}
