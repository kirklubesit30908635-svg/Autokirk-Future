import type { CSSProperties } from "react";

export default function Home() {
  return (
    <div style={styles.page}>
      
      {/* LEFT NAV */}
      <aside style={styles.sidebar}>
        <div style={styles.navItem}>KERNEL</div>
        <div style={styles.navItem}>OBLIGATIONS</div>
        <div style={styles.navItem}>RECEIPTS</div>
        <div style={styles.navItem}>FAILURES</div>
        <div style={styles.navItem}>WATCHDOG</div>
      </aside>

      {/* CENTER */}
      <main style={styles.main}>
        <img src="/seal.png" style={styles.seal} />

        <h1 style={styles.title}>
          Failures Do Not Disappear
        </h1>

        <p style={styles.sub}>
          Every event becomes obligation.  
          Every obligation remains active until proven resolved.
        </p>

        <div style={styles.commandBox}>
          <input
            placeholder="Inspect system truth..."
            style={styles.input}
          />
        </div>

        <div style={styles.systemLog}>
          <div>event recorded</div>
          <div>obligation opened</div>
          <div>delivery failed</div>
          <div>retry scheduled</div>
          <div>receipt absent</div>
        </div>
      </main>

      {/* RIGHT PANEL */}
      <aside style={styles.rightPanel}>
        <div style={styles.stat}>OPEN: 12</div>
        <div style={styles.stat}>FAILED: 4</div>
        <div style={styles.stat}>OVERDUE: 2</div>
        <div style={styles.stat}>RETRIES: 3</div>
        <div style={styles.stat}>PROJECTION: OK</div>
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
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    gap: 24,
  },

  seal: {
    width: 220,
    marginBottom: 16,
  },

  title: {
    fontSize: 42,
    letterSpacing: "-0.03em",
    color: "#f5d27a",
  },

  sub: {
    maxWidth: 500,
    color: "#a3a3a3",
    lineHeight: 1.6,
  },

  commandBox: {
    width: 500,
    border: "1px solid rgba(255,215,0,0.2)",
    borderRadius: 8,
    padding: 12,
  },

  input: {
    width: "100%",
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#fff",
    fontSize: 14,
  },

  systemLog: {
    marginTop: 20,
    fontSize: 12,
    color: "#888",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  rightPanel: {
    width: 200,
    padding: 24,
    borderLeft: "1px solid rgba(255,215,0,0.1)",
  },

  stat: {
    marginBottom: 12,
    fontSize: 12,
    color: "#f5d27a",
  },
};