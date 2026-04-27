"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
      const res = await fetch("/api/tasks/beg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      if (res.ok) {
        setTitle("");
        router.refresh();
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
