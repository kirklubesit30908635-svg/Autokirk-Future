import Head from "next/head";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";

type CheckoutState =
  | { state: "idle" }
  | { state: "starting" }
  | { state: "verified"; email: string | null; paymentStatus: string | null }
  | { state: "cancelled" }
  | { state: "error"; message: string };

type CheckoutCreateResponse = { ok: true; id: string; url: string } | { ok: false; error: string };
type CheckoutVerifyResponse =
  | { ok: true; paid: boolean; payment_status: string | null; customer_email: string | null }
  | { ok: false; error: string };
type AccountLinkResponse =
  | { ok: true; workspace_id: string; board_url: string; workspace_name: string | null }
  | { ok: false; error: string; detail?: string };
type LinkedAccountState =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "ready"; workspaceId: string; boardUrl: string; workspaceName: string | null }
  | { state: "error"; message: string };
type FirstObligationState =
  | { state: "idle" }
  | { state: "submitting" }
  | { state: "created"; result: unknown }
  | { state: "error"; message: string };
type FirstObligationForm = {
  object_anchor: string;
  action_anchor: string;
  trigger_anchor: string;
  trigger_text: string;
  operator_note: string;
};
type IntakeCommitResponse = { ok: true; result: unknown } | { ok: false; error: string; detail?: string };

const steps = [
  ["Choose one workflow", "Pick one promise your business makes to a customer."],
  ["Set the proof rule", "Define the evidence required before that work can close."],
  ["Create the first obligation", "Send one real item into AutoKirk and let the system govern it."],
];
const states = [
  ["Open", "The obligation exists and still needs proof."],
  ["Proof ready", "Evidence is present and the item is ready for governed resolution."],
  ["Needs attention", "Proof is missing, unclear, rejected, or not enough to close."],
];

function statusCopy(status: CheckoutState) {
  if (status.state === "starting") return { label: "Opening Stripe", body: "Creating a secure checkout session." };
  if (status.state === "verified") return { label: "Payment verified", body: status.email ? `Activation is ready for ${status.email}.` : "Activation is ready." };
  if (status.state === "cancelled") return { label: "Checkout cancelled", body: "No payment was completed. Start checkout again when ready." };
  if (status.state === "error") return { label: "Stripe needs attention", body: status.message };
  return { label: "Trial active", body: "Start with one proof-gated workflow." };
}

function firstObligationCopy(status: FirstObligationState) {
  if (status.state === "submitting") return { label: "Creating obligation", body: "Opening the first governed item." };
  if (status.state === "created") return { label: "First obligation created", body: "It is open and waiting for proof." };
  if (status.state === "error") return { label: "Obligation needs attention", body: status.message };
  return { label: "Ready for first obligation", body: "Define one real promise and proof rule." };
}

function getSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) throw new Error("SUPABASE_BROWSER_ENV_NOT_CONFIGURED");
  return createClient(supabaseUrl, supabaseAnonKey);
}

function resetFirstForm(): FirstObligationForm {
  return {
    object_anchor: "first customer workflow",
    action_anchor: "complete promised work",
    trigger_anchor: "activation started",
    trigger_text: "Customer activated AutoKirk and defined the first proof-gated workflow.",
    operator_note: "",
  };
}

export default function PlatformPage() {
  const [checkout, setCheckout] = useState<CheckoutState>({ state: "idle" });
  const [linkedAccount, setLinkedAccount] = useState<LinkedAccountState>({ state: "idle" });
  const [firstObligation, setFirstObligation] = useState<FirstObligationState>({ state: "idle" });
  const [firstForm, setFirstForm] = useState<FirstObligationForm>(resetFirstForm());
  const copy = useMemo(() => statusCopy(checkout), [checkout]);
  const obligationCopy = useMemo(() => firstObligationCopy(firstObligation), [firstObligation]);
  const boardHref = linkedAccount.state === "ready" ? linkedAccount.boardUrl : "/platform";
  const activeWorkspaceId = linkedAccount.state === "ready" ? linkedAccount.workspaceId : null;

  async function loadLinkedAccount(accessToken?: string | null) {
    setLinkedAccount({ state: "loading" });
    try {
      const headers: Record<string, string> = { "content-type": "application/json" };
      if (accessToken) headers.authorization = `Bearer ${accessToken}`;
      const response = await fetch("/api/platform/account-link", { method: "POST", headers });
      const body = (await response.json()) as AccountLinkResponse;
      if (!response.ok || !body.ok) throw new Error(body.ok ? "Could not link board." : body.detail || body.error);
      setLinkedAccount({ state: "ready", workspaceId: body.workspace_id, boardUrl: body.board_url, workspaceName: body.workspace_name });
    } catch (err) {
      setLinkedAccount({ state: "error", message: err instanceof Error ? err.message : "Could not link board." });
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (params.get("checkout") === "cancelled") return setCheckout({ state: "cancelled" });
    if (!sessionId) {
      void loadLinkedAccount(null);
      return;
    }
    let ignore = false;
    fetch(`/api/stripe/checkout-session?session_id=${encodeURIComponent(sessionId)}`)
      .then(async (response) => {
        const body = (await response.json()) as CheckoutVerifyResponse;
        if (!response.ok || !body.ok) throw new Error(body.ok ? "Stripe verification failed." : body.error);
        return body;
      })
      .then(async (body) => {
        if (ignore) return;
        if (!body.paid) return setCheckout({ state: "error", message: `Stripe returned payment status: ${body.payment_status ?? "unknown"}.` });
        setCheckout({ state: "verified", email: body.customer_email, paymentStatus: body.payment_status });
        const supabase = getSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        await loadLinkedAccount(session?.access_token ?? null);
      })
      .catch((err) => {
        if (!ignore) setCheckout({ state: "error", message: err instanceof Error ? err.message : "Stripe verification failed." });
      });
    return () => { ignore = true; };
  }, []);

  async function startCheckout() {
    setCheckout({ state: "starting" });
    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source: "platform" }),
      });
      const body = (await response.json()) as CheckoutCreateResponse;
      if (!response.ok || !body.ok) throw new Error(body.ok ? "Could not start Stripe checkout." : body.error);
      window.location.assign(body.url);
    } catch (err) {
      setCheckout({ state: "error", message: err instanceof Error ? err.message : "Could not start Stripe checkout." });
    }
  }

  async function createFirstObligation() {
    setFirstObligation({ state: "submitting" });
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw new Error(sessionError.message);
      if (!session?.access_token) throw new Error("Sign in before creating the first obligation.");
      let workspaceId = activeWorkspaceId;
      if (!workspaceId) {
        await loadLinkedAccount(session.access_token);
        throw new Error("Account link is being prepared. Tap create again after the link appears.");
      }
      const sessionId = new URLSearchParams(window.location.search).get("session_id");
      const response = await fetch("/api/intake/commit", {
        method: "POST",
        headers: { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          candidate_ref: sessionId ? `platform-activation:${sessionId}` : `platform-activation:${Date.now()}`,
          obligation_code: "fulfill_promised_service",
          trigger_text: firstForm.trigger_text.trim(),
          source_signal_ref: sessionId ?? "platform-activation",
          object_anchor: firstForm.object_anchor.trim(),
          action_anchor: firstForm.action_anchor.trim(),
          trigger_anchor: firstForm.trigger_anchor.trim(),
          operator_note: firstForm.operator_note.trim() || null,
        }),
      });
      const body = (await response.json()) as IntakeCommitResponse;
      if (!response.ok || !body.ok) throw new Error(body.ok ? "Could not create first obligation." : body.detail || body.error);
      setFirstObligation({ state: "created", result: body.result });
    } catch (err) {
      setFirstObligation({ state: "error", message: err instanceof Error ? err.message : "Could not create first obligation." });
    }
  }

  function createAnotherObligation() {
    setFirstObligation({ state: "idle" });
    setFirstForm(resetFirstForm());
  }

  return <>
    <Head><title>AutoKirk Platform</title><meta name="description" content="Start with one workflow. AutoKirk keeps important work from being marked complete until the right proof exists." /></Head>
    <main className="shell">
      <section className="card hero">
        <div className="status"><span className={checkout.state === "verified" ? "dot ready" : "dot"} /><strong>{copy.label}</strong><span>{copy.body}</span></div>
        <p className="eyebrow">Your AutoKirk platform link</p>
        <h1>Start with one workflow.</h1>
        <p className="lede">AutoKirk connects to the tools you already use and keeps important work from being marked complete until the right proof exists.</p>
        <div className="actions"><button className="primary" type="button" onClick={checkout.state === "verified" ? undefined : startCheckout} disabled={checkout.state === "starting"}>{checkout.state === "verified" ? "Continue activation" : checkout.state === "starting" ? "Opening Stripe..." : "Activate AutoKirk"}</button><a className="secondary" href="#setup">See setup path</a></div>
      </section>
      <section className="card rule"><p className="eyebrow">The rule</p><strong>Important work should not be marked complete without proof.</strong></section>
      {(checkout.state === "verified" || linkedAccount.state === "ready") && <section className="card panel">
        <div><div className="status"><span className={linkedAccount.state === "ready" ? "dot ready" : "dot"} /><strong>{linkedAccount.state === "ready" ? "Account link ready" : "Linking account"}</strong><span>{linkedAccount.state === "ready" ? `${linkedAccount.workspaceName ?? "Personal board"} is attached to a safe board URL.` : linkedAccount.state === "error" ? linkedAccount.message : "Preparing a personal board link."}</span></div><p className="eyebrow">First obligation</p><h2>Create the first proof-gated workflow.</h2><p>Start with one real promise. AutoKirk will open it as an obligation and keep it visible until proof exists.</p>
        {linkedAccount.state === "ready" && <div className="nextBox"><p className="eyebrow">Safe board URL</p><h3>Your system is attached to this board.</h3><p>The board link is signed and points to the workspace AutoKirk will write obligations into.</p><div className="actions compact"><a className="primary" href={boardHref}>Open live board</a><button className="secondary" type="button" onClick={() => navigator.clipboard?.writeText(boardHref)}>Copy board link</button></div></div>}
        {firstObligation.state === "created" && <div className="nextBox"><p className="eyebrow">Next step</p><h3>Go to the live board.</h3><p>The obligation is open. The board is the proof surface that shows what is owed, what needs proof, and what has closed.</p><div className="actions compact"><a className="primary" href={boardHref}>View live board</a><button className="secondary" type="button" onClick={createAnotherObligation}>Create another obligation</button></div></div>}
        </div>
        <form className="form" onSubmit={(event) => { event.preventDefault(); createFirstObligation(); }}>
          <label>What work must be completed?<input required value={firstForm.object_anchor} onChange={(event) => setFirstForm((current) => ({ ...current, object_anchor: event.target.value }))} /></label>
          <label>What action proves progress?<input required value={firstForm.action_anchor} onChange={(event) => setFirstForm((current) => ({ ...current, action_anchor: event.target.value }))} /></label>
          <label>When should AutoKirk care?<input required value={firstForm.trigger_anchor} onChange={(event) => setFirstForm((current) => ({ ...current, trigger_anchor: event.target.value }))} /></label>
          <label>Rule in plain English<textarea required value={firstForm.trigger_text} onChange={(event) => setFirstForm((current) => ({ ...current, trigger_text: event.target.value }))} /></label>
          <label>Operator note<textarea value={firstForm.operator_note} onChange={(event) => setFirstForm((current) => ({ ...current, operator_note: event.target.value }))} placeholder="Optional note for the operator view" /></label>
          <button className="primary" type="submit" disabled={firstObligation.state === "submitting" || linkedAccount.state !== "ready"}>{firstObligation.state === "submitting" ? "Creating obligation..." : firstObligation.state === "created" ? "Create another from this form" : "Create first obligation"}</button>
          {firstObligation.state === "created" && <p className="success">First obligation created. It is now open and waiting for proof. Continue to the board to inspect it.</p>}
          {firstObligation.state === "error" && <p className="error">{firstObligation.message}</p>}
        </form>
      </section>}
      <section className="card panel" id="setup"><div><p className="eyebrow">First workflow</p><h2>A calm setup for one proof standard.</h2><p>Start narrow. The workflow stays familiar. AutoKirk keeps important work open until the right proof exists.</p></div><div className="list">{steps.map(([label, body], index) => <article key={label} className="mini"><span>0{index + 1}</span><h3>{label}</h3><p>{body}</p></article>)}</div></section>
      <section className="card panel"><div><p className="eyebrow">Operating view</p><h2>AutoKirk shows what is open, ready, or exposed.</h2><p>Any system can create the signal. AutoKirk governs the obligation, the proof path, and the receipt-backed closeout.</p></div><div className="grid">{states.map(([label, body]) => <article key={label} className="mini"><h3>{label}</h3><p>{body}</p></article>)}</div></section>
    </main>
    <style jsx>{`
      .shell{min-height:100vh;padding:24px 12px 40px;color:#f4f4f5;background:radial-gradient(circle at 50% -10%,rgba(16,163,127,.14),transparent 34rem),#070a0f}.card{width:min(1080px,100%);margin:0 auto 14px;border:1px solid rgba(255,255,255,.09);border-radius:30px;background:linear-gradient(180deg,rgba(17,22,29,.97),rgba(9,12,17,.96));box-shadow:0 24px 80px rgba(0,0,0,.44);padding:clamp(22px,3vw,34px)}.hero{min-height:520px;display:grid;align-content:center;padding:clamp(32px,5vw,64px)}.status{width:fit-content;max-width:100%;display:flex;align-items:center;gap:9px;margin-bottom:22px;border:1px solid rgba(16,163,127,.24);border-radius:999px;padding:8px 12px;color:#d7f9ee;background:rgba(16,163,127,.08);font-size:.86rem}.status span:last-child{color:#b6c2c9}.dot{width:8px;height:8px;border-radius:999px;background:#10a37f;box-shadow:0 0 18px rgba(16,163,127,.7)}.ready{background:#22c55e}.eyebrow{margin:0 0 12px;color:#9ca3af;font-size:.78rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}h1,h2,h3,p{margin:0}h1{max-width:880px;font-size:clamp(3rem,7vw,5.85rem);line-height:.98;letter-spacing:-.064em}h2,.rule strong{max-width:760px;font-size:clamp(1.65rem,3.2vw,2.85rem);line-height:1.1;letter-spacing:-.044em;display:block}.lede{max-width:760px;margin-top:22px;color:#e4e4e7;font-size:clamp(1.08rem,2.1vw,1.35rem);line-height:1.48}.actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px}.actions.compact{margin-top:16px}.primary,.secondary{display:inline-flex;min-height:48px;align-items:center;justify-content:center;border-radius:999px;padding:0 20px;border:0;font:inherit;font-weight:900;text-decoration:none;cursor:pointer}.primary{color:#06130f;background:#10a37f}.secondary{border:1px solid rgba(255,255,255,.16);color:#f4f4f5;background:rgba(255,255,255,.025)}.panel{display:grid;grid-template-columns:minmax(0,.95fr) minmax(320px,1.05fr);gap:18px;align-items:start}.panel p,.mini p,.nextBox p{color:#a1a1aa;line-height:1.5}.list,.grid,.form{display:grid;gap:10px}.grid{grid-template-columns:repeat(3,minmax(0,1fr))}.mini,.nextBox{border:1px solid rgba(255,255,255,.08);border-radius:20px;background:rgba(18,23,30,.74);padding:16px}.nextBox{margin-top:18px;background:rgba(16,163,127,.06);border-color:rgba(16,163,127,.24)}.mini span{color:#10a37f;font-size:.78rem;font-weight:900;letter-spacing:.08em}.form label{display:grid;gap:7px;color:#d4d4d8;font-size:.9rem;font-weight:800}.form input,.form textarea{width:100%;border:1px solid rgba(255,255,255,.11);border-radius:16px;background:rgba(255,255,255,.04);color:#f4f4f5;padding:13px 14px;font:inherit}.form textarea{min-height:96px;resize:vertical}.success{color:#86efac!important;font-weight:800}.error{color:#fca5a5!important;font-weight:800}@media(max-width:900px){.shell{padding:16px 8px 32px}.card{border-radius:22px}.hero{min-height:auto;padding:28px 20px}.panel,.grid{grid-template-columns:1fr}.primary,.secondary{width:100%}}
    `}</style>
  </>;
}
