import Head from "next/head";
import { useEffect } from "react";

const loopSteps = [
  {
    label: "Payment",
    body: "A customer pays, a checkout clears, or money changes hands.",
  },
  {
    label: "Obligation",
    body: "AutoKirk opens the paid work as something that still must be proven.",
  },
  {
    label: "Proof",
    body: "The work stays visible until the required evidence exists.",
  },
  {
    label: "Receipt",
    body: "Completion creates a permanent record of what happened and why it counted.",
  },
  {
    label: "Board",
    body: "The customer sees what is open, what is proven, and what cannot disappear yet.",
  },
];

const workflowCards = [
  {
    title: "Start with one paid workflow.",
    body: "Pick the work that creates the most leakage: a paid order, service call, onboarding step, repair, install, delivery, or agent-completed task.",
  },
  {
    title: "Define what proof means.",
    body: "Call log, photo, signed form, message reply, file, approval, system event, or any evidence your customer would accept as complete.",
  },
  {
    title: "Show the board before you expand.",
    body: "Once one loop works, expand from the same pattern instead of rebuilding the business around another platform.",
  },
];

export default function HomePage() {
  useEffect(() => {
    const isVercelPreview = window.location.hostname.endsWith(".vercel.app");
    const hasAuthReturn =
      window.location.search.includes("error=") ||
      window.location.search.includes("error_code=") ||
      window.location.hash.includes("access_token=") ||
      window.location.hash.includes("refresh_token=") ||
      window.location.hash.includes("error=");

    if (!hasAuthReturn && !isVercelPreview) return;

    const target = new URL("https://autokirk.com/login");
    if (window.location.search) {
      const params = new URLSearchParams(window.location.search);
      params.forEach((value, key) => target.searchParams.set(key, value));
    }
    target.hash = window.location.hash;
    window.location.replace(target.toString());
  }, []);

  return (
    <>
      <Head>
        <title>AutoKirk — One paid workflow, proven complete</title>
        <meta
          name="description"
          content="Paid work should not disappear before it is proven complete. Start with one workflow, then expand from payment to obligation to proof to receipt to board."
        />
        <meta
          property="og:title"
          content="AutoKirk — One paid workflow, proven complete"
        />
        <meta
          property="og:description"
          content="Paid work should not disappear before it is proven complete. AutoKirk starts with one proof-gated workflow."
        />
        <meta property="og:site_name" content="AutoKirk" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://autokirk.com/" />
        <meta name="twitter:card" content="summary" />
        <meta
          name="twitter:title"
          content="AutoKirk — One paid workflow, proven complete"
        />
        <meta
          name="twitter:description"
          content="Start with one paid workflow. Keep it open until proof exists. Expand from the loop that works."
        />
      </Head>

      <main className="shell">
        <section className="hero" aria-labelledby="home-title">
          <nav className="topbar" aria-label="AutoKirk navigation">
            <a className="brand" href="/" aria-label="AutoKirk home">
              <span className="brandMark" />
              AutoKirk
            </a>
            <div className="navLinks" aria-label="Primary links">
              <a href="#workflow">Workflow</a>
              <a href="#loop">Loop</a>
              <a href="/platform">Activate</a>
            </div>
          </nav>

          <div className="heroGrid">
            <div className="heroCopy">
              <p className="eyebrow">One workflow first</p>
              <h1 id="home-title">Paid work should not disappear before it is proven complete.</h1>
              <p className="lede">
                AutoKirk starts with one paid workflow. It keeps the work visible after payment, holds it open as an obligation, requires proof before completion, issues a receipt, and shows the result on a board.
              </p>
              <div className="actions" aria-label="Primary actions">
                <a className="primaryAction" href="/platform">Start one workflow</a>
                <a className="secondaryAction" href="#loop">See the loop</a>
              </div>
            </div>

            <aside className="chatPanel" aria-label="One workflow preview">
              <div className="chatHeader">
                <span />
                <strong>AutoKirk workflow</strong>
              </div>
              <div className="message mutedMessage">Payment received for promised work.</div>
              <div className="message userMessage">Can this be marked complete?</div>
              <div className="message systemMessage">
                Not yet. The work is now an obligation. Completion requires proof.
              </div>
              <div className="statusStack" aria-label="Workflow state">
                <div><span className="dot paid" />Payment captured</div>
                <div><span className="dot open" />Obligation open</div>
                <div><span className="dot waiting" />Proof required</div>
              </div>
            </aside>
          </div>
        </section>

        <section className="section workflowSection" id="workflow" aria-labelledby="workflow-title">
          <div className="sectionIntro">
            <p className="eyebrow">Do not sell the platform</p>
            <h2 id="workflow-title">Sell the first workflow that should not leak.</h2>
            <p>
              The first customer does not need a new operating system. They need one paid action to stop disappearing before there is evidence it was actually finished.
            </p>
          </div>
          <div className="workflowGrid">
            {workflowCards.map((card) => (
              <article className="workflowCard" key={card.title}>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section loopSection" id="loop" aria-labelledby="loop-title">
          <div className="sectionIntro narrow">
            <p className="eyebrow">The category loop</p>
            <h2 id="loop-title">Payment → obligation → proof → receipt → board.</h2>
            <p>
              Once one workflow works, expand only along this path. The loop is the product. The loop is the proof. The loop is the category.
            </p>
          </div>
          <div className="loopRail" aria-label="AutoKirk category loop">
            {loopSteps.map((step, index) => (
              <div className="loopItem" key={step.label}>
                <div className="stepNumber">{String(index + 1).padStart(2, "0")}</div>
                <h3>{step.label}</h3>
                <p>{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="closing" aria-labelledby="closing-title">
          <p className="eyebrow">What the buyer gets</p>
          <h2 id="closing-title">One board where paid work cannot quietly vanish.</h2>
          <p>
            Start with a single paid workflow. Prove that work can stay open until evidence exists. Then expand from the same loop, not from another platform promise.
          </p>
          <a className="primaryAction" href="/platform">Activate AutoKirk</a>
        </section>
      </main>

      <style jsx>{`
        .shell {
          min-height: 100vh;
          padding: 18px 10px 40px;
          background:
            radial-gradient(circle at 50% -18%, rgba(45, 245, 213, 0.16), transparent 32rem),
            radial-gradient(circle at 8% 10%, rgba(255, 255, 255, 0.08), transparent 24rem),
            #030303;
          color: #f5f5f5;
        }

        .hero,
        .section,
        .closing {
          width: min(1120px, 100%);
          margin: 0 auto 14px;
          border: 1px solid #242424;
          border-radius: 30px;
          background: linear-gradient(180deg, rgba(18, 18, 18, 0.98), rgba(6, 6, 6, 0.98));
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.58);
        }

        .hero {
          padding: clamp(18px, 3vw, 34px);
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: clamp(44px, 7vw, 86px);
        }

        .brand,
        .navLinks a,
        .primaryAction,
        .secondaryAction {
          text-decoration: none;
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #f5f5f5;
          font-weight: 950;
          letter-spacing: -0.02em;
        }

        .brandMark {
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: #2df5d5;
          box-shadow: 0 0 22px rgba(45, 245, 213, 0.72);
        }

        .navLinks {
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #242424;
          border-radius: 999px;
          background: rgba(8, 8, 8, 0.9);
          padding: 5px;
        }

        .navLinks a {
          border-radius: 999px;
          color: #a3a3a3;
          font-size: 0.88rem;
          font-weight: 850;
          padding: 8px 11px;
        }

        .navLinks a:hover {
          color: #f5f5f5;
          background: #111;
        }

        .heroGrid {
          display: grid;
          grid-template-columns: minmax(0, 1.12fr) minmax(320px, 0.88fr);
          gap: clamp(18px, 4vw, 42px);
          align-items: end;
        }

        .heroCopy {
          padding-bottom: 8px;
        }

        .eyebrow {
          margin: 0 0 12px;
          color: #9a9a9a;
          font-size: 0.78rem;
          font-weight: 900;
          letter-spacing: 0.1em;
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
          font-size: clamp(3.15rem, 8vw, 7.6rem);
          line-height: 0.9;
          letter-spacing: -0.078em;
        }

        h2 {
          font-size: clamp(2rem, 4.6vw, 4rem);
          line-height: 0.96;
          letter-spacing: -0.058em;
        }

        h3 {
          font-size: 1.08rem;
          line-height: 1.16;
          letter-spacing: -0.025em;
        }

        .lede,
        .sectionIntro p,
        .workflowCard p,
        .loopItem p,
        .closing p,
        .message,
        .statusStack {
          color: #a3a3a3;
          line-height: 1.5;
        }

        .lede {
          max-width: 760px;
          margin-top: 22px;
          color: #d4d4d4;
          font-size: clamp(1.08rem, 2vw, 1.36rem);
        }

        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 30px;
        }

        .primaryAction,
        .secondaryAction {
          display: inline-flex;
          min-height: 48px;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 0 20px;
          font-weight: 950;
        }

        .primaryAction {
          color: #020202;
          background: #2df5d5;
          box-shadow: 0 0 30px rgba(45, 245, 213, 0.18);
        }

        .secondaryAction {
          border: 1px solid #2c2c2c;
          color: #f5f5f5;
          background: #080808;
        }

        .chatPanel {
          border: 1px solid #242424;
          border-radius: 28px;
          background: #080808;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
          padding: 14px;
        }

        .chatHeader {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #d4d4d4;
          font-size: 0.9rem;
          padding: 6px 6px 14px;
        }

        .chatHeader span {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: #2df5d5;
          box-shadow: 0 0 18px rgba(45, 245, 213, 0.7);
        }

        .message {
          width: fit-content;
          max-width: 92%;
          margin-bottom: 10px;
          border-radius: 18px;
          padding: 12px 14px;
          font-size: 0.95rem;
        }

        .mutedMessage {
          background: #101010;
        }

        .userMessage {
          margin-left: auto;
          color: #f5f5f5;
          background: #202123;
        }

        .systemMessage {
          color: #dffefa;
          background: rgba(45, 245, 213, 0.09);
          border: 1px solid rgba(45, 245, 213, 0.18);
        }

        .statusStack {
          display: grid;
          gap: 8px;
          margin-top: 16px;
          border-top: 1px solid #1f1f1f;
          padding: 14px 4px 4px;
          font-size: 0.9rem;
          font-weight: 850;
        }

        .statusStack div {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
        }

        .dot.paid {
          background: #d4d4d4;
        }

        .dot.open {
          background: #2df5d5;
        }

        .dot.waiting {
          background: #f5d76e;
        }

        .section,
        .closing {
          padding: clamp(22px, 4vw, 42px);
        }

        .workflowSection,
        .loopSection {
          display: grid;
          gap: 22px;
        }

        .sectionIntro {
          max-width: 780px;
          display: grid;
          gap: 10px;
        }

        .sectionIntro.narrow {
          max-width: 860px;
        }

        .workflowGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .workflowCard,
        .loopItem {
          border: 1px solid #242424;
          border-radius: 22px;
          background: #080808;
          padding: 18px;
        }

        .workflowCard {
          display: grid;
          gap: 10px;
          min-height: 170px;
        }

        .loopRail {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 10px;
        }

        .loopItem {
          display: grid;
          gap: 10px;
          min-height: 206px;
        }

        .stepNumber {
          width: fit-content;
          border: 1px solid rgba(45, 245, 213, 0.28);
          border-radius: 999px;
          background: rgba(45, 245, 213, 0.08);
          color: #dffefa;
          font-size: 0.78rem;
          font-weight: 950;
          padding: 6px 10px;
        }

        .closing {
          display: grid;
          justify-items: start;
          gap: 14px;
        }

        .closing p {
          max-width: 760px;
          color: #d4d4d4;
          font-size: 1.08rem;
        }

        @media (max-width: 940px) {
          .shell {
            padding: 10px 7px 32px;
          }

          .hero,
          .section,
          .closing {
            border-radius: 22px;
          }

          .topbar {
            align-items: flex-start;
            flex-direction: column;
            margin-bottom: 46px;
          }

          .navLinks {
            width: 100%;
            justify-content: space-between;
          }

          .heroGrid,
          .workflowGrid,
          .loopRail {
            grid-template-columns: 1fr;
          }

          .chatPanel {
            border-radius: 22px;
          }

          .primaryAction,
          .secondaryAction {
            width: 100%;
          }

          .loopItem,
          .workflowCard {
            min-height: auto;
          }
        }
      `}</style>
    </>
  );
}
