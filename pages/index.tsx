import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";

type FailedRow = {
  obligation_id: string;
  entity_id: string;
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
  truth_burden: string;
  due_at: string | null;
  lifecycle_state: "failed";
  emission_id: string | null;
  delivery_target: string | null;
  delivery_status: string | null;
  emission_created_at: string | null;
  attempt_count: number | null;
  last_attempt_at: string | null;
  next_retry_at: string | null;
  max_attempts: number | null;
};

type FailedApiResponse =
  | { ok: true; count: number; rows: FailedRow[] }
  | { ok: false; error: string };

function formatDate(value: string | null): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [failedCount, setFailedCount] = useState(0);
  const [rows, setRows] = useState<FailedRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/watchdog/failed-obligations");
        const data = (await response.json()) as FailedApiResponse;

        if (!active) return;

        if (!response.ok || !data.ok) {
          setFailedCount(0);
          setRows([]);
          setError(data.ok ? "WATCHDOG_ROUTE_FAILED" : data.error);
          return;
        }

        setFailedCount(data.count);
        setRows(data.rows);
      } catch (err) {
        if (!active) return;

        setFailedCount(0);
        setRows([]);
        setError(err instanceof Error ? err.message : "UNKNOWN_ERROR");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const statusText = useMemo(() => {
    if (loading) return "LOADING";
    if (error) return "DEGRADED";
    if (failedCount > 0) return "ACTIVE FAILURES";
    return "CLEAR";
  }, [loading, error, failedCount]);

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div style={styles.navItem}>KERNEL</div>
        <div style={styles.navItem}>OBLIGATIONS</div>
        <div style={styles.navItem}>RECEIPTS</div>
        <div style={styles.navItem}>FAILURES</div>
        <div style={styles.navItem}>WATCHDOG</div>
      </aside>

      <main style={styles.main}>
        <div style={styles.badge}>ENFORCEMENT SURFACE</div>

        <h1 style={styles.title}>Failures Do Not Disappear</h1>

        <p style={styles.sub}>
          Every event becomes obligation. Every obligation remains active until
          valid proof resolves it.
        </p>

        <div style={styles.commandBox}>
          <div style={styles.commandLabel}>watchdog.route</div>
          <div style={styles.commandValue}>/api/watchdog/failed-obligations</div>
        </div>

        <div style={styles.statusRow}>
          <div style={styles.statusPill}>STATUS: {statusText}</div>
          <div style={styles.statusPill}>
            {loading ? "SYNCING…" : error ? "ERROR" : "TRUTH CONNECTED"}
          </div>
        </div>

        {error ? (
          <div style={styles.errorBox}>ERROR: {error}</div>
        ) : rows.length === 0 ? (
          <div style={styles.emptyBox}>
            No failed or overdue obligations are currently surfaced.
          </div>
        ) : (
          <div style={styles.tableWrap}>
            <div style={styles.tableHeader}>
              <div>OBLIGATION</div>
              <div>ENTITY</div>
              <div>DUE</div>
              <div>DELIVERY</div>
              <div>ATTEMPTS</div>
            </div>

            {rows.map((row) => (
              <div key={row.obligation_id} style={styles.tableRow}>
                <div style={styles.primaryCell}>
                  <div style={styles.code}>{row.obligation_code}</div>
                  <div style={styles.meta}>{row.obligation_id}</div>
                </div>
                <div style={styles.entityCell}>
                  <div style={styles.meta}>{row.entity_id}</div>
                  <div style={styles.entitySub}>
                    {row.receipt_entity_id
                      ? `receipt: ${row.receipt_entity_id}`
                      : "receipt: pending"}
                  </div>
                </div>
                <div>{formatDate(row.due_at)}</div>
                <div>{row.delivery_status ?? "pending"}</div>
                <div>{row.attempt_count ?? 0}</div>
              </div>
            ))}
          </div>
        )}
      </main>

      <aside style={styles.rightPanel}>
        <div style={styles.stat}>FAILED: {loading ? "…" : failedCount}</div>
        <div style={styles.stat}>
          ROWS: {loading ? "…" : rows.length}
        </div>
        <div style={styles.stat}>STATUS: {statusText}</div>
        <div style={styles.stat}>
          ROUTE: {error ? "DEGRADED" : loading ? "SYNCING" : "OK"}
        </div>
        <div style={styles.stat}>
          ENTITY: {loading ? "…" : rows[0]?.entity_id ?? "NONE"}
        </div>
      </aside>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    display: "flex",
    minHeight: "100vh",
    background: "#050505",
    color: "#e5e5e5",
    fontFamily: "Inter, sans-serif",
  },
  sidebar: {
    width: 200,
    padding: 24,
    borderRight: "1px solid rgba(255,215,0,0.1)",
  },
  navItem: {
    marginBottom: 16,
    fontSize: 12,
    letterSpacing: "0.2em",
    color: "#a3a3a3",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "48px 40px",
    gap: 20,
  },
  badge: {
    fontSize: 12,
    letterSpacing: "0.28em",
    textTransform: "uppercase",
    color: "#c9a84f",
  },
  title: {
    margin: 0,
    fontSize: 42,
    letterSpacing: "-0.03em",
    color: "#f5d27a",
  },
  sub: {
    maxWidth: 680,
    color: "#a3a3a3",
    lineHeight: 1.6,
    margin: 0,
  },
  commandBox: {
    width: "100%",
    maxWidth: 720,
    border: "1px solid rgba(255,215,0,0.2)",
    borderRadius: 8,
    padding: 14,
    background: "rgba(255,255,255,0.02)",
  },
  commandLabel: {
    fontSize: 11,
    letterSpacing: "0.2em",
    color: "#888",
    marginBottom: 6,
  },
  commandValue: {
    color: "#fff",
    fontSize: 14,
  },
  statusRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  statusPill: {
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,215,0,0.18)",
    color: "#f5d27a",
    fontSize: 12,
  },
  errorBox: {
    maxWidth: 720,
    border: "1px solid rgba(255,100,100,0.35)",
    background: "rgba(255,100,100,0.08)",
    borderRadius: 8,
    padding: 16,
    color: "#ffb4b4",
  },
  emptyBox: {
    maxWidth: 720,
    border: "1px solid rgba(255,215,0,0.15)",
    background: "rgba(255,255,255,0.02)",
    borderRadius: 8,
    padding: 16,
    color: "#d4d4d4",
  },
  tableWrap: {
    width: "100%",
    maxWidth: 900,
    border: "1px solid rgba(255,215,0,0.15)",
    borderRadius: 10,
    overflow: "hidden",
  },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "1.6fr 1.9fr 1.2fr 1fr 0.7fr",
    gap: 12,
    padding: "12px 14px",
    background: "rgba(255,255,255,0.03)",
    fontSize: 11,
    letterSpacing: "0.18em",
    color: "#999",
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "1.6fr 1.9fr 1.2fr 1fr 0.7fr",
    gap: 12,
    padding: "14px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    alignItems: "center",
    fontSize: 13,
  },
  primaryCell: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  code: {
    color: "#f5d27a",
    fontWeight: 600,
  },
  meta: {
    color: "#8a8a8a",
    fontSize: 11,
    overflowWrap: "anywhere",
  },
  entityCell: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  entitySub: {
    color: "#7a7a7a",
    fontSize: 10,
    overflowWrap: "anywhere",
  },
  rightPanel: {
    width: 240,
    padding: 24,
    borderLeft: "1px solid rgba(255,215,0,0.1)",
  },
  stat: {
    marginBottom: 12,
    fontSize: 12,
    color: "#f5d27a",
    letterSpacing: "0.08em",
  },
};
