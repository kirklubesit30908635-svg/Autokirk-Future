import Head from "next/head";

const setupSteps = [
  {
    label: "Connect the source",
    body: "Start with the tool where important work already appears.",
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

const systemUses = [
  {
    label: "Source system",
    body: "Tickets, forms, email, CRM, field notes, or internal requests can stay where they are.",
  },
  {
    label: "Proof system",
    body: "Files, approvals, messages, invoices, photos, or records become the evidence boundary.",
  },
  {
    label: "Operating view",
    body: "AutoKirk shows whether the item is still open, ready to resolve, or blocked by missing proof.",
  },
];

const proofStates = [
  {
    label: "Open",
    body: "The obligation exists, but the required proof has not been attached yet.",
  },
  {
    label: "Proof ready",
    body: "Evidence is present and the item is ready for governed resolution.",
  },
  {
    label: "Needs attention",
    body: "The proof is missing, unclear, rejected, or not enough to close.",
  },
];

export default function PlatformPage() {
  return (
    <>
      <Head>
        <title>AutoKirk Platform</title>
        <meta
          name="description"
          content="Start with one workflow. AutoKirk connects to the tools you already use and keeps important work from being marked complete until the right proof exists."
        />
      </Head>

      <main className="platformShell">
        <div className="topGlow" aria-hidden="true" />
        <div className="sideGlow" aria-hidden="true" />

        <section className="hero" aria-labelledby="platform-title">
          <div className="statusPill" aria-label="AutoKirk trial status">
            <span className="statusDot" />
            Trial active
          </div>
          <p className="eyebrow">Your AutoKirk platform link</p>
          <h1 id="platform-title">Start with one workflow.</h1>
          <p className="lede">
            AutoKirk connects to the tools you already use and keeps important work from being marked complete until the right proof exists.
          </p>
          <p className="support">
            Choose where work starts, define what proof means, and see whether work resolves, escalates, or fails.
          </p>
          <div className="actions" aria-label="Platform actions">
            <a href="/activate" className="primaryAction">
              Activate AutoKirk
            </a>
            <a href="#first-workflow" className="secondaryAction">
              Preview setup
            </a>
          </div>
        </section>

        <section className="signalCard" aria-label="AutoKirk promise">
          <p className="eyebrow">The rule</p>
          <strong>Important work should not be marked complete without proof.</strong>
        </section>

        <section className="workflowPanel" id="first-workflow" aria-labelledby="workflow-title">
          <div className="panelIntro">
            <p className="eyebrow">First workflow</p>
            <h2 id="workflow-title">A calm setup for one proof standard.</h2>
            <p>
              Start narrow. Pick one workflow where missed follow-up, weak evidence, or premature completion creates real operational risk.
            </p>
          </div>

          <div className="setupList" aria-label="Setup steps">
            {setupSteps.map((step, index) => (
              <article className="setupStep" key={step.label}>
                <span>0{index + 1}</span>
                <div>
                  <h3>{step.label}</h3>
                  <p>{step.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="systemPanel" aria-labelledby="systems-title">
          <div>
            <p className="eyebrow">Existing systems</p>
            <h2 id="systems-title">Your tools keep their jobs. AutoKirk governs the proof boundary.</h2>
          </div>
          <div className="systemUseGrid" aria-label="How AutoKirk works beside existing systems">
            {systemUses.map((systemUse) => (
              <article className="systemUseCard" key={systemUse.label}>
                <h3>{systemUse.label}</h3>
                <p>{systemUse.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="stateGrid" aria-label="Work states">
          {proofStates.map((state) => (
            <article className="stateCard" key={state.label}>
              <h3>{state.label}</h3>
              <p>{state.body}</p>
            </article>
          ))}
        </section>

        <section className="closing" aria-label="Start activation">
          <div>
            <p className="eyebrow">Next</p>
            <strong>Attach AutoKirk beside the work that matters first.</strong>
            <p>
              The workflow stays familiar. AutoKirk adds the governed layer that decides when proof is enough to resolve.
            </p>
          </div>
          <a href="/activate" className="stripAction">
            Continue to activation
          </a>
        </section>
      </main>

      <style jsx>{`
        .platformShell {
          position: relative;
          min-height: 100vh;
          padding: 26px 12px 40px;
          color: #f4f4f5;
          background:
            radial-gradient(circle at 50% -10%, rgba(16, 163, 127, 0.13), transparent 34rem),
            radial-gradient(circle at 88% 72%, rgba(88, 166, 255, 0.08), transparent 24rem),
            #070a0f;
          isolation: isolate;
        }

        .topGlow,
        .sideGlow {
          position: absolute;
          pointer-events: none;
          z-index: 0;
        }

        .topGlow {
          top: 26px;
          left: 50%;
          width: min(760px, 86vw);
          height: 340px;
          transform: translateX(-50%);
          border-radius: 999px;
          background: radial-gradient(circle, rgba(16, 163, 127, 0.18), rgba(16, 163, 127, 0.06) 42%, transparent 72%);
          filter: blur(20px);
          opacity: 0.82;
        }

        .sideGlow {
          right: 5%;
          bottom: 12%;
          width: min(440px, 72vw);
          height: 250px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(88, 166, 255, 0.09), rgba(88, 166, 255, 0.03) 44%, transparent 72%);
          filter: blur(26px);
          opacity: 0.68;
        }

        .hero,
        .signalCard,
        .workflowPanel,
        .systemPanel,
        .stateGrid,
        .closing {
          position: relative;
          z-index: 1;
          width: min(1080px, 100%);
          margin: 0 auto;
        }

        .hero,
        .signalCard,
        .workflowPanel,
        .systemPanel,
        .closing,
        .stateCard,
        .systemUseCard {
          border: 1px solid rgba(255, 255, 255, 0.09);
          background: linear-gradient(180deg, rgba(14, 18, 24, 0.96), rgba(8, 11, 16, 0.95));
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.46), inset 0 1px 0 rgba(255, 255, 255, 0.035);
          backdrop-filter: blur(12px);
        }

        .hero {
          min-height: 560px;
          border-radius: 34px;
          padding: clamp(28px, 6vw, 72px);
          display: grid;
          align-content: center;
        }

        .statusPill {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 18px;
          border: 1px solid rgba(16, 163, 127, 0.28);
          border-radius: 999px;
          padding: 7px 11px;
          color: #c7f9e7;
          background: rgba(16, 163, 127, 0.08);
          font-size: 0.82rem;
          font-weight: 800;
        }

        .statusDot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #10a37f;
          box-shadow: 0 0 18px rgba(16, 163, 127, 0.7);
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
          max-width: 900px;
          font-size: clamp(3rem, 8vw, 7rem);
          line-height: 0.9;
          letter-spacing: -0.078em;
        }

        h2 {
          max-width: 720px;
          font-size: clamp(1.75rem, 3.7vw, 3.35rem);
          line-height: 1.04;
          letter-spacing: -0.05em;
        }

        h3 {
          font-size: 1.05rem;
          line-height: 1.25;
        }

        .lede {
          max-width: 760px;
          margin-top: 22px;
          color: #e4e4e7;
          font-size: clamp(1.08rem, 2.4vw, 1.45rem);
          line-height: 1.45;
        }

        .support,
        .panelIntro p,
        .setupStep p,
        .systemUseCard p,
        .stateCard p,
        .closing p {
          color: #a1a1aa;
          line-height: 1.5;
        }

        .support {
          max-width: 720px;
          margin-top: 12px;
          font-size: clamp(0.98rem, 2vw, 1.13rem);
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
          min-height: 46px;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 0 18px;
          font-weight: 800;
          text-decoration: none;
        }

        .primaryAction,
        .stripAction {
          background: #10a37f;
          color: #06130f;
          box-shadow: 0 0 24px rgba(16, 163, 127, 0.18);
        }

        .secondaryAction {
          border: 1px solid rgba(255, 255, 255, 0.16);
          color: #f4f4f5;
          background: rgba(255, 255, 255, 0.025);
        }

        .signalCard,
        .workflowPanel,
        .systemPanel,
        .closing {
          margin-top: 14px;
          border-radius: 26px;
          padding: clamp(20px, 3vw, 30px);
        }

        .signalCard strong,
        .closing strong {
          display: block;
          max-width: 800px;
          font-size: clamp(1.35rem, 3.2vw, 2.6rem);
          line-height: 1.08;
          letter-spacing: -0.05em;
        }

        .workflowPanel,
        .systemPanel {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(300px, 0.95fr);
          gap: 18px;
          align-items: start;
        }

        .panelIntro {
          display: grid;
          gap: 8px;
        }

        .setupList,
        .systemUseGrid {
          display: grid;
          gap: 10px;
        }

        .setupStep,
        .systemUseCard {
          min-height: 92px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          border-radius: 18px;
          padding: 14px;
        }

        .setupStep {
          background: rgba(18, 23, 30, 0.78);
        }

        .setupStep span {
          color: #10a37f;
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.08em;
        }

        .setupStep h3,
        .systemUseCard h3 {
          margin-bottom: 6px;
        }

        .stateGrid {
          margin-top: 14px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .stateCard {
          min-height: 150px;
          border-radius: 22px;
          padding: 18px;
          display: grid;
          align-content: start;
          gap: 10px;
        }

        .closing {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }

        .closing p {
          max-width: 680px;
          margin-top: 10px;
        }

        @media (max-width: 900px) {
          .platformShell {
            padding: 16px 8px 32px;
          }

          .hero {
            min-height: auto;
            border-radius: 24px;
            padding: 26px 20px;
          }

          .signalCard,
          .workflowPanel,
          .systemPanel,
          .closing,
          .stateCard {
            border-radius: 22px;
            padding: 20px;
          }

          .workflowPanel,
          .systemPanel,
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
