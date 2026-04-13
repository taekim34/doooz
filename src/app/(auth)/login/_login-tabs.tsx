"use client";
import { useState, type ReactNode } from "react";
import { useT } from "@/lib/i18n/useT";

export function LoginTabs({
  defaultTab = "family",
  children,
}: {
  defaultTab?: "family" | "email";
  children: ReactNode;
}) {
  const [tab, setTab] = useState<"family" | "email">(defaultTab);
  const t = useT();

  // children are two <form> elements with data-tab="family" and data-tab="email"
  const forms = Array.isArray(children) ? children : [children];

  return (
    <div>
      <div className="mb-4 flex rounded-lg border bg-muted p-1">
        <button
          type="button"
          onClick={() => setTab("family")}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            tab === "family" ? "bg-background shadow-sm" : "text-muted-foreground"
          }`}
        >
          {t("auth.family_tab")}
        </button>
        <button
          type="button"
          onClick={() => setTab("email")}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            tab === "email" ? "bg-background shadow-sm" : "text-muted-foreground"
          }`}
        >
          {t("auth.email_tab")}
        </button>
      </div>
      {forms.map((form, i) => {
        const formTab = (form as React.ReactElement<{ "data-tab": string }>)?.props?.["data-tab"];
        return (
          <div key={i} className={formTab === tab ? "" : "hidden"}>
            {form}
          </div>
        );
      })}
    </div>
  );
}
