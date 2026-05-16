import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

type CountMap = Record<string, number | null>;
type RegistryResponse =
  | {
      ok: true;
      authorized: boolean;
      counts: CountMap;
      connected_systems: Array<Record<string, unknown>>;
      ingestion_events: Array<Record<string, unknown>>;
      proof_evaluations: Array<Record<string, unknown>>;
      receipt_rationales: Array<Record<string, unknown>>;
      message?: string;
    }
  | { ok: false; error: string; detail?: string };

type CapabilityResponse =
  | {
      ok: true;
      vocabulary: string[];
      tables: Record<string, { count: number | null; error: string | null }>;
      routes: string[];
      rpcBoundary: string;
      productState: string;
    }
  | { ok: false; error: string; detail?: string };

const visibleSections = [
  ["connected_systems", "Connected systems"],
  ["ingestion_events", "Ingestion events"],
  ["proof_evaluations", "Proof evaluations"],
  ["receipt_rationales", "Receipt rationales"],
] as const;

function valueText(value: unknown): string {
  if (value === null || typeof value === "undefined") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function useOpsKey(): [string, (value: string) => void] {
  const [key, setKeyState] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryKey = params.get("key") ?? window.localStorage.getItem("autokirk_ops_key") ?? "";
    setKeyState(queryKey);
  }, []);
  const setKey = (value: string) => {
    setKeyState(value);
    if (value) window.localStorage.setItem("autokirk_ops_key", value);
    else window.localStorage.removeItem("autokirk_ops_key");
  };
  return [key, setKey];
}

export default function OpsPage() {
  const [key, setKey] = useOpsKey();
  const [registry, setRegistry] = useState<RegistryResponse | null>(null);
  const [capability, setCapability] = useState<CapabilityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<(typeof visibleSections)[number][0]>("connected_systems");

  const activeRows = useMemo(() => {
    if (!registry?.ok) return [];
    if (active === "connected_systems") return registry.connected_systems;
    if (active === "ingestion_events") return registry.ingestion_events;
    if (active === "proof_evaluations") return registry.proof_evaluations;
    return registry.receipt_rationales;
  }, [active, registry]);

  async function load() {
    setLoading(true);
    try {
      const qs = key ? `?key=${encodeURIComponent(key)}` : "";
      const [registryResponse, capabilityResponse] = await Promise.all([
        fetch(`/api/ops/intake-registry${qs}`),
        fetch(`/api/ops/capability-status`),
      ]);
      setRegistry((await registryResponse.json()) as RegistryResponse);
      setCapability((await capabilityResponse.json()) as CapabilityResponse);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const counts = registry?.ok ? registry.counts : {};

  return (
    <>
      <Head>
        <title>AutoKirk Ops Console</title>
        <meta name="description" content="Operational control surface for AutoKirk ingestion, proof boundary, and receipt rationales." />
      </Head>
      <main className="shell">
        <section className="card hero">
          <p className="eyebrow">AutoKirk operations</p>
          <h1>Make the upgraded kernel visible.</h1>
          <p className="lede">Track connected systems, ingestion events, proof evaluations, receipt rationales, and the vocabulary that now defines AutoKirk as the governed proof boundary for work.</p>
          <div className="actions">
            <a href="/platform" className="primary">Create intake link</a>
            <a href="/intake" className="secondary">View intake paths</a>
            <a href="/agent-proof" className="secondary">Agent proof boundary</a>
          </div>
        </section>

        <section className="card authCard">
          <div>
            <p className="eyebrow">Access boundary</p>
            <h2>{registry?.ok && registry.authorized ? "Operational rows unlocked." : "Counts are visible. Rows require ops key."}</h2>
            <p className="muted">Governed-write RPCs remain service-role only. This page reads through server routes, not direct browser RPC calls.</p>
          </div>
          <form onSubmit={(event) => { event.preventDefault(); void load(); }}>
            <label>Ops key<input value={key} onChange={(event) => setKey(event.target.value)} placeholder="AUTOKIRK_OPS_KEY" /></label>
            <button className="primary" type="submit" disabled={loading}>{loading ? "Loading..." : "Refresh ops"}</button>
          </form>
        </section>

        <section className="card">
          <p className="eyebrow">Live capability counts</p>
          <div className="countGrid">
            {Object.entries(counts).map(([name, value]) => (
              <article key={name}>
                <strong>{value ?? "—"}</strong>
                <span>{name.replace(/_/g, " ")}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="card split">
          <div>
            <p className="eyebrow">Vocabulary</p>
            <h2>Category language now has database objects behind it.</h2>
            <div className="chips">
              {capability?.ok ? capability.vocabulary.map((item) => <span key={item}>{item}</span>) : null}
            </div>
          </div>
          <div>
            <p className="eyebrow">Routes</p>
            <div className="routeList">
              {capability?.ok ? capability.routes.map((route) => <code key={route}>{route}</code>) : null}
            </div>
          </div>
        </section>

        <section className="card">
          <p className="eyebrow">Operational records</p>
          <div className="tabs">
            {visibleSections.map(([value, label]) => (
              <button key={value} type="button" className={active === value ? "active" : ""} onClick={() => setActive(value)}>{label}</button>
            ))}
          </div>
          {registry?.ok && !registry.authorized ? <p className="notice">{registry.message}</p> : null}
          <div className="rows">
            {activeRows.length === 0 ? (
              <div className="empty">No rows yet. Create an intake link and send test work from /platform.</div>
            ) : activeRows.map((row, index) => (
              <article key={String(row.id ?? row.receipt_id ?? index)}>
                {Object.entries(row).map(([keyName, value]) => (
                  <div key={keyName}><span>{keyName}</span><strong>{valueText(value)}</strong></div>
                ))}
              </article>
            ))}
          </div>
        </section>
      </main>
      <style jsx>{`
        .shell{min-height:100vh;background:radial-gradient(circle at 50% -10%,rgba(45,245,213,.13),transparent 34rem),#030303;color:#f5f5f5;padding:24px 12px 48px}.card{width:min(1180px,100%);margin:0 auto 16px;border:1px solid #242424;border-radius:30px;background:linear-gradient(180deg,#101010,#060606);box-shadow:0 24px 80px rgba(0,0,0,.55);padding:clamp(22px,3vw,38px)}.hero{min-height:390px;display:grid;align-content:center;gap:18px}h1,h2,p{margin:0}h1{max-width:900px;font-size:clamp(3rem,7vw,5.8rem);line-height:.96;letter-spacing:-.065em}h2{font-size:clamp(1.7rem,3vw,3rem);letter-spacing:-.045em;line-height:1.05}.lede{max-width:760px;color:#d0d0d0;font-size:clamp(1.08rem,2vw,1.32rem);line-height:1.5}.eyebrow{font-size:.78rem;font-weight:900;letter-spacing:.11em;text-transform:uppercase;color:#9a9a9a}.muted,.notice,.empty{color:#a9a9a9;line-height:1.55}.actions{display:flex;gap:12px;flex-wrap:wrap}.primary,.secondary,.tabs button{min-height:48px;border-radius:999px;padding:0 20px;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;font:inherit;font-weight:950;cursor:pointer}.primary{border:0;background:#2df5d5;color:#020202}.secondary,.tabs button{border:1px solid #2c2c2c;color:#f5f5f5;background:#080808}.authCard,.split{display:grid;grid-template-columns:1fr 1fr;gap:22px}.authCard form{display:grid;gap:10px;align-content:end}.authCard label{display:grid;gap:8px;color:#d4d4d4;font-weight:900}.authCard input{border:1px solid #2c2c2c;border-radius:16px;background:#050505;color:#f5f5f5;padding:13px 14px;font:inherit}.countGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.countGrid article,.rows article,.empty{border:1px solid #262626;border-radius:18px;background:#080808;padding:14px}.countGrid strong{display:block;font-size:2.4rem;color:#2df5d5}.countGrid span{display:block;color:#a9a9a9;text-transform:capitalize}.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}.chips span,.routeList code{border:1px solid #262626;border-radius:999px;background:#080808;padding:9px 12px;color:#dffefa}.routeList{display:grid;gap:8px}.routeList code{border-radius:12px;word-break:break-all}.tabs{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}.tabs button.active{background:#2df5d5;color:#020202}.rows{display:grid;gap:12px;margin-top:16px}.rows article{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.rows div{min-width:0}.rows span{display:block;color:#8f8f8f;font-size:.74rem;text-transform:uppercase;letter-spacing:.08em}.rows strong{display:block;color:#f5f5f5;font-size:.88rem;word-break:break-word;line-height:1.35}.notice{margin-top:14px;border:1px solid #333;border-radius:16px;padding:14px;background:#070707}@media(max-width:900px){.shell{padding:16px 8px 32px}.card{border-radius:22px}.authCard,.split,.countGrid,.rows article{grid-template-columns:1fr}.primary,.secondary,.tabs button{width:100%}.hero{min-height:auto}}
      `}</style>
    </>
  );
}
