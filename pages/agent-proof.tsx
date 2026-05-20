import Head from "next/head";

export default function AgentProofPage() {
  return (
    <>
      <Head>
        <title>Proof-Required Completion | AutoKirk</title>
        <meta
          name="description"
          content="AutoKirk helps keep important work visible until the right proof exists."
        />
      </Head>

      <main className="shell">
        <section className="card hero">
          <p className="eyebrow">Proof-required completion</p>
          <h1>Important work should not be marked complete without proof.</h1>
          <p className="lede">
            AutoKirk connects to the tools you already use and keeps important
            work visible until the right proof exists.
          </p>

          <div className="stateStrip">
            <span>Important work</span>
            <span>Required proof</span>
            <span>Proof standard</span>
            <span>Trusted final state</span>
          </div>

          <div className="actions">
            <a href="/platform" className="primary">Start with one proof rule</a>
            <a href="/board/demo" className="secondary">View proof board</a>
          </div>
        </section>

        <section className="card gridCard">
          <article>
            <p className="eyebrow">What AutoKirk can govern</p>
            <h2>Human, system, automation, and AI-created work.</h2>
            <p>
              AutoKirk helps teams require proof before important work reaches a
              trusted final state.
            </p>
            <ul>
              <li>human work claims</li>
              <li>system-triggered actions</li>
              <li>automation workflows</li>
              <li>AI-created work</li>
              <li>multi-step handoffs</li>
              <li>external work assertions</li>
            </ul>
          </article>

          <article>
            <p className="eyebrow">Proof-required closeout</p>
            <h2>Resolve. Escalate. Fail.</h2>
            <p>
              When proof is sufficient, work can resolve automatically. When
              proof is missing, it stays visible, escalates, or fails.
            </p>
            <ul>
              <li>customer proof rules</li>
              <li>required proof</li>
              <li>clear decision reason</li>
              <li>required follow-up</li>
              <li>proof-required completion</li>
              <li>durable proof history</li>
            </ul>
          </article>
        </section>

        <section className="card flowCard">
          <p className="eyebrow">Completion trust</p>
          <h2>How proof-required completion works.</h2>

          <div className="flow">
            <div>
              <strong>01</strong>
              <h3>Choose where important work starts</h3>
              <p>Connect the work source your team already uses.</p>
            </div>

            <div>
              <strong>02</strong>
              <h3>Define what proof means</h3>
              <p>Set the proof standard for that work.</p>
            </div>

            <div>
              <strong>03</strong>
              <h3>Keep work visible</h3>
              <p>Track the work until the right proof exists.</p>
            </div>

            <div>
              <strong>04</strong>
              <h3>Review the proof</h3>
              <p>Resolve, escalate, or fail the work based on the proof standard.</p>
            </div>

            <div>
              <strong>05</strong>
              <h3>Preserve the final state</h3>
              <p>Keep a durable history of the decision and supporting proof.</p>
            </div>
          </div>
        </section>

        <section className="card publicCard">
          <p className="eyebrow">AI-created work</p>
          <h2>AI can create, suggest, and act. Proof decides what counts.</h2>
          <p className="footnote">
            AutoKirk helps determine whether the result is acceptable to count as
            complete based on your rules, required proof, and evidence of how it
            got there.
          </p>
        </section>
      </main>

      <style jsx>{`
        .shell{min-height:100vh;padding:24px 12px 48px;color:#f5f5f5;background:radial-gradient(circle at 50% -10%,rgba(45,245,213,.12),transparent 36rem),#030303}
        .card{width:min(1120px,100%);margin:0 auto 16px;border:1px solid #242424;border-radius:30px;background:linear-gradient(180deg,#101010,#060606);padding:clamp(22px,3vw,38px);box-shadow:0 24px 80px rgba(0,0,0,.55)}
        .hero{display:grid;gap:18px;min-height:420px;align-content:center}
        h1,h2,h3,p{margin:0}
        h1{font-size:clamp(3rem,7vw,5.7rem);line-height:.96;letter-spacing:-.065em;max-width:920px}
        h2{font-size:clamp(1.8rem,3vw,3rem);line-height:1.04;letter-spacing:-.045em}
        h3{font-size:1.05rem}
        .lede{max-width:760px;color:#d0d0d0;font-size:clamp(1.08rem,2vw,1.32rem);line-height:1.5}
        .eyebrow{font-size:.78rem;font-weight:900;letter-spacing:.11em;text-transform:uppercase;color:#9a9a9a}
        .stateStrip,.flow{display:grid;gap:12px}
        .stateStrip{grid-template-columns:repeat(4,minmax(0,1fr))}
        .stateStrip span,.flow div{border:1px solid #262626;border-radius:18px;background:#080808;padding:14px}
        .actions{display:flex;gap:12px;flex-wrap:wrap}
        .primary,.secondary{min-height:48px;border-radius:999px;padding:0 20px;display:inline-flex;align-items:center;justify-content:center;text-decoration:none;font-weight:950}
        .primary{background:#2df5d5;color:#020202}
        .secondary{border:1px solid #2c2c2c;color:#f5f5f5;background:#080808}
        .gridCard{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
        article p,li{color:#b0b0b0;line-height:1.55}
        ul{margin:14px 0 0;padding-left:18px}
        .flow{grid-template-columns:repeat(5,minmax(0,1fr));margin-top:22px}
        .flow strong{display:inline-flex;width:34px;height:34px;border-radius:999px;background:#2df5d5;color:#020202;align-items:center;justify-content:center;font-size:.85rem;margin-bottom:12px}
        .footnote{margin-top:18px;color:#b0b0b0;line-height:1.55;max-width:820px}
        @media(max-width:900px){
          .shell{padding:16px 8px 32px}
          .card{border-radius:22px}
          .gridCard,.flow,.stateStrip{grid-template-columns:1fr}
          .primary,.secondary{width:100%}
        }
      `}</style>
    </>
  );
}
