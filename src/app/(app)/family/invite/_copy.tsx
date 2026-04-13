"use client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useT } from "@/lib/i18n/useT";

export function CopyButton({ code }: { code: string }) {
  const t = useT();
  return (
    <Button
      variant="outline"
      onClick={() => {
        navigator.clipboard.writeText(code);
        toast.success(t("family.copied"));
      }}
    >
      {t("family.copy")}
    </Button>
  );
}
