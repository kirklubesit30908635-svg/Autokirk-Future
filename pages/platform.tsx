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

const integrityMetrics = [
  {
    label: "Verified Closure",
    value: "Strong",
    body: "Commitments are reaching verified outcomes instead of staying open-ended.",
  },
  {
    label: "Time Exposure",
    value: "Controlled",
    body: "Aging commitments remain visible before they become operational risk.",
  },
  {
    label: "Commitment Capture",
    value: "Active",
    body: "Important source activity is being shaped into governed obligations.",
  },
  {
    label: "Resolution Speed",
    value: "Stable",
    body: "Open commitments are moving toward resolution inside the expected window.",
  },
  {
    label: "Evidence Timing",
    value: "Watch",
    body: "Verification should be captured closer to the moment work is completed.",
  },
];

const integrityIntake = [
  "Work is completed but evidence is not captured",
  "Customers dispute completed work",
  "Payment follow-up is inconsistent",
  "Handoffs lose ownership",
  "Time-sensitive commitments are missed",
  "The next responsible owner is unclear",
  "Work is reopened after being marked complete",
  "Important commitments live in texts, calls, or memory",
];

export default function PlatformPage() {
  return (
    <>
      <Head>
        <title>AutoKirk Platform</title>
        <meta
          name="description"
          content="Start with one workflow. AutoKirk connects to the tools you already use and measures operational integrity across commitments, evidence, timing, and durable receipts."
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
            <a href="#integrity" className="secondaryAction">
              View integrity layer
            </a>
          </div>
        </section>

        <section className="signalCard" aria-label="AutoKirk promise">
          <p className="eyebrow">The rule</p>
          <strong>Important work should not be marked complete without proof.</strong>
        </section>

        <section className="integrityPanel" id="integrity" aria-labelledby="integrity-title">
          <div className="integrityHeader">
            <div>
              <p className="eyebrow">Operational Integrity</p>
              <h2 id="integrity-title">See where follow-through is strong and where it becomes exposed.</h2>
              <p>
                AutoKirk measures how reliably your company captures commitments, verifies outcomes, controls time exposure, and produces durable receipts.
              </p>
            </div>
            <div className="scoreCard" aria-label="Operational integrity score">
              <span>Integrity Score</span>
              <strong>87</strong>
              <small>Stable — evidence timing requires attention</small>
            </div>
          </div>

          <div className="integritySummary" aria-label="Integrity summary">
            <article>
              <span>Integrity Strength</span>
              <strong>Verified outcome coverage is strong.</strong>
              <p>Most work is moving toward receipt-backed closure once the required evidence is present.</p>
            </article>
            <article>
              <span>Integrity Exposure</span>
              <strong>Closeout verification is the current risk area.</strong>
              <p>Evidence should be captured closer to completion so the business record stays durable.</p>
            </article>
            <article>
              <span>Observed Pattern</span>
              <strong>Completion is not the weak point. Verification timing is.</strong>
              <p>AutoKirk is watching the gap between finished work and accepted evidence.</p>
            </article>
          </div>

          <div className="metricGrid" aria-label="Operational integrity components">
            {integrityMetrics.map((metric) => (
              <article className="metricCard" key={metric.label}>
                <div>
                  <h3>{metric.label}</h3>
                  <span>{metric.value}</span>
                </div>
                <p>{metric.body}</p>
              </article>
            ))}
          </div>
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

        <section className="baselinePanel" aria-labelledby="baseline-title">
          <div>
            <p className="eyebrow">Integrity Baseline</p>
            <h2 id="baseline-title">Teach AutoKirk where follow-through usually becomes exposed.</h2>
            <p>
              This intake layer gives AutoKirk the first operating map: what proof means, what exposure looks like, and what should be monitored first.
            </p>
          </div>

          <div className="baselineList" aria-label="Integrity baseline options">
            {integrityIntake.map((item) => (
              <label className="baselineOption" key={item}>
                <span aria-hidden="true" />
                {item}
              </label>
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
          padding: 24px 12px 40px;
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
        .integrityPanel,
        .workflowPanel,
        .baselinePanel,
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
        .integrityPanel,
        .workflowPanel,
        .baselinePanel,
        .systemPanel,
        .closing,
        .stateCard,
        .systemUseCard,
        .metricCard,
        .integritySummary article {
          border: 1px solid rgba(255, 255, 255, 0.09);
          background: linear-gradient(180deg, rgba(14, 18, 24, 0.96), rgba(8, 11, 16, 0.95));
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.46), inset 0 1px 0 rgba(255, 255, 255, 0.035);
          backdrop-filter: blur(12px);
        }

        .hero {
          min-height: 520px;
          border-radius: 34px;
          padding: clamp(32px, 5vw, 64px);
          display: grid;
          align-content: center;
          overflow: hidden;
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

        h1,
        h2,
        .signalCard strong,
        .closing strong {
          text-wrap: balance;
          overflow-wrap: break-word;
        }

        h1 {
          max-width: 880px;
          font-size: clamp(3rem, 7vw, 5.85rem);
          line-height: 0.98;
          letter-spacing: -0.064em;
        }

        h2 {
          max-width: 720px;
          font-size: clamp(1.65rem, 3vw, 2.75rem);
          line-height: 1.12;
          letter-spacing: -0.04em;
        }

        h3 {
          font-size: 1.05rem;
          line-height: 1.25;
        }

        .lede {
          max-width: 760px;
          margin-top: 22px;
          color: #e4e4e7;
          font-size: clamp(1.08rem, 2.1vw, 1.35rem);
          line-height: 1.48;
        }

        .support,
        .panelIntro p,
        .setupStep p,
        .systemUseCard p,
        .stateCard p,
        .closing p,
        .integrityHeader p,
        .integritySummary p,
        .metricCard p,
        .baselinePanel p {
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
        .integrityPanel,
        .workflowPanel,
        .baselinePanel,
        .systemPanel,
        .closing {
          margin-top: 14px;
          border-radius: 26px;
          padding: clamp(22px, 3vw, 34px);
          overflow: hidden;
        }

        .signalCard strong,
        .closing strong {
          display: block;
          max-width: 780px;
          font-size: clamp(1.35rem, 2.8vw, 2.25rem);
          line-height: 1.15;
          letter-spacing: -0.04em;
        }

        .integrityPanel {
          display: grid;
          gap: 18px;
        }

        .integrityHeader {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 260px;
          gap: 18px;
          align-items: stretch;
        }

        .integrityHeader > div,
        .workflowPanel > div,
        .baselinePanel > div,
        .systemPanel > div,
        .closing > div {
          min-width: 0;
        }

        .scoreCard {
          border: 1px solid rgba(16, 163, 127, 0.22);
          border-radius: 24px;
          padding: 20px;
          display: grid;
          align-content: center;
          background:
            radial-gradient(circle at 50% 0%, rgba(16, 163, 127, 0.16), transparent 70%),
            rgba(16, 163, 127, 0.045);
        }

        .scoreCard span,
        .integritySummary span,
        .metricCard span {
          color: #9ca3af;
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .scoreCard strong {
          margin-top: 8px;
          color: #f4f4f5;
          font-size: 4.5rem;
          line-height: 0.9;
          letter-spacing: -0.08em;
        }

        .scoreCard small {
          margin-top: 10px;
          color: #c7f9e7;
          font-weight: 800;
          line-height: 1.35;
        }

        .integritySummary {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .integritySummary article,
        .metricCard {
          border-radius: 20px;
          padding: 16px;
        }

        .integritySummary strong {
          display: block;
          margin-top: 8px;
          font-size: 1.08rem;
          line-height: 1.25;
        }

        .integritySummary p {
          margin-top: 8px;
        }

        .metricGrid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 10px;
        }

        .metricCard {
          min-height: 168px;
          display: grid;
          align-content: space-between;
          gap: 14px;
          background: rgba(18, 23, 30, 0.78);
        }

        .metricCard div {
          display: grid;
          gap: 8px;
        }

        .metricCard span {
          color: #c7f9e7;
        }

        .workflowPanel,
        .systemPanel,
        .baselinePanel {
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
        .systemUseGrid,
        .baselineList {
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

        .baselineOption {
          min-height: 44px;
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 11px 12px;
          color: #e4e4e7;
          background: rgba(18, 23, 30, 0.72);
          font-size: 0.94rem;
          line-height: 1.35;
        }

        .baselineOption span {
          width: 15px;
          height: 15px;
          border: 1px solid rgba(16, 163, 127, 0.46);
          border-radius: 5px;
          background: rgba(16, 163, 127, 0.06);
          flex: 0 0 auto;
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

        @media (max-width: 1040px) {
          .metricGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
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
          .integrityPanel,
          .workflowPanel,
          .baselinePanel,
          .systemPanel,
          .closing,
          .stateCard {
            border-radius: 22px;
            padding: 20px;
          }

          .integrityHeader,
          .integritySummary,
          .workflowPanel,
          .baselinePanel,
          .systemPanel,
          .stateGrid {
            grid-template-columns: 1fr;
          }

          h1 {
            font-size: clamp(2.8rem, 13vw, 4.8rem);
            line-height: 1;
          }

          h2 {
            font-size: clamp(1.8rem, 8vw, 3rem);
            line-height: 1.08;
          }

          .scoreCard strong {
            font-size: 3.75rem;
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

        @media (max-width: 560px) {
          .metricGrid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
