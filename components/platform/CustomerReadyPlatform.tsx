import Head from "next/head";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";

type AccountLinkResponse =
  | { ok: true; workspace_id: string; board_url: string; workspace_name: string | null }
  | { ok: false; error: string; detail?: string };
type CheckoutCreateResponse = { ok: true; url: string; id: string } | { ok: false; error: string };
type ConnectionLinkResponse =
  | { ok: true; connection_url: string; source_type: string; helper_text: string }
  | { ok: false; error: string; detail?: string };
type SourceResponse =
  | { ok: true; status: "created" | "duplicate"; title: string; board_label: string }
  | { ok: false; error: string; detail?: string };

type AccountState =
  | { state: "loading" }
  | { state: "ready"; workspaceId: string; boardUrl: string; workspaceName: string | null }
  | { state: "error"; message: string };
type WorkSource = "manual" | "website-form" | "crm" | "job-system" | "payment" | "other";
type FormState = {
  watchedWork: string;
  proofRequired: string;
  boardLabel: string;
  sourceType: WorkSource;
};
type SetupState =
  | { state: "idle" }
  | { state: "starting" }
  | { state: "ready"; connectionUrl: string; helperText: string }
  | { state: "testing"; connectionUrl: string; helperText: string }
  | { state: "tested"; connectionUrl: string; helperText: string; title: string }
  | { state: "error"; message: string };

const sourceOptions: Array<[WorkSource, string, string]> = [
  ["manual", "Manual entry", "Start inside AutoKirk while your system is being connected."],
  ["website-form", "Website form", "Use this when a form submission creates work."],
  ["crm", "CRM or lead system", "Use this when a new lead or customer starts work."],
  ["job-system", "Job system", "Use this when a job, booking, or request is created."],
  ["payment", "Payment or checkout", "Use this when payment should open work."],
  ["other", "Other system", "Send the AutoKirk instructions to the person who manages it."],
];

function defaultForm(): FormState {
  return {
    watchedWork: "Call every new lead back",
    proofRequired: "call log, text reply, or written note",
    boardLabel: "New lead follow-up",
    sourceType: "manual",
  };
}

function clean(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function codeFromLabel(value: string): string {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 54) || "client_proof_rule";
}

function validate(form: FormState): string | null {
  if (clean(form.watchedWork).length < 6) return "Describe what AutoKirk should watch.";
  if (clean(form.proofRequired).length < 4) return "Describe what proof is required.";
  if (clean(form.boardLabel).length < 3) return "Give this proof rule a short board name.";
  return null;
}

function maybeSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function currentAccessToken(): Promise<string | null> {
  const supabase = maybeSupabaseBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session?.access_token ?? null;
}

function popupUrl(url: string): string {
  const next = new URL(url, window.location.origin);
  next.searchParams.set("panel", "popup");
  return next.toString();
}

function openBoard(url: string) {
  const width = 380;
  const height = 440;
  const left = Math.max(0, Math.round(window.screenX + window.outerWidth - width - 24));
  const top = Math.max(0, Math.round(window.screenY + window.outerHeight - height - 80));
  const opened = window.open(popupUrl(url), "autokirk_live_board", `popup=yes,width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no`);
  if (opened) opened.focus();
  else window.location.assign(popupUrl(url));
}

export default function CustomerReadyPlatform() {
  const [account, setAccount] = useState<AccountState>({ state: "loading" });
  const [form, setForm] = useState<FormState>(defaultForm());
  const [setup, setSetup] = useState<SetupState>({ state: "idle" });
  const [checkout, setCheckout] = useState<"idle" | "starting" | "error">("idle");
  const boardUrl = account.state === "ready" ? account.boardUrl : "";
  const selectedSource = useMemo(() => sourceOptions.find(([value]) => value === form.sourceType), [form.sourceType]);

  async function loadAccount(accessToken?: string | null) {
    setAccount({ state: "loading" });
    try {
      const headers: Record<string, string> = { "content-type": "application/json" };
      if (accessToken) headers.authorization = `Bearer ${accessToken}`;
      const response = await fetch("/api/platform/account-link", { method: "POST", headers });
      const body = (await response.json()) as AccountLinkResponse;
      if (!response.ok || !body.ok) throw new Error(body.ok ? "Account not ready." : body.detail || body.error);
      setAccount({ state: "ready", workspaceId: body.workspace_id, boardUrl: body.board_url, workspaceName: body.workspace_name });
    } catch (error) {
      setAccount({ state: "error", message: error instanceof Error ? error.message : "Account not ready." });
    }
  }

  useEffect(() => {
    void currentAccessToken().then((token) => loadAccount(token));
  }, []);

  async function startCheckout() {
    setCheckout("starting");
    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source: "platform" }),
      });
      const body = (await response.json()) as CheckoutCreateResponse;
      if (!response.ok || !body.ok) throw new Error(body.ok ? "Checkout not ready." : body.error);
      window.location.assign(body.url);
    } catch {
      setCheckout("error");
    }
  }

  async function createConnection() {
    setSetup({ state: "starting" });
    try {
      const issue = validate(form);
      if (issue) throw new Error(issue);
      if (account.state !== "ready") throw new Error("Account is still loading.");
      const accessToken = await currentAccessToken();
      const headers: Record<string, string> = { "content-type": "application/json" };
      if (accessToken) headers.authorization = `Bearer ${accessToken}`;

      const response = await fetch("/api/customer/connection-link", {
        method: "POST",
        headers,
        body: JSON.stringify({
          workspace_id: account.workspaceId,
          watched_work: clean(form.watchedWork),
          proof_required: clean(form.proofRequired),
          board_label: clean(form.boardLabel),
          obligation_code: codeFromLabel(form.boardLabel),
          source_type: form.sourceType,
        }),
      });
      const body = (await response.json()) as ConnectionLinkResponse;
      if (!response.ok || !body.ok) throw new Error(body.ok ? "AutoKirk link not ready." : body.detail || body.error);
      setSetup({ state: "ready", connectionUrl: body.connection_url, helperText: body.helper_text });
    } catch (error) {
      setSetup({ state: "error", message: error instanceof Error ? error.message : "AutoKirk link not ready." });
    }
  }

  async function sendTestWork() {
    if (setup.state !== "ready" && setup.state !== "tested") return;
    const current = setup;
    setSetup({ state: "testing", connectionUrl: current.connectionUrl, helperText: current.helperText });
    try {
      const response = await fetch(current.connectionUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source_event_id: `test-${Date.now()}`, title: `Test work: ${clean(form.boardLabel)}` }),
      });
      const body = (await response.json()) as SourceResponse;
      if (!response.ok || !body.ok) throw new Error(body.ok ? "Test work failed." : body.detail || body.error);
      setSetup({ state: "tested", connectionUrl: current.connectionUrl, helperText: current.helperText, title: body.title });
      if (boardUrl) openBoard(boardUrl);
    } catch (error) {
      setSetup({ state: "error", message: error instanceof Error ? error.message : "Test work failed." });
    }
  }

  return (
    <>
      <Head><title>AutoKirk Setup</title><meta name="description" content="Connect where work starts and keep it open until proof exists." /></Head>
      <main className="shell">
        <section className="card hero">
          <p className="eyebrow">AutoKirk</p>
          <h1>Connect where work starts.</h1>
          <p className="lede">AutoKirk keeps important work open until proof exists.</p>
          <div className="actions">
            <button className="primary" type="button" onClick={startCheckout} disabled={checkout === "starting"}>{checkout === "starting" ? "Opening checkout..." : "Activate AutoKirk"}</button>
            {boardUrl && <button className="secondary" type="button" onClick={() => openBoard(boardUrl)}>Open live board</button>}
          </div>
          {checkout === "error" && <p className="error">Checkout needs attention.</p>}
        </section>

        <section className="card panel">
          <div>
            <div className="pill"><span />{account.state === "ready" ? "Account ready" : account.state === "loading" ? "Preparing account" : account.message}</div>
            <p className="eyebrow">Setup</p>
            <h2>Create one proof rule.</h2>
            <p className="muted">Answer plain-English questions. AutoKirk will give you an AutoKirk link for the system where work starts.</p>
            {setup.state === "ready" || setup.state === "testing" || setup.state === "tested" ? (
              <div className="nextBox">
                <p className="eyebrow">AutoKirk link</p>
                <h3>Send new work here.</h3>
                <p>{setup.helperText}</p>
                <div className="copyBox">{setup.connectionUrl}</div>
                <div className="actions compact">
                  <button className="primary" type="button" onClick={sendTestWork}>{setup.state === "testing" ? "Sending test..." : "Send test work"}</button>
                  <button className="secondary" type="button" onClick={() => navigator.clipboard?.writeText(setup.connectionUrl)}>Copy AutoKirk link</button>
                </div>
                {setup.state === "tested" && <p className="success">Test work accepted. Open the board to view it.</p>}
              </div>
            ) : null}
          </div>

          <form className="form" onSubmit={(event) => { event.preventDefault(); createConnection(); }}>
            <label>What should AutoKirk watch?<textarea value={form.watchedWork} onChange={(event) => setForm((current) => ({ ...current, watchedWork: event.target.value }))} /></label>
            <label>What proof is required before it is done?<textarea value={form.proofRequired} onChange={(event) => setForm((current) => ({ ...current, proofRequired: event.target.value }))} /></label>
            <label>What should the board call this?<input value={form.boardLabel} onChange={(event) => setForm((current) => ({ ...current, boardLabel: event.target.value }))} /></label>
            <fieldset><legend>Where does this work start?</legend><div className="sourceGrid">{sourceOptions.map(([value, label, body]) => <button key={value} type="button" className={form.sourceType === value ? "source selected" : "source"} onClick={() => setForm((current) => ({ ...current, sourceType: value }))}><strong>{label}</strong><span>{body}</span></button>)}</div></fieldset>
            <button className="primary" type="submit" disabled={setup.state === "starting" || account.state !== "ready"}>{setup.state === "starting" ? "Creating..." : "Create AutoKirk link"}</button>
            {selectedSource && <p className="muted">Selected: {selectedSource[1]}</p>}
            {setup.state === "error" && <p className="error">{setup.message}</p>}
          </form>
        </section>
      </main>
      <style jsx>{`
        .shell{min-height:100vh;padding:24px 12px 42px;color:#f5f5f5;background:radial-gradient(circle at 50% -10%,rgba(45,245,213,.14),transparent 34rem),#030303}.card{width:min(1080px,100%);margin:0 auto 14px;border:1px solid #242424;border-radius:30px;background:linear-gradient(180deg,#101010,#060606);box-shadow:0 24px 80px rgba(0,0,0,.58);padding:clamp(22px,3vw,38px)}.hero{min-height:420px;display:grid;align-content:center}h1,h2,h3,p{margin:0}h1{max-width:860px;font-size:clamp(3rem,7vw,5.7rem);line-height:.98;letter-spacing:-.064em}h2{font-size:clamp(1.8rem,3.4vw,3rem);letter-spacing:-.045em;line-height:1.05}.lede{max-width:720px;margin-top:20px;color:#d4d4d4;font-size:clamp(1.1rem,2vw,1.35rem);line-height:1.45}.eyebrow{margin:0 0 12px;color:#9a9a9a;font-size:.78rem;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}.actions.compact{margin-top:16px}.primary,.secondary{min-height:48px;border-radius:999px;padding:0 20px;font:inherit;font-weight:950;cursor:pointer}.primary{border:0;color:#020202;background:#2df5d5}.secondary{border:1px solid #2c2c2c;color:#f5f5f5;background:#080808}.panel{display:grid;grid-template-columns:minmax(0,.9fr) minmax(340px,1.1fr);gap:18px}.muted,.nextBox p{color:#a3a3a3;line-height:1.5}.pill{width:fit-content;display:flex;gap:8px;align-items:center;border:1px solid rgba(45,245,213,.28);border-radius:999px;padding:8px 12px;margin-bottom:22px;background:rgba(45,245,213,.08);color:#dffefa;font-weight:850}.pill span{width:8px;height:8px;border-radius:999px;background:#2df5d5;box-shadow:0 0 18px rgba(45,245,213,.7)}.form{display:grid;gap:12px}.form label{display:grid;gap:7px;color:#d4d4d4;font-weight:900}.form input,.form textarea{width:100%;border:1px solid #2c2c2c;border-radius:16px;background:#050505;color:#f5f5f5;padding:13px 14px;font:inherit}.form textarea{min-height:104px;resize:vertical}.form input:focus,.form textarea:focus{outline:none;border-color:#2df5d5;box-shadow:0 0 0 1px rgba(45,245,213,.2)}fieldset{border:1px solid #242424;border-radius:20px;padding:12px}legend{padding:0 8px;color:#d4d4d4;font-weight:950}.sourceGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.source{border:1px solid #242424;border-radius:16px;background:#080808;color:#f5f5f5;text-align:left;padding:12px;cursor:pointer;font:inherit}.source.selected{border-color:#2df5d5;box-shadow:0 0 0 1px rgba(45,245,213,.18)}.source strong,.source span{display:block}.source span{margin-top:6px;color:#a3a3a3;font-size:.8rem;line-height:1.35}.nextBox{margin-top:18px;border:1px solid rgba(45,245,213,.28);border-radius:20px;background:rgba(45,245,213,.06);padding:16px}.copyBox{margin-top:12px;border:1px solid #242424;border-radius:14px;background:#050505;color:#d7d7d7;padding:12px;word-break:break-all;font-size:.82rem;line-height:1.45}.success{color:#2df5d5!important;font-weight:900}.error{margin-top:12px;border:1px solid #3a3a3a;border-radius:14px;background:#0b0b0b;color:#f5f5f5;padding:10px;font-weight:900}@media(max-width:900px){.shell{padding:16px 8px 32px}.card{border-radius:22px}.panel,.sourceGrid{grid-template-columns:1fr}.primary,.secondary{width:100%}.hero{min-height:auto}}
      `}</style>
    </>
  );
}