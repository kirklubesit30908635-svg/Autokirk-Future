type CycleStep = {
  title: string;
  body: string;
};

type Surface = {
  title: string;
  body: string;
};

const cycleSteps: CycleStep[] = [
  {
    title: "1. Existing tool creates work",
    body: "A job, AI action, audit control, revenue event, handoff, or internal task starts in the software you already use.",
  },
  {
    title: "2. AutoKirk keeps it visible",
    body: "Important work is not allowed to quietly disappear or be treated as done just because a status changed somewhere else.",
  },
  {
    title: "3. Proof decides the outcome",
    body: "Your rules define the proof standard. Sufficient proof resolves the work; missing proof keeps it visible, escalates, or fails.",
  },
  {
    title: "4. The final state is recorded",
    body: "The customer, operator, auditor, or source system can see what happened without needing to trust screenshots or memory.",
  },
];

const surfaces: Surface[] = [
  {
    title: "AI producers",
    body: "Build fast while giving customers proof-gated trust around AI-driven work.",
  },
  {
    title: "AI consumers",
    body: "Use AI without losing visibility into what completed, failed, or still needs proof.",
  },
  {
    title: "Service teams",
    body: "Keep jobs from being marked complete until the right completion or failure proof exists.",
  },
  {
    title: "Audit and compliance",
    body: "Keep controls visible until evidence exists and the final state can be trusted.",
  },
  {
    title: "Revenue enforcement",
    body: "Connect payments, contracts, and renewals to proof-backed fulfillment.",
  },
  {
    title: "Workforce movement",
    body: "People can join, leave, transfer, or hand off work while important obligations stay visible.",
  },
];

export function HomeValueCycle() {
  return (
    <section className="homeCycle" aria-labelledby="home-cycle-title">
      <div className="heroGrid">
        <div className="copy">
          <p className="eyebrow">Proof-gated closure infrastructure</p>
          <h1 id="home-cycle-title">Keep your software. Add proof-gated closure.</h1>
          <p className="lede">
            AutoKirk connects to the tools you already use and keeps important work from being marked complete until the right proof exists.
          </p>
          <p className="support">
            When proof is sufficient, work can resolve automatically. When proof is missing, it stays visible, escalates, or fails.
          </p>
          <div className="actions">
            <a href="#try-cycle" className="primaryAction">
              See how it works
            </a>
            <a href="#live-board" className="secondaryAction">
              Open live proof board
            </a>
          </div>
        </div>

        <div className="promiseCard" id="why-subscribe">
          <p className="cardLabel">Why subscribe</p>
          <h2>Important work should not disappear.</h2>
          <p>
            AutoKirk gives teams a trusted closeout layer without replacing the systems they already run.
          </p>
          <ul>
            <li>Keep unresolved work visible until proof exists.</li>
            <li>Resolve automatically when the proof standard is met.</li>
            <li>Escalate or fail work when proof is missing.</li>
          </ul>
        </div>
      </div>

      <div className="cycle" aria-label="AutoKirk proof-gated closure cycle" id="try-cycle">
        {cycleSteps.map((step) => (
          <article className="step" key={step.title}>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </article>
        ))}
      </div>

      <div className="surfaceSection" aria-labelledby="surface-title">
        <div className="surfaceIntro">
          <p className="stripLabel">One closure layer. Many operating surfaces.</p>
          <h2 id="surface-title">Designed to connect around the tools people already use.</h2>
        </div>
        <div className="surfaceGrid">
          {surfaces.map((surface) => (
            <article className="surfaceCard" key={surface.title}>
              <h3>{surface.title}</h3>
              <p>{surface.body}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="conversionStrip">
        <div>
          <p className="stripLabel">The category</p>
          <strong>Existing tool → important work → proof standard → resolve / fail / escalate</strong>
        </div>
        <a href="#live-board" className="stripAction">
          See live evidence
        </a>
      </div>

      <style jsx>{`
        .homeCycle {
          width: min(1180px, calc(100% - 24px));
          margin: 0 auto;
          padding: 28px 0 18px;
          color: #f4f4f5;
        }

        .heroGrid {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(300px, 0.75fr);
          gap: 18px;
          align-items: stretch;
        }

        .copy,
        .promiseCard,
        .step,
        .conversionStrip,
        .surfaceSection,
        .surfaceCard {
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(17, 22, 28, 0.96);
          box-shadow: 0 22px 60px rgba(0, 0, 0, 0.32);
        }

        .copy {
          border-radius: 28px;
          padding: clamp(24px, 5vw, 52px);
        }

        .eyebrow,
        .cardLabel,
        .stripLabel {
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
          max-width: 850px;
          font-size: clamp(2.75rem, 8vw, 6.6rem);
          line-height: 0.92;
          letter-spacing: -0.07em;
        }

        .lede {
          max-width: 760px;
          margin-top: 20px;
          color: #e4e4e7;
          font-size: clamp(1.08rem, 2.4vw, 1.45rem);
          line-height: 1.45;
        }

        .support {
          max-width: 730px;
          margin-top: 12px;
          color: #a1a1aa;
          font-size: clamp(0.98rem, 2vw, 1.15rem);
          line-height: 1.5;
        }

        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 26px;
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
        }

        .secondaryAction {
          border: 1px solid rgba(255, 255, 255, 0.16);
          color: #f4f4f5;
        }

        .promiseCard {
          border-radius: 28px;
          padding: 24px;
          display: grid;
          align-content: center;
          gap: 14px;
        }

        .promiseCard h2 {
          font-size: clamp(1.55rem, 3vw, 2.45rem);
          line-height: 1.05;
          letter-spacing: -0.04em;
        }

        .promiseCard p,
        .promiseCard li {
          color: #a1a1aa;
          line-height: 1.45;
        }

        .promiseCard ul {
          margin: 0;
          padding-left: 18px;
          display: grid;
          gap: 8px;
        }

        .cycle {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-top: 14px;
        }

        .step {
          border-radius: 20px;
          padding: 18px;
          min-height: 178px;
          display: grid;
          align-content: start;
          gap: 12px;
        }

        .step h3,
        .surfaceCard h3 {
          color: #f4f4f5;
          font-size: 1.02rem;
          line-height: 1.25;
        }

        .step p,
        .surfaceCard p {
          color: #a1a1aa;
          line-height: 1.45;
        }

        .surfaceSection {
          border-radius: 24px;
          margin-top: 14px;
          padding: 20px;
          display: grid;
          gap: 16px;
        }

        .surfaceIntro {
          max-width: 820px;
          display: grid;
          gap: 4px;
        }

        .surfaceIntro h2 {
          font-size: clamp(1.55rem, 3.4vw, 3rem);
          line-height: 1.05;
          letter-spacing: -0.045em;
        }

        .surfaceGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .surfaceCard {
          border-radius: 18px;
          padding: 16px;
          display: grid;
          gap: 8px;
          box-shadow: none;
        }

        .conversionStrip {
          border-radius: 22px;
          margin-top: 14px;
          padding: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }

        .conversionStrip strong {
          display: block;
          font-size: clamp(1.15rem, 3vw, 2rem);
          line-height: 1.15;
        }

        @media (max-width: 900px) {
          .homeCycle {
            width: min(100% - 16px, 1180px);
            padding-top: 16px;
          }

          .heroGrid,
          .cycle,
          .surfaceGrid {
            grid-template-columns: 1fr;
          }

          .copy,
          .promiseCard,
          .surfaceSection {
            border-radius: 22px;
            padding: 20px;
          }

          h1 {
            font-size: clamp(2.5rem, 13vw, 5.4rem);
          }

          .step {
            min-height: auto;
          }

          .conversionStrip {
            display: grid;
          }

          .primaryAction,
          .secondaryAction,
          .stripAction {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
}
