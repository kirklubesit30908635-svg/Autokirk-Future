import Head from "next/head";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";

import { SystemProofBoard, type SystemProofBoardProps } from "../components/SystemProofBoard";
import { getSystemProofBoardData } from "../components/systemProofData";

type ProofDemoPageProps = {
  board: SystemProofBoardProps;
};

export const getServerSideProps: GetServerSideProps<ProofDemoPageProps> = async () => {
  return {
    props: {
      board: await getSystemProofBoardData(),
    },
  };
};

export default function ProofDemoPage({
  board,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <>
      <Head>
        <title>AutoKirk Proof Demo</title>
        <meta
          name="description"
          content="Operator-facing proof demo: obligation cannot be dropped."
        />
      </Head>

      <section className="proofDemoBrief" aria-labelledby="proof-demo-title">
        <div className="proofDemoShell">
          <p className="proofDemoKicker">OPERATOR PROOF DEMO</p>
          <h1 id="proof-demo-title">Obligation cannot be dropped.</h1>
          <p className="proofDemoCopy">
            This route packages the existing AutoKirk lifecycle into a two-minute operator proof:
            payment creates an obligation, the obligation remains visible, and closure requires a receipt.
          </p>

          <div className="proofDemoGrid" aria-label="Proof demo acceptance checks">
            <div className="proofDemoCard">
              <span>01</span>
              <strong>Stripe event</strong>
              <p>A real payment event enters the system as a governed source event.</p>
            </div>
            <div className="proofDemoCard">
              <span>02</span>
              <strong>Obligation opened</strong>
              <p>The canonical RPC path turns the event into an obligation.</p>
            </div>
            <div className="proofDemoCard">
              <span>03</span>
              <strong>Proof required</strong>
              <p>The work item cannot silently disappear while proof is missing.</p>
            </div>
            <div className="proofDemoCard">
              <span>04</span>
              <strong>Receipt emitted</strong>
              <p>Completion becomes real only when the receipt-backed terminal state exists.</p>
            </div>
          </div>

          <div className="proofDemoScript">
            <strong>Demo line:</strong> A payment came in. AutoKirk created the duty. It stayed open until proof existed.
          </div>
        </div>
      </section>

      <SystemProofBoard {...board} />

      <style jsx>{`
        .proofDemoBrief {
          background: #050403;
          color: #f8efe3;
          padding: 40px 20px 16px;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .proofDemoShell {
          max-width: 1180px;
          margin: 0 auto;
          border: 1px solid rgba(248, 239, 227, 0.14);
          border-radius: 28px;
          padding: 28px;
          background:
            radial-gradient(circle at top left, rgba(255, 174, 66, 0.16), transparent 34%),
            linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.38);
        }

        .proofDemoKicker {
          margin: 0 0 10px;
          color: #f5b95f;
          font-size: 12px;
          letter-spacing: 0.22em;
          font-weight: 800;
        }

        .proofDemoShell h1 {
          margin: 0;
          max-width: 820px;
          font-size: clamp(36px, 7vw, 78px);
          line-height: 0.92;
          letter-spacing: -0.07em;
        }

        .proofDemoCopy {
          max-width: 760px;
          margin: 18px 0 0;
          color: rgba(248, 239, 227, 0.72);
          font-size: 18px;
          line-height: 1.6;
        }

        .proofDemoGrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-top: 26px;
        }

        .proofDemoCard {
          border: 1px solid rgba(248, 239, 227, 0.12);
          border-radius: 20px;
          padding: 18px;
          background: rgba(5, 4, 3, 0.54);
        }

        .proofDemoCard span {
          display: block;
          color: #f5b95f;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.16em;
          margin-bottom: 14px;
        }

        .proofDemoCard strong {
          display: block;
          font-size: 16px;
          margin-bottom: 8px;
        }

        .proofDemoCard p {
          margin: 0;
          color: rgba(248, 239, 227, 0.64);
          font-size: 14px;
          line-height: 1.5;
        }

        .proofDemoScript {
          margin-top: 18px;
          border-left: 3px solid #f5b95f;
          padding: 14px 16px;
          color: rgba(248, 239, 227, 0.84);
          background: rgba(245, 185, 95, 0.08);
          border-radius: 14px;
        }

        @media (max-width: 860px) {
          .proofDemoGrid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
