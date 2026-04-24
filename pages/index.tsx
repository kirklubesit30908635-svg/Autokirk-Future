import type { CSSProperties } from "react";
import { useState } from "react";

type ProofArtifact = Record<string, unknown>;

type LiveProofResponse =
  | {
      ok: true;
      event: ProofArtifact;
      obligation: ProofArtifact;
      resolution: ProofArtifact;
      receipt: ProofArtifact;
      lifecycle_state: string;
      entity_id: string | null;
      receipt_entity_id: string | null;
    }
  | {
      ok: false;
      error: string;
    };

type ProofCardProps = {
  title: string;
  eyebrow: string;
  body: string;
  artifact?: ProofArtifact;
};

function ProofCard({ title, eyebrow, body, artifact }: ProofCardProps) {
  return (
    <section style={styles.card}>
      <div style={styles.eyebrow}>{eyebrow}</div>
      <h2 style={styles.cardTitle}>{title}</h2>
      <p style={styles.cardBody}>{body}</p>
      {artifact ? (
        <pre style={styles.pre}>{JSON.stringify(artifact, null, 2)}</pre>
      ) : null}
    </section>
  );
}

export default function Home() {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LiveProofResponse | null>(null);

  async function runLiveProof() {
    try {
      setRunning(true);
      setError(null);

      const response = await fetch("/api/live-proof/run", {
        method: "POST",
      });

      const data = (await response.json()) as LiveProofResponse;

      if (!response.ok) {
        throw new Error("error" in data ? data.error : "LIVE_PROOF_FAILED");
      }

      if (!data.ok) {
        throw new Error("error" in data ? data.error : "LIVE_PROOF_FAILED");
      }

      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "UNKNOWN_ERROR");
    } finally {
      setRunning(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.hero}>
          <div style={styles.kicker}>Live Proof Runner</div>
          <h1 style={styles.title}>AutoKirk Live Proof</h1>
          <p style={styles.statement}>
            AutoKirk proves what happened, how it resolved, and whose
            obligation it was.
          </p>
          <button
            type="button"
            onClick={runLiveProof}
            disabled={running}
            style={{
              ...styles.button,
              ...(running ? styles.buttonDisabled : {}),
            }}
          >
            {running ? "Running..." : "Run Live Proof"}
          </button>
          {error ? <div style={styles.error}>{error}</div> : null}
        </div>

        <div style={styles.cards}>
          <ProofCard
            title="Event"
            eyebrow="Step 1"
            body={
              result?.ok
                ? "A source event was ingested into the obligation pipeline."
                : "Run the proof to create a unique source event."
            }
            artifact={result?.ok ? result.event : undefined}
          />

          <ProofCard
            title="Obligation"
            eyebrow="Step 2"
            body={
              result?.ok
                ? `Lifecycle state: ${result.lifecycle_state}`
                : "The resulting obligation will appear here."
            }
            artifact={result?.ok ? result.obligation : undefined}
          />

          <ProofCard
            title="Resolution"
            eyebrow="Step 3"
            body={
              result?.ok
                ? "The obligation was resolved through the canonical API surface."
                : "The resolution event will appear here."
            }
            artifact={result?.ok ? result.resolution : undefined}
          />

          <ProofCard
            title="Receipt"
            eyebrow="Step 4"
            body={
              result?.ok
                ? "A receipt confirms the recorded terminal state."
                : "The emitted receipt will appear here."
            }
            artifact={result?.ok ? result.receipt : undefined}
          />

          <ProofCard
            title="Entity Attribution"
            eyebrow="Attribution"
            body={
              result?.ok
                ? `Obligation entity: ${result.entity_id ?? "missing"} | Receipt entity: ${
                    result.receipt_entity_id ?? "missing"
                  }`
                : "Entity attribution is shown after a successful run."
            }
          />
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "40px 20px",
    background:
      "radial-gradient(circle at top, rgba(185, 230, 255, 0.35), transparent 32%), #f4f7fb",
    color: "#102033",
    fontFamily:
      '"Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
  },
  shell: {
    maxWidth: 1120,
    margin: "0 auto",
    display: "grid",
    gap: 28,
  },
  hero: {
    padding: "32px",
    borderRadius: 24,
    background: "rgba(255, 255, 255, 0.88)",
    border: "1px solid rgba(16, 32, 51, 0.08)",
    boxShadow: "0 24px 60px rgba(16, 32, 51, 0.08)",
  },
  kicker: {
    fontSize: 12,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "#4b6b88",
    marginBottom: 12,
  },
  title: {
    margin: 0,
    fontSize: "clamp(2.2rem, 5vw, 4rem)",
    lineHeight: 1,
  },
  statement: {
    margin: "16px 0 24px",
    maxWidth: 700,
    fontSize: 18,
    lineHeight: 1.6,
    color: "#35506a",
  },
  button: {
    appearance: "none",
    border: 0,
    borderRadius: 999,
    padding: "14px 22px",
    background: "#102033",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
  },
  buttonDisabled: {
    cursor: "wait",
    opacity: 0.7,
  },
  error: {
    marginTop: 16,
    padding: "14px 16px",
    borderRadius: 16,
    background: "#fff1f1",
    color: "#b42318",
    border: "1px solid rgba(180, 35, 24, 0.12)",
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 18,
  },
  card: {
    minHeight: 240,
    padding: "22px",
    borderRadius: 20,
    background: "rgba(255, 255, 255, 0.92)",
    border: "1px solid rgba(16, 32, 51, 0.08)",
    boxShadow: "0 18px 40px rgba(16, 32, 51, 0.06)",
    display: "grid",
    alignContent: "start",
    gap: 10,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "#5d7a96",
  },
  cardTitle: {
    margin: 0,
    fontSize: 24,
  },
  cardBody: {
    margin: 0,
    color: "#47627c",
    lineHeight: 1.6,
  },
  pre: {
    margin: 0,
    padding: "14px",
    borderRadius: 14,
    background: "#0f1a28",
    color: "#d7e7f6",
    fontSize: 12,
    lineHeight: 1.5,
    overflowX: "auto",
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
  },
};
