import { redirect } from "next/navigation";
import Link from "next/link";
import { BackButton } from "@/components/atoms";
import { requireUser } from "@/features/auth/current-user";
import { CopyButton } from "./_copy";
import { t, type Locale } from "@/lib/i18n";

export default async function InvitePage() {
  const { user, family } = await requireUser();
  const locale = (family.locale || "ko") as Locale;
  if (user.role !== "parent") redirect("/family");

  return (
    <div className="relative flex min-h-screen flex-col bg-[color:var(--bg)] text-[color:var(--ink)]">
      {/* Top bar */}
      <div className="grid grid-cols-[36px_1fr_36px] items-center px-5 pt-3 pb-2">
        <BackButton href="/family" />
        <div className="whitespace-nowrap text-center text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--ink-subtle)]">
          {t("family.invite_title", locale)}
        </div>
        <div />
      </div>

      {/* Body */}
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-[18px] px-5 pt-5 pb-6">
        <div className="mx-0 my-1 text-center text-sm font-medium leading-normal tracking-[-0.01em] text-[color:var(--ink-subtle)]">
          {t("family.invite_desc", locale)}
        </div>

        {/* Dashed code card */}
        <CopyButton
          code={family.invite_code}
          copyLabel={t("family.copy", locale)}
          copiedLabel={t("family.copied", locale)}
        />

        <div className="flex-1" />

        {/* Kakao CTA */}
        <a
          href={`https://sharer.kakao.com/talk/friends/picker/shorturl?url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/join?code=${family.invite_code}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] border-none bg-[color:var(--ink)] text-base font-bold tracking-[-0.01em] text-[color:var(--on-accent)] no-underline"
        >
          <span aria-hidden>💬</span>
          {t("family.invite_kakao", locale)}
        </a>

        {/* Back link */}
        <Link
          href={"/family" as never}
          className="py-1 text-center text-sm font-medium tracking-[-0.01em] text-[color:var(--accent)] no-underline"
        >
          {t("common.back", locale)}
        </Link>
      </div>
    </div>
  );
}
