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
      <h1 style={styles.title}>AutoKirk Future</h1>
      <p style={styles.subtitle}>
        Kernel-backed proof of system behavior
      </p>

      {loading && <p>Loading system state...</p>}

      <div style={styles.chain}>
        {data.map((o) => (
          <div key={o.obligation_id} style={styles.card}>
            <div style={styles.step}>EVENT</div>
            <div>{o.source_system} / {o.source_event_type}</div>

            <div style={styles.arrow}>?</div>

            <div style={styles.step}>OBLIGATION</div>
            <div>{o.obligation_code}</div>

            <div style={styles.arrow}>?</div>

            <div style={styles.step}>STATE</div>
            <div style={{ color: "#ff6b6b" }}>
              {o.lifecycle_state.toUpperCase()}
            </div>

            {o.due_at && (
              <>
                <div style={styles.arrow}>?</div>
                <div style={styles.step}>DUE</div>
                <div>{new Date(o.due_at).toLocaleString()}</div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: any = {
  container: {
    minHeight: "100vh",
    background: "#0b0f14",
    color: "#e6edf3",
    padding: "40px",
    fontFamily: "Inter, sans-serif",
  },
  title: {
    fontSize: "40px",
    marginBottom: "10px",
  },
  subtitle: {
    color: "#8b949e",
    marginBottom: "40px",
  },
  chain: {
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
  },
  card: {
    background: "#11161c",
    border: "1px solid #1f2933",
    borderRadius: "12px",
    padding: "20px",
    width: "260px",
    boxShadow: "0 0 20px rgba(0,0,0,0.4)",
  },
  step: {
    fontSize: "12px",
    color: "#58a6ff",
    marginTop: "10px",
  },
  arrow: {
    textAlign: "center",
    margin: "10px 0",
    color: "#30363d",
  },
};
