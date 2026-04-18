"use client";
import { ApprovalRow } from "@/components/ui/approval-row";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { now } from "@/lib/datetime/clock";

type Approval = {
  id: string;
  kidName: string;
  taskTitle: string;
  points: number;
  createdAt: string;
};

export function ApprovalList({
  approvals,
}: {
  approvals: Approval[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function timeAgo(iso: string): string {
    const mins = Math.round((now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return "방금";
    if (mins < 60) return `${mins}분 전`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}시간 전`;
    return `${Math.round(hrs / 24)}일 전`;
  }

  async function handleAction(id: string, action: "approve" | "reject") {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/tasks/beg/${id}/${action}`, {
          method: "POST",
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          toast.error(j.error || "Failed");
          return;
        }
        router.refresh();
      } catch {
        toast.error("Network error");
      }
    });
  }

  if (approvals.length === 0) return null;

  return (
    <div className="space-y-2">
      {approvals.map((a) => (
        <ApprovalRow
          key={a.id}
          kidName={a.kidName}
          taskTitle={a.taskTitle}
          points={a.points}
          timeAgo={timeAgo(a.createdAt)}
          onApprove={() => handleAction(a.id, "approve")}
          onReject={() => handleAction(a.id, "reject")}
          disabled={pending}
        />
      ))}
    </div>
  );
}
