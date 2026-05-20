import type { BoardViewModel } from "../../lib/board/getTenantBoard";

type ProofLoopProps = {
  board: BoardViewModel;
};

type LoopStep = {
  label: string;
  description: string;
  state: "complete" | "current" | "waiting";
};

function stepClass(state: LoopStep["state"]): string {
  return `step ${state}`;
}

export function ProofLoop({ board }: ProofLoopProps) {
  const obligationCount = board.obligations.length;
  const receiptCount = board.receipts.length;
  const latestReceipt = board.receipts[0] ?? null;
  const hasOpenTruth = obligationCount > 0;
  const hasReceipt = receiptCount > 0;
  const hasCustomerHeldReceipt = Boolean(latestReceipt?.hash);

  const steps: LoopStep[] = [
    {
      label: "1. Define the promise",
      description:
        "The tenant chooses one obligation: what is owed, what proof closes it, and when it is late.",
      state: hasOpenTruth ? "complete" : "current",
    },
    {
      label: "2. Govern the obligation",
      description:
        "Once intake happens, the record becomes governed truth on the customer board.",
      state: hasOpenTruth ? "complete" : "waiting",
    },
    {
      label: "3. Resolve only with proof",
      description:
        "Closure must pass through the proof path before the obligation can be treated as resolved.",
      state: hasReceipt ? "complete" : hasOpenTruth ? "current" : "waiting",
    },
    {
      label: "4. Hand the customer a receipt",
      description:
        "The buyer gets a sealed receipt artifact with the receipt hash and sequence visible.",
      state: hasCustomerHeldReceipt ? "complete" : hasReceipt ? "current" : "waiting",
    },
  ];

  const headline = hasCustomerHeldReceipt
    ? "Loop sealed: obligation truth reached a customer-held receipt."
    : hasOpenTruth
      ? "Loop active: resolve one obligation with proof to seal the first customer receipt."
      : "Loop ready: define one obligation to start governed truth.";

  return (
    <section className="proofLoop" aria-labelledby="proof-loop-title">
      <div className="intro">
        <p className="eyebrow">Customer loop</p>
        <h2 id="proof-loop-title">Chosen intake → governed obligation → proof path → receipt</h2>
        <p className="headline">{headline}</p>
      </div>

      <ol className="steps">
        {steps.map((step) => (
          <li className={stepClass(step.state)} key={step.label}>
            <span className="marker" aria-hidden="true">
              {step.state === "complete" ? "✓" : step.state === "current" ? "•" : ""}
            </span>
            <div>
              <h3>{step.label}</h3>
              <p>{step.description}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="metrics" aria-label="Loop metrics">
        <div>
          <strong>{obligationCount}</strong>
          <span>visible obligations</span>
        </div>
        <div>
          <strong>{receiptCount}</strong>
          <span>sealed receipts</span>
        </div>
        <div>
          <strong>{latestReceipt?.sequence ?? "—"}</strong>
          <span>latest receipt sequence</span>
        </div>
      </div>

      <style jsx>{`
        .proofLoop {
          border: 1px solid #cfd7e6;
          border-radius: 16px;
          padding: 18px;
          background: linear-gradient(180deg, #ffffff 0%, #f4f7fb 100%);
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
        h3,
        p {
          margin: 0;
        }

        h2 {
          color: #101828;
          font-size: 1.25rem;
          line-height: 1.25;
        }

        .headline {
          color: #344054;
          line-height: 1.45;
        }

        .steps {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .step {
          border: 1px solid #e3e7ef;
          border-radius: 12px;
          padding: 12px;
          background: #fff;
          display: grid;
          grid-template-columns: 28px 1fr;
          gap: 10px;
          min-height: 132px;
        }

        .step.complete {
          border-color: #98d8b2;
          background: #f1fbf5;
        }

        .step.current {
          border-color: #9bb8ff;
          background: #f4f7ff;
        }

        .marker {
          width: 26px;
          height: 26px;
          border-radius: 999px;
          display: inline-grid;
          place-items: center;
          border: 1px solid #cfd7e6;
          color: #344054;
          font-weight: 800;
        }

        .complete .marker {
          border-color: #23a35a;
          color: #137333;
        }

        .current .marker {
          border-color: #3767d6;
          color: #1d4ed8;
        }

        h3 {
          color: #101828;
          font-size: 0.95rem;
          margin-bottom: 6px;
        }

        .step p {
          color: #52606d;
          font-size: 0.86rem;
          line-height: 1.35;
        }

        .metrics {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .metrics div {
          border: 1px solid #e3e7ef;
          border-radius: 12px;
          padding: 12px;
          background: #fff;
          display: grid;
          gap: 4px;
        }

        .metrics strong {
          color: #101828;
          font-size: 1.35rem;
        }

        .metrics span {
          color: #52606d;
          font-size: 0.84rem;
        }

        @media (max-width: 900px) {
          .steps,
          .metrics {
            grid-template-columns: 1fr;
          }

          .step {
            min-height: auto;
          }
        }
      `}</style>
    </section>
  );
}
