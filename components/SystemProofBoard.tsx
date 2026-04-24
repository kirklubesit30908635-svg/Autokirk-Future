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

const leftRail = [
  "KERNEL",
  "OBLIGATIONS",
  "RECEIPTS",
  "FAILURES",
  "WATCHDOG",
];

function formatValue(value: SummaryValue): string {
  if (value === null || typeof value === "undefined" || value === "") {
    return "—";
  }

  if (typeof value === "number") {
    return new Intl.NumberFormat("en-US").format(value);
  }

  return value;
}

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "—";
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
    return "—";
  }

  if (value.length <= 20) {
    return value;
  }

  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}

function selectRows(
  rows: LifecycleRow[],
  predicate: (row: LifecycleRow) => boolean,
  limit = 4
): LifecycleRow[] {
  return rows.filter(predicate).slice(0, limit);
}

function getProjectionTone(
  projection: string
): "projectionOk" | "projectionFailing" | "projectionOffline" {
  if (projection === "OK") {
    return "projectionOk";
  }

  if (projection === "FAILING") {
    return "projectionFailing";
  }

  return "projectionOffline";
}

function getLifecycleOutcome(rows: LifecycleRow[]): string {
  if (rows.some((row) => row.lifecycle_state === "failed")) {
    return "FAILURE RECORDED";
  }

  if (
    rows.some(
      (row) =>
        row.lifecycle_state === "resolved" ||
        row.proof_status === "sufficient" ||
        row.proof_status === "accepted"
    )
  ) {
    return "RESOLUTION PROVEN";
  }

  return "RESOLUTION PENDING";
}

function getReceiptOutcome(rows: LifecycleRow[]): string {
  if (rows.some((row) => Boolean(row.receipt_id))) {
    return "RECEIPT EMITTED";
  }

  return "RECEIPT ABSENT";
}

function RowField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="field">
      <div className="fieldLabel">{label}</div>
      <div className="fieldValue">{value}</div>
    </div>
  );
}

function RowRecord({ row }: { row: LifecycleRow }) {
  return (
    <article className="record">
      <div className="recordTop">
        <div className="recordIdentity">
          <div className="recordCode">{row.obligation_code}</div>
          <div className="recordSource">
            {row.source_event_type ?? "NO SOURCE EVENT TYPE"}
          </div>
        </div>

        <div className={`stateBadge state-${row.lifecycle_state}`}>
          {row.lifecycle_state}
        </div>
      </div>

      <div className="fieldGrid">
        <RowField label="CODE" value={row.obligation_code} />
        <RowField label="STATE" value={row.lifecycle_state.toUpperCase()} />
        <RowField
          label="BURDEN"
          value={(row.truth_burden ?? "—").toUpperCase()}
        />
        <RowField label="RECEIPT" value={compactId(row.receipt_id)} />
        <RowField label="OPENED" value={formatTimestamp(row.obligation_created_at)} />
        <RowField label="DUE" value={formatTimestamp(row.due_at)} />
      </div>
    </article>
  );
}

function StreamSection({
  title,
  value,
  description,
  rows,
}: {
  title: string;
  value: SummaryValue;
  description: string;
  rows: LifecycleRow[];
}) {
  return (
    <section className="streamSection">
      <div className="streamHeader">
        <div>
          <div className="sectionTitle">{title}</div>
          <p className="sectionDescription">{description}</p>
        </div>
        <div className="sectionValue">{formatValue(value)}</div>
      </div>

      <div className="recordList">
        {rows.length > 0 ? (
          rows.map((row) => <RowRecord key={row.obligation_id} row={row} />)
        ) : (
          <div className="emptyState">NO LIVE DATA</div>
        )}
      </div>
    </section>
  );
}

export function SystemProofBoard({
  generatedAt,
  summary,
  lifecycleRows,
  watchdogRows,
  note,
  error,
}: SystemProofBoardProps) {
  const projection = String(summary.projection ?? "NO LIVE DATA");
  const projectionTone = getProjectionTone(projection);
  const lifecycleOutcome = getLifecycleOutcome(lifecycleRows);
  const receiptOutcome = getReceiptOutcome(lifecycleRows);

  const sourceRows = selectRows(lifecycleRows, (row) => Boolean(row.source_event_id));
  const obligationRows = lifecycleRows.slice(0, 4);
  const receiptRows = selectRows(lifecycleRows, (row) => Boolean(row.receipt_id));
  const failedRows = selectRows(
    lifecycleRows,
    (row) => row.lifecycle_state === "failed"
  );
  const overdueRows = watchdogRows.slice(0, 4);
  const projectionRows = selectRows(
    lifecycleRows,
    (row) =>
      row.lifecycle_state === "open" ||
      row.lifecycle_state === "failed" ||
      !row.receipt_id
  );

  const heroStats = [
    { label: "Source Events", value: summary.sourceEvents },
    { label: "Obligations", value: summary.obligations },
    { label: "Receipts", value: summary.receipts },
  ];

  const rightRail = [
    { label: "OPEN", value: summary.open },
    { label: "FAILED", value: summary.failed },
    { label: "OVERDUE", value: summary.overdue },
    { label: "RETRIES", value: summary.retries },
    { label: "PROJECTION", value: projection },
  ];

  return (
    <main className="surface">
      <div className="ambientGlow ambientGlowLeft" />
      <div className="ambientGlow ambientGlowRight" />
      <div className="frame">
        <aside className="leftRail">
          <div className="railBrand">
            <div className="eyebrow">READ ONLY PROJECTION SURFACE</div>
            <p className="railCopy">
              Kernel authority remains the sole mutation path. This surface only
              renders projection truth.
            </p>
          </div>

          <nav className="navList" aria-label="System sections">
            {leftRail.map((item) => (
              <div key={item} className="navItem">
                <span className="navPulse" />
                <span>{item}</span>
              </div>
            ))}
          </nav>

          <div className="railFooter">
            <div className="eyebrow">Generated</div>
            <div className="railTimestamp">{formatTimestamp(generatedAt)}</div>
          </div>
        </aside>

        <section className="workspace">
          <header className="heroPanel">
            <div className="heroTop">
              <div>
                <div className="heroEyebrow">AUTOKIRK FUTURE</div>
                <h1>FAILURES DO NOT DISAPPEAR</h1>
                <p className="heroCopy">
                  Every event becomes an obligation. Every obligation remains
                  active until proven resolved.
                </p>
              </div>

              <div className={`projectionChip ${projectionTone}`}>
                <span>PROJECTION</span>
                <strong>{projection}</strong>
              </div>
            </div>

            <div className="heroStats">
              {heroStats.map((item) => (
                <div key={item.label} className="heroStatCard">
                  <div className="heroStatLabel">{item.label}</div>
                  <div className="heroStatValue">{formatValue(item.value)}</div>
                </div>
              ))}
            </div>
          </header>

          <section className="proofPanel">
            <div className="proofPanelHeader">
              <div>
                <div className="sectionLabel">Main Proof Block</div>
                <p className="proofCopy">
                  The lifecycle remains visible until proof or failure is
                  explicitly recorded by the kernel.
                </p>
              </div>
              <div className="proofMeta">{formatTimestamp(generatedAt)}</div>
            </div>

            <div className="lifecycleStrip">
              <div className="lifecycleNode">
                <span className="nodeIndex">01</span>
                <span className="nodeLabel">EVENT RECORDED</span>
              </div>
              <div className="lifecycleConnector" />
              <div className="lifecycleNode">
                <span className="nodeIndex">02</span>
                <span className="nodeLabel">OBLIGATION OPENED</span>
              </div>
              <div className="lifecycleConnector" />
              <div className="lifecycleNode lifecycleNodeAccent">
                <span className="nodeIndex">03</span>
                <span className="nodeLabel">{lifecycleOutcome}</span>
              </div>
              <div className="lifecycleConnector" />
              <div className="lifecycleNode lifecycleNodeAccent">
                <span className="nodeIndex">04</span>
                <span className="nodeLabel">{receiptOutcome}</span>
              </div>
            </div>

            <div className="noticeStack">
              <div className="noticeCard">
                <div className="noticeLabel">READ MODEL</div>
                <div className="noticeBody">{note}</div>
              </div>
              {error ? (
                <div className="noticeCard noticeError">
                  <div className="noticeLabel">ERROR</div>
                  <div className="noticeBody">{error}</div>
                </div>
              ) : null}
            </div>
          </section>

          <div className="sections">
            <StreamSection
              title="Source Events"
              value={summary.sourceEvents}
              description="Latest recorded events attached to obligation truth."
              rows={sourceRows}
            />
            <StreamSection
              title="Obligations"
              value={summary.obligations}
              description="Open and recent obligations in the projection stream."
              rows={obligationRows}
            />
            <StreamSection
              title="Receipts"
              value={summary.receipts}
              description="Receipt-backed lifecycle proofs emitted by the system."
              rows={receiptRows}
            />
            <StreamSection
              title="Failed"
              value={summary.failed}
              description="Failure states remain visible until doctrine-valid proof exists."
              rows={failedRows}
            />
            <StreamSection
              title="Overdue"
              value={summary.overdue}
              description="Watchdog rows surfaced from the overdue failure read model."
              rows={overdueRows}
            />
            <StreamSection
              title="Projection Status"
              value={projection}
              description="Current projection health with unresolved or receipt-absent rows."
              rows={projectionRows}
            />
          </div>
        </section>

        <aside className="rightRail">
          <div className="statusStack">
            {rightRail.map((item) => (
              <div key={item.label} className="statusCard">
                <div className="statusLabel">{item.label}</div>
                <div
                  className={`statusValue ${
                    item.label === "PROJECTION" ? projectionTone : ""
                  }`}
                >
                  {formatValue(item.value)}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <style jsx>{`
        .surface {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at top left, rgba(212, 175, 55, 0.16), transparent 30%),
            radial-gradient(circle at 85% 0%, rgba(212, 175, 55, 0.08), transparent 24%),
            linear-gradient(180deg, #050403 0%, #090705 48%, #040302 100%);
          color: #f3ead3;
          font-family:
            "Söhne", "Avenir Next", "Segoe UI", system-ui, sans-serif;
        }

        .ambientGlow {
          position: absolute;
          width: 34rem;
          height: 34rem;
          border-radius: 999px;
          filter: blur(100px);
          opacity: 0.08;
          pointer-events: none;
        }

        .ambientGlowLeft {
          top: -14rem;
          left: -10rem;
          background: #d4af37;
        }

        .ambientGlowRight {
          top: 14rem;
          right: -14rem;
          background: #8b6a17;
        }

        .frame {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          display: grid;
          grid-template-columns: 248px minmax(0, 1fr) 220px;
          gap: 24px;
          padding: 24px;
        }

        .leftRail,
        .heroPanel,
        .proofPanel,
        .streamSection,
        .statusCard {
          border: 1px solid rgba(243, 234, 211, 0.08);
          background:
            linear-gradient(180deg, rgba(19, 16, 12, 0.94), rgba(8, 7, 5, 0.94));
          box-shadow:
            inset 0 1px 0 rgba(255, 245, 215, 0.04),
            0 18px 60px rgba(0, 0, 0, 0.28);
        }

        .leftRail {
          display: grid;
          align-content: start;
          gap: 22px;
          padding: 24px 20px;
          border-radius: 28px;
        }

        .eyebrow,
        .heroEyebrow,
        .sectionLabel,
        .heroStatLabel,
        .statusLabel,
        .fieldLabel,
        .noticeLabel {
          color: #d4af37;
          font-family:
            "IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono",
            Menlo, monospace;
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .railCopy,
        .heroCopy,
        .proofCopy,
        .sectionDescription,
        .noticeBody,
        .railTimestamp {
          color: #cbbd96;
          line-height: 1.75;
        }

        .railCopy,
        .proofCopy,
        .sectionDescription,
        .noticeBody,
        .railTimestamp {
          font-size: 13px;
        }

        .navList {
          display: grid;
          gap: 10px;
        }

        .navItem {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 14px;
          border-radius: 16px;
          border: 1px solid rgba(212, 175, 55, 0.08);
          background: rgba(212, 175, 55, 0.04);
          color: #f6eed5;
          font-family:
            "IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono",
            Menlo, monospace;
          font-size: 13px;
          letter-spacing: 0.05em;
        }

        .navPulse {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #d4af37;
          box-shadow: 0 0 18px rgba(212, 175, 55, 0.6);
        }

        .workspace {
          display: grid;
          gap: 20px;
          align-content: start;
        }

        .heroPanel,
        .proofPanel,
        .streamSection {
          border-radius: 28px;
        }

        .heroPanel {
          padding: 30px;
          display: grid;
          gap: 24px;
        }

        .heroTop {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: start;
          flex-wrap: wrap;
        }

        h1 {
          margin: 8px 0 14px;
          max-width: 10ch;
          color: #fff5da;
          font-size: clamp(2.8rem, 5.2vw, 5.6rem);
          line-height: 0.94;
          letter-spacing: -0.04em;
        }

        .heroCopy {
          margin: 0;
          max-width: 760px;
          font-size: 17px;
        }

        .projectionChip {
          min-width: 170px;
          display: grid;
          gap: 8px;
          padding: 16px 18px;
          border-radius: 20px;
          border: 1px solid rgba(212, 175, 55, 0.12);
          background: rgba(212, 175, 55, 0.05);
          font-family:
            "IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono",
            Menlo, monospace;
          text-transform: uppercase;
        }

        .projectionChip span {
          font-size: 10px;
          letter-spacing: 0.18em;
        }

        .projectionChip strong {
          font-size: 1.4rem;
          line-height: 1.1;
        }

        .projectionOk {
          color: #87d38f;
        }

        .projectionFailing {
          color: #f59b7d;
        }

        .projectionOffline {
          color: #d8bb67;
        }

        .heroStats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .heroStatCard {
          padding: 18px;
          border-radius: 20px;
          border: 1px solid rgba(212, 175, 55, 0.1);
          background: linear-gradient(180deg, rgba(212, 175, 55, 0.08), rgba(212, 175, 55, 0.02));
        }

        .heroStatValue {
          margin-top: 10px;
          color: #fff2cf;
          font-size: clamp(1.4rem, 2.8vw, 2.15rem);
          line-height: 1;
        }

        .proofPanel {
          padding: 26px;
          display: grid;
          gap: 20px;
        }

        .proofPanelHeader {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: start;
          flex-wrap: wrap;
        }

        .proofCopy {
          margin: 10px 0 0;
          max-width: 620px;
        }

        .proofMeta {
          color: #9f9270;
          font-family:
            "IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono",
            Menlo, monospace;
          font-size: 12px;
          letter-spacing: 0.05em;
        }

        .lifecycleStrip {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 24px minmax(0, 1fr) 24px minmax(0, 1fr) 24px minmax(0, 1fr);
          align-items: center;
          gap: 10px;
        }

        .lifecycleNode {
          min-height: 122px;
          display: grid;
          align-content: start;
          gap: 18px;
          padding: 18px;
          border-radius: 22px;
          border: 1px solid rgba(212, 175, 55, 0.12);
          background: rgba(212, 175, 55, 0.04);
        }

        .lifecycleNodeAccent {
          background: linear-gradient(180deg, rgba(212, 175, 55, 0.12), rgba(212, 175, 55, 0.03));
          border-color: rgba(212, 175, 55, 0.2);
        }

        .nodeIndex {
          color: #a08c5b;
          font-family:
            "IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono",
            Menlo, monospace;
          font-size: 11px;
          letter-spacing: 0.18em;
        }

        .nodeLabel {
          color: #fff3d4;
          font-size: 15px;
          line-height: 1.4;
          text-transform: uppercase;
        }

        .lifecycleConnector {
          height: 1px;
          background: linear-gradient(90deg, rgba(212, 175, 55, 0.2), rgba(212, 175, 55, 0.7), rgba(212, 175, 55, 0.2));
        }

        .noticeStack {
          display: grid;
          gap: 12px;
        }

        .noticeCard {
          padding: 16px 18px;
          border-radius: 18px;
          border: 1px solid rgba(212, 175, 55, 0.08);
          background: rgba(212, 175, 55, 0.04);
        }

        .noticeError {
          border-color: rgba(245, 155, 125, 0.16);
          background: rgba(245, 155, 125, 0.06);
        }

        .sections {
          display: grid;
          gap: 18px;
        }

        .streamSection {
          padding: 24px;
          display: grid;
          gap: 18px;
        }

        .streamHeader {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: start;
        }

        .sectionTitle {
          color: #fff2cf;
          font-size: 1.2rem;
          line-height: 1.1;
        }

        .sectionDescription {
          margin: 10px 0 0;
          max-width: 680px;
        }

        .sectionValue {
          color: #fff2cf;
          font-size: clamp(1.5rem, 3vw, 2.7rem);
          line-height: 1;
          white-space: nowrap;
        }

        .recordList {
          display: grid;
          gap: 12px;
        }

        .record {
          padding: 18px;
          display: grid;
          gap: 14px;
          border-radius: 20px;
          border: 1px solid rgba(212, 175, 55, 0.08);
          background:
            linear-gradient(180deg, rgba(18, 16, 12, 0.92), rgba(13, 11, 8, 0.92));
        }

        .recordTop {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: start;
          flex-wrap: wrap;
        }

        .recordIdentity {
          display: grid;
          gap: 6px;
        }

        .recordCode {
          color: #fff3d7;
          font-family:
            "IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono",
            Menlo, monospace;
          font-size: 13px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .recordSource {
          color: #bca871;
          font-size: 13px;
          line-height: 1.5;
        }

        .stateBadge {
          padding: 7px 10px;
          border-radius: 999px;
          border: 1px solid rgba(212, 175, 55, 0.12);
          background: rgba(212, 175, 55, 0.07);
          font-family:
            "IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono",
            Menlo, monospace;
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .state-open {
          color: #edcb72;
        }

        .state-resolved {
          color: #87d38f;
        }

        .state-failed {
          color: #f59b7d;
        }

        .fieldGrid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 12px;
        }

        .field {
          display: grid;
          gap: 6px;
          min-width: 0;
        }

        .fieldValue {
          color: #efe2bc;
          font-family:
            "IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono",
            Menlo, monospace;
          font-size: 12px;
          line-height: 1.65;
          overflow-wrap: anywhere;
        }

        .emptyState {
          padding: 22px 18px;
          border-radius: 18px;
          border: 1px dashed rgba(212, 175, 55, 0.18);
          color: #d1bb73;
          font-family:
            "IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono",
            Menlo, monospace;
          font-size: 12px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .rightRail {
          display: grid;
          align-content: start;
        }

        .statusStack {
          display: grid;
          gap: 12px;
          position: sticky;
          top: 24px;
        }

        .statusCard {
          padding: 18px;
          border-radius: 22px;
        }

        .statusValue {
          margin-top: 10px;
          color: #fff2cf;
          font-size: clamp(1.35rem, 2.8vw, 2.2rem);
          line-height: 1.05;
          overflow-wrap: anywhere;
        }

        @media (max-width: 1260px) {
          .frame {
            grid-template-columns: 1fr;
          }

          .leftRail,
          .statusStack {
            position: static;
          }

          .navList,
          .statusStack {
            grid-template-columns: repeat(5, minmax(0, 1fr));
          }
        }

        @media (max-width: 1024px) {
          .heroStats,
          .fieldGrid,
          .navList,
          .statusStack,
          .lifecycleStrip {
            grid-template-columns: 1fr;
          }

          .lifecycleConnector {
            width: 1px;
            height: 20px;
            justify-self: center;
          }

          .heroTop,
          .streamHeader,
          .proofPanelHeader {
            flex-direction: column;
          }
        }

        @media (max-width: 720px) {
          .frame {
            padding: 14px;
            gap: 14px;
          }

          .leftRail,
          .heroPanel,
          .proofPanel,
          .streamSection,
          .statusCard {
            border-radius: 22px;
          }

          .leftRail,
          .heroPanel,
          .proofPanel,
          .streamSection,
          .statusCard {
            padding-left: 16px;
            padding-right: 16px;
          }

          h1 {
            font-size: 2.55rem;
          }
        }
      `}</style>
    </main>
  );
}
