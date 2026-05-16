import Head from "next/head";

export default function AgentProofPage() {
  return (
    <>
      <Head>
        <title>Agent Proof Boundary | AutoKirk</title>
        <meta
          name="description"
          content="Govern whether agentic work is allowed to count through authority boundaries, proof evaluation, and receipt-backed completion."
        />
      </Head>

      <main className="shell">
        <section className="card hero">
          <p className="eyebrow">Agentic proof boundary</p>
          <h1>Govern whether autonomous work is allowed to count.</h1>
          <p className="lede">
            AutoKirk does not replace your agents, automations, or systems.
            It governs whether their claims are allowed to become business truth.
          </p>

          <div className="stateStrip">
            <span>Claim source</span>
            <span>Authority boundary</span>
            <span>Proof evaluation</span>
            <span>Receipt rationale</span>
          </div>

          <div className="actions">
            <a href="/platform" className="primary">Start with one proof rule</a>
            <a href="/board/demo" className="secondary">View proof board</a>
          </div>
        </section>

        <section className="card gridCard">
          <article>
            <p className="eyebrow">What AutoKirk can now govern</p>
            <h2>Human, API, automation, and agent claims.</h2>
            <p>
              AutoKirk now supports governed provenance for:
            </p>
            <ul>
              <li>human work claims</li>
              <li>API-triggered actions</li>
              <li>automation workflows</li>
              <li>AI agents</li>
              <li>multi-agent systems</li>
              <li>external system assertions</li>
            </ul>
          </article>

          <article>
            <p className="eyebrow">Authority-aware completion</p>
            <h2>Approve. Deny. Conditional.</h2>
            <p>
              AutoKirk evaluates whether claimed work should count before closure.
            </p>
            <ul>
              <li>authority boundaries</li>
              <li>machine-readable rationale</li>
              <li>cited controls</li>
              <li>required follow-up</li>
              <li>receipt-backed closure</li>
              <li>append-only proof trails</li>
            </ul>
          </article>
        </section>

        <section className="card flowCard">
          <p className="eyebrow">Governed flow</p>
          <h2>How the proof boundary works.</h2>

          <div className="flow">
            <div>
              <strong>01</strong>
              <h3>Register claim source</h3>
              <p>Identify who or what is making the claim.</p>
            </div>

            <div>
              <strong>02</strong>
              <h3>Define authority boundary</h3>
              <p>Define what the source may claim or close.</p>
            </div>

            <div>
              <strong>03</strong>
              <h3>Attach obligation context</h3>
              <p>Bind the claim to a governed obligation.</p>
            </div>

            <div>
              <strong>04</strong>
              <h3>Evaluate proof</h3>
              <p>Approve, deny, or conditionally gate completion.</p>
            </div>

            <div>
              <strong>05</strong>
              <h3>Emit receipt</h3>
              <p>Preserve rationale, controls, and proof history.</p>
            </div>
          </div>
        </section>

        <section className="card apiCard">
          <p className="eyebrow">Live governed APIs</p>
          <h2>Operational proof-boundary surfaces are now live.</h2>

          <div className="apiGrid">
            <div><code>api.register_claim_source(...)</code></div>
            <div><code>api.upsert_authority_boundary(...)</code></div>
            <div><code>api.attach_obligation_claim_context(...)</code></div>
            <div><code>api.evaluate_proof_boundary(...)</code></div>
          </div>

          <p className="footnote">
            These APIs operate beside the existing governed obligation kernel and canonical receipt path.
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
        .stateStrip,.flow,.apiGrid{display:grid;gap:12px}
        .stateStrip{grid-template-columns:repeat(4,minmax(0,1fr))}
        .stateStrip span,.apiGrid div,.flow div{border:1px solid #262626;border-radius:18px;background:#080808;padding:14px}
        .actions{display:flex;gap:12px;flex-wrap:wrap}
        .primary,.secondary{min-height:48px;border-radius:999px;padding:0 20px;display:inline-flex;align-items:center;justify-content:center;text-decoration:none;font-weight:950}
        .primary{background:#2df5d5;color:#020202}
        .secondary{border:1px solid #2c2c2c;color:#f5f5f5;background:#080808}
        .gridCard{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
        article p,li{color:#b0b0b0;line-height:1.55}
        ul{margin:14px 0 0;padding-left:18px}
        .flow{grid-template-columns:repeat(5,minmax(0,1fr));margin-top:22px}
        .flow strong{display:inline-flex;width:34px;height:34px;border-radius:999px;background:#2df5d5;color:#020202;align-items:center;justify-content:center;font-size:.85rem;margin-bottom:12px}
        .apiGrid{grid-template-columns:repeat(2,minmax(0,1fr));margin-top:18px}
        code{font-size:.92rem;color:#dffefa}
        .footnote{margin-top:18px;color:#8e8e8e}
        @media(max-width:900px){
          .shell{padding:16px 8px 32px}
          .card{border-radius:22px}
          .gridCard,.flow,.apiGrid,.stateStrip{grid-template-columns:1fr}
          .primary,.secondary{width:100%}
        }
      `}</style>
    </>
  );
}
