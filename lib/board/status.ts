export type BoardStatus =
  | "Open"
  | "Needs Proof"
  | "Overdue — System Acting"
  | "Sealed"
  | "Failed";

type MapBoardStatusInput = {
  lifecycleState: string | null;
  proofStatus: string | null;
  dueAt: string | null;
  hasReceipt: boolean;
  now: Date;
};

function parseTimestamp(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function mapBoardStatus({
  lifecycleState,
  proofStatus,
  dueAt,
  hasReceipt,
  now,
}: MapBoardStatusInput): BoardStatus {
  const lifecycle = (lifecycleState ?? "").toLowerCase();
  const proof = (proofStatus ?? "").toLowerCase();
  const dueDate = parseTimestamp(dueAt);

  if (
    lifecycle === "failed" ||
    proof === "failed" ||
    proof === "insufficient" ||
    proof === "rejected"
  ) {
    return "Failed";
  }

  if (
    hasReceipt ||
    lifecycle === "resolved" ||
    proof === "sufficient" ||
    proof === "accepted"
  ) {
    return "Sealed";
  }

  if (!hasReceipt && dueDate && dueDate.getTime() < now.getTime()) {
    return "Overdue — System Acting";
  }

  if (proof === "pending" || proof === "required") {
    return "Needs Proof";
  }

  return "Open";
}
