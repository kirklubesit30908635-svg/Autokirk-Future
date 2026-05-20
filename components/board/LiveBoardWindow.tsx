import { useMemo, useState } from "react";

import type {
  BoardObligation,
  BoardReceipt,
  BoardViewModel,
} from "../../lib/board/getTenantBoard";

type LiveBoardWindowProps = {
  board: BoardViewModel;
};

type ReceiptSummary = {
  id: string | null;
  obligationId: string | null;
  sealedAt: string | null;
  hash: string | null;
  sequence: number | null;
};

type ResolveState = {
  obligationId: string;
  proofNote: string;
  proofUrl: string;
  status: "idle" | "submitting" | "done" | "error";
  message: string;
  receipt: ReceiptSummary | null;
};

function shorten(value: string | null | undefined): string {
  if (!value) return "--";
  if (value.length <= 14) return value;
  return `${value.slice(0, 7)}...${value.slice(-4)}`;
}

function formatTime(value: string | null): string {
  if (!value) return "not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function nullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function receiptFromResponse(value: unknown): ReceiptSummary | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;

  return {
    id: nullableString(record.id),
    obligationId: nullableString(record.obligation_id),
    sealedAt: nullableString(record.emitted_at),
    hash: nullableString(record.receipt_hash),
    sequence: nullableNumber(record.seq),
  };
}

function statusLabel(item: BoardObligation): string {
  if (item.status === "Overdue — System Acting") return "needs attention";
  if (item.status === "Needs Proof") return "waiting";
  if (item.status === "Failed") return "needs attention";
  if (item.status === "Open") return "ready to prove";
  return item.status.toLowerCase();
}

function obligationSummary(item: BoardObligation): string {
  return item.description ?? item.subjectLabel ?? "Select to inspect this work before closing it.";
}

function calculateIntegrityScore(
  obligations: BoardObligation[],
  receipts: BoardReceipt[]
): number {
  const active = obligations.filter((item) => item.status !== "Sealed");
  const total = Math.max(obligations.length, 1);
  const sealedRatio = receipts.length / Math.max(receipts.length + active.length, 1);
  const proofIssues = active.filter(
    (item) => item.status === "Needs Proof" || item.status === "Failed"
  ).length;
  const overdue = active.filter(
    (item) => item.status === "Overdue — System Acting"
  ).length;
  const score =
    72 +
    Math.round(sealedRatio * 22) -
    Math.round((proofIssues / total) * 18) -
    Math.round((overdue / total) * 14);

  return Math.max(0, Math.min(100, score));
}

export function LiveBoardWindow({ board }: LiveBoardWindowProps) {
  const activeObligations = useMemo(
    () => board.obligations.filter((item) => item.status !== "Sealed"),
    [board.obligations]
  );
  const closedObligations = useMemo(
    () => board.obligations.filter((item) => item.status === "Sealed"),
    [board.obligations]
  );
  const needsAttentionCount = useMemo(
    () => activeObligations.filter((item) => item.status === "Failed" || item.status === "Overdue — System Acting").length,
    [activeObligations]
  );
  const [showClosed, setShowClosed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [resolveState, setResolveState] = useState<ResolveState>(() => ({
    obligationId: activeObligations[0]?.id ?? "",
    proofNote: "",
    proofUrl: "",
    status: "idle",
    message: "",
    receipt: null,
  }));

  const selectedObligation =
    activeObligations.find((item) => item.id === resolveState.obligationId) ??
    activeObligations[0] ??
    null;
  const integrityScore = calculateIntegrityScore(board.obligations, board.receipts);
  const boardTitle = board.tenant.name ?? "Active system";

  function checkForNewWork() {
    setRefreshing(true);
    window.setTimeout(() => location.reload(), 240);
  }

  function selectObligation(item: BoardObligation) {
    setShowClosed(false);
    setResolveState((current) => ({
      ...current,
      obligationId: item.id,
      status: "idle",
      message: "",
      receipt: null,
    }));
  }

  async function submitResolution() {
    if (!selectedObligation) {
      setResolveState((current) => ({
        ...current,
        status: "error",
        message: "Select work that is waiting on proof.",
      }));
      return;
    }

    if (!resolveState.proofNote.trim()) {
      setResolveState((current) => ({
        ...current,
        status: "error",
        message: "Add proof before closing.",
      }));
      return;
    }

    if (!selectedObligation.proofActionToken) {
      setResolveState((current) => ({
        ...current,
        status: "error",
        message: "Refresh this board before closing with proof.",
      }));
      return;
    }

    setResolveState((current) => ({
      ...current,
      status: "submitting",
      message: "Checking proof...",
      receipt: null,
    }));

    try {
      const response = await fetch("/api/obligations/resolve-with-proof", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          obligation_id: selectedObligation.id,
          proof_note: resolveState.proofNote,
          proof_photo_url: resolveState.proofUrl.trim() || undefined,
          reason: "operator closed from live board panel",
          proof_action_token: selectedObligation.proofActionToken,
        }),
      });
      const body = await response.json();

      if (!response.ok || !body?.ok) {
        throw new Error(body?.error ?? "CLOSE_WITH_PROOF_FAILED");
      }

      const receipt = receiptFromResponse(body.receipt);
      setResolveState((current) => ({
        ...current,
        status: "done",
        message: "Closed with proof. Receipt recorded.",
        receipt,
      }));
    } catch (error) {
      setResolveState((current) => ({
        ...current,
        status: "error",
        message: error instanceof Error ? error.message : "Close with proof failed.",
        receipt: null,
      }));
    }
  }

  return (
    <main className="liveBoardShell">
      <section className="liveBoardPanel" aria-label="AutoKirk live proof board">
        <header className="panelTop">
          <div className="titleBlock">
            <p className="eyebrow">AutoKirk live board</p>
            <h1 className="boardTitle" title={boardTitle}>{boardTitle}</h1>
            <p className="subcopy">Work stays open until the right proof exists.</p>
          </div>
          <div className="score" aria-label={`Integrity score ${integrityScore}`}>
            <strong>{integrityScore}</strong>
            <span>integrity</span>
          </div>
        </header>

        <section className="stats" aria-label="Board state summary">
          <article><strong>{activeObligations.length}</strong><span>waiting</span></article>
          <article><strong>{board.receipts.length}</strong><span>proven</span></article>
          <article><strong>{needsAttentionCount}</strong><span>attention</span></article>
        </section>

        <div className="boardGrid">
          <section className="block workBlock">
            <div className="blockHead">
              <div>
                <p className="eyebrow">Waiting on proof</p>
                <h2>Select work to inspect it</h2>
              </div>
              <button type="button" className="tinyButton" onClick={checkForNewWork}>
                {refreshing ? "Checking..." : "Check for new work"}
              </button>
            </div>

            {activeObligations.length > 0 ? (
              <div className="obligationList">
                {activeObligations.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`obligationRow ${item.id === selectedObligation?.id ? "selected" : ""}`}
                    onClick={() => selectObligation(item)}
                    aria-pressed={item.id === selectedObligation?.id}
                  >
                    <span>
                      <strong>{item.subjectLabel ?? item.obligationCode}</strong>
                      <small>{item.obligationCode} - {shorten(item.id)}</small>
                      <p>{obligationSummary(item)}</p>
                    </span>
                    <em>{statusLabel(item)}</em>
                  </button>
                ))}
              </div>
            ) : (
              <div className="emptyState">
                <strong>No open work.</strong>
                <p>New work will appear here when a connected system sends it.</p>
              </div>
            )}
          </section>

          <section className="block detailBlock">
            <div className="blockHead">
              <div>
                <p className="eyebrow">Proof panel</p>
                <h2>{selectedObligation ? "Close with proof" : "Nothing selected"}</h2>
              </div>
            </div>

            {selectedObligation ? (
              <div className="resolveBox">
                <p className="detailText">{selectedObligation.proofRequired ?? "Add evidence that proves the work is complete."}</p>
                <label>
                  Proof note
                  <textarea value={resolveState.proofNote} onChange={(event) => setResolveState((current) => ({ ...current, proofNote: event.target.value }))} placeholder="What proves this was completed?" />
                </label>
                <label>
                  Proof URL optional
                  <input value={resolveState.proofUrl} onChange={(event) => setResolveState((current) => ({ ...current, proofUrl: event.target.value }))} placeholder="https://..." />
                </label>
                <button type="button" className="primaryButton" onClick={submitResolution} disabled={resolveState.status === "submitting"}>
                  {resolveState.status === "submitting" ? "Checking proof..." : "Close with proof"}
                </button>
                {resolveState.message && <p className={`message ${resolveState.status}`}>{resolveState.message}</p>}
                {resolveState.receipt && (
                  <article className="instantReceipt" aria-label="Receipt recorded">
                    <p className="eyebrow">Receipt recorded</p>
                    <strong>{shorten(resolveState.receipt.hash)}</strong>
                    <span>{formatTime(resolveState.receipt.sealedAt)}</span>
                    <small>seq {resolveState.receipt.sequence ?? "--"} - obligation {shorten(resolveState.receipt.obligationId)}</small>
                  </article>
                )}
              </div>
            ) : (
              <div className="emptyState">
                <strong>No work selected.</strong>
                <p>Open work will appear when intake creates governed obligations.</p>
              </div>
            )}
          </section>
        </div>

        <section className="block receiptsBlock">
          <div className="blockHead">
            <div>
              <p className="eyebrow">Proof history</p>
              <h2>Receipts</h2>
            </div>
            {closedObligations.length > 0 && (
              <button type="button" className="tinyButton" onClick={() => setShowClosed((value) => !value)}>
                {showClosed ? "Hide closed" : "Show closed"}
              </button>
            )}
          </div>

          {board.receipts.length > 0 ? (
            <div className="receiptList">
              {board.receipts.map((receipt) => (
                <article key={receipt.id} className="receiptRow">
                  <strong>{shorten(receipt.hash)}</strong>
                  <span>{formatTime(receipt.sealedAt)}</span>
                  <small>seq {receipt.sequence ?? "--"} - obligation {shorten(receipt.obligationId)}</small>
                </article>
              ))}
            </div>
          ) : (
            <div className="emptyState">
              <strong>No receipts yet.</strong>
              <p>When work is closed with proof, the receipt history appears here.</p>
            </div>
          )}
        </section>
      </section>
      <style jsx>{`
        .liveBoardShell{min-height:100vh;background:#030303;color:#f5f5f5;padding:10px;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.liveBoardPanel{border:1px solid #242424;border-radius:22px;background:linear-gradient(180deg,#101010,#050505);padding:14px;min-height:calc(100vh - 20px);box-shadow:0 24px 80px rgba(0,0,0,.5)}.panelTop{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.eyebrow{margin:0 0 6px;color:#9a9a9a;text-transform:uppercase;letter-spacing:.1em;font-size:.68rem;font-weight:900}.boardTitle{margin:0;font-size:1.25rem;letter-spacing:-.04em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:230px}.subcopy{margin:4px 0 0;color:#a3a3a3;font-size:.8rem}.score{border:1px solid rgba(45,245,213,.32);border-radius:18px;background:rgba(45,245,213,.07);padding:8px 10px;text-align:center;min-width:68px}.score strong{display:block;color:#2df5d5;font-size:1.35rem}.score span{display:block;color:#bfbfbf;font-size:.66rem;text-transform:uppercase;letter-spacing:.08em}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}.stats article{border:1px solid #242424;border-radius:16px;background:#080808;padding:10px}.stats strong{display:block;font-size:1.25rem}.stats span{display:block;color:#a3a3a3;font-size:.72rem}.boardGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.block{border:1px solid #242424;border-radius:18px;background:#080808;padding:12px}.blockHead{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:10px}.blockHead h2{margin:0;font-size:1rem;letter-spacing:-.03em}.tinyButton,.primaryButton{border:0;border-radius:999px;font-weight:900;cursor:pointer}.tinyButton{background:#111;color:#f5f5f5;border:1px solid #2c2c2c;padding:8px 10px;font-size:.75rem}.primaryButton{background:#2df5d5;color:#020202;padding:11px 14px}.obligationList,.receiptList{display:grid;gap:8px}.obligationRow{width:100%;text-align:left;border:1px solid #242424;border-radius:16px;background:#050505;color:#f5f5f5;padding:10px;display:flex;justify-content:space-between;gap:10px;cursor:pointer}.obligationRow.selected{border-color:#2df5d5;box-shadow:0 0 0 1px rgba(45,245,213,.18)}.obligationRow strong,.receiptRow strong,.instantReceipt strong{display:block}.obligationRow small,.receiptRow small,.instantReceipt small{display:block;color:#777;margin-top:3px}.obligationRow p{margin:6px 0 0;color:#a3a3a3;font-size:.8rem;line-height:1.35}.obligationRow em{font-style:normal;color:#2df5d5;font-size:.72rem;white-space:nowrap}.resolveBox{display:grid;gap:9px}.resolveBox label{display:grid;gap:6px;color:#d4d4d4;font-size:.78rem;font-weight:900}.resolveBox textarea,.resolveBox input{width:100%;border:1px solid #2c2c2c;border-radius:14px;background:#030303;color:#f5f5f5;padding:10px;font:inherit}.resolveBox textarea{min-height:88px;resize:vertical}.detailText{margin:0;color:#a3a3a3;font-size:.84rem;line-height:1.45}.message{margin:0;border-radius:12px;padding:8px;font-size:.8rem}.message.done{background:rgba(45,245,213,.1);color:#2df5d5}.message.error{background:#160909;color:#ffb7b7}.message.submitting,.message.idle{background:#111;color:#d7d7d7}.receiptsBlock{margin-top:10px}.receiptRow,.instantReceipt{border:1px solid #242424;border-radius:16px;background:#050505;padding:10px}.instantReceipt{border-color:rgba(45,245,213,.28);background:rgba(45,245,213,.06)}.receiptRow span,.instantReceipt span{display:block;color:#a3a3a3;font-size:.78rem;margin-top:2px}.emptyState{border:1px dashed #333;border-radius:16px;padding:14px;background:#050505;color:#a3a3a3}.emptyState strong{display:block;color:#f5f5f5}.emptyState p{margin:5px 0 0;font-size:.84rem;line-height:1.4}@media(max-width:760px){.boardGrid{grid-template-columns:1fr}.boardTitle{max-width:180px}}
      `}</style>
    </main>
  );
}