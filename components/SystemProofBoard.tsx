type LifecycleRow = {
  obligation_id: string;
  entity_id: string | null;
  obligation_code: string;
  workspace_id: string;
  obligation_created_at: string;
  source_event_id: string | null;
  source_system: string | null;
  source_event_key: string | null;
  source_event_type: string | null;
  source_event_created_at: string | null;
  receipt_id: string | null;
  receipt_entity_id: string | null;
  resolution_type: string | null;
  proof_status: string | null;
  receipt_emitted_at: string | null;
  truth_burden: string | null;
  due_at: string | null;
  lifecycle_state: string;
};

type SummaryValue = number | string | null;

export type SystemProofBoardProps = {
  mode: "live" | "placeholder" | "error";
  generatedAt: string;
  summary: {
    sourceEvents: SummaryValue;
    obligations: SummaryValue;
    receipts: SummaryValue;
    failed: SummaryValue;
    overdue: SummaryValue;
    open: SummaryValue;
    retries: SummaryValue;
    projection: SummaryValue;
  };
  lifecycleRows: LifecycleRow[];
  watchdogRows: LifecycleRow[];
  note: string;
  error?: string;
};

const lifecycleSteps = [
  "EVENT RECORDED",
  "OBLIGATION OPENED",
  "RESOLUTION PROVEN",
  "RECEIPT EMITTED",
];

const leftRail = [
  "KERNEL",
  "OBLIGATIONS",
  "RECEIPTS",
  "FAILURES",
  "WATCHDOG",
];

function formatValue(value: SummaryValue): string {
  if (value === null || typeof value === "undefined") {
    return "--";
  }

  if (typeof value === "number") {
    return new Intl.NumberFormat("en-US").format(value);
  }

  return value;
}

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "not emitted";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function compactId(value: string | null): string {
  if (!value) {
    return "none";
  }

  if (value.length <= 18) {
    return value;
  }

  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function firstRows(
  rows: LifecycleRow[],
  predicate: (row: LifecycleRow) => boolean
): LifecycleRow[] {
  return rows.filter(predicate).slice(0, 3);
}

function renderRow(row: LifecycleRow) {
  return (
    <article key={row.obligation_id} className="rowCard">
      <div className="rowCardTop">
        <span className={`stateBadge state-${row.lifecycle_state}`}>
          {row.lifecycle_state}
        </span>
        <span className="rowCode">{row.obligation_code}</span>
      </div>
      <div className="rowMeta">
        <span>{row.source_event_type ?? "source event pending"}</span>
        <span>{row.truth_burden ?? "truth burden n/a"}</span>
      </div>
      <div className="rowMeta">
        <span>entity {compactId(row.entity_id)}</span>
        <span>receipt {compactId(row.receipt_id)}</span>
      </div>
      <div className="rowMeta">
        <span>opened {formatTimestamp(row.obligation_created_at)}</span>
        <span>due {formatTimestamp(row.due_at)}</span>
      </div>
    </article>
  );
}

function ProofCard({
  title,
  value,
  tone,
  description,
  rows,
}: {
  title: string;
  value: SummaryValue;
  tone: "neutral" | "success" | "warning" | "danger";
  description: string;
  rows: LifecycleRow[];
}) {
  return (
    <section className={`proofCard proofCard-${tone}`}>
      <div className="cardHeader">
        <span className="cardLabel">{title}</span>
        <span className="cardValue">{formatValue(value)}</span>
      </div>
      <p className="cardDescription">{description}</p>
      <div className="rowList">
        {rows.length > 0 ? rows.map(renderRow) : <div className="emptyState">No rows in the current read slice.</div>}
      </div>
    </section>
  );
}

export function SystemProofBoard({
  mode,
  generatedAt,
  summary,
  lifecycleRows,
  watchdogRows,
  note,
  error,
}: SystemProofBoardProps) {
  const openRows = firstRows(lifecycleRows, (row) => row.lifecycle_state === "open");
  const receiptRows = firstRows(lifecycleRows, (row) => Boolean(row.receipt_id));
  const failedRows = firstRows(lifecycleRows, (row) => row.lifecycle_state === "failed");

  const statusRail = [
    { label: "OPEN", value: summary.open },
    { label: "FAILED", value: summary.failed },
    { label: "OVERDUE", value: summary.overdue },
    { label: "RETRIES", value: summary.retries },
    { label: "PROJECTION", value: summary.projection },
  ];

  return (
    <main className="proofSurface">
      <div className="grain" />
      <div className="frame">
        <aside className="leftRail">
          <div className="railLabel">READ ONLY PROJECTION SURFACE</div>
          <nav className="navStack" aria-label="System sections">
            {leftRail.map((item) => (
              <div key={item} className="navItem">
                <span className="navMarker" />
                <span>{item}</span>
              </div>
            ))}
          </nav>
        </aside>

        <section className="centerColumn">
          <header className="heroPanel">
            <div className="heroEyebrow">AutoKirk Future</div>
            <h1>Failures Do Not Disappear</h1>
            <p>
              Every event becomes an obligation. Every obligation remains active
              until proven resolved.
            </p>
            <div className="heroMeta">
              <span className={`modeTag mode-${mode}`}>{mode.toUpperCase()}</span>
              <span>generated {formatTimestamp(generatedAt)}</span>
            </div>
          </header>

          <section className="lifecyclePanel" aria-label="Lifecycle row">
            {lifecycleSteps.map((step, index) => (
              <div key={step} className="lifecycleStep">
                <span>{step}</span>
                {index < lifecycleSteps.length - 1 ? (
                  <span className="lifecycleArrow">-&gt;</span>
                ) : null}
              </div>
            ))}
          </section>

          <section className="proofGrid">
            <ProofCard
              title="Source Events"
              value={summary.sourceEvents}
              tone="neutral"
              description="Projection truth anchored to recorded source events."
              rows={firstRows(lifecycleRows, (row) => Boolean(row.source_event_id))}
            />
            <ProofCard
              title="Obligations"
              value={summary.obligations}
              tone="neutral"
              description="Open and terminal obligation rows from the lifecycle projection."
              rows={lifecycleRows.slice(0, 3)}
            />
            <ProofCard
              title="Receipts"
              value={summary.receipts}
              tone="success"
              description="Receipts remain visible as proof-backed terminal artifacts."
              rows={receiptRows}
            />
            <ProofCard
              title="Failed"
              value={summary.failed}
              tone="danger"
              description="Failure remains visible until the kernel emits a terminal receipt."
              rows={failedRows}
            />
            <ProofCard
              title="Overdue"
              value={summary.overdue}
              tone="warning"
              description="Read-only watchdog rows sourced from public.overdue_failure_watchdog."
              rows={watchdogRows.slice(0, 3)}
            />
            <ProofCard
              title="Projection Status"
              value={summary.projection}
              tone="neutral"
              description={note}
              rows={openRows}
            />
          </section>

          <section className="footerPanel">
            <div className="footerLine">
              <span className="footerKey">Mode</span>
              <span>{mode.toUpperCase()}</span>
            </div>
            <div className="footerLine">
              <span className="footerKey">Authority</span>
              <span>Kernel mutation authority remains outside this UI.</span>
            </div>
            {error ? (
              <div className="footerError">
                <span className="footerKey">Read failure</span>
                <span>{error}</span>
              </div>
            ) : null}
          </section>
        </section>

        <aside className="rightRail">
          {statusRail.map((item) => (
            <div key={item.label} className="statusItem">
              <div className="statusLabel">{item.label}</div>
              <div className="statusValue">{formatValue(item.value)}</div>
            </div>
          ))}
        </aside>
      </div>

      <style jsx>{`
        .proofSurface {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at top left, rgba(217, 166, 55, 0.12), transparent 28%),
            radial-gradient(circle at top right, rgba(217, 166, 55, 0.08), transparent 24%),
            linear-gradient(180deg, #090806 0%, #0e0b07 52%, #090806 100%);
          color: #f6e7b6;
          font-family:
            "IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono",
            Menlo, monospace;
        }

        .grain {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255, 214, 102, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 214, 102, 0.03) 1px, transparent 1px);
          background-size: 100% 4px, 4px 100%;
          opacity: 0.24;
          pointer-events: none;
        }

        .frame {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          display: grid;
          grid-template-columns: 220px minmax(0, 1fr) 220px;
          gap: 20px;
          padding: 24px;
        }

        .leftRail,
        .rightRail,
        .heroPanel,
        .lifecyclePanel,
        .proofCard,
        .footerPanel {
          border: 1px solid rgba(246, 231, 182, 0.12);
          background: rgba(7, 6, 5, 0.86);
          box-shadow:
            inset 0 0 0 1px rgba(217, 166, 55, 0.05),
            0 24px 80px rgba(0, 0, 0, 0.34);
        }

        .leftRail,
        .rightRail {
          display: grid;
          align-content: start;
          gap: 18px;
          padding: 20px;
          backdrop-filter: blur(18px);
        }

        .centerColumn {
          display: grid;
          gap: 20px;
          align-content: start;
        }

        .railLabel,
        .heroEyebrow,
        .cardLabel,
        .statusLabel,
        .footerKey {
          color: #cf9f31;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          font-size: 11px;
        }

        .navStack {
          display: grid;
          gap: 10px;
        }

        .navItem {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border: 1px solid rgba(217, 166, 55, 0.12);
          background: linear-gradient(90deg, rgba(217, 166, 55, 0.08), transparent);
          color: #f9efcb;
        }

        .navMarker {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #cf9f31;
          box-shadow: 0 0 18px rgba(217, 166, 55, 0.5);
        }

        .heroPanel {
          padding: 28px;
        }

        h1 {
          margin: 12px 0 16px;
          color: #fff5d6;
          font-size: clamp(2.6rem, 5vw, 4.75rem);
          line-height: 0.96;
          text-transform: uppercase;
        }

        p {
          margin: 0;
          max-width: 760px;
          color: #d8c590;
          font-size: 17px;
          line-height: 1.8;
        }

        .heroMeta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 18px;
          color: #bfa564;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .modeTag {
          padding: 6px 10px;
          border: 1px solid rgba(217, 166, 55, 0.18);
          background: rgba(217, 166, 55, 0.08);
        }

        .mode-live {
          color: #f5dd96;
        }

        .mode-placeholder {
          color: #f0b85f;
        }

        .mode-error {
          color: #ff8d67;
        }

        .lifecyclePanel {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          padding: 18px;
        }

        .lifecycleStep {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 78px;
          padding: 0 12px;
          border: 1px solid rgba(217, 166, 55, 0.12);
          color: #fff2c5;
          background: linear-gradient(180deg, rgba(217, 166, 55, 0.1), rgba(217, 166, 55, 0.02));
          text-align: center;
          font-size: 13px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .lifecycleArrow {
          color: #cf9f31;
        }

        .proofGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .proofCard {
          display: grid;
          gap: 14px;
          padding: 20px;
          min-height: 280px;
        }

        .proofCard-success {
          box-shadow:
            inset 0 0 0 1px rgba(119, 154, 92, 0.12),
            0 24px 80px rgba(0, 0, 0, 0.34);
        }

        .proofCard-warning {
          box-shadow:
            inset 0 0 0 1px rgba(189, 133, 50, 0.16),
            0 24px 80px rgba(0, 0, 0, 0.34);
        }

        .proofCard-danger {
          box-shadow:
            inset 0 0 0 1px rgba(190, 92, 66, 0.16),
            0 24px 80px rgba(0, 0, 0, 0.34);
        }

        .cardHeader {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 16px;
        }

        .cardValue,
        .statusValue {
          color: #fff5d6;
          font-size: clamp(1.4rem, 3vw, 2.6rem);
          line-height: 1;
        }

        .cardDescription {
          color: #ceb980;
          font-size: 13px;
          line-height: 1.7;
        }

        .rowList {
          display: grid;
          gap: 10px;
        }

        .rowCard,
        .statusItem {
          border: 1px solid rgba(217, 166, 55, 0.12);
          background: rgba(217, 166, 55, 0.04);
        }

        .rowCard {
          display: grid;
          gap: 8px;
          padding: 12px;
        }

        .rowCardTop,
        .rowMeta {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .rowCode {
          color: #f9efcb;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .rowMeta {
          color: #bca770;
          font-size: 12px;
        }

        .stateBadge {
          padding: 4px 8px;
          border: 1px solid rgba(217, 166, 55, 0.2);
          color: #0b0906;
          background: #cf9f31;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .state-open {
          background: #c59a2d;
        }

        .state-resolved {
          background: #7d9f61;
        }

        .state-failed {
          background: #bf6b4c;
        }

        .emptyState {
          padding: 12px;
          border: 1px dashed rgba(217, 166, 55, 0.16);
          color: #9d8857;
          font-size: 12px;
        }

        .footerPanel {
          display: grid;
          gap: 10px;
          padding: 18px 20px;
        }

        .footerLine,
        .footerError {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          color: #d5c390;
          font-size: 12px;
        }

        .footerError {
          color: #ff9b78;
        }

        .rightRail {
          gap: 12px;
        }

        .statusItem {
          padding: 14px;
        }

        @media (max-width: 1180px) {
          .frame {
            grid-template-columns: 1fr;
          }

          .leftRail,
          .rightRail {
            grid-template-columns: repeat(5, minmax(0, 1fr));
          }

          .navStack {
            grid-template-columns: repeat(5, minmax(0, 1fr));
          }
        }

        @media (max-width: 920px) {
          .proofGrid,
          .lifecyclePanel,
          .leftRail,
          .rightRail,
          .navStack {
            grid-template-columns: 1fr;
          }

          .frame {
            padding: 16px;
          }

          .heroPanel,
          .lifecyclePanel,
          .proofCard,
          .footerPanel,
          .leftRail,
          .rightRail {
            padding-left: 16px;
            padding-right: 16px;
          }
        }
      `}</style>
    </main>
  );
}
