import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

type ActivationStatus =
  | { state: "missing" }
  | { state: "loading" }
  | {
      state: "ready";
      customerEmail: string | null;
      customerName: string | null;
      paymentStatus: string | null;
    }
  | {
      state: "not_paid";
      paymentStatus: string | null;
    }
  | { state: "error"; message: string };

type ActivationSessionResponse =
  | {
      ok: true;
      paid: boolean;
      payment_status: string | null;
      customer_email: string | null;
      customer_name: string | null;
    }
  | { ok: false; error: string };

const intakeOptions = [
  {
    title: "Manual item",
    body: "Create one proof-gated work item by hand.",
  },
  {
    title: "AI workflow",
    body: "Require human-acceptable proof before AI-assisted work counts as complete.",
  },
  {
    title: "Existing tool",
    body: "Attach AutoKirk to the software your team already uses.",
  },
  {
    title: "Webhook",
    body: "Send source events into a proof-gated closeout flow.",
  },
];

const proofQuestions = [
  "What important work should stay visible?",
  "What proof should count as complete?",
  "What happens when proof is missing?",
  "Who needs to see the final state?",
];

function useSessionId(): string | null {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("session_id");
    setSessionId(value);
  }, []);

  return sessionId;
}

function loginPath(sessionId: string | null): string {
  return sessionId ? `/login?session_id=${encodeURIComponent(sessionId)}` : "/login";
}

function useActivationStatus(sessionId: string | null): ActivationStatus {
  const [status, setStatus] = useState<ActivationStatus>({ state: "missing" });

  useEffect(() => {
    if (!sessionId) {
      setStatus({ state: "missing" });
      return;
    }

    let cancelled = false;
    setStatus({ state: "loading" });

    fetch(`/api/stripe/checkout-session?session_id=${encodeURIComponent(sessionId)}`)
      .then(async (response) => {
        const body = (await response.json()) as ActivationSessionResponse;
        if (!response.ok || !body.ok) {
          const message = body.ok ? "Activation verification failed." : body.error;
          throw new Error(message);
        }
        return body;
      })
      .then((body) => {
        if (cancelled) return;

        if (!body.paid) {
          setStatus({ state: "not_paid", paymentStatus: body.payment_status });
          return;
        }

        setStatus({
          state: "ready",
          customerEmail: body.customer_email,
          customerName: body.customer_name,
          paymentStatus: body.payment_status,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus({
          state: "error",
          message: err instanceof Error ? err.message : "Activation verification failed.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return status;
}

function statusCopy(status: ActivationStatus): {
  eyebrow: string;
  title: string;
  body: string;
} {
  switch (status.state) {
    case "loading":
      return {
        eyebrow: "Verifying payment",
        title: "Checking your Stripe session.",
        body: "AutoKirk is confirming checkout before opening the login path for this workspace.",
      };
    case "ready":
      return {
        eyebrow: "Payment verified",
        title: status.customerEmail
          ? `Ready for ${status.customerEmail}`
          : "Payment verified. Continue to login.",
        body: "Your payment is confirmed. Sign in by email to open the governed workspace board. You will not go through Stripe again for normal access.",
      };
    case "not_paid":
      return {
        eyebrow: "Payment not complete",
        title: "This checkout is not marked paid yet.",
        body: `Stripe returned payment status: ${status.paymentStatus ?? "unknown"}. Complete payment, then return to this activation link.`,
      };
    case "error":
      return {
        eyebrow: "Activation needs attention",
        title: "AutoKirk could not verify this checkout session.",
        body: status.message,
      };
    case "missing":
    default:
      return {
        eyebrow: "Activate your first workflow",
        title: "Activate your first proof-gated workflow.",
        body: "After checkout, AutoKirk verifies your activation and sends you to email login for workspace access.",
      };
  }
}

export default function ActivatePage() {
  const sessionId = useSessionId();
  const activationStatus = useActivationStatus(sessionId);
  const copy = useMemo(() => statusCopy(activationStatus), [activationStatus]);
  const activationReady = activationStatus.state === "ready";
  const loginHref = loginPath(sessionId);

  return (
    <>
      <Head>
        <title>Activate AutoKirk</title>
        <meta
          name="description"
          content="Activate AutoKirk with one Stripe checkout, then sign in by email for returning workspace access."
        />
      </Head>

      <main className="activationShell">
        <section className="hero" aria-labelledby="activate-title">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1 id="activate-title">{copy.title}</h1>
          <p className="lede">{copy.body}</p>
          <p className="support">
            AutoKirk connects to the tools you already use and keeps important work from being marked complete until the right proof exists.
          </p>
          <div className="sessionCard" aria-label="Stripe activation status">
            <span className={activationReady ? "statusDot ready" : "statusDot"} />
            <div>
              <strong>
                {activationReady ? "Payment verified. Login is ready." : "Ready after checkout"}
              </strong>
              <p>
                {sessionId
                  ? "Checkout session received. AutoKirk is verifying activation before login."
                  : "After checkout, AutoKirk verifies your activation and enables the daily login path."}
              </p>
            </div>
          </div>
          <div className="actions" aria-label="Activation actions">
            {activationReady ? (
              <a className="primaryAction" href={loginHref}>
                Continue to email login
              </a>
            ) : (
              <a className="primaryAction" href="#choose-intake">
                Start activation
              </a>
            )}
            <a className="secondaryAction" href="#proof-standard">
              Define proof standard
            </a>
          </div>
        </section>

        <section className="flowCard" aria-labelledby="flow-title">
          <div>
            <p className="eyebrow">How it works</p>
            <h2 id="flow-title">Stripe once. Login thereafter. Board access stays tenant-gated.</h2>
          </div>
          <div className="flowGrid" aria-label="Activation flow">
            <div className="flowStep">Customer pays</div>
            <div className="flowArrow" aria-hidden="true">→</div>
            <div className="flowStep">Stripe verifies checkout</div>
            <div className="flowArrow" aria-hidden="true">→</div>
            <div className="flowStep">Email login opens access</div>
            <div className="flowArrow" aria-hidden="true">→</div>
            <div className="flowStep">Workspace board opens</div>
          </div>
        </section>

        <section className="section" id="choose-intake" aria-labelledby="intake-title">
          <div className="sectionHeader">
            <p className="eyebrow">Choose intake</p>
            <h2 id="intake-title">Where does important work start?</h2>
            <p>
              Pick one small workflow first. AutoKirk should feel like an attachment to your existing tools, not a replacement for them.
            </p>
          </div>
          <div className="optionGrid">
            {intakeOptions.map((option) => (
              <article className="optionCard" key={option.title}>
                <h3>{option.title}</h3>
                <p>{option.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section twoColumn" id="proof-standard" aria-labelledby="proof-title">
          <div className="sectionHeader">
            <p className="eyebrow">Proof standard</p>
            <h2 id="proof-title">Define what should count as complete.</h2>
            <p>
              The first setup should answer four simple questions. The goal is not a complex configuration screen. The goal is one trustworthy closeout loop.
            </p>
          </div>
          <div className="questionList">
            {proofQuestions.map((question) => (
              <div className="question" key={question}>{question}</div>
            ))}
          </div>
        </section>

        <section className="outcomeStrip" aria-labelledby="outcome-title">
          <p className="eyebrow">Activation proof</p>
          <h2 id="outcome-title">The first successful moment is simple.</h2>
          <p>
            The customer pays once, signs in by email, lands on the governed workspace board, and sees that important work stays visible until proof exists.
          </p>
        </section>
      </main>

      <style jsx>{`
        .activationShell {
          min-height: 100vh;
          padding: 28px 12px 42px;
          background:
            radial-gradient(circle at top left, rgba(16, 163, 127, 0.16), transparent 34rem),
            radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.07), transparent 30rem),
            #0b0f14;
          color: #f4f4f5;
        }

        .hero,
        .flowCard,
        .section,
        .outcomeStrip {
          width: min(1120px, 100%);
          margin: 0 auto 14px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(17, 22, 28, 0.95);
          box-shadow: 0 22px 60px rgba(0, 0, 0, 0.32);
        }

        .hero {
          border-radius: 30px;
          padding: clamp(24px, 5vw, 56px);
        }

        .flowCard,
        .section,
        .outcomeStrip {
          border-radius: 24px;
          padding: clamp(18px, 3vw, 28px);
        }

        .eyebrow {
          margin: 0 0 10px;
          color: #a1a1aa;
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
          max-width: 900px;
          font-size: clamp(3rem, 8vw, 6.8rem);
          line-height: 0.92;
          letter-spacing: -0.07em;
        }

        h2 {
          font-size: clamp(1.7rem, 3.8vw, 3.2rem);
          line-height: 1.02;
          letter-spacing: -0.045em;
        }

        h3 {
          font-size: 1.05rem;
          line-height: 1.2;
        }

        .lede {
          max-width: 760px;
          margin-top: 20px;
          color: #e4e4e7;
          font-size: clamp(1.05rem, 2.2vw, 1.4rem);
          line-height: 1.45;
        }

        .support,
        .sectionHeader p,
        .outcomeStrip p,
        .optionCard p,
        .sessionCard p {
          color: #a1a1aa;
          line-height: 1.5;
        }

        .support {
          max-width: 720px;
          margin-top: 12px;
          font-size: 1.02rem;
        }

        .sessionCard {
          max-width: 760px;
          margin-top: 18px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 18px;
          background: rgba(20, 25, 32, 0.94);
          padding: 14px;
        }

        .sessionCard strong {
          display: block;
          margin-bottom: 4px;
        }

        .sessionCard p {
          word-break: break-word;
        }

        .statusDot {
          width: 10px;
          height: 10px;
          flex: 0 0 auto;
          margin-top: 6px;
          border-radius: 999px;
          background: #eab308;
          box-shadow: 0 0 18px rgba(234, 179, 8, 0.48);
        }

        .statusDot.ready {
          background: #10a37f;
          box-shadow: 0 0 18px rgba(16, 163, 127, 0.7);
        }

        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 28px;
        }

        .primaryAction,
        .secondaryAction {
          display: inline-flex;
          min-height: 46px;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 0 18px;
          font-weight: 800;
          text-decoration: none;
        }

        .primaryAction {
          background: #10a37f;
          color: #06130f;
        }

        .secondaryAction {
          border: 1px solid rgba(255, 255, 255, 0.16);
          color: #f4f4f5;
        }

        .flowCard {
          display: grid;
          gap: 18px;
        }

        .flowGrid {
          display: grid;
          grid-template-columns: 1fr auto 1fr auto 1fr auto 1fr;
          gap: 10px;
          align-items: center;
        }

        .flowStep,
        .question,
        .optionCard {
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 18px;
          background: rgba(20, 25, 32, 0.94);
        }

        .flowStep {
          min-height: 86px;
          padding: 16px;
          display: grid;
          place-items: center;
          text-align: center;
          color: #e4e4e7;
          font-weight: 800;
        }

        .flowArrow {
          color: #71717a;
          font-size: 1.6rem;
          font-weight: 900;
        }

        .sectionHeader {
          max-width: 760px;
          display: grid;
          gap: 8px;
        }

        .optionGrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-top: 18px;
        }

        .optionCard {
          padding: 16px;
          display: grid;
          gap: 10px;
        }

        .twoColumn {
          display: grid;
          grid-template-columns: minmax(0, 0.9fr) minmax(280px, 1.1fr);
          gap: 20px;
          align-items: start;
        }

        .questionList {
          display: grid;
          gap: 10px;
        }

        .question {
          padding: 16px;
          color: #e4e4e7;
          font-weight: 800;
        }

        .outcomeStrip {
          display: grid;
          gap: 10px;
        }

        @media (max-width: 900px) {
          .activationShell {
            padding: 16px 8px 32px;
          }

          .hero,
          .flowCard,
          .section,
          .outcomeStrip {
            border-radius: 22px;
          }

          .flowGrid,
          .optionGrid,
          .twoColumn {
            grid-template-columns: 1fr;
          }

          .flowArrow {
            transform: rotate(90deg);
            justify-self: center;
          }

          .primaryAction,
          .secondaryAction {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}
