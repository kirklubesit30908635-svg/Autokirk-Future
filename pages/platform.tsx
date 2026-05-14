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
type ProofRuleState =
  | { state: "idle" }
  | { state: "submitting" }
  | { state: "created"; result: unknown }
  | { state: "error"; message: string };
type ClientProofRuleForm = {
  protected_work: string;
  proof_required: string;
  board_label: string;
};
type IntakeCommitResponse = { ok: true; result: unknown } | { ok: false; error: string; detail?: string };

const TURQUOISE = "#2df5d5";

const examples = [
  ["Customer follow-up", "Call or message every new lead", "call log, reply, or note"],
  ["Job completion", "Finish service before it is marked done", "photo, approval, or completion note"],
  ["Payment/admin", "Send document, invoice, or approval", "paid invoice, uploaded document, or approval message"],
];

const states = [
  ["Open", "The work is visible and still needs proof."],
  ["Ready", "Proof has been added and can be checked."],
  ["Closed", "The work was marked done with a record."],
];

function statusCopy(status: CheckoutState) {
  if (status.state === "starting") return { label: "Opening Stripe", body: "Creating a secure checkout session." };
  if (status.state === "verified") return { label: "Payment verified", body: status.email ? `Activation is ready for ${status.email}.` : "Activation is ready." };
  if (status.state === "cancelled") return { label: "Checkout cancelled", body: "No payment was completed. Start checkout again when ready." };
  if (status.state === "error") return { label: "Stripe needs attention", body: status.message };
  return { label: "Trial active", body: "Start with one proof rule." };
}

function proofRuleCopy(status: ProofRuleState) {
  if (status.state === "submitting") return { label: "Creating proof rule", body: "Opening the first tracked work item." };
  if (status.state === "created") return { label: "Proof rule created", body: "It is open on the live board." };
  if (status.state === "error") return { label: "Needs attention", body: status.message };
  return { label: "Ready", body: "Answer three plain-English questions." };
}

function getSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) throw new Error("SUPABASE_BROWSER_ENV_NOT_CONFIGURED");
  return createClient(supabaseUrl, supabaseAnonKey);
}

function clean(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function codeFromLabel(value: string): string {
  const code = clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 54);
  return code || "client_proof_rule";
}

function validateForm(form: ClientProofRuleForm): string | null {
  if (clean(form.protected_work).length < 6) return "Describe the work AutoKirk should watch.";
  if (clean(form.proof_required).length < 4) return "Describe the proof required before work is done.";
  if (clean(form.board_label).length < 3) return "Give the board item a short name.";
  if (clean(form.protected_work).length > 220) return "The watched work description is too long.";
  if (clean(form.proof_required).length > 220) return "The proof rule is too long.";
  if (clean(form.board_label).length > 80) return "The board name is too long.";
  return null;
}

function toInternalPayload(form: ClientProofRuleForm, workspaceId: string, sessionId: string | null) {
  const protectedWork = clean(form.protected_work);
  const proofRequired = clean(form.proof_required);
  const boardLabel = clean(form.board_label);
  const nowRef = Date.now();

  return {
    workspace_id: workspaceId,
    candidate_ref: sessionId ? `platform-activation:${sessionId}:${codeFromLabel(boardLabel)}` : `platform-setup:${nowRef}:${codeFromLabel(boardLabel)}`,
    obligation_code: codeFromLabel(boardLabel),
    trigger_text: `${protectedWork} must stay open until this proof exists: ${proofRequired}.`,
    source_signal_ref: sessionId ?? `platform-simple-setup:${nowRef}`,
    object_anchor: protectedWork,
    action_anchor: proofRequired,
    trigger_anchor: boardLabel,
    operator_note: `Client setup. Board label: ${boardLabel}. Proof required: ${proofRequired}.`,
  };
}

function popupUrl(url: string): string {
  const next = new URL(url, window.location.origin);
  next.searchParams.set("panel", "popup");
  return next.toString();
}

function openBoardPopup(url: string) {
  const width = 380;
  const height = 440;
  const left = Math.max(0, Math.round(window.screenX + window.outerWidth - width - 24));
  const top = Math.max(0, Math.round(window.screenY + window.outerHeight - height - 80));
  const features = [
    "popup=yes",
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    "menubar=no",
    "toolbar=no",
    "location=no",
    "status=no",
    "resizable=yes",
    "scrollbars=no",
  ].join(",");

  const opened = window.open(popupUrl(url), "autokirk_live_board", features);
  if (opened) {
    opened.focus();
    return;
  }
  window.location.assign(popupUrl(url));
}

function resetClientForm(): ClientProofRuleForm {
  return {
    protected_work: "Call every new lead back",
    proof_required: "call log, text reply, or written note",
    board_label: "New lead follow-up",
  };
}

export default function PlatformPage() {
  const [checkout, setCheckout] = useState<CheckoutState>({ state: "idle" });
  const [linkedAccount, setLinkedAccount] = useState<LinkedAccountState>({ state: "idle" });
  const [proofRule, setProofRule] = useState<ProofRuleState>({ state: "idle" });
  const [clientForm, setClientForm] = useState<ClientProofRuleForm>(resetClientForm());
  const checkoutCopy = useMemo(() => statusCopy(checkout), [checkout]);
  const proofCopy = useMemo(() => proofRuleCopy(proofRule), [proofRule]);
  const boardHref = linkedAccount.state === "ready" ? linkedAccount.boardUrl : "/platform";
  const activeWorkspaceId = linkedAccount.state === "ready" ? linkedAccount.workspaceId : null;

  async function loadLinkedAccount(accessToken?: string | null) {
    setLinkedAccount({ state: "loading" });
    try {
      const headers: Record<string, string> = { "content-type": "application/json" };
      if (accessToken) headers.authorization = `Bearer ${accessToken}`;
      const response = await fetch("/api/platform/account-link", { method: "POST", headers });
      const body = (await response.json()) as AccountLinkResponse;
      if (!response.ok || !body.ok) throw new Error(body.ok ? "Could not create account link." : body.detail || body.error);
      setLinkedAccount({ state: "ready", workspaceId: body.workspace_id, boardUrl: body.board_url, workspaceName: body.workspace_name });
    } catch (err) {
      setLinkedAccount({ state: "error", message: err instanceof Error ? err.message : "Could not create account link." });
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

  async function createProofRule() {
    setProofRule({ state: "submitting" });
    try {
      const validationError = validateForm(clientForm);
      if (validationError) throw new Error(validationError);

      const supabase = getSupabaseBrowserClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw new Error(sessionError.message);
      if (!session?.access_token) throw new Error("Sign in before creating a proof rule.");

      const workspaceId = activeWorkspaceId;
      if (!workspaceId) {
        await loadLinkedAccount(session.access_token);
        throw new Error("Account link is being prepared. Tap create again after the link appears.");
      }

      const sessionId = new URLSearchParams(window.location.search).get("session_id");
      const response = await fetch("/api/intake/commit", {
        method: "POST",
        headers: { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" },
        body: JSON.stringify(toInternalPayload(clientForm, workspaceId, sessionId)),
      });
      const body = (await response.json()) as IntakeCommitResponse;
      if (!response.ok || !body.ok) throw new Error(body.ok ? "Could not create proof rule." : body.detail || body.error);
      setProofRule({ state: "created", result: body.result });
      openBoardPopup(boardHref);
    } catch (err) {
      setProofRule({ state: "error", message: err instanceof Error ? err.message : "Could not create proof rule." });
    }
  }

  function createAnotherRule() {
    setProofRule({ state: "idle" });
    setClientForm(resetClientForm());
  }

  function useExample(index: number) {
    const example = examples[index];
    if (!example) return;
    setClientForm({ board_label: example[0], protected_work: example[1], proof_required: example[2] });
    setProofRule({ state: "idle" });
  }

  return <>
    <Head><title>AutoKirk Platform</title><meta name="description" content="Create one proof rule. AutoKirk keeps important work open until proof exists." /></Head>
    <main className="shell">
      <section className="card hero">
        <div className="status"><span className={checkout.state === "verified" ? "dot ready" : "dot"} /><strong>{checkoutCopy.label}</strong><span>{checkoutCopy.body}</span></div>
        <p className="eyebrow">Your AutoKirk setup</p>
        <h1>Create one proof rule.</h1>
        <p className="lede">Tell AutoKirk what work should not be marked done without proof. AutoKirk turns that into a live board item for you.</p>
        <div className="actions"><button className="primary" type="button" onClick={checkout.state === "verified" ? undefined : startCheckout} disabled={checkout.state === "starting"}>{checkout.state === "verified" ? "Continue setup" : checkout.state === "starting" ? "Opening Stripe..." : "Activate AutoKirk"}</button><a className="secondary" href="#setup">Set proof rule</a></div>
      </section>

      <section className="card rule"><p className="eyebrow">The rule</p><strong>Work should not be marked done until proof exists.</strong></section>

      {(checkout.state === "verified" || linkedAccount.state === "ready") && <section className="card clientPanel" id="setup">
        <div className="introColumn">
          <div className="status"><span className={linkedAccount.state === "ready" ? "dot ready" : "dot"} /><strong>{linkedAccount.state === "ready" ? "Account ready" : "Linking account"}</strong><span>{linkedAccount.state === "ready" ? `${linkedAccount.workspaceName ?? "Your board"} is attached to a safe board URL.` : linkedAccount.state === "error" ? linkedAccount.message : "Preparing your board link."}</span></div>
          <p className="eyebrow">Client setup</p><h2>Answer three questions.</h2><p>No workspace IDs. No obligation language. One proof rule creates the first live board item.</p>
          {linkedAccount.state === "ready" && <div className="nextBox"><p className="eyebrow">Your live board</p><h3>Attached popup is ready.</h3><p>The board opens in a compact popup and shows open work, proof, and closed records.</p><div className="actions compact"><button className="primary" type="button" onClick={() => openBoardPopup(boardHref)}>Open board popup</button><button className="secondary" type="button" onClick={() => navigator.clipboard?.writeText(popupUrl(boardHref))}>Copy board link</button></div></div>}
          {proofRule.state === "created" && <div className="nextBox"><p className="eyebrow">Created</p><h3>Proof rule is live.</h3><p>The first item is now on the board. Use the popup to mark it done with proof.</p><div className="actions compact"><button className="primary" type="button" onClick={() => openBoardPopup(boardHref)}>Open board popup</button><button className="secondary" type="button" onClick={createAnotherRule}>Create another rule</button></div></div>}
        </div>

        <form className="form simpleForm" onSubmit={(event) => { event.preventDefault(); createProofRule(); }}>
          <div className="status compactStatus"><span className={proofRule.state === "created" ? "dot ready" : "dot"} /><strong>{proofCopy.label}</strong><span>{proofCopy.body}</span></div>
          <label>What should AutoKirk watch?<textarea required value={clientForm.protected_work} onChange={(event) => setClientForm((current) => ({ ...current, protected_work: event.target.value }))} placeholder="Example: Call every new lead back" /></label>
          <label>What proof is required before it is done?<textarea required value={clientForm.proof_required} onChange={(event) => setClientForm((current) => ({ ...current, proof_required: event.target.value }))} placeholder="Example: call log, text reply, or written note" /></label>
          <label>What should the board call this?<input required value={clientForm.board_label} onChange={(event) => setClientForm((current) => ({ ...current, board_label: event.target.value }))} placeholder="Example: New lead follow-up" /></label>
          <button className="primary" type="submit" disabled={proofRule.state === "submitting" || linkedAccount.state !== "ready"}>{proofRule.state === "submitting" ? "Creating proof rule..." : proofRule.state === "created" ? "Create another proof rule" : "Create proof rule"}</button>
          {proofRule.state === "created" && <p className="success">Created. The board popup should show the open item after refresh.</p>}
          {proofRule.state === "error" && <p className="error">{proofRule.message}</p>}
        </form>
      </section>}

      <section className="card examples"><div><p className="eyebrow">Fast starts</p><h2>Pick a common proof rule.</h2><p>These only fill the form. You can change the words before creating anything.</p></div><div className="grid">{examples.map(([label, work, proof], index) => <button key={label} type="button" className="mini actionMini" onClick={() => useExample(index)}><h3>{label}</h3><p>{work}</p><span>{proof}</span></button>)}</div></section>

      <section className="card examples"><div><p className="eyebrow">What the board shows</p><h2>Open. Proof ready. Closed.</h2><p>The client sees status and action. AutoKirk keeps the governed record underneath.</p></div><div className="grid">{states.map(([label, body]) => <article key={label} className="mini"><h3>{label}</h3><p>{body}</p></article>)}</div></section>
    </main>
    <style jsx>{`
      .shell{min-height:100vh;padding:24px 12px 40px;color:#f5f5f5;background:radial-gradient(circle at 50% -10%,rgba(45,245,213,.14),transparent 34rem),#030303}.card{width:min(1080px,100%);margin:0 auto 14px;border:1px solid #242424;border-radius:30px;background:linear-gradient(180deg,#101010,#060606);box-shadow:0 24px 80px rgba(0,0,0,.58);padding:clamp(22px,3vw,34px)}.hero{min-height:500px;display:grid;align-content:center;padding:clamp(32px,5vw,64px)}.status{width:fit-content;max-width:100%;display:flex;align-items:center;gap:9px;margin-bottom:22px;border:1px solid rgba(45,245,213,.28);border-radius:999px;padding:8px 12px;color:#f5f5f5;background:rgba(45,245,213,.08);font-size:.86rem}.compactStatus{margin-bottom:0}.status span:last-child{color:#a3a3a3}.dot{width:8px;height:8px;border-radius:999px;background:${TURQUOISE};box-shadow:0 0 18px rgba(45,245,213,.7)}.ready{background:${TURQUOISE}}.eyebrow{margin:0 0 12px;color:#9a9a9a;font-size:.78rem;font-weight:900;letter-spacing:.1em;text-transform:uppercase}h1,h2,h3,p{margin:0}h1{max-width:880px;font-size:clamp(3rem,7vw,5.85rem);line-height:.98;letter-spacing:-.064em}h2,.rule strong{max-width:760px;font-size:clamp(1.65rem,3.2vw,2.85rem);line-height:1.1;letter-spacing:-.044em;display:block}.lede{max-width:760px;margin-top:22px;color:#d4d4d4;font-size:clamp(1.08rem,2.1vw,1.35rem);line-height:1.48}.actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px}.actions.compact{margin-top:16px}.primary,.secondary{display:inline-flex;min-height:48px;align-items:center;justify-content:center;border-radius:999px;padding:0 20px;border:0;font:inherit;font-weight:950;text-decoration:none;cursor:pointer}.primary{color:#020202;background:${TURQUOISE}}.secondary{border:1px solid #2c2c2c;color:#f5f5f5;background:#080808}.clientPanel,.examples{display:grid;grid-template-columns:minmax(0,.95fr) minmax(320px,1.05fr);gap:18px;align-items:start}.introColumn p,.mini p,.nextBox p{color:#a3a3a3;line-height:1.5}.grid,.form{display:grid;gap:10px}.grid{grid-template-columns:repeat(3,minmax(0,1fr))}.mini,.nextBox{border:1px solid #242424;border-radius:20px;background:#0b0b0b;padding:16px}.actionMini{text-align:left;color:#f5f5f5;font:inherit;cursor:pointer}.actionMini:hover{border-color:${TURQUOISE}}.nextBox{margin-top:18px;background:rgba(45,245,213,.06);border-color:rgba(45,245,213,.28)}.mini span{display:block;margin-top:10px;color:${TURQUOISE};font-size:.78rem;font-weight:900}.form label{display:grid;gap:7px;color:#d4d4d4;font-size:.9rem;font-weight:900}.form input,.form textarea{width:100%;border:1px solid #2c2c2c;border-radius:16px;background:#050505;color:#f5f5f5;padding:13px 14px;font:inherit}.form input:focus,.form textarea:focus{outline:none;border-color:${TURQUOISE};box-shadow:0 0 0 1px rgba(45,245,213,.2)}.form textarea{min-height:108px;resize:vertical}.success{color:${TURQUOISE}!important;font-weight:900}.error{color:#f5f5f5!important;border:1px solid #3a3a3a;border-radius:14px;padding:10px;background:#0b0b0b;font-weight:900}@media(max-width:900px){.shell{padding:16px 8px 32px}.card{border-radius:22px}.hero{min-height:auto;padding:28px 20px}.clientPanel,.examples,.grid{grid-template-columns:1fr}.primary,.secondary{width:100%}}
    `}</style>
  </>;
}
