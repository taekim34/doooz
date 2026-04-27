"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/useT";

export function BegForm() {
  const router = useRouter();
  const t = useT();
  const [title, setTitle] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || pending) return;
    startTransition(async () => {
      try {
        const res = await fetch("/api/tasks/beg", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: title.trim() }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          toast.error(j.error || t("tasks.error_network"));
          return;
        }
        setTitle("");
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message || t("tasks.error_network"));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t("tasks.beg_placeholder")}
        maxLength={80}
        required
        disabled={pending}
      />
      <Button type="submit" disabled={pending} size="sm" aria-busy={pending}>
        {t("tasks.beg_request")}
      </Button>
    </form>
  );
}
