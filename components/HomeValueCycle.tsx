type CycleStep = {
  title: string;
  body: string;
};

const cycleSteps: CycleStep[] = [
  {
    title: "1. Define what is owed",
    body: "Capture one promise: what must happen, who owns it, and what proof will close it.",
  },
  {
    title: "2. Govern it as an obligation",
    body: "AutoKirk opens a governed obligation instead of another loose task or note.",
  },
  {
    title: "3. Prove completion or failure",
    body: "The operator submits evidence. Completion proof resolves the obligation; failure proof preserves the truth that it was not completed.",
  },
  {
    title: "4. Give the customer a receipt",
    body: "Closure emits receipt-backed truth the customer can see, audit, and rely on.",
  },
];

export function HomeValueCycle() {
  return (
    <section className="homeCycle" aria-labelledby="home-cycle-title">
      <div className="heroGrid">
        <div className="copy">
          <p className="eyebrow">Governed obligation truth</p>
          <h1 id="home-cycle-title">Stop marking work done. Prove what happened.</h1>
          <p className="lede">
            AutoKirk is for businesses that owe customers outcomes: reports, services,
            deliveries, follow-ups, compliance work, or any promise that should not disappear
            without proof of completion or proof of failure.
          </p>
          <div className="actions">
            <a href="#try-cycle" className="primaryAction">
              Try the proof cycle
            </a>
            <a href="#why-subscribe" className="secondaryAction">
              Why subscribe
            </a>
          </div>
        </div>

        <div className="promiseCard" id="why-subscribe">
          <p className="cardLabel">Value of subscribing</p>
          <h2>A customer-visible truth board for every promise your business makes.</h2>
          <p>
            Subscribers get one place to see what is open, what was completed, what failed,
            and which receipts prove the final state.
          </p>
          <ul>
            <li>Customers stop asking, “Was this actually done?”</li>
            <li>Operators stop relying on screenshots and memory.</li>
            <li>Every closed obligation becomes receipt-backed truth.</li>
          </ul>
        </div>
      </div>

      <div className="cycle" aria-label="AutoKirk customer cycle">
        {cycleSteps.map((step) => (
          <article className="step" key={step.title}>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </article>
        ))}
      </div>

      <div className="conversionStrip" id="try-cycle">
        <div>
          <p className="stripLabel">The loop</p>
          <strong>Promise → Obligation → Completion or failure proof → Receipt → Renewal trust</strong>
        </div>
        <a href="#live-board" className="stripAction">
          Open the live board
        </a>
      </div>

      <style jsx>{`
        .homeCycle {
          width: min(1180px, calc(100% - 24px));
          margin: 0 auto;
          padding: 28px 0 18px;
          color: #eef7f0;
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
        .conversionStrip {
          border: 1px solid rgba(135, 214, 230, 0.22);
          background: rgba(8, 24, 29, 0.88);
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
        }

        .copy {
          border-radius: 28px;
          padding: clamp(24px, 5vw, 48px);
        }

        .eyebrow,
        .cardLabel,
        .stripLabel {
          margin: 0 0 10px;
          color: #5bd7ff;
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        h1,
        h2,
        h3,
        p {
          margin: 0;
        }

        h1 {
          max-width: 780px;
          font-size: clamp(2.7rem, 9vw, 6.8rem);
          line-height: 0.9;
          letter-spacing: -0.07em;
        }

        .lede {
          max-width: 720px;
          margin-top: 18px;
          color: #c9d8c9;
          font-size: clamp(1rem, 2.4vw, 1.35rem);
          line-height: 1.45;
        }

        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 24px;
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
          background: linear-gradient(180deg, #65dcff, #25aeea);
          color: #05212b;
        }

        .secondaryAction {
          border: 1px solid rgba(240, 219, 145, 0.45);
          color: #f0db91;
        }

        .promiseCard {
          border-radius: 28px;
          padding: 24px;
          display: grid;
          align-content: center;
          gap: 14px;
        }

        .promiseCard h2 {
          font-size: clamp(1.45rem, 3vw, 2.35rem);
          line-height: 1.05;
          letter-spacing: -0.03em;
        }

        .promiseCard p,
        .promiseCard li {
          color: #c9d8c9;
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
          min-height: 160px;
          display: grid;
          align-content: start;
          gap: 12px;
        }

        .step h3 {
          color: #f0db91;
          font-size: 1.02rem;
          line-height: 1.25;
        }

        .step p {
          color: #c9d8c9;
          line-height: 1.45;
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
          .cycle {
            grid-template-columns: 1fr;
          }

          .copy,
          .promiseCard {
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
