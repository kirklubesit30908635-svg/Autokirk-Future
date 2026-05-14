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
  if (!value) return "not sealed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function statusLabel(item: BoardObligation): string {
  if (item.status === "Overdue — System Acting") return "overdue";
  if (item.status === "Needs Proof") return "proof";
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
  const [resolveOpen, setResolveOpen] = useState(false);
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
      message: "Submitting proof...",
    }));

    try {
      const response = await fetch("/api/obligations/resolve-with-proof", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          obligation_id: selectedObligation.id,
          proof_note: resolveState.proofNote,
          proof_photo_url: resolveState.proofUrl.trim() || undefined,
          reason: "operator resolved from live board panel",
        }),
      });
      const body = await response.json();

      if (!response.ok || !body?.ok) {
        throw new Error(body?.error ?? "RESOLUTION_FAILED");
      }

      setResolveState((current) => ({
        ...current,
        status: "done",
        message: "Resolved. Refresh to verify receipt.",
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
      <section className="liveBoardPanel" aria-label="AutoKirk live board attached panel">
        <header className="panelTop">
          <div>
            <p className="eyebrow">AutoKirk live</p>
            <h1>{board.tenant.name ?? "Active system"}</h1>
          </div>
          <div className="score" aria-label={`Integrity score ${integrityScore}`}>
            <strong>{integrityScore}</strong>
            <span>integrity</span>
          </div>
        </header>

        <section className="stats" aria-label="Board state summary">
          <article><strong>{activeObligations.length}</strong><span>active</span></article>
          <article><strong>{board.receipts.length}</strong><span>closed</span></article>
          <article><strong>{board.systemActivity.overdueCount}</strong><span>exposed</span></article>
        </section>

        <div className="scrollArea">
          <section className="rule">
            <span>proof rule</span>
            <p>Work cannot close until proof exists.</p>
          </section>

          <section className="block">
            <div className="blockHead">
              <div>
                <p className="eyebrow">Active obligations</p>
                <h2>Still open</h2>
              </div>
              <button type="button" className="tinyButton" onClick={() => location.reload()}>
                refresh
              </button>
            </div>

            {activeObligations.length > 0 ? (
              <div className="obligationList">
                {activeObligations.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`obligationRow ${item.id === selectedObligation?.id ? "selected" : ""}`}
                    onClick={() => {
                      setResolveOpen(true);
                      setShowClosed(false);
                      setResolveState((current) => ({
                        ...current,
                        obligationId: item.id,
                        status: "idle",
                        message: "",
                      }));
                    }}
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
                <p>Create one from the linked system.</p>
              </div>
            )}
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
              <span>Resolve selected</span>
              <strong>{selectedObligation ? "open" : "none"}</strong>
            </button>
            {resolveOpen ? (
              <div className="drawer">
                {selectedObligation ? (
                  <>
                    <div className="selectedLine">
                      <strong>{selectedObligation.obligationCode}</strong>
                      <span>{shorten(selectedObligation.id)}</span>
                    </div>
                    <label>
                      Proof note
                      <textarea
                        value={resolveState.proofNote}
                        onChange={(event) => setResolveState((current) => ({ ...current, proofNote: event.target.value, status: "idle", message: "" }))}
                        placeholder="What proof closes this?"
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
                      {resolveState.status === "submitting" ? "Resolving..." : "Resolve with proof"}
                    </button>
                    {resolveState.message ? <p className="message">{resolveState.message}</p> : null}
                  </>
                ) : (
                  <div className="emptyBox"><strong>Nothing selected.</strong><p>Select an active obligation.</p></div>
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
              <span>Look up closed</span>
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
                          <strong>{item.obligationCode}</strong>
                          <p>{shorten(item.id)} · {formatTime(receipt?.sealedAt ?? null)}</p>
                        </div>
                        <span>{shorten(receipt?.hash)}</span>
                      </article>
                    );
                  })
                ) : (
                  <div className="emptyBox"><strong>No closed obligations.</strong><p>Receipts appear here after resolution.</p></div>
                )}
              </div>
            ) : null}
          </section>
        </div>
      </section>

      <style jsx>{`
        .liveBoardShell {
          min-height: 100vh;
          color: #f5f5f5;
          background: transparent;
          pointer-events: none;
        }

        .liveBoardPanel {
          position: fixed;
          right: 18px;
          bottom: 18px;
          z-index: 2147483000;
          width: min(360px, calc(100vw - 28px));
          height: min(430px, calc(100vh - 36px));
          pointer-events: auto;
          border: 1px solid #2b2b2b;
          border-radius: 22px;
          background: linear-gradient(180deg, #101010, #050505);
          box-shadow: 0 28px 92px rgba(0, 0, 0, 0.76);
          overflow: hidden;
        }

        .panelTop {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
          padding: 14px 14px 8px;
        }

        h1, h2, p { margin: 0; }

        h1 {
          font-size: 1rem;
          line-height: 1.05;
          letter-spacing: -0.04em;
          max-width: 205px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        h2 {
          font-size: 0.86rem;
          letter-spacing: -0.03em;
        }

        .eyebrow {
          color: #8e8e8e;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-size: 0.56rem;
          font-weight: 900;
          margin-bottom: 5px;
        }

        .score {
          flex: 0 0 auto;
          min-width: 58px;
          border: 1px solid rgba(45, 245, 213, 0.5);
          border-radius: 16px;
          padding: 7px 8px;
          text-align: center;
          box-shadow: 0 0 22px rgba(45, 245, 213, 0.12);
        }

        .score strong {
          display: block;
          color: #2df5d5;
          font-size: 1.1rem;
          line-height: 1;
        }

        .score span {
          display: block;
          margin-top: 3px;
          color: #b8b8b8;
          font-size: 0.48rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 6px;
          padding: 0 10px 8px;
        }

        .stats article,
        .rule,
        .block,
        .emptyBox,
        .obligationRow,
        .closedRow {
          border: 1px solid #242424;
          background: #0b0b0b;
        }

        .stats article {
          border-radius: 14px;
          padding: 8px;
        }

        .stats strong {
          display: block;
          color: #2df5d5;
          font-size: 1rem;
          line-height: 1;
        }

        .stats span {
          display: block;
          margin-top: 4px;
          color: #9a9a9a;
          font-size: 0.55rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .scrollArea {
          height: calc(100% - 112px);
          overflow-y: auto;
          padding: 0 10px 10px;
        }

        .scrollArea::-webkit-scrollbar { width: 6px; }
        .scrollArea::-webkit-scrollbar-thumb { background: #2c2c2c; border-radius: 999px; }

        .rule,
        .block {
          border-radius: 16px;
          padding: 10px;
          margin-bottom: 8px;
        }

        .rule span {
          color: #2df5d5;
          font-size: 0.55rem;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .rule p {
          margin-top: 4px;
          color: #f5f5f5;
          font-weight: 900;
          line-height: 1.15;
          font-size: 0.83rem;
        }

        .blockHead,
        .selectedLine {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
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
          padding: 6px 8px;
          font-size: 0.62rem;
          font-weight: 900;
        }

        .obligationList,
        .drawer {
          display: grid;
          gap: 6px;
          margin-top: 8px;
        }

        .obligationRow {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          border-radius: 13px;
          padding: 8px;
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
          font-size: 0.77rem;
          line-height: 1.2;
        }

        .obligationRow small,
        .emptyBox p,
        .closedRow p,
        .message,
        label {
          color: #9a9a9a;
          font-size: 0.64rem;
          line-height: 1.3;
        }

        .obligationRow em {
          flex: 0 0 auto;
          color: #2df5d5;
          border: 1px solid rgba(45, 245, 213, 0.38);
          border-radius: 999px;
          padding: 4px 6px;
          font-style: normal;
          font-size: 0.54rem;
          font-weight: 950;
          text-align: center;
        }

        .emptyBox {
          border-radius: 13px;
          padding: 10px;
          margin-top: 8px;
        }

        .wideToggle {
          width: 100%;
          min-height: 36px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          color: #f5f5f5;
          background: #050505;
          border: 1px solid #2c2c2c;
          border-radius: 999px;
          padding: 0 10px;
          font-size: 0.76rem;
          font-weight: 950;
        }

        .wideToggle strong,
        .selectedLine span,
        .closedRow span {
          color: #2df5d5;
        }

        label {
          display: grid;
          gap: 5px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        textarea,
        input {
          width: 100%;
          border: 1px solid #2c2c2c;
          border-radius: 12px;
          background: #050505;
          color: #f5f5f5;
          font: inherit;
          font-size: 0.76rem;
          padding: 8px;
          outline: none;
        }

        textarea:focus,
        input:focus {
          border-color: #2df5d5;
          box-shadow: 0 0 0 1px rgba(45, 245, 213, 0.18);
        }

        textarea {
          min-height: 58px;
          resize: vertical;
        }

        .primaryButton {
          width: 100%;
          min-height: 36px;
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
          gap: 8px;
          align-items: center;
          border-radius: 13px;
          padding: 8px;
        }

        .closedRow span {
          font-size: 0.6rem;
          font-weight: 900;
          text-align: right;
        }

        @media (max-width: 700px) {
          .liveBoardPanel {
            right: 10px;
            left: 10px;
            bottom: 10px;
            width: auto;
            height: min(420px, calc(100vh - 20px));
          }
        }
      `}</style>
    </main>
  );
}
