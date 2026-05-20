import { useMemo, useState } from "react";

type ProofWindowProps = {
  workspace: string;
  boardHref?: string;
};

const proofStates = [
  { label: "Open", count: 3, tone: "open", body: "Important work is still waiting for proof." },
  { label: "Proof ready", count: 1, tone: "ready", body: "Evidence is present. Governed close is available." },
  { label: "Needs attention", count: 1, tone: "attention", body: "Proof is missing, unclear, or not enough." },
  { label: "Closed with receipt", count: 2, tone: "closed", body: "Final state recorded with a receipt-backed record." },
];

const notifications = [
  "New obligation opened from live work.",
  "Proof required before close.",
  "Receipt-backed completion ready.",
];

function displayWorkspace(workspace: string) {
  return workspace
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim() || "Subscriber";
}

export default function AutoKirkProofWindow({ workspace, boardHref }: ProofWindowProps) {
  const [expanded, setExpanded] = useState(true);
  const subscriberName = useMemo(() => displayWorkspace(workspace), [workspace]);
  const proofBoardHref = boardHref ?? `/board/${encodeURIComponent(workspace)}`;
  const openCount = proofStates.find((state) => state.label === "Open")?.count ?? 0;

  return (
    <section className={expanded ? "proofWindow expanded" : "proofWindow"} aria-label="AutoKirk Proof Window">
      <button className="launcher" type="button" onClick={() => setExpanded((current) => !current)} aria-expanded={expanded}>
        <span className="mark">AK</span>
        <span className="launcherText">
          <strong>AutoKirk</strong>
          <small>{openCount} open proof items</small>
        </span>
        <span className="pulse" />
      </button>

      {expanded && (
        <div className="panel">
          <div className="topline">
            <div>
              <p className="eyebrow">AutoKirk Proof Window</p>
              <h1>Work is not complete until it is proven.</h1>
            </div>
            <button className="collapse" type="button" onClick={() => setExpanded(false)} aria-label="Collapse AutoKirk Proof Window">-</button>
          </div>

          <div className="subscriber">
            <span className="liveDot" />
            <div>
              <strong>{subscriberName}</strong>
              <p>The proof layer between work claimed and work closed.</p>
            </div>
          </div>

          <div className="states">
            {proofStates.map((state) => (
              <article className={`state ${state.tone}`} key={state.label}>
                <div>
                  <span>{state.label}</span>
                  <strong>{state.count}</strong>
                </div>
                <p>{state.body}</p>
              </article>
            ))}
          </div>

          <div className="notifications">
            <p className="eyebrow">Live proof notifications</p>
            {notifications.map((notification) => (
              <div className="notice" key={notification}>
                <span />
                <p>{notification}</p>
              </div>
            ))}
          </div>

          <div className="actions">
            <a className="primary" href={proofBoardHref} target="_blank" rel="noreferrer">Open proof board</a>
            <a className="secondary" href="/platform" target="_blank" rel="noreferrer">Activate workflow</a>
          </div>

          <p className="footer">AutoKirk keeps important work open until the right proof exists.</p>
        </div>
      )}

      <style jsx>{`
        .proofWindow{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#f8fafc;width:min(420px,100%)}
        .launcher{width:100%;min-height:64px;border:1px solid rgba(16,163,127,.38);border-radius:999px;background:linear-gradient(135deg,rgba(4,8,12,.98),rgba(7,18,16,.98));color:#f8fafc;display:flex;align-items:center;gap:12px;padding:10px 14px;box-shadow:0 18px 60px rgba(0,0,0,.42),0 0 28px rgba(16,163,127,.16);cursor:pointer;text-align:left}
        .mark{height:40px;width:40px;border-radius:14px;display:grid;place-items:center;color:#06130f;background:#10a37f;font-weight:1000;letter-spacing:-.06em;box-shadow:0 0 28px rgba(16,163,127,.52)}
        .launcherText{display:grid;gap:2px;flex:1}.launcherText strong{font-size:1rem;letter-spacing:-.03em}.launcherText small{color:#b6c2c9;font-weight:800}.pulse{height:10px;width:10px;border-radius:999px;background:#10a37f;box-shadow:0 0 0 8px rgba(16,163,127,.12),0 0 22px rgba(16,163,127,.85)}
        .panel{margin-top:10px;border:1px solid rgba(255,255,255,.12);border-radius:28px;background:radial-gradient(circle at 20% -10%,rgba(16,163,127,.22),transparent 18rem),linear-gradient(180deg,rgba(12,18,25,.98),rgba(5,8,13,.98));box-shadow:0 28px 90px rgba(0,0,0,.58);overflow:hidden;padding:18px}.topline{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.eyebrow{margin:0 0 8px;color:#10a37f;font-size:.72rem;font-weight:1000;letter-spacing:.14em;text-transform:uppercase}h1{margin:0;font-size:1.72rem;line-height:1;letter-spacing:-.06em;max-width:320px}.collapse{height:34px;width:34px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#f8fafc;font:inherit;font-weight:1000;cursor:pointer}.subscriber{display:flex;align-items:center;gap:10px;margin:16px 0;padding:12px;border:1px solid rgba(16,163,127,.22);border-radius:18px;background:rgba(16,163,127,.08)}.subscriber strong{display:block}.subscriber p{margin:2px 0 0;color:#b6c2c9;font-size:.9rem}.liveDot{height:10px;width:10px;border-radius:999px;background:#10a37f;box-shadow:0 0 18px rgba(16,163,127,.85)}.states{display:grid;grid-template-columns:1fr 1fr;gap:9px}.state{border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:12px;background:rgba(255,255,255,.045)}.state div{display:flex;align-items:center;justify-content:space-between;gap:10px}.state span{font-size:.8rem;font-weight:1000;color:#d4d4d8}.state strong{font-size:1.55rem;line-height:1}.state p{margin:7px 0 0;color:#a1a1aa;font-size:.82rem;line-height:1.32}.ready{border-color:rgba(34,197,94,.34)}.attention{border-color:rgba(251,191,36,.34)}.closed{border-color:rgba(148,163,184,.22)}.notifications{margin-top:15px;border-top:1px solid rgba(255,255,255,.09);padding-top:14px}.notice{display:flex;gap:9px;align-items:center;margin-top:8px;color:#d4d4d8;font-size:.9rem}.notice span{height:7px;width:7px;border-radius:999px;background:#10a37f}.notice p{margin:0}.actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:16px}.primary,.secondary{min-height:44px;border-radius:999px;display:flex;align-items:center;justify-content:center;text-decoration:none;font-weight:1000}.primary{background:#10a37f;color:#06130f}.secondary{border:1px solid rgba(255,255,255,.16);color:#f8fafc;background:rgba(255,255,255,.05)}.footer{margin:14px 0 0;color:#b6c2c9;font-size:.86rem;line-height:1.42}@media(max-width:460px){.proofWindow{width:100%}.states,.actions{grid-template-columns:1fr}h1{font-size:1.45rem}.panel{border-radius:22px}}
      `}</style>
    </section>
  );
}
