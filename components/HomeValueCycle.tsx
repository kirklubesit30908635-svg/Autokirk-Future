type LoopStep = {
  label: string;
  body: string;
};

type UseCase = {
  title: string;
  body: string;
};

const loopSteps: LoopStep[] = [
  {
    label: "Work starts",
    body: "A tool, person, AI workflow, payment, service job, or handoff creates important work.",
  },
  {
    label: "Proof required",
    body: "AutoKirk keeps the work visible until the right proof exists.",
  },
  {
    label: "Resolve or escalate",
    body: "Sufficient proof resolves it. Missing proof keeps it visible, escalates, or fails.",
  },
];

const useCases: UseCase[] = [
  {
    title: "AI actions",
    body: "Know whether work created or completed by AI is acceptable to count as done.",
  },
  {
    title: "Revenue follow-up",
    body: "Keep payment, renewal, fulfillment, and exception work visible until proof exists.",
  },
  {
    title: "Service closeout",
    body: "Keep jobs from being marked complete without completion or failure proof.",
  },
  {
    title: "Audit evidence",
    body: "Keep controls visible until evidence exists and the final state is clear.",
  },
  {
    title: "Employee handoffs",
    body: "Keep important work visible as people join, leave, transfer, or hand off ownership.",
  },
];

export function HomeValueCycle() {
  return (
    <section className="homeShell" aria-labelledby="home-title">
      <div className="underGlow" aria-hidden="true" />
      <div className="sideGlow" aria-hidden="true" />

      <section className="hero" aria-labelledby="home-title">
        <p className="eyebrow">Completion trust for existing tools</p>
        <h1 id="home-title">Important work should not be marked complete without proof.</h1>
        <p className="lede">
          AutoKirk connects to the tools you already use and keeps important work visible until the right proof exists.
        </p>
        <p className="support">
          When proof is sufficient, work can resolve automatically. When proof is missing, it stays visible, escalates, or fails.
        </p>
        <div className="actions" aria-label="Homepage actions">
          <a href="/activate" className="primaryAction">
            Activate your AutoKirk link
          </a>
          <a href="#how-it-works" className="secondaryAction">
            See how it works
          </a>
        </div>
      </section>

      <section className="loopCard" id="how-it-works" aria-labelledby="loop-title">
        <div className="sectionHeader">
          <p className="eyebrow">The loop</p>
          <h2 id="loop-title">Existing tools still run the work. AutoKirk keeps completion honest.</h2>
        </div>
        <div className="loopGrid">
          {loopSteps.map((step, index) => (
            <article className="loopStep" key={step.label}>
              <span className="stepNumber">0{index + 1}</span>
              <h3>{step.label}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="proofStrip" aria-label="AutoKirk outcome summary">
        <div>
          <p className="eyebrow">What changes</p>
          <strong>Work does not disappear. Completion has to be supported by proof.</strong>
        </div>
        <a href="/activate" className="stripAction">
          Start with one workflow
        </a>
      </section>

      <section className="useCases" aria-labelledby="use-title">
        <div className="sectionHeader compact">
          <p className="eyebrow">Where it applies</p>
          <h2 id="use-title">One trust layer. Many ways to use it.</h2>
        </div>
        <div className="useGrid">
          {useCases.map((useCase) => (
            <article className="useCase" key={useCase.title}>
              <h3>{useCase.title}</h3>
              <p>{useCase.body}</p>
            </article>
          ))}
        </div>
      </section>

      <style jsx>{`
        .homeShell {
          position: relative;
          width: min(1120px, calc(100% - 24px));
          margin: 0 auto;
          padding: 28px 0 22px;
          color: #f4f4f5;
          isolation: isolate;
        }

        .underGlow,
        .sideGlow {
          position: absolute;
          pointer-events: none;
          z-index: 0;
        }

        .underGlow {
          inset: 18px auto auto 50%;
          width: min(760px, 86vw);
          height: 360px;
          transform: translateX(-50%);
          border-radius: 999px;
          background: radial-gradient(circle, rgba(16, 163, 127, 0.2), rgba(16, 163, 127, 0.07) 42%, transparent 72%);
          filter: blur(18px);
          opacity: 0.82;
        }

        .sideGlow {
          right: 4%;
          bottom: 12%;
          width: min(460px, 72vw);
          height: 250px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(88, 166, 255, 0.1), rgba(88, 166, 255, 0.035) 44%, transparent 72%);
          filter: blur(24px);
          opacity: 0.72;
        }

        .hero,
        .loopCard,
        .proofStrip,
        .useCases {
          position: relative;
          z-index: 1;
          border: 1px solid rgba(255, 255, 255, 0.09);
          background: linear-gradient(180deg, rgba(14, 18, 24, 0.96), rgba(8, 11, 16, 0.95));
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.46), inset 0 1px 0 rgba(255, 255, 255, 0.035);
          backdrop-filter: blur(12px);
        }

        .hero {
          border-radius: 34px;
          padding: clamp(28px, 6vw, 72px);
          min-height: 570px;
          display: grid;
          align-content: center;
        }

        .loopCard,
        .useCases,
        .proofStrip {
          margin-top: 14px;
          border-radius: 26px;
          padding: clamp(18px, 3vw, 28px);
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
          max-width: 940px;
          font-size: clamp(2.8rem, 8vw, 6.8rem);
          line-height: 0.92;
          letter-spacing: -0.075em;
        }

        h2 {
          max-width: 800px;
          font-size: clamp(1.65rem, 3.6vw, 3.25rem);
          line-height: 1.04;
          letter-spacing: -0.05em;
        }

        h3 {
          font-size: 1.03rem;
          line-height: 1.25;
        }

        .lede {
          max-width: 760px;
          margin-top: 22px;
          color: #e4e4e7;
          font-size: clamp(1.08rem, 2.4vw, 1.45rem);
          line-height: 1.45;
        }

        .support {
          max-width: 700px;
          margin-top: 12px;
          color: #a1a1aa;
          font-size: clamp(0.98rem, 2vw, 1.13rem);
          line-height: 1.5;
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

        .sectionHeader {
          display: grid;
          gap: 4px;
          margin-bottom: 18px;
        }

        .compact {
          margin-bottom: 14px;
        }

        .loopGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .loopStep,
        .useCase {
          border: 1px solid rgba(255, 255, 255, 0.09);
          background: rgba(18, 23, 30, 0.78);
          border-radius: 20px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
        }

        .loopStep {
          min-height: 190px;
          padding: 18px;
          display: grid;
          align-content: start;
          gap: 12px;
        }

        .stepNumber {
          color: #10a37f;
          font-size: 0.8rem;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .loopStep p,
        .useCase p {
          color: #a1a1aa;
          line-height: 1.45;
        }

        .proofStrip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }

        .proofStrip strong {
          display: block;
          max-width: 760px;
          font-size: clamp(1.25rem, 3.1vw, 2.35rem);
          line-height: 1.08;
          letter-spacing: -0.045em;
        }

        .useGrid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 10px;
        }

        .useCase {
          padding: 15px;
          display: grid;
          gap: 8px;
        }

        @media (max-width: 980px) {
          .homeShell {
            width: min(100% - 16px, 1120px);
            padding-top: 16px;
          }

          .hero {
            min-height: auto;
            border-radius: 24px;
            padding: 26px 20px;
          }

          .loopCard,
          .useCases,
          .proofStrip {
            border-radius: 22px;
            padding: 20px;
          }

          .loopGrid,
          .useGrid {
            grid-template-columns: 1fr;
          }

          .loopStep {
            min-height: auto;
          }

          .proofStrip {
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
