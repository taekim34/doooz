"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { t, type Locale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

export function DeleteAccount({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/user/delete", {
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
        className="block w-full cursor-pointer border-none bg-transparent py-2.5 text-left text-sm font-semibold tracking-[-0.01em] text-[color:var(--error)]"
      >
        {t("settings.delete_account", locale)}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("settings.delete_account_confirm_title", locale)}</DialogTitle>
          </DialogHeader>
          <ul className="my-3 space-y-1 text-sm text-muted-foreground">
            <li>• {t("settings.delete_account_warn1", locale)}</li>
            <li>• {t("settings.delete_account_warn2", locale)}</li>
            <li>• {t("settings.delete_account_warn3", locale)}</li>
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
