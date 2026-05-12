import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

type CheckoutState =
  | { state: "idle" }
  | { state: "starting" }
  | { state: "verified"; email: string | null; paymentStatus: string | null }
  | { state: "cancelled" }
  | { state: "error"; message: string };

type CheckoutCreateResponse =
  | { ok: true; id: string; url: string }
  | { ok: false; error: string };

type CheckoutVerifyResponse =
  | {
      ok: true;
      paid: boolean;
      payment_status: string | null;
      customer_email: string | null;
    }
  | { ok: false; error: string };

const steps = [
  {
    label: "Choose one workflow",
    body: "Start where missed follow-up, weak evidence, or premature completion creates real risk.",
  },
  {
    label: "Set the proof rule",
    body: "Define the evidence required before that work can close.",
  },
  {
    label: "Create the first obligation",
    body: "Send one real item into AutoKirk and let the system govern it.",
  },
];

const states = [
  {
    label: "Open",
    body: "The obligation exists and still needs proof.",
  },
  {
    label: "Proof ready",
    body: "Evidence is present and the item is ready for governed resolution.",
  },
  {
    label: "Needs attention",
    body: "Proof is missing, unclear, rejected, or not enough to close.",
  },
];

function statusCopy(status: CheckoutState): { label: string; body: string } {
  switch (status.state) {
    case "starting":
      return {
        label: "Opening Stripe",
        body: "Creating a secure checkout session.",
      };
    case "verified":
      return {
        label: "Payment verified",
        body: status.email
          ? `Activation is ready for ${status.email}.`
          : "Activation is ready.",
      };
    case "cancelled":
      return {
        label: "Checkout cancelled",
        body: "No payment was completed. Start checkout again when ready.",
      };
    case "error":
      return {
        label: "Stripe needs attention",
        body: status.message,
      };
    case "idle":
    default:
      return {
        label: "Trial active",
        body: "Start with one proof-gated workflow.",
      };
  }
}

export default function PlatformPage() {
  const [checkout, setCheckout] = useState<CheckoutState>({ state: "idle" });
  const copy = useMemo(() => statusCopy(checkout), [checkout]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const cancelled = params.get("checkout") === "cancelled";

    if (cancelled) {
      setCheckout({ state: "cancelled" });
      return;
    }

    if (!sessionId) return;

    let ignore = false;

    fetch(`/api/stripe/checkout-session?session_id=${encodeURIComponent(sessionId)}`)
      .then(async (response) => {
        const body = (await response.json()) as CheckoutVerifyResponse;
        if (!response.ok || !body.ok) {
          throw new Error(body.ok ? "Stripe verification failed." : body.error);
        }
        return body;
      })
      .then((body) => {
        if (ignore) return;
        if (!body.paid) {
          setCheckout({
            state: "error",
            message: `Stripe returned payment status: ${body.payment_status ?? "unknown"}.`,
          });
          return;
        }
        setCheckout({
          state: "verified",
          email: body.customer_email,
          paymentStatus: body.payment_status,
        });
      })
      .catch((err) => {
        if (ignore) return;
        setCheckout({
          state: "error",
          message: err instanceof Error ? err.message : "Stripe verification failed.",
        });
      });

    return () => {
      ignore = true;
    };
  }, []);

  async function startCheckout() {
    setCheckout({ state: "starting" });

    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source: "platform" }),
      });
      const body = (await response.json()) as CheckoutCreateResponse;

      if (!response.ok || !body.ok) {
        throw new Error(body.ok ? "Could not start Stripe checkout." : body.error);
      }

      window.location.assign(body.url);
    } catch (err) {
      setCheckout({
        state: "error",
        message: err instanceof Error ? err.message : "Could not start Stripe checkout.",
      });
    }
  }

  return (
    <>
      <Head>
        <title>AutoKirk Platform</title>
        <meta
          name="description"
          content="Start with one workflow. AutoKirk keeps important work from being marked complete until the right proof exists."
        />
      </Head>

      <main className="shell">
        <section className="hero" aria-labelledby="platform-title">
          <div className="status" aria-live="polite">
            <span className={checkout.state === "verified" ? "dot ready" : "dot"} />
            <strong>{copy.label}</strong>
            <span>{copy.body}</span>
          </div>

          <p className="eyebrow">Your AutoKirk platform link</p>
          <h1 id="platform-title">Start with one workflow.</h1>
          <p className="lede">
            AutoKirk connects to the tools you already use and keeps important work from being marked complete until the right proof exists.
          </p>

          <div className="actions" aria-label="Platform actions">
            <button
              className="primaryAction"
              type="button"
              onClick={startCheckout}
              disabled={checkout.state === "starting"}
            >
              {checkout.state === "verified" ? "Continue activation" : checkout.state === "starting" ? "Opening Stripe..." : "Activate AutoKirk"}
            </button>
            <a className="secondaryAction" href="#setup">
              See setup path
            </a>
          </div>
        </section>

        <section className="rule" aria-label="AutoKirk rule">
          <p className="eyebrow">The rule</p>
          <strong>Important work should not be marked complete without proof.</strong>
        </section>

        <section className="panel" id="setup" aria-labelledby="setup-title">
          <div>
            <p className="eyebrow">First workflow</p>
            <h2 id="setup-title">A calm setup for one proof standard.</h2>
            <p>
              Start narrow. The workflow stays familiar. AutoKirk adds the governed layer that decides when proof is enough to resolve.
            </p>
          </div>
          <div className="stepList" aria-label="Setup steps">
            {steps.map((step, index) => (
              <article className="step" key={step.label}>
                <span>0{index + 1}</span>
                <div>
                  <h3>{step.label}</h3>
                  <p>{step.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel" aria-labelledby="states-title">
          <div>
            <p className="eyebrow">Operating view</p>
            <h2 id="states-title">AutoKirk shows what is open, ready, or exposed.</h2>
            <p>
              Any system can create the signal. AutoKirk governs the obligation, the proof path, and the receipt-backed closeout.
            </p>
          </div>
          <div className="stateGrid" aria-label="Work states">
            {states.map((state) => (
              <article className="stateCard" key={state.label}>
                <h3>{state.label}</h3>
                <p>{state.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="closing" aria-label="Start checkout">
          <div>
            <p className="eyebrow">Next</p>
            <strong>Attach AutoKirk beside the work that matters first.</strong>
          </div>
          <button
            className="stripAction"
            type="button"
            onClick={startCheckout}
            disabled={checkout.state === "starting"}
          >
            {checkout.state === "starting" ? "Opening Stripe..." : "Activate AutoKirk"}
          </button>
        </section>
      </main>

      <style jsx>{`
        .shell {
          min-height: 100vh;
          padding: 24px 12px 40px;
          color: #f4f4f5;
          background:
            radial-gradient(circle at 50% -10%, rgba(16, 163, 127, 0.14), transparent 34rem),
            radial-gradient(circle at 90% 70%, rgba(88, 166, 255, 0.08), transparent 24rem),
            #070a0f;
        }

        .hero,
        .rule,
        .panel,
        .closing {
          width: min(1080px, 100%);
          margin: 0 auto 14px;
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 30px;
          background: linear-gradient(180deg, rgba(17, 22, 29, 0.97), rgba(9, 12, 17, 0.96));
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.44), inset 0 1px 0 rgba(255, 255, 255, 0.035);
        }

        .hero {
          min-height: 520px;
          display: grid;
          align-content: center;
          padding: clamp(32px, 5vw, 64px);
        }

        .status {
          width: fit-content;
          max-width: 100%;
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 22px;
          border: 1px solid rgba(16, 163, 127, 0.24);
          border-radius: 999px;
          padding: 8px 12px;
          color: #d7f9ee;
          background: rgba(16, 163, 127, 0.08);
          font-size: 0.86rem;
          line-height: 1.25;
        }

        .status span:last-child {
          color: #b6c2c9;
        }

        .dot {
          width: 8px;
          height: 8px;
          flex: 0 0 auto;
          border-radius: 999px;
          background: #10a37f;
          box-shadow: 0 0 18px rgba(16, 163, 127, 0.7);
        }

        .dot.ready {
          background: #22c55e;
        }

        .eyebrow {
          margin: 0 0 12px;
          color: #9ca3af;
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        h1,
        h2,
        h3,
        p {
          margin: 0;
        }

        h1 {
          max-width: 880px;
          font-size: clamp(3rem, 7vw, 5.85rem);
          line-height: 0.98;
          letter-spacing: -0.064em;
          text-wrap: balance;
        }

        h2,
        .rule strong,
        .closing strong {
          max-width: 760px;
          font-size: clamp(1.65rem, 3.2vw, 2.85rem);
          line-height: 1.1;
          letter-spacing: -0.044em;
          text-wrap: balance;
        }

        h3 {
          font-size: 1.06rem;
          line-height: 1.25;
        }

        .lede {
          max-width: 760px;
          margin-top: 22px;
          color: #e4e4e7;
          font-size: clamp(1.08rem, 2.1vw, 1.35rem);
          line-height: 1.48;
        }

        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 30px;
        }

        .primaryAction,
        .secondaryAction,
        .stripAction {
          display: inline-flex;
          min-height: 48px;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 0 20px;
          border: 0;
          font: inherit;
          font-weight: 900;
          text-decoration: none;
          cursor: pointer;
        }

        .primaryAction,
        .stripAction {
          color: #06130f;
          background: #10a37f;
          box-shadow: 0 0 24px rgba(16, 163, 127, 0.2);
        }

        .primaryAction:disabled,
        .stripAction:disabled {
          cursor: wait;
          opacity: 0.74;
        }

        .secondaryAction {
          border: 1px solid rgba(255, 255, 255, 0.16);
          color: #f4f4f5;
          background: rgba(255, 255, 255, 0.025);
        }

        .rule,
        .panel,
        .closing {
          padding: clamp(22px, 3vw, 34px);
        }

        .rule strong,
        .closing strong {
          display: block;
        }

        .panel {
          display: grid;
          grid-template-columns: minmax(0, 0.95fr) minmax(320px, 1.05fr);
          gap: 18px;
          align-items: start;
        }

        .panel p,
        .step p,
        .stateCard p {
          color: #a1a1aa;
          line-height: 1.5;
        }

        .panel > div:first-child p {
          max-width: 620px;
          margin-top: 10px;
        }

        .stepList,
        .stateGrid {
          display: grid;
          gap: 10px;
        }

        .step,
        .stateCard {
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          background: rgba(18, 23, 30, 0.74);
          padding: 16px;
        }

        .step {
          display: flex;
          gap: 12px;
          min-height: 96px;
        }

        .step span {
          color: #10a37f;
          font-size: 0.78rem;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .step h3,
        .stateCard h3 {
          margin-bottom: 6px;
        }

        .stateGrid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .stateCard {
          min-height: 146px;
        }

        .closing {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }

        @media (max-width: 900px) {
          .shell {
            padding: 16px 8px 32px;
          }

          .hero,
          .rule,
          .panel,
          .closing {
            border-radius: 22px;
          }

          .hero {
            min-height: auto;
            padding: 28px 20px;
          }

          .panel,
          .stateGrid {
            grid-template-columns: 1fr;
          }

          .closing {
            display: grid;
          }

          .primaryAction,
          .secondaryAction,
          .stripAction {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}
