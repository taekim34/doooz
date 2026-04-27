"use client";
import { useFormStatus } from "react-dom";

function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M21 12a9 9 0 1 1-6.22-8.56" strokeLinecap="round" />
    </svg>
  );
}

export function SubmitButton({
  children,
  className,
  style,
  pendingLabel,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  pendingLabel?: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className} style={style} aria-busy={pending}>
      <span className="inline-flex items-center justify-center gap-2">
        {pending && <Spinner />}
        <span>{pending && pendingLabel ? pendingLabel : children}</span>
      </span>
    </button>
  );
}
