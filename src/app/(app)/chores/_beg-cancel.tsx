"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/useT";

export function BegCancelButton({ id }: { id: string }) {
  const router = useRouter();
  const t = useT();
  const [loading, setLoading] = useState(false);

  async function cancel() {
    setLoading(true);
    await fetch(`/api/chores/beg/${id}/cancel`, { method: "POST" });
    router.refresh();
    setLoading(false);
  }

  return (
    <Button size="sm" variant="ghost" onClick={cancel} disabled={loading} className="text-xs text-muted-foreground">
      {t("common.cancel")}
    </Button>
  );
}
