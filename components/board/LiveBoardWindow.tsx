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

function statusLabel(item: BoardObligation): string {
  if (item.status === "Overdue — System Acting") return "needs attention";
  if (item.status === "Needs Proof") return "waiting";
  if (item.status === "Failed") return "needs attention";
  if (item.status === "Ready") return "ready to prove";
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
  const [resolveOpen, setResolveOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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
  const boardTitle = board.tenant.name ?? "Active system";

  function checkForNewWork() {
    setRefreshing(true);
    window.setTimeout(() => location.reload(), 240);
  }

  function selectObligation(item: BoardObligation) {
    setResolveOpen(true);
    setShowClosed(false);
    setResolveState((current) => ({
      ...current,
      obligationId: item.id,
      status: "idle",
      message: "",
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

    setResolveState((current) => ({
      ...current,
      status: "submitting",
      message: "Checking proof...",
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
        }),
      });
      const body = await response.json();

      if (!response.ok || !body?.ok) {
        throw new Error(body?.error ?? "CLOSE_WITH_PROOF_FAILED");
      }

      setResolveState((current) => ({
        ...current,
        status: "done",
        message: "Closed with proof. Refresh proof history to verify the record.",
      }));
    } catch (error) {
      setResolveState((current) => ({
        ...current,
        status: "error",
        message: error instanceof Error ? error.message : "Close with proof failed.",
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
              <div className="emptyBox">
                <strong>Nothing waiting on proof.</strong>
                <p>New work from your connected system will appear here.</p>
              </div>
            )}
          </section>

          <aside className="sideStack">
            <section className="block rule">
              <span>proof rule</span>
              <p>Work stays open until the right proof exists.</p>
            </section>

            <section className="block">
              <button
                type="button"
                className="wideToggle"
                onClick={() => {
                  setResolveOpen((value) => !value);
                  setShowClosed(false);
                }}
              >
                <span>{selectedObligation ? "Resolve selected" : "Close with proof"}</span>
                <strong>{selectedObligation ? "open" : "none"}</strong>
              </button>
              {resolveOpen ? (
                <div className="drawer">
                  {selectedObligation ? (
                    <>
                      <div className="selectedCard">
                        <div className="selectedLine">
                          <strong>{selectedObligation.subjectLabel ?? selectedObligation.obligationCode}</strong>
                          <span>{shorten(selectedObligation.id)}</span>
                        </div>
                        <p>{obligationSummary(selectedObligation)}</p>
                        <dl>
                          <div>
                            <dt>Obligation</dt>
                            <dd>{selectedObligation.obligationCode}</dd>
                          </div>
                          {selectedObligation.proofRequired ? (
                            <div>
                              <dt>Proof required</dt>
                              <dd>{selectedObligation.proofRequired}</dd>
                            </div>
                          ) : null}
                          {selectedObligation.sourceLabel ? (
                            <div>
                              <dt>Source</dt>
                              <dd>{selectedObligation.sourceLabel}</dd>
                            </div>
                          ) : null}
                        </dl>
                      </div>
                      <label>
                        Proof note
                        <textarea
                          value={resolveState.proofNote}
                          onChange={(event) => setResolveState((current) => ({ ...current, proofNote: event.target.value, status: "idle", message: "" }))}
                          placeholder="What proof shows this is complete?"
                        />
                      </label>
                      <label>
                        Proof link
                        <input
                          value={resolveState.proofUrl}
                          onChange={(event) => setResolveState((current) => ({ ...current, proofUrl: event.target.value, status: "idle", message: "" }))}
                          placeholder="https://..."
                        />
                      </label>
                      <button
                        type="button"
                        className="primaryButton"
                        disabled={resolveState.status === "submitting"}
                        onClick={submitResolution}
                      >
                        {resolveState.status === "submitting" ? "Closing with proof..." : "Close with proof"}
                      </button>
                      {resolveState.message ? <p className="message">{resolveState.message}</p> : null}
                    </>
                  ) : (
                    <div className="emptyBox"><strong>Nothing selected.</strong><p>Choose work that is waiting on proof.</p></div>
                  )}
                </div>
              ) : null}
            </section>

            <section className="block">
              <button
                type="button"
                className="wideToggle"
                onClick={() => {
                  setShowClosed((value) => !value);
                  setResolveOpen(false);
                }}
              >
                <span>Proof history</span>
                <strong>{closedObligations.length}</strong>
              </button>
              {showClosed ? (
                <div className="drawer">
                  {closedObligations.length > 0 ? (
                    closedObligations.slice(0, 8).map((item) => {
                      const receipt = board.receipts.find((entry) => entry.obligationId === item.id);
                      return (
                        <article key={item.id} className="closedRow">
                          <div>
                            <strong>{item.subjectLabel ?? item.obligationCode}</strong>
                            <p>{item.obligationCode} - {formatTime(receipt?.sealedAt ?? null)}</p>
                          </div>
                          <span>{shorten(receipt?.hash)}</span>
                        </article>
                      );
                    })
                  ) : (
                    <div className="emptyBox"><strong>No proof history yet.</strong><p>Completed work will appear here after it closes with proof.</p></div>
                  )}
                </div>
              ) : null}
            </section>
          </aside>
        </div>
      </section>

      <style jsx>{`
        .liveBoardShell {
          min-height: 100vh;
          color: #f5f5f5;
          background:
            radial-gradient(circle at 15% 0%, rgba(45, 245, 213, 0.14), transparent 34rem),
            linear-gradient(180deg, #071013, #030303 56%);
          padding: 20px;
        }

        .liveBoardPanel {
          width: min(1180px, 100%);
          min-height: calc(100vh - 40px);
          margin: 0 auto;
          border: 1px solid #2b2b2b;
          border-radius: 30px;
          background: linear-gradient(180deg, rgba(16, 16, 16, 0.96), rgba(5, 5, 5, 0.98));
          box-shadow: 0 28px 92px rgba(0, 0, 0, 0.76);
          overflow: hidden;
        }

        .panelTop {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 18px;
          padding: clamp(24px, 4vw, 46px);
          border-bottom: 1px solid #242424;
        }

        .titleBlock { min-width: 0; }

        h1, h2, p { margin: 0; }

        .boardTitle {
          color: #f5f5f5;
          font-size: clamp(2.7rem, 7vw, 5.6rem);
          line-height: 0.94;
          letter-spacing: -0.07em;
          max-width: 860px;
        }

        .subcopy {
          margin-top: 14px;
          color: #a7a7a7;
          font-size: clamp(1rem, 2vw, 1.35rem);
          line-height: 1.4;
        }

        h2 {
          font-size: clamp(1.3rem, 2.4vw, 2rem);
          letter-spacing: -0.04em;
        }

        .eyebrow {
          color: #8e8e8e;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-size: 0.72rem;
          font-weight: 900;
          margin-bottom: 8px;
        }

        .score {
          flex: 0 0 auto;
          min-width: 112px;
          border: 1px solid rgba(45, 245, 213, 0.5);
          border-radius: 24px;
          padding: 16px 18px;
          text-align: center;
          box-shadow: 0 0 28px rgba(45, 245, 213, 0.13);
        }

        .score strong {
          display: block;
          color: #2df5d5;
          font-size: 2rem;
          line-height: 1;
        }

        .score span {
          display: block;
          margin-top: 6px;
          color: #b8b8b8;
          font-size: 0.62rem;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          padding: 18px clamp(20px, 4vw, 46px) 0;
        }

        .stats article,
        .rule,
        .block,
        .emptyBox,
        .obligationRow,
        .closedRow,
        .selectedCard {
          border: 1px solid #242424;
          background: #0b0b0b;
        }

        .stats article {
          border-radius: 20px;
          padding: 18px;
        }

        .stats strong {
          display: block;
          color: #2df5d5;
          font-size: 2rem;
          line-height: 1;
        }

        .stats span {
          display: block;
          margin-top: 7px;
          color: #9a9a9a;
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .boardGrid {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.8fr);
          gap: 16px;
          padding: 18px clamp(20px, 4vw, 46px) clamp(24px, 4vw, 46px);
        }

        .sideStack {
          display: grid;
          align-content: start;
          gap: 12px;
        }

        .rule,
        .block {
          border-radius: 22px;
          padding: 18px;
        }

        .rule span {
          color: #2df5d5;
          font-size: 0.72rem;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .rule p {
          margin-top: 8px;
          color: #f5f5f5;
          font-weight: 900;
          line-height: 1.15;
          font-size: 1.15rem;
        }

        .blockHead,
        .selectedLine {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .tinyButton,
        .wideToggle,
        .primaryButton,
        .obligationRow {
          cursor: pointer;
          font: inherit;
        }

        .tinyButton {
          color: #2df5d5;
          border: 1px solid #2b2b2b;
          border-radius: 999px;
          background: #060606;
          padding: 9px 12px;
          font-size: 0.72rem;
          font-weight: 900;
          white-space: nowrap;
        }

        .obligationList,
        .drawer {
          display: grid;
          gap: 10px;
          margin-top: 16px;
        }

        .obligationRow {
          width: 100%;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 12px;
          border-radius: 18px;
          padding: 16px;
          color: #f5f5f5;
          text-align: left;
        }

        .obligationRow.selected {
          border-color: #2df5d5;
          box-shadow: 0 0 0 1px rgba(45, 245, 213, 0.18);
        }

        .obligationRow strong,
        .closedRow strong,
        .emptyBox strong,
        .selectedLine strong {
          display: block;
          color: #f5f5f5;
          font-size: 1rem;
          line-height: 1.2;
        }

        .obligationRow small,
        .emptyBox p,
        .closedRow p,
        .message,
        label {
          color: #9a9a9a;
          font-size: 0.78rem;
          line-height: 1.35;
        }

        .obligationRow p,
        .selectedCard p {
          margin-top: 8px;
          color: #c9c9c9;
          font-size: 0.86rem;
          line-height: 1.38;
        }

        .obligationRow em {
          flex: 0 0 auto;
          color: #2df5d5;
          border: 1px solid rgba(45, 245, 213, 0.38);
          border-radius: 999px;
          padding: 7px 10px;
          font-style: normal;
          font-size: 0.68rem;
          font-weight: 950;
          text-align: center;
        }

        .selectedCard {
          border-radius: 18px;
          padding: 14px;
        }

        dl {
          display: grid;
          gap: 10px;
          margin: 14px 0 0;
        }

        dl div {
          display: grid;
          gap: 3px;
        }

        dt {
          color: #8e8e8e;
          font-size: 0.62rem;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        dd {
          margin: 0;
          color: #f5f5f5;
          font-size: 0.86rem;
          line-height: 1.3;
          font-weight: 800;
        }

        .emptyBox {
          border-radius: 18px;
          padding: 16px;
          margin-top: 14px;
        }

        .wideToggle {
          width: 100%;
          min-height: 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          color: #f5f5f5;
          background: #050505;
          border: 1px solid #2c2c2c;
          border-radius: 999px;
          padding: 0 16px;
          font-size: 0.95rem;
          font-weight: 950;
        }

        .wideToggle strong,
        .selectedLine span,
        .closedRow span {
          color: #2df5d5;
        }

        label {
          display: grid;
          gap: 7px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        textarea,
        input {
          width: 100%;
          border: 1px solid #2c2c2c;
          border-radius: 14px;
          background: #050505;
          color: #f5f5f5;
          font: inherit;
          font-size: 0.92rem;
          padding: 12px;
          outline: none;
        }

        textarea:focus,
        input:focus {
          border-color: #2df5d5;
          box-shadow: 0 0 0 1px rgba(45, 245, 213, 0.18);
        }

        textarea {
          min-height: 86px;
          resize: vertical;
        }

        .primaryButton {
          width: 100%;
          min-height: 48px;
          border: 0;
          border-radius: 999px;
          color: #020202;
          background: #2df5d5;
          font-weight: 950;
        }

        .primaryButton:disabled { opacity: 0.62; }

        .closedRow {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          border-radius: 18px;
          padding: 14px;
        }

        .closedRow span {
          font-size: 0.72rem;
          font-weight: 900;
          text-align: right;
        }

        @media (max-width: 860px) {
          .liveBoardShell { padding: 10px; }
          .liveBoardPanel {
            min-height: calc(100vh - 20px);
            border-radius: 24px;
          }
          .panelTop {
            display: grid;
            padding: 24px 18px 18px;
          }
          .boardTitle {
            font-size: clamp(2.9rem, 16vw, 5rem);
          }
          .score {
            justify-self: start;
          }
          .stats,
          .boardGrid {
            grid-template-columns: 1fr;
            padding-left: 18px;
            padding-right: 18px;
          }
        }
      `}</style>
    </main>
  );
}
