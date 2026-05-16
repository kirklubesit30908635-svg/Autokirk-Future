import Head from "next/head";

const paths = [
  ["Webhook/API", "/api/intake/webhook", "Generic POST endpoint for tools, scripts, backend jobs, and automation systems."],
  ["CRM", "/api/intake/crm", "Lead, customer, opportunity, or follow-up events become governed obligations."],
  ["Form", "/api/intake/form", "Website and customer forms can open proof-gated work."],
  ["Email", "/api/intake/email", "Forwarded or parsed inbox work can enter the governed proof path."],
  ["AI Agent", "/api/intake/agent", "Agent claims carry run identity, execution context, and proof-boundary provenance."],
  ["MCP Tool", "/api/intake/mcp", "MCP-connected tool events can be governed before they become business truth."],
  ["Automation", "/api/intake/automation", "Zapier, Make, scripts, and background jobs can create governed obligations."],
];

export default function IntakePage() {
  return (
    <>
      <Head>
        <title>Operational Intake | AutoKirk</title>
        <meta name="description" content="Connect where work starts and govern whether system, automation, and agent claims are allowed to count." />
      </Head>
      <main className="shell">
        <section className="card hero">
          <p className="eyebrow">Operational ingestion</p>
          <h1>Connect where work starts. Govern whether it counts.</h1>
          <p className="lede">AutoKirk now has a productized intake registry for connected systems, webhooks, CRM events, forms, email, automations, agents, and MCP-connected tools.</p>
          <div className="actions">
            <a className="primary" href="/platform">Create an intake link</a>
            <a className="secondary" href="/agent-proof">View agent proof boundary</a>
          </div>
        </section>

        <section className="card">
          <p className="eyebrow">Live intake paths</p>
          <h2>One governed source model. Multiple ways work can enter.</h2>
          <div className="grid">
            {paths.map(([label, path, body]) => (
              <article key={path}>
                <h3>{label}</h3>
                <code>{path}</code>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="card split">
          <div>
            <p className="eyebrow">What is recorded</p>
            <h2>Signals do not become truth automatically.</h2>
            <p>Each connected system can carry source identity, connector type, trust level, token fingerprint, ingestion scopes, health state, source event key, agent run ID, MCP tool name, and workflow chain.</p>
          </div>
          <div className="steps">
            <span>Connected system</span>
            <span>Source event</span>
            <span>Governed obligation</span>
            <span>Claim context</span>
            <span>Proof evaluation</span>
            <span>Receipt</span>
          </div>
        </section>

        <section className="card closing">
          <p className="eyebrow">Category boundary</p>
          <strong>Execution systems create signals. AutoKirk governs whether those signals count.</strong>
          <p>That separation is the moat: orchestration optimizes execution; AutoKirk optimizes governed truth.</p>
        </section>
      </main>
      <style jsx>{`
        .shell{min-height:100vh;background:radial-gradient(circle at 50% -10%,rgba(45,245,213,.13),transparent 34rem),#030303;color:#f5f5f5;padding:24px 12px 48px}.card{width:min(1120px,100%);margin:0 auto 16px;border:1px solid #242424;border-radius:30px;background:linear-gradient(180deg,#101010,#060606);box-shadow:0 24px 80px rgba(0,0,0,.55);padding:clamp(22px,3vw,38px)}.hero{min-height:420px;display:grid;align-content:center;gap:18px}h1,h2,h3,p{margin:0}h1{max-width:960px;font-size:clamp(3rem,7vw,5.8rem);line-height:.96;letter-spacing:-.065em}h2{font-size:clamp(1.8rem,3.2vw,3rem);letter-spacing:-.045em;line-height:1.05}.lede{max-width:760px;color:#d0d0d0;font-size:clamp(1.1rem,2vw,1.35rem);line-height:1.48}.eyebrow{color:#9a9a9a;font-size:.78rem;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.actions{display:flex;gap:12px;flex-wrap:wrap}.primary,.secondary{min-height:48px;border-radius:999px;padding:0 20px;text-decoration:none;display:inline-flex;align-items:center;font-weight:950}.primary{background:#2df5d5;color:#020202}.secondary{border:1px solid #2c2c2c;color:#f5f5f5}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:22px}.grid article,.steps span{border:1px solid #262626;border-radius:18px;background:#080808;padding:14px}.grid p,.split p,.closing p{color:#a9a9a9;line-height:1.55;margin-top:10px}code{display:block;margin-top:8px;color:#dffefa;font-size:.86rem}.split{display:grid;grid-template-columns:1fr 1fr;gap:18px}.steps{display:grid;gap:10px}.closing strong{display:block;font-size:clamp(1.5rem,3vw,2.8rem);line-height:1.05;letter-spacing:-.045em}@media(max-width:900px){.shell{padding:16px 8px 32px}.card{border-radius:22px}.grid,.split{grid-template-columns:1fr}.primary,.secondary{width:100%;justify-content:center}.hero{min-height:auto}}
      `}</style>
    </>
  );
}
