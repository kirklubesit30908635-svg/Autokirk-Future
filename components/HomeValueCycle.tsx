type LoopStep = {
  label: string;
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
            See the loop
          </a>
        </div>
      </section>

      <section className="loopCard" id="how-it-works" aria-labelledby="loop-title">
        <div className="sectionHeader">
          <p className="eyebrow">The loop</p>
          <h2 id="loop-title">Your software runs the work. AutoKirk keeps completion honest.</h2>
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

      <section className="closingCard" aria-label="AutoKirk outcome summary">
        <div>
          <p className="eyebrow">Start small</p>
          <strong>One workflow. One proof standard. One clear final state.</strong>
          <p>
            Test AutoKirk beside the tools you already use. See what stays open, what resolves, and what still needs proof.
          </p>
        </div>
        <a href="/activate" className="stripAction">
          Start with one workflow
        </a>
      </section>

      <style jsx>{`
        .homeShell {
          position: relative;
          width: min(1080px, calc(100% - 24px));
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
          inset: 28px auto auto 50%;
          width: min(760px, 86vw);
          height: 360px;
          transform: translateX(-50%);
          border-radius: 999px;
          background: radial-gradient(circle, rgba(16, 163, 127, 0.2), rgba(16, 163, 127, 0.065) 42%, transparent 72%);
          filter: blur(20px);
          opacity: 0.78;
        }

        .sideGlow {
          right: 3%;
          bottom: 8%;
          width: min(460px, 72vw);
          height: 250px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(88, 166, 255, 0.09), rgba(88, 166, 255, 0.03) 44%, transparent 72%);
          filter: blur(26px);
          opacity: 0.68;
        }

        .hero,
        .loopCard,
        .closingCard {
          position: relative;
          z-index: 1;
          border: 1px solid rgba(255, 255, 255, 0.09);
          background: linear-gradient(180deg, rgba(14, 18, 24, 0.96), rgba(8, 11, 16, 0.95));
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.46), inset 0 1px 0 rgba(255, 255, 255, 0.035);
          backdrop-filter: blur(12px);
        }

        .hero {
          border-radius: 34px;
          padding: clamp(30px, 6vw, 76px);
          min-height: 590px;
          display: grid;
          align-content: center;
        }

        .loopCard,
        .closingCard {
          margin-top: 14px;
          border-radius: 26px;
          padding: clamp(20px, 3vw, 30px);
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
          max-width: 780px;
          font-size: clamp(1.7rem, 3.6vw, 3.25rem);
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

        .loopGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .loopStep {
          min-height: 190px;
          padding: 18px;
          display: grid;
          align-content: start;
          gap: 12px;
          border: 1px solid rgba(255, 255, 255, 0.09);
          background: rgba(18, 23, 30, 0.78);
          border-radius: 20px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
        }

        .stepNumber {
          color: #10a37f;
          font-size: 0.8rem;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .loopStep p,
        .closingCard p {
          color: #a1a1aa;
          line-height: 1.45;
        }

        .closingCard {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }

        .closingCard strong {
          display: block;
          max-width: 760px;
          font-size: clamp(1.35rem, 3.2vw, 2.55rem);
          line-height: 1.08;
          letter-spacing: -0.05em;
        }

        .closingCard p {
          max-width: 680px;
          margin-top: 10px;
        }

        @media (max-width: 980px) {
          .homeShell {
            width: min(100% - 16px, 1080px);
            padding-top: 16px;
          }

          .hero {
            min-height: auto;
            border-radius: 24px;
            padding: 26px 20px;
          }

          .loopCard,
          .closingCard {
            border-radius: 22px;
            padding: 20px;
          }

          .loopGrid {
            grid-template-columns: 1fr;
          }

          .loopStep {
            min-height: auto;
          }

          .closingCard {
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
