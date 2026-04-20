import { useEffect, useState } from "react";

type Obligation = {
  obligation_id: string;
  obligation_code: string;
  source_event_type: string;
  source_system: string;
  lifecycle_state: string;
  due_at: string | null;
};

export default function Home() {
  const [data, setData] = useState<Obligation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/watchdog/failed-obligations")
      .then((res) => res.json())
      .then((json) => {
        setData(json.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div style={styles.badge}>KERNEL-ALIGNED PROOF SYSTEM</div>
        <h1 style={styles.title}>AutoKirk Future</h1>
        <p style={styles.subtitle}>
          A governed proof chain for real system behavior:
          event to obligation to resolution to receipt.
        </p>
      </div>

      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>Live failure watchdog</h2>
        <p style={styles.sectionText}>
          Read-only projection of unresolved failed obligations.
        </p>
      </div>

      {loading && <p style={styles.muted}>Loading system state...</p>}

      {!loading && data.length === 0 && (
        <div style={styles.emptyState}>
          <div style={styles.emptyTitle}>No overdue failed obligations</div>
          <div style={styles.muted}>
            The watchdog surface is live, but nothing is currently failing.
          </div>
        </div>
      )}

      <div style={styles.chain}>
        {data.map((o) => (
          <div key={o.obligation_id} style={styles.card}>
            <div style={styles.step}>EVENT</div>
            <div style={styles.value}>
              {o.source_system} / {o.source_event_type}
            </div>

            <div style={styles.arrow}>?</div>

            <div style={styles.step}>OBLIGATION</div>
            <div style={styles.value}>{o.obligation_code}</div>

            <div style={styles.arrow}>?</div>

            <div style={styles.step}>STATE</div>
            <div style={styles.failedState}>
              {o.lifecycle_state.toUpperCase()}
            </div>

            {o.due_at && (
              <>
                <div style={styles.arrow}>?</div>
                <div style={styles.step}>DUE</div>
                <div style={styles.value}>
                  {new Date(o.due_at).toLocaleString()}
                </div>
              </>
            )}

            <div style={styles.metaRow}>
              <span style={styles.metaLabel}>obligation_id</span>
              <span style={styles.metaValue}>{o.obligation_id}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, #111827 0%, #0b0f14 45%, #07090d 100%)",
    color: "#e6edf3",
    padding: "48px 24px",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  hero: {
    maxWidth: "980px",
    margin: "0 auto 48px auto",
  },
  badge: {
    display: "inline-block",
    padding: "6px 10px",
    border: "1px solid #1f2937",
    borderRadius: "999px",
    fontSize: "12px",
    letterSpacing: "0.08em",
    color: "#8b9bb0",
    marginBottom: "18px",
    background: "rgba(17, 24, 39, 0.7)",
  },
  title: {
    margin: 0,
    fontSize: "56px",
    lineHeight: 1.05,
    fontWeight: 700,
    letterSpacing: "-0.03em",
  },
  subtitle: {
    marginTop: "16px",
    maxWidth: "760px",
    fontSize: "20px",
    lineHeight: 1.6,
    color: "#9fb0c3",
  },
  sectionHeader: {
    maxWidth: "980px",
    margin: "0 auto 24px auto",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "24px",
    fontWeight: 600,
  },
  sectionText: {
    marginTop: "8px",
    color: "#8b9bb0",
  },
  muted: {
    color: "#8b9bb0",
    maxWidth: "980px",
    margin: "0 auto",
  },
  emptyState: {
    maxWidth: "980px",
    margin: "0 auto 24px auto",
    padding: "20px",
    borderRadius: "18px",
    border: "1px solid #1f2937",
    background: "rgba(17, 24, 39, 0.6)",
  },
  emptyTitle: {
    fontSize: "18px",
    fontWeight: 600,
    marginBottom: "8px",
  },
  chain: {
    maxWidth: "980px",
    margin: "24px auto 0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },
  card: {
    background: "rgba(17, 24, 39, 0.72)",
    border: "1px solid #1f2937",
    borderRadius: "20px",
    padding: "22px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
    backdropFilter: "blur(10px)",
  },
  step: {
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.12em",
    color: "#67e8f9",
    marginTop: "4px",
  },
  value: {
    marginTop: "6px",
    fontSize: "16px",
    lineHeight: 1.5,
    color: "#e6edf3",
    wordBreak: "break-word",
  },
  arrow: {
    margin: "12px 0",
    color: "#425066",
    fontSize: "18px",
  },
  failedState: {
    marginTop: "6px",
    fontSize: "16px",
    fontWeight: 700,
    color: "#f87171",
    letterSpacing: "0.04em",
  },
  metaRow: {
    marginTop: "18px",
    paddingTop: "14px",
    borderTop: "1px solid #1f2937",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  metaLabel: {
    fontSize: "11px",
    letterSpacing: "0.08em",
    color: "#8b9bb0",
    textTransform: "uppercase",
  },
  metaValue: {
    fontSize: "12px",
    color: "#cbd5e1",
    wordBreak: "break-all",
  },
};
