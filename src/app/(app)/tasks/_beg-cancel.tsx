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
    await fetch(`/api/tasks/beg/${id}/cancel`, { method: "POST" });
    router.refresh();
    setLoading(false);
  }

  return (
    <Button size="sm" variant="outline" onClick={cancel} disabled={loading} className="text-xs border-red-300 text-red-600 hover:bg-red-50">
      {t("common.cancel")}
    </Button>
  );
}
