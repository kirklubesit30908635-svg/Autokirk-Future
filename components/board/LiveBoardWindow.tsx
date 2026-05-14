import { useMemo, useState } from "react";

import type {
  BoardObligation,
  BoardReceipt,
  BoardViewModel,
} from "../../lib/board/getTenantBoard";

type LiveBoardWindowProps = {
  board: BoardViewModel;
};

type ResolveState = {
  obligationId: string;
  proofNote: string;
  proofUrl: string;
  status: "idle" | "submitting" | "done" | "error";
  message: string;
};

function formatTime(value: string | null): string {
  if (!value) return "not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function shorten(value: string | null | undefined): string {
  if (!value) return "--";
  if (value.length <= 16) return value;
  return `${value.slice(0, 8)}...${value.slice(-5)}`;
}

function statusLabel(item: BoardObligation): string {
  if (item.status === "Overdue — System Acting") return "overdue";
  if (item.status === "Needs Proof") return "needs proof";
  return item.status.toLowerCase();
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
  const [showClosed, setShowClosed] = useState(false);
  const [resolveState, setResolveState] = useState<ResolveState>(() => ({
    obligationId: activeObligations[0]?.id ?? "",
    proofNote: "",
    proofUrl: "",
    status: "idle",
    message: "",
  }));

  const selectedObligation =
    activeObligations.find((item) => item.id === resolveState.obligationId) ??
    activeObligations[0] ??
    null;
  const integrityScore = calculateIntegrityScore(board.obligations, board.receipts);

  async function submitResolution() {
    if (!selectedObligation) {
      setResolveState((current) => ({
        ...current,
        status: "error",
        message: "No active obligation selected.",
      }));
      return;
    }

    if (!resolveState.proofNote.trim()) {
      setResolveState((current) => ({
        ...current,
        status: "error",
        message: "Add proof before resolving.",
      }));
      return;
    }

    setResolveState((current) => ({
      ...current,
      status: "submitting",
      message: "Submitting proof to the governed path...",
    }));

    try {
      const response = await fetch("/api/obligations/resolve-with-proof", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          obligation_id: selectedObligation.id,
          proof_note: resolveState.proofNote,
          proof_photo_url: resolveState.proofUrl.trim() || undefined,
          reason: "operator resolved from live board window",
        }),
      });
      const body = await response.json();

      if (!response.ok || !body?.ok) {
        throw new Error(body?.error ?? "RESOLUTION_FAILED");
      }

      setResolveState((current) => ({
        ...current,
        status: "done",
        message: "Resolved. Refresh to see the new receipt-backed state.",
      }));
    } catch (error) {
      setResolveState((current) => ({
        ...current,
        status: "error",
        message: error instanceof Error ? error.message : "Resolution failed.",
      }));
    }
  }

  return (
    <main className="liveBoardShell">
      <section className="liveBoardWindow" aria-label="AutoKirk live board window">
        <header className="windowHeader">
          <div>
            <p className="eyebrow">AutoKirk live board</p>
            <h1>{board.tenant.name ?? "Active system"}</h1>
            <p className="subline">Attached obligation window</p>
          </div>
          <div className="scoreBadge" aria-label={`Integrity score ${integrityScore}`}>
            <span>{integrityScore}</span>
            <small>integrity</small>
          </div>
        </header>

        <section className="summaryStrip">
          <article>
            <strong>{activeObligations.length}</strong>
            <span>active</span>
          </article>
          <article>
            <strong>{board.receipts.length}</strong>
            <span>closed</span>
          </article>
          <article>
            <strong>{board.systemActivity.overdueCount}</strong>
            <span>exposed</span>
          </article>
        </section>

        <section className="ruleCard">
          <span>proof rule</span>
          <p>Important work cannot be marked complete until proof exists.</p>
        </section>

        <section className="panel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Active obligations</p>
              <h2>Resolve what is still open.</h2>
            </div>
            <button type="button" className="ghostButton" onClick={() => location.reload()}>
              refresh
            </button>
          </div>

          {activeObligations.length > 0 ? (
            <div className="obligationList">
              {activeObligations.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`obligationRow ${
                    item.id === selectedObligation?.id ? "selected" : ""
                  }`}
                  onClick={() =>
                    setResolveState((current) => ({
                      ...current,
                      obligationId: item.id,
                      status: "idle",
                      message: "",
                    }))
                  }
                >
                  <span>
                    <strong>{item.obligationCode}</strong>
                    <small>{shorten(item.id)} · {item.proofStatus ?? "proof pending"}</small>
                  </span>
                  <em>{statusLabel(item)}</em>
                </button>
              ))}
            </div>
          ) : (
            <div className="emptyBox">
              <strong>No active obligations.</strong>
              <p>The active system has no open proof burden right now.</p>
            </div>
          )}
        </section>

        <section className="panel resolvePanel">
          <p className="eyebrow">Resolve with proof</p>
          {selectedObligation ? (
            <div className="resolveBody">
              <div className="selectedLine">
                <strong>{selectedObligation.obligationCode}</strong>
                <span>{shorten(selectedObligation.id)}</span>
              </div>
              <label>
                Proof note
                <textarea
                  value={resolveState.proofNote}
                  onChange={(event) =>
                    setResolveState((current) => ({
                      ...current,
                      proofNote: event.target.value,
                      status: "idle",
                      message: "",
                    }))
                  }
                  placeholder="What proof closes this obligation?"
                />
              </label>
              <label>
                Proof link
                <input
                  value={resolveState.proofUrl}
                  onChange={(event) =>
                    setResolveState((current) => ({
                      ...current,
                      proofUrl: event.target.value,
                      status: "idle",
                      message: "",
                    }))
                  }
                  placeholder="https://..."
                />
              </label>
              <button
                type="button"
                className="primaryButton"
                disabled={resolveState.status === "submitting"}
                onClick={submitResolution}
              >
                {resolveState.status === "submitting"
                  ? "Resolving..."
                  : "Resolve with proof"}
              </button>
              {resolveState.message ? (
                <p className="message">{resolveState.message}</p>
              ) : null}
            </div>
          ) : (
            <div className="emptyBox">
              <strong>Nothing selected.</strong>
              <p>Create or select an active obligation to resolve.</p>
            </div>
          )}
        </section>

        <section className="panel closedPanel">
          <button
            type="button"
            className="closedToggle"
            onClick={() => setShowClosed((value) => !value)}
          >
            <span>Look up closed obligations</span>
            <strong>{closedObligations.length}</strong>
          </button>
          {showClosed ? (
            <div className="closedList">
              {closedObligations.length > 0 ? (
                closedObligations.slice(0, 12).map((item) => {
                  const receipt = board.receipts.find(
                    (entry) => entry.obligationId === item.id
                  );
                  return (
                    <article key={item.id} className="closedRow">
                      <div>
                        <strong>{item.obligationCode}</strong>
                        <p>{shorten(item.id)} · sealed {formatTime(receipt?.sealedAt ?? null)}</p>
                      </div>
                      <span>{shorten(receipt?.hash)}</span>
                    </article>
                  );
                })
              ) : (
                <div className="emptyBox">
                  <strong>No closed obligations yet.</strong>
                  <p>Resolved obligations will appear here with receipt evidence.</p>
                </div>
              )}
            </div>
          ) : null}
        </section>
      </section>

      <style jsx>{`
        .liveBoardShell {
          min-height: 100vh;
          display: grid;
          place-items: start center;
          padding: 18px 10px 32px;
          color: #f5f5f5;
          background: radial-gradient(circle at 18% 0%, rgba(45, 245, 213, 0.2), transparent 30rem), #030303;
        }

        .liveBoardWindow {
          width: min(480px, 100%);
          border: 1px solid #2b2b2b;
          border-radius: 28px;
          background: linear-gradient(180deg, #101010, #050505);
          box-shadow: 0 28px 92px rgba(0, 0, 0, 0.76);
          overflow: hidden;
        }

        .windowHeader,
        .summaryStrip,
        .ruleCard,
        .panel {
          margin: 12px;
        }

        .windowHeader {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          padding: 18px 18px 8px;
        }

        h1,
        h2,
        p {
          margin: 0;
        }

        h1 {
          font-size: 1.45rem;
          letter-spacing: -0.045em;
          line-height: 1.05;
        }

        h2 {
          font-size: 1rem;
          letter-spacing: -0.035em;
        }

        .eyebrow {
          color: #8e8e8e;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-size: 0.68rem;
          font-weight: 900;
          margin-bottom: 7px;
        }

        .subline,
        .message,
        .emptyBox p,
        .obligationRow small,
        .closedRow p,
        label,
        .summaryStrip span {
          color: #9a9a9a;
        }

        .scoreBadge {
          flex: 0 0 auto;
          min-width: 74px;
          border: 1px solid rgba(45, 245, 213, 0.5);
          border-radius: 20px;
          padding: 9px 10px;
          text-align: center;
          box-shadow: 0 0 28px rgba(45, 245, 213, 0.12);
        }

        .scoreBadge span {
          display: block;
          color: #2df5d5;
          font-size: 1.35rem;
          font-weight: 950;
          line-height: 1;
        }

        .scoreBadge small {
          color: #b8b8b8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 0.58rem;
          font-weight: 900;
        }

        .summaryStrip {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }

        .summaryStrip article,
        .ruleCard,
        .panel,
        .emptyBox,
        .obligationRow,
        .closedRow {
          border: 1px solid #242424;
          background: #0b0b0b;
        }

        .summaryStrip article {
          border-radius: 18px;
          padding: 12px 10px;
        }

        .summaryStrip strong {
          display: block;
          color: #2df5d5;
          font-size: 1.28rem;
          line-height: 1;
        }

        .summaryStrip span {
          display: block;
          margin-top: 5px;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 900;
        }

        .ruleCard {
          border-radius: 20px;
          padding: 15px;
        }

        .ruleCard span {
          color: #2df5d5;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-size: 0.66rem;
          font-weight: 950;
        }

        .ruleCard p {
          margin-top: 7px;
          color: #f5f5f5;
          font-weight: 900;
          line-height: 1.2;
          letter-spacing: -0.03em;
        }

        .panel {
          border-radius: 22px;
          padding: 14px;
        }

        .panelHeader {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 11px;
        }

        .ghostButton,
        .closedToggle,
        .primaryButton,
        .obligationRow {
          cursor: pointer;
          font: inherit;
        }

        .ghostButton {
          color: #2df5d5;
          border: 1px solid #2b2b2b;
          border-radius: 999px;
          background: #060606;
          padding: 7px 10px;
          font-size: 0.74rem;
          font-weight: 900;
        }

        .obligationList,
        .closedList,
        .resolveBody {
          display: grid;
          gap: 8px;
        }

        .obligationRow {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          border-radius: 16px;
          padding: 11px;
          text-align: left;
          color: #f5f5f5;
        }

        .obligationRow.selected {
          border-color: #2df5d5;
          box-shadow: 0 0 0 1px rgba(45, 245, 213, 0.24);
        }

        .obligationRow strong,
        .closedRow strong,
        .emptyBox strong,
        .selectedLine strong {
          display: block;
          color: #f5f5f5;
          font-size: 0.9rem;
          line-height: 1.2;
        }

        .obligationRow small {
          display: block;
          margin-top: 4px;
          font-size: 0.72rem;
        }

        .obligationRow em {
          flex: 0 0 auto;
          color: #2df5d5;
          border: 1px solid rgba(45, 245, 213, 0.38);
          border-radius: 999px;
          padding: 5px 8px;
          font-style: normal;
          font-size: 0.64rem;
          font-weight: 950;
          text-align: center;
          max-width: 106px;
        }

        .emptyBox {
          border-radius: 16px;
          padding: 13px;
        }

        .emptyBox p {
          margin-top: 5px;
          font-size: 0.78rem;
          line-height: 1.35;
        }

        .selectedLine {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
          padding-bottom: 4px;
        }

        .selectedLine span {
          color: #2df5d5;
          font-size: 0.72rem;
          font-weight: 900;
        }

        label {
          display: grid;
          gap: 7px;
          font-size: 0.76rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        textarea,
        input {
          width: 100%;
          border: 1px solid #2c2c2c;
          border-radius: 16px;
          background: #050505;
          color: #f5f5f5;
          font: inherit;
          padding: 11px;
          outline: none;
        }

        textarea:focus,
        input:focus {
          border-color: #2df5d5;
          box-shadow: 0 0 0 1px rgba(45, 245, 213, 0.18);
        }

        textarea {
          resize: vertical;
          min-height: 82px;
        }

        .primaryButton,
        .closedToggle {
          width: 100%;
          border: 0;
          border-radius: 999px;
          min-height: 46px;
          font-weight: 950;
        }

        .primaryButton {
          color: #020202;
          background: #2df5d5;
        }

        .primaryButton:disabled {
          opacity: 0.62;
        }

        .message {
          font-size: 0.78rem;
          line-height: 1.35;
        }

        .closedToggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: #f5f5f5;
          background: #050505;
          border: 1px solid #2c2c2c;
          padding: 0 14px;
        }

        .closedToggle strong {
          color: #2df5d5;
        }

        .closedList {
          margin-top: 10px;
        }

        .closedRow {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
          border-radius: 16px;
          padding: 11px;
        }

        .closedRow p {
          margin-top: 4px;
          font-size: 0.72rem;
        }

        .closedRow span {
          color: #2df5d5;
          font-size: 0.7rem;
          font-weight: 900;
          text-align: right;
        }
      `}</style>
    </main>
  );
}
