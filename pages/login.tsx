import Head from "next/head";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";

type LoginState =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "sending" }
  | { state: "resolving_workspace" }
  | { state: "sent"; email: string }
  | { state: "signed_in"; email: string | null }
  | { state: "error"; message: string };

const SESSION_KEY = "autokirk.pendingCheckoutSessionId";

function getSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) throw new Error("SUPABASE_BROWSER_ENV_NOT_CONFIGURED");
  return createClient(supabaseUrl, supabaseAnonKey);
}

function getSessionId(): string | null {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("session_id");
  if (fromUrl) {
    window.localStorage.setItem(SESSION_KEY, fromUrl);
    return fromUrl;
  }
  return window.localStorage.getItem(SESSION_KEY);
}

function getRedirectUrl(): string {
  return `${window.location.origin}/login`;
}

async function resolveWorkspaceAccess(): Promise<string> {
  const response = await fetch('/api/customer/returning-access', {
    method: 'GET',
    credentials: 'include',
    headers: {
      accept: 'application/json',
    },
  })

  const body = await response.json()

  if (!response.ok || !body.ok || typeof body.board_path !== 'string') {
    throw new Error(body?.error ?? 'WORKSPACE_ACCESS_RESOLUTION_FAILED')
  }

  return body.board_path
}

function copyFor(status: LoginState): { label: string; body: string } {
  if (status.state === "checking") return { label: "Checking login", body: "AutoKirk is checking whether this browser is already signed in." };
  if (status.state === "sending") return { label: "Sending login link", body: "AutoKirk is sending a secure sign-in link." };
  if (status.state === "resolving_workspace") return { label: "Opening workspace", body: "AutoKirk is resolving your governed workspace access." };
  if (status.state === "sent") return { label: "Check your email", body: `A secure login link was sent to ${status.email}.` };
  if (status.state === "signed_in") return { label: "Signed in", body: status.email ? `Continuing as ${status.email}.` : "Continuing to AutoKirk." };
  if (status.state === "error") return { label: "Login needs attention", body: status.message };
  return { label: "Daily login", body: "Sign in after checkout and return whenever you need to run AutoKirk." };
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<LoginState>({ state: "checking" });
  const copy = useMemo(() => copyFor(status), [status]);

  useEffect(() => {
    async function bootstrap() {
      try {
        getSessionId();
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          setStatus({ state: 'error', message: error.message })
          return
        }

        if (!data.session) {
          setStatus({ state: 'idle' })
          return
        }

        setStatus({
          state: 'signed_in',
          email: data.session.user.email ?? null,
        })

        setStatus({ state: 'resolving_workspace' })
        const boardPath = await resolveWorkspaceAccess()
        window.location.replace(boardPath)
      } catch (err) {
        setStatus({
          state: 'error',
          message: err instanceof Error ? err.message : 'Workspace access failed.',
        })
      }
    }

    bootstrap()
  }, []);

  async function sendLoginLink() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@")) return setStatus({ state: "error", message: "Enter the email address used for AutoKirk." });
    setStatus({ state: "sending" });
    try {
      getSessionId();
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { emailRedirectTo: getRedirectUrl() },
      });
      if (error) throw error;
      setStatus({ state: "sent", email: trimmed });
    } catch (err) {
      setStatus({ state: "error", message: err instanceof Error ? err.message : "Could not send login link." });
    }
  }

  return (
    <>
      <Head>
        <title>Login to AutoKirk</title>
        <meta name="description" content="Sign in to AutoKirk after checkout or for daily use." />
      </Head>
      <main className="shell">
        <section className="card" aria-labelledby="login-title">
          <div className="status" aria-live="polite">
            <span className={status.state === "signed_in" || status.state === "sent" ? "dot ready" : "dot"} />
            <strong>{copy.label}</strong>
            <span>{copy.body}</span>
          </div>
          <p className="eyebrow">AutoKirk login</p>
          <h1 id="login-title">Sign in to continue.</h1>
          <p className="lede">After checkout, use this login to enter AutoKirk. Returning customers sign in once and continue directly to their governed workspace board.</p>
          {status.state === "signed_in" || status.state === "resolving_workspace" ? (
            <button className="primary" type="button" disabled>
              Opening workspace...
            </button>
          ) : (
            <form className="form" onSubmit={(event) => { event.preventDefault(); sendLoginLink(); }}>
              <label>Email address<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" /></label>
              <button className="primary" type="submit" disabled={status.state === "sending" || status.state === "checking"}>{status.state === "sending" ? "Sending login link..." : "Send secure login link"}</button>
            </form>
          )}
          <div className="steps" aria-label="Login flow">
            <article><span>01</span><strong>Pay through Stripe once</strong><p>Checkout provisions the governed workspace.</p></article>
            <article><span>02</span><strong>Sign in by email</strong><p>Passwordless login restores tenant-safe access.</p></article>
            <article><span>03</span><strong>Continue to your board</strong><p>AutoKirk resolves workspace membership and opens the board directly.</p></article>
          </div>
        </section>
      </main>
      <style jsx>{`
        .shell{min-height:100vh;padding:24px 12px 40px;color:#f4f4f5;background:radial-gradient(circle at 50% -10%,rgba(16,163,127,.16),transparent 34rem),#070a0f}.card{width:min(900px,100%);margin:0 auto;border:1px solid rgba(255,255,255,.09);border-radius:30px;background:linear-gradient(180deg,rgba(17,22,29,.97),rgba(9,12,17,.96));box-shadow:0 24px 80px rgba(0,0,0,.44);padding:clamp(28px,5vw,58px)}.status{width:fit-content;max-width:100%;display:flex;align-items:center;gap:9px;margin-bottom:22px;border:1px solid rgba(16,163,127,.24);border-radius:999px;padding:8px 12px;color:#d7f9ee;background:rgba(16,163,127,.08);font-size:.86rem}.status span:last-child{color:#b6c2c9}.dot{width:8px;height:8px;border-radius:999px;background:#10a37f;box-shadow:0 0 18px rgba(16,163,127,.7)}.ready{background:#22c55e}.eyebrow{margin:0 0 12px;color:#9ca3af;font-size:.78rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}h1,p{margin:0}h1{max-width:760px;font-size:clamp(3rem,7vw,5.6rem);line-height:.96;letter-spacing:-.064em}.lede{max-width:680px;margin-top:18px;color:#e4e4e7;font-size:clamp(1.05rem,2vw,1.28rem);line-height:1.48}.form{display:grid;gap:12px;max-width:520px;margin-top:28px}.form label{display:grid;gap:8px;color:#d4d4d8;font-size:.9rem;font-weight:800}.form input{width:100%;border:1px solid rgba(255,255,255,.11);border-radius:16px;background:rgba(255,255,255,.04);color:#f4f4f5;padding:14px;font:inherit}.primary{display:inline-flex;min-height:48px;align-items:center;justify-content:center;border-radius:999px;padding:0 20px;border:0;color:#06130f;background:#10a37f;font:inherit;font-weight:900;cursor:pointer;margin-top:28px}.form .primary{margin-top:0}.primary:disabled{cursor:wait;opacity:.74}.steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:34px}.steps article{border:1px solid rgba(255,255,255,.08);border-radius:18px;background:rgba(18,23,30,.74);padding:16px}.steps span{display:block;margin-bottom:8px;color:#10a37f;font-size:.78rem;font-weight:900;letter-spacing:.08em}.steps p{margin-top:6px;color:#a1a1aa;line-height:1.45}@media(max-width:760px){.shell{padding:16px 8px 32px}.card{border-radius:22px;padding:24px 18px}.steps{grid-template-columns:1fr}.primary{width:100%}.status{align-items:flex-start;border-radius:18px}}
      `}</style>
    </>
  );
}
