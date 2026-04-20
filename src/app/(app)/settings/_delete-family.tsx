"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { t, type Locale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

export function DeleteFamily({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/family/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "DELETE" }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t("settings.delete_error", locale));
        return;
      }
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
    } catch {
      setError(t("settings.delete_error", locale));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--error)",
          letterSpacing: "-0.01em",
          padding: "10px 0",
          textAlign: "left",
          display: "block",
          width: "100%",
        }}
      >
        {t("settings.delete_family", locale)}
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--ink-subtle)",
            marginLeft: 6,
            letterSpacing: "0.02em",
          }}
        >
          ({locale === "ko" ? "관리자만" : locale === "ja" ? "管理者のみ" : "Admin only"})
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("settings.delete_family_confirm_title", locale)}</DialogTitle>
          </DialogHeader>
          <p className="my-2 text-sm font-semibold text-destructive">
            {t("settings.delete_family_warn", locale)}
          </p>
          <ul className="my-3 space-y-1 text-sm text-muted-foreground">
            <li>• {t("settings.delete_family_item1", locale)}</li>
            <li>• {t("settings.delete_family_item2", locale)}</li>
            <li>• {t("settings.delete_family_item3", locale)}</li>
          </ul>
          <label className="mb-1 block text-sm font-medium">
            {t("settings.delete_confirm_input", locale)}
          </label>
          <Input
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="DELETE"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setOpen(false);
                setConfirmation("");
                setError("");
              }}
            >
              {t("common.cancel", locale)}
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={confirmation !== "DELETE" || loading}
              onClick={handleDelete}
            >
              {loading ? "..." : t("settings.delete_confirm_button", locale)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
