import { FormEvent, useState } from "react";

type IntakeFormProps = {
  workspaceId: string;
};

type IntakeState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

export function IntakeForm({ workspaceId }: IntakeFormProps) {
  const [promise, setPromise] = useState("");
  const [obligationCode, setObligationCode] = useState("");
  const [proofRequired, setProofRequired] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [state, setState] = useState<IntakeState>({ kind: "idle" });

  const normalizedCode = toSlug(obligationCode);
  const canSubmit =
    promise.trim().length > 0 &&
    normalizedCode.length > 0 &&
    proofRequired.trim().length > 0 &&
    state.kind !== "submitting";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      setState({ kind: "error", message: "Promise, obligation code, and proof requirement are required." });
      return;
    }

    setState({ kind: "submitting" });

    try {
      const response = await fetch("/api/obligations/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          obligation_code: normalizedCode,
          promise: promise.trim(),
          proof_required: proofRequired.trim(),
          due_at: dueAt || null,
        }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        obligation_id?: string | null;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "INTAKE_FAILED");
      }

      setState({
        kind: "success",
        message: payload.obligation_id
          ? `Obligation opened: ${payload.obligation_id}`
          : "Obligation opened.",
      });
      setPromise("");
      setObligationCode("");
      setProofRequired("");
      setDueAt("");
      window.setTimeout(() => window.location.reload(), 650);
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "INTAKE_FAILED",
      });
    }
  }

  return (
    <section className="intake" aria-labelledby="intake-title">
      <div className="intro">
        <p className="eyebrow">Intake</p>
        <h2 id="intake-title">Define first obligation</h2>
        <p>
          Choose one promise. AutoKirk turns it into governed obligation truth through the canonical intake path.
        </p>
      </div>

      <form onSubmit={onSubmit}>
        <label>
          <span>What is owed?</span>
          <textarea
            value={promise}
            onChange={(event) => setPromise(event.target.value)}
            placeholder="Example: Send the monthly proof packet to the customer."
            rows={3}
            required
          />
        </label>

        <label>
          <span>Obligation code</span>
          <input
            value={obligationCode}
            onChange={(event) => setObligationCode(event.target.value)}
            placeholder="monthly_proof_packet"
            required
          />
          {obligationCode ? <small>Will be sealed as: {normalizedCode || "—"}</small> : null}
        </label>

        <label>
          <span>What proof closes it?</span>
          <textarea
            value={proofRequired}
            onChange={(event) => setProofRequired(event.target.value)}
            placeholder="Example: Customer-visible receipt, delivery link, or signed completion note."
            rows={3}
            required
          />
        </label>

        <label>
          <span>Due date / time</span>
          <input
            type="datetime-local"
            value={dueAt}
            onChange={(event) => setDueAt(event.target.value)}
          />
          <small>Captured in the intake payload. Kernel due-date binding can be tightened later.</small>
        </label>

        <div className="actions">
          <button type="submit" disabled={!canSubmit}>
            {state.kind === "submitting" ? "Opening..." : "Open governed obligation"}
          </button>
          {state.kind === "success" || state.kind === "error" ? (
            <p className={state.kind}>{state.message}</p>
          ) : null}
        </div>
      </form>

      <style jsx>{`
        .intake {
          border: 1px solid #d6d6db;
          border-radius: 16px;
          padding: 18px;
          background: #fff;
          display: grid;
          gap: 16px;
        }

        .intro {
          display: grid;
          gap: 6px;
        }

        .eyebrow {
          margin: 0;
          color: #52606d;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        h2,
        p {
          margin: 0;
        }

        h2 {
          color: #101828;
          font-size: 1.15rem;
        }

        .intro p {
          color: #52606d;
          line-height: 1.45;
        }

        form {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        label {
          display: grid;
          gap: 6px;
          color: #101828;
          font-weight: 650;
        }

        input,
        textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #cfd7e6;
          border-radius: 10px;
          padding: 10px 11px;
          font: inherit;
          color: #101828;
          background: #fff;
        }

        textarea {
          resize: vertical;
        }

        small {
          color: #667085;
          font-weight: 500;
        }

        .actions {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        button {
          border: 0;
          border-radius: 999px;
          padding: 11px 16px;
          background: #101828;
          color: white;
          font-weight: 750;
          cursor: pointer;
        }

        button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .success {
          color: #137333;
          font-weight: 650;
        }

        .error {
          color: #b42318;
          font-weight: 650;
        }

        @media (max-width: 900px) {
          form {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
