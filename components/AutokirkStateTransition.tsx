export function AutokirkStateTransition() {
  return (
    <section className="stateTransition" aria-labelledby="state-transition-title">
      <div className="stateHeader">
        <p className="eyebrow">What AutoKirk changes</p>
        <h2 id="state-transition-title">Both states are inside AutoKirk.</h2>
        <p>
          The difference is not “no AutoKirk” versus “with AutoKirk.” The difference is
          whether the obligation has been closed with proof.
        </p>
      </div>

      <div className="stateGrid">
        <article className="stateCard pending">
          <p className="cardLabel">Before proof is supplied</p>
          <ul>
            <li>Obligation remains open</li>
            <li>Overdue state stays visible</li>
            <li>Watchdog can escalate the miss</li>
          </ul>
        </article>

        <div className="arrow" aria-hidden="true">→</div>

        <article className="stateCard closed">
          <p className="cardLabel">After AutoKirk receives proof</p>
          <ul>
            <li>Proof of completion or failure is recorded</li>
            <li>Obligation reaches a governed final state</li>
            <li>Receipt-backed truth is emitted</li>
          </ul>
        </article>
      </div>

      <style jsx>{`
        .stateTransition {
          width: min(1180px, calc(100% - 24px));
          margin: 0 auto 14px;
          padding: 22px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          background: rgba(17, 22, 28, 0.96);
          color: #f4f4f5;
          box-shadow: 0 22px 60px rgba(0, 0, 0, 0.32);
        }

        .stateHeader {
          max-width: 780px;
          display: grid;
          gap: 8px;
        }

        .eyebrow,
        .cardLabel {
          margin: 0;
          color: #a1a1aa;
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        h2,
        p {
          margin: 0;
        }

        h2 {
          font-size: clamp(1.65rem, 4vw, 3rem);
          letter-spacing: -0.04em;
          line-height: 1;
        }

        .stateHeader p:not(.eyebrow) {
          color: #a1a1aa;
          line-height: 1.5;
        }

        .stateGrid {
          margin-top: 18px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
          gap: 14px;
          align-items: center;
        }

        .stateCard {
          min-height: 176px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 18px;
          padding: 18px;
          background: rgba(20, 25, 32, 0.94);
          display: grid;
          gap: 12px;
          align-content: start;
        }

        .pending {
          border-color: rgba(248, 113, 113, 0.24);
        }

        .closed {
          border-color: rgba(16, 163, 127, 0.34);
        }

        ul {
          margin: 0;
          padding-left: 20px;
          display: grid;
          gap: 8px;
          color: #e4e4e7;
          line-height: 1.4;
        }

        .arrow {
          color: #a1a1aa;
          font-size: 2rem;
          line-height: 1;
        }

        @media (max-width: 760px) {
          .stateTransition {
            width: min(100% - 16px, 1180px);
            padding: 16px;
            border-radius: 18px;
          }

          .stateGrid {
            grid-template-columns: 1fr;
          }

          .arrow {
            transform: rotate(90deg);
            justify-self: start;
          }

          .stateCard {
            min-height: auto;
          }
        }
      `}</style>
    </section>
  );
}
