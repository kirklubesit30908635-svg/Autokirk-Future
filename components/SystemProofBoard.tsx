import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/router";
import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import type { Session, SupabaseClient } from "@supabase/supabase-js";

type LifecycleRow = {
  obligation_id: string;
  entity_id: string | null;
  obligation_code: string;
  workspace_id: string;
  obligation_created_at: string;
  source_event_id: string | null;
  source_system: string | null;
  source_event_key: string | null;
  source_event_type: string | null;
  source_event_created_at: string | null;
  receipt_id: string | null;
  receipt_entity_id: string | null;
  resolution_type: string | null;
  proof_status: string | null;
  receipt_emitted_at: string | null;
  truth_burden: string | null;
  due_at: string | null;
  lifecycle_state: string;
};

type SummaryValue = number | string | null;

export type SystemProofBoardProps = {
  mode: "live" | "placeholder" | "error";
  generatedAt: string;
  summary: {
    sourceEvents: SummaryValue;
    obligations: SummaryValue;
    receipts: SummaryValue;
    failed: SummaryValue;
    overdue: SummaryValue;
    open: SummaryValue;
    retries: SummaryValue;
    projection: SummaryValue;
  };
  lifecycleRows: LifecycleRow[];
  watchdogRows: LifecycleRow[];
  note: string;
  error?: string;
};

type LiveProofRunSuccess = {
  ok: true;
  event: Record<string, unknown>;
  obligation: Record<string, unknown>;
  resolution: Record<string, unknown>;
  receipt: Record<string, unknown>;
  lifecycle_state: string;
  entity_id: string | null;
  receipt_entity_id: string | null;
};

type LiveProofRunFailure = {
  ok: false;
  error: string;
};

type LiveProofRunResponse = LiveProofRunSuccess | LiveProofRunFailure;

type AuthState =
  | "loading"
  | "ready"
  | "signed_out"
  | "sending"
  | "error"
  | "unavailable";

const leftRail = [
  "KERNEL",
  "OBLIGATIONS",
  "RECEIPTS",
  "FAILURES",
  "WATCHDOG",
];

const publicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const publicAppUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

let browserSupabaseClient: SupabaseClient | null = null;

function getBrowserSupabaseClient(): SupabaseClient | null {
  if (!publicSupabaseUrl?.trim() || !publicSupabaseAnonKey?.trim()) {
    return null;
  }

  if (!browserSupabaseClient) {
    browserSupabaseClient = createBrowserClient(publicSupabaseUrl, publicSupabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return browserSupabaseClient;
}

function formatValue(value: SummaryValue): string {
  if (value === null || typeof value === "undefined" || value === "") {
    return "—";
  }

  if (typeof value === "number") {
    return new Intl.NumberFormat("en-US").format(value);
  }

  return value;
}

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function compactId(value: string | null): string {
  if (!value) {
    return "—";
  }

  if (value.length <= 20) {
    return value;
  }

  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}

function selectRows(
  rows: LifecycleRow[],
  predicate: (row: LifecycleRow) => boolean,
  limit = 4
): LifecycleRow[] {
  return rows.filter(predicate).slice(0, limit);
}

function getProjectionTone(
  projection: string
): "projectionOk" | "projectionFailing" | "projectionOffline" {
  if (projection === "OK") {
    return "projectionOk";
  }

  if (projection === "FAILING") {
    return "projectionFailing";
  }

  return "projectionOffline";
}

function getOperatorRedirectUrl(): string | undefined {
  if (typeof window === "undefined") {
    return publicAppUrl ? new URL("/", publicAppUrl).toString() : undefined;
  }

  const callbackOrigin =
    publicAppUrl ||
    (window.location.hostname.endsWith(".vercel.app")
      ? "https://autokirk.com"
      : window.location.origin);

  return new URL(window.location.pathname || "/", callbackOrigin).toString();
}

function getLifecycleOutcome(rows: LifecycleRow[]): string {
  if (rows.some((row) => row.lifecycle_state === "failed")) {
    return "FAILURE RECORDED";
  }

  if (
    rows.some(
      (row) =>
        row.lifecycle_state === "resolved" ||
        row.proof_status === "sufficient" ||
        row.proof_status === "accepted"
    )
  ) {
    return "RESOLUTION PROVEN";
  }

  return "RESOLUTION PENDING";
}

function getReceiptOutcome(rows: LifecycleRow[]): string {
  if (rows.some((row) => Boolean(row.receipt_id))) {
    return "RECEIPT EMITTED";
  }

  return "RECEIPT ABSENT";
}

function RowField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="field">
      <div className="fieldLabel">{label}</div>
      <div className="fieldValue">{value}</div>
    </div>
  );
}

function ResultField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="runResultField">
      <div className="fieldLabel">{label}</div>
      <div className="runResultValue">{value}</div>
    </div>
  );
}

function RowRecord({ row }: { row: LifecycleRow }) {
  return (
    <article className="record">
      <div className="recordTop">
        <div className="recordIdentity">
          <div className="recordCode">{row.obligation_code}</div>
          <div className="recordSource">
            {row.source_event_type ?? "NO SOURCE EVENT TYPE"}
          </div>
        </div>

        <div className={`stateBadge state-${row.lifecycle_state}`}>
          {row.lifecycle_state}
        </div>
      </div>

      <div className="fieldGrid">
        <RowField label="CODE" value={row.obligation_code} />
        <RowField label="STATE" value={row.lifecycle_state.toUpperCase()} />
        <RowField
          label="BURDEN"
          value={(row.truth_burden ?? "—").toUpperCase()}
        />
        <RowField label="RECEIPT" value={compactId(row.receipt_id)} />
        <RowField label="OPENED" value={formatTimestamp(row.obligation_created_at)} />
        <RowField label="DUE" value={formatTimestamp(row.due_at)} />
      </div>
    </article>
  );
}

function StreamSection({
  title,
  value,
  description,
  rows,
}: {
  title: string;
  value: SummaryValue;
  description: string;
  rows: LifecycleRow[];
}) {
  return (
    <section className="streamSection">
      <div className="streamHeader">
        <div>
          <div className="sectionTitle">{title}</div>
          <p className="sectionDescription">{description}</p>
        </div>
        <div className="sectionValue">{formatValue(value)}</div>
      </div>

      <div className="recordList">
        {rows.length > 0 ? (
          rows.map((row) => <RowRecord key={row.obligation_id} row={row} />)
        ) : (
          <div className="emptyState">NO LIVE DATA</div>
        )}
      </div>
    </section>
  );
}

export function SystemProofBoard({
  generatedAt,
  summary,
  lifecycleRows,
  watchdogRows,
  note,
  error,
}: SystemProofBoardProps) {
  const router = useRouter();
  const [isRunning, startRunTransition] = useTransition();
  const [operatorEmail, setOperatorEmail] = useState("");
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [authMessage, setAuthMessage] = useState(
    "Checking for an authenticated operator session..."
  );
  const [operatorSession, setOperatorSession] = useState<Session | null>(null);
  const [runStatus, setRunStatus] = useState<
    "idle" | "running" | "success" | "error"
  >("idle");
  const [runMessage, setRunMessage] = useState<string>(
    "Run the canonical event -> obligation -> resolution -> receipt loop through kernel authority."
  );
  const [runResult, setRunResult] = useState<LiveProofRunSuccess | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.sessionStorage.getItem("autokirk-live-proof-result");

    if (!stored) {
      return;
    }

    window.sessionStorage.removeItem("autokirk-live-proof-result");

    try {
      const parsed = JSON.parse(stored) as LiveProofRunSuccess;
      setRunStatus("success");
      setRunMessage(
        "Full loop completed through kernel authority. Projection truth has been reloaded."
      );
      setRunResult(parsed);
    } catch {
      window.sessionStorage.removeItem("autokirk-live-proof-result");
    }
  }, []);

  useEffect(() => {
    const client = getBrowserSupabaseClient();

    if (!client) {
      setAuthState("unavailable");
      setAuthMessage("Operator auth is unavailable in this environment.");
      return;
    }

    let isMounted = true;

    const syncSession = (session: Session | null) => {
      if (!isMounted) {
        return;
      }

      setOperatorSession(session);

      if (session?.access_token) {
        setAuthState("ready");
        setAuthMessage(
          `Operator session active for ${session.user.email ?? session.user.id}.`
        );
        if (session.user.email) {
          setOperatorEmail((current) => current || session.user.email || "");
        }
      } else {
        setAuthState("signed_out");
        setAuthMessage("Sign in as a workspace operator to run the live loop.");
      }
    };

    client.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (sessionError) {
          throw sessionError;
        }

        syncSession(data.session);
      })
      .catch((sessionError: Error) => {
        if (!isMounted) {
          return;
        }

        setAuthState("error");
        setAuthMessage(sessionError.message);
      });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      syncSession(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const projection = String(summary.projection ?? "NO LIVE DATA");
  const projectionTone = getProjectionTone(projection);
  const lifecycleOutcome = getLifecycleOutcome(lifecycleRows);
  const receiptOutcome = getReceiptOutcome(lifecycleRows);

  const sourceRows = selectRows(lifecycleRows, (row) => Boolean(row.source_event_id));
  const obligationRows = lifecycleRows.slice(0, 4);
  const receiptRows = selectRows(lifecycleRows, (row) => Boolean(row.receipt_id));
  const failedRows = selectRows(
    lifecycleRows,
    (row) => row.lifecycle_state === "failed"
  );
  const overdueRows = watchdogRows.slice(0, 4);
  const projectionRows = selectRows(
    lifecycleRows,
    (row) =>
      row.lifecycle_state === "open" ||
      row.lifecycle_state === "failed" ||
      !row.receipt_id
  );

  const heroStats = [
    { label: "Source Events", value: summary.sourceEvents },
    { label: "Obligations", value: summary.obligations },
    { label: "Receipts", value: summary.receipts },
  ];

  const rightRail = [
    { label: "OPEN", value: summary.open },
    { label: "FAILED", value: summary.failed },
    { label: "OVERDUE", value: summary.overdue },
    { label: "RETRIES", value: summary.retries },
    { label: "PROJECTION", value: projection },
  ];

  function toApiError(payload: unknown, fallback: string): string {
    if (!payload || typeof payload !== "object") {
      return fallback;
    }

    const candidate = (payload as { error?: unknown }).error;
    return typeof candidate === "string" && candidate.trim()
      ? candidate
      : fallback;
  }

  function handleRunLoop() {
    startRunTransition(async () => {
      if (!operatorSession?.access_token) {
        setRunStatus("error");
        setRunMessage("OPERATOR_SIGN_IN_REQUIRED");
        return;
      }

      setRunStatus("running");
      setRunMessage("Running the full loop through the kernel...");
      setRunResult(null);

      try {
        const response = await fetch("/api/live-proof/run", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${operatorSession.access_token}`,
          },
        });

        const payload = (await response.json()) as LiveProofRunResponse;

        if (!response.ok || !payload.ok) {
          throw new Error(
            toApiError(payload, `LIVE_PROOF_REQUEST_FAILED_${response.status}`)
          );
        }

        setRunStatus("success");
        setRunMessage(
          "Loop completed. Reloading projection truth from the live read model..."
        );
        setRunResult(payload);

        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(
            "autokirk-live-proof-result",
            JSON.stringify(payload)
          );
          window.setTimeout(() => {
            router.reload();
          }, 500);
        }
      } catch (runError) {
        setRunStatus("error");
        setRunMessage(
          runError instanceof Error
            ? runError.message
            : "LIVE_PROOF_REQUEST_FAILED"
        );
      }
    });
  }

  async function handleOperatorSignIn() {
    const client = getBrowserSupabaseClient();

    if (!client) {
      setAuthState("unavailable");
      setAuthMessage("Operator auth is unavailable in this environment.");
      return;
    }

    const email = operatorEmail.trim();

    if (!email) {
      setAuthState("error");
      setAuthMessage("OPERATOR_EMAIL_REQUIRED");
      return;
    }

    setAuthState("sending");
    setAuthMessage("Sending operator sign-in link...");

    const { error: signInError } = await client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: getOperatorRedirectUrl(),
      },
    });

    if (signInError) {
      setAuthState("error");
      setAuthMessage(signInError.message);
      return;
    }

    setAuthState("signed_out");
    setAuthMessage("Check your email for the operator sign-in link.");
  }

  async function handleOperatorSignOut() {
    const client = getBrowserSupabaseClient();

    if (!client) {
      return;
    }

    const { error: signOutError } = await client.auth.signOut();

    if (signOutError) {
      setAuthState("error");
      setAuthMessage(signOutError.message);
      return;
    }

    setRunResult(null);
    setRunStatus("idle");
    setRunMessage(
      "Run the canonical event -> obligation -> resolution -> receipt loop through kernel authority."
    );
  }

  return (
    <main className="surface">
      <div className="ambientGlow ambientGlowLeft" />
      <div className="ambientGlow ambientGlowRight" />
      <div className="frame">
        <aside className="leftRail">
          <div className="railBrand">
            <div className="eyebrow">READ ONLY PROJECTION SURFACE</div>
            <p className="railCopy">
              Kernel authority remains the sole mutation path. This surface only
              renders projection truth.
            </p>
          </div>

          <nav className="navList" aria-label="System sections">
            {leftRail.map((item) => (
              <div key={item} className="navItem">
                <span className="navPulse" />
                <span>{item}</span>
              </div>
            ))}
          </nav>

          <div className="railFooter">
            <div className="eyebrow">Generated</div>
            <div className="railTimestamp">{formatTimestamp(generatedAt)}</div>
          </div>
        </aside>

        <section className="workspace">
          <header className="heroPanel">
            <div className="heroTop">
              <div>
                <div className="heroEyebrow">AUTOKIRK FUTURE</div>
                <h1>FAILURES DO NOT DISAPPEAR</h1>
                <p className="heroCopy">
                  Every event becomes an obligation. Every obligation remains
                  active until proven resolved.
                </p>
              </div>

              <div className={`projectionChip ${projectionTone}`}>
                <span>PROJECTION</span>
                <strong>{projection}</strong>
              </div>
            </div>

            <div className="heroStats">
              {heroStats.map((item) => (
                <div key={item.label} className="heroStatCard">
                  <div className="heroStatLabel">{item.label}</div>
                  <div className="heroStatValue">{formatValue(item.value)}</div>
                </div>
              ))}
            </div>
          </header>

          <section className="proofPanel">
            <div className="proofPanelHeader">
              <div>
                <div className="sectionLabel">Main Proof Block</div>
                <p className="proofCopy">
                  The lifecycle remains visible until proof or failure is
                  explicitly recorded by the kernel.
                </p>
              </div>
              <div className="proofMeta">{formatTimestamp(generatedAt)}</div>
            </div>

            <div className="lifecycleStrip">
              <div className="lifecycleNode">
                <span className="nodeIndex">01</span>
                <span className="nodeLabel">EVENT RECORDED</span>
              </div>
              <div className="lifecycleConnector" />
              <div className="lifecycleNode">
                <span className="nodeIndex">02</span>
                <span className="nodeLabel">OBLIGATION OPENED</span>
              </div>
              <div className="lifecycleConnector" />
              <div className="lifecycleNode lifecycleNodeAccent">
                <span className="nodeIndex">03</span>
                <span className="nodeLabel">{lifecycleOutcome}</span>
              </div>
              <div className="lifecycleConnector" />
              <div className="lifecycleNode lifecycleNodeAccent">
                <span className="nodeIndex">04</span>
                <span className="nodeLabel">{receiptOutcome}</span>
              </div>
            </div>

            <div className="noticeStack">
              <div className="operatorCard">
                <div className="operatorHeader">
                  <div>
                    <div className="noticeLabel">Operator Session</div>
                    <div className="operatorTitle">Authenticated Kernel Access</div>
                  </div>
                  <div className={`operatorBadge operatorBadge-${authState}`}>
                    {authState === "ready"
                      ? "AUTHENTICATED"
                      : authState === "sending"
                      ? "SENDING"
                      : authState === "loading"
                      ? "CHECKING"
                      : authState === "unavailable"
                      ? "UNAVAILABLE"
                      : "SIGN IN REQUIRED"}
                  </div>
                </div>

                <p className="operatorText">
                  The live loop can only be triggered by an authenticated workspace
                  operator.
                </p>

                <div className="operatorControls">
                  <input
                    type="email"
                    value={operatorEmail}
                    onChange={(event) => setOperatorEmail(event.target.value)}
                    className="operatorInput"
                    placeholder="operator@autokirk.com"
                    autoComplete="email"
                    disabled={authState === "ready" || authState === "loading"}
                  />
                  {authState === "ready" ? (
                    <button
                      type="button"
                      className="secondaryButton"
                      onClick={handleOperatorSignOut}
                    >
                      Sign Out
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="secondaryButton"
                      onClick={handleOperatorSignIn}
                      disabled={authState === "loading" || authState === "sending"}
                    >
                      {authState === "sending" ? "Sending Link..." : "Send Sign-In Link"}
                    </button>
                  )}
                </div>

                <div className={`operatorMessage operatorMessage-${authState}`}>
                  {authMessage}
                </div>
              </div>

              <div className="runPanel">
                <div className="runPanelCopy">
                  <div className="noticeLabel">Operator Loop</div>
                  <div className="runPanelTitle">Run The Full Loop</div>
                  <p className="runPanelText">
                    Emit a live source event, open the obligation, resolve it
                    through kernel authority, and confirm receipt emission.
                  </p>
                </div>

                <div className="runPanelAction">
                  <button
                    type="button"
                    className="runButton"
                    onClick={handleRunLoop}
                    disabled={isRunning || authState !== "ready"}
                  >
                    {isRunning ? "RUNNING LOOP..." : "RUN FULL LOOP"}
                  </button>
                  <div className={`runStatus runStatus-${runStatus}`}>
                    {runMessage}
                  </div>
                </div>
              </div>

              {runResult ? (
                <div className="runResultCard">
                  <div className="noticeLabel">Latest Loop Result</div>
                  <div className="runResultGrid">
                    <ResultField
                      label="EVENT"
                      value={String(
                        runResult.event["source_event_type"] ??
                          runResult.event["id"] ??
                          "—"
                      )}
                    />
                    <ResultField
                      label="OBLIGATION"
                      value={String(
                        runResult.obligation["obligation_code"] ??
                          runResult.obligation["id"] ??
                          "—"
                      )}
                    />
                    <ResultField
                      label="RESOLUTION"
                      value={String(
                        runResult.resolution["resolution_type"] ??
                          runResult.resolution["id"] ??
                          "—"
                      )}
                    />
                    <ResultField
                      label="RECEIPT"
                      value={String(
                        runResult.receipt["id"] ?? runResult.receipt_entity_id ?? "—"
                      )}
                    />
                    <ResultField
                      label="STATE"
                      value={runResult.lifecycle_state.toUpperCase()}
                    />
                    <ResultField
                      label="ENTITY"
                      value={runResult.entity_id ?? "—"}
                    />
                  </div>
                </div>
              ) : null}

              <div className="noticeCard">
                <div className="noticeLabel">READ MODEL</div>
                <div className="noticeBody">{note}</div>
              </div>
              {error ? (
                <div className="noticeCard noticeError">
                  <div className="noticeLabel">ERROR</div>
                  <div className="noticeBody">{error}</div>
                </div>
              ) : null}
            </div>
          </section>

          <div className="sections">
            <StreamSection
              title="Source Events"
              value={summary.sourceEvents}
              description="Latest recorded events attached to obligation truth."
              rows={sourceRows}
            />
            <StreamSection
              title="Obligations"
              value={summary.obligations}
              description="Open and recent obligations in the projection stream."
              rows={obligationRows}
            />
            <StreamSection
              title="Receipts"
              value={summary.receipts}
              description="Receipt-backed lifecycle proofs emitted by the system."
              rows={receiptRows}
            />
            <StreamSection
              title="Failed"
              value={summary.failed}
              description="Failure states remain visible until doctrine-valid proof exists."
              rows={failedRows}
            />
            <StreamSection
              title="Overdue"
              value={summary.overdue}
              description="Watchdog rows surfaced from the overdue failure read model."
              rows={overdueRows}
            />
            <StreamSection
              title="Projection Status"
              value={projection}
              description="Current projection health with unresolved or receipt-absent rows."
              rows={projectionRows}
            />
          </div>
        </section>

        <aside className="rightRail">
          <div className="statusStack">
            {rightRail.map((item) => (
              <div key={item.label} className="statusCard">
                <div className="statusLabel">{item.label}</div>
                <div
                  className={`statusValue ${
                    item.label === "PROJECTION" ? projectionTone : ""
                  }`}
                >
                  {formatValue(item.value)}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <style jsx>{`
        .surface {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at top left, rgba(212, 175, 55, 0.16), transparent 30%),
            radial-gradient(circle at 85% 0%, rgba(212, 175, 55, 0.08), transparent 24%),
            linear-gradient(180deg, #050403 0%, #090705 48%, #040302 100%);
          color: #f3ead3;
          font-family:
            "Söhne", "Avenir Next", "Segoe UI", system-ui, sans-serif;
        }

        .ambientGlow {
          position: absolute;
          width: 34rem;
          height: 34rem;
          border-radius: 999px;
          filter: blur(100px);
          opacity: 0.08;
          pointer-events: none;
        }

        .ambientGlowLeft {
          top: -14rem;
          left: -10rem;
          background: #d4af37;
        }

        .ambientGlowRight {
          top: 14rem;
          right: -14rem;
          background: #8b6a17;
        }

        .frame {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          display: grid;
          grid-template-columns: 248px minmax(0, 1fr) 220px;
          gap: 24px;
          padding: 24px;
        }

        .leftRail,
        .heroPanel,
        .proofPanel,
        .streamSection,
        .statusCard {
          border: 1px solid rgba(243, 234, 211, 0.08);
          background:
            linear-gradient(180deg, rgba(19, 16, 12, 0.94), rgba(8, 7, 5, 0.94));
          box-shadow:
            inset 0 1px 0 rgba(255, 245, 215, 0.04),
            0 18px 60px rgba(0, 0, 0, 0.28);
        }

        .leftRail {
          display: grid;
          align-content: start;
          gap: 22px;
          padding: 24px 20px;
          border-radius: 28px;
        }

        .eyebrow,
        .heroEyebrow,
        .sectionLabel,
        .heroStatLabel,
        .statusLabel,
        .fieldLabel,
        .noticeLabel {
          color: #d4af37;
          font-family:
            "IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono",
            Menlo, monospace;
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .railCopy,
        .heroCopy,
        .proofCopy,
        .sectionDescription,
        .noticeBody,
        .railTimestamp {
          color: #cbbd96;
          line-height: 1.75;
        }

        .railCopy,
        .proofCopy,
        .sectionDescription,
        .noticeBody,
        .railTimestamp {
          font-size: 13px;
        }

        .navList {
          display: grid;
          gap: 10px;
        }

        .navItem {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 14px;
          border-radius: 16px;
          border: 1px solid rgba(212, 175, 55, 0.08);
          background: rgba(212, 175, 55, 0.04);
          color: #f6eed5;
          font-family:
            "IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono",
            Menlo, monospace;
          font-size: 13px;
          letter-spacing: 0.05em;
        }

        .navPulse {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #d4af37;
          box-shadow: 0 0 18px rgba(212, 175, 55, 0.6);
        }

        .workspace {
          display: grid;
          gap: 20px;
          align-content: start;
        }

        .heroPanel,
        .proofPanel,
        .streamSection {
          border-radius: 28px;
        }

        .heroPanel {
          padding: 30px;
          display: grid;
          gap: 24px;
        }

        .heroTop {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: start;
          flex-wrap: wrap;
        }

        h1 {
          margin: 8px 0 14px;
          max-width: 10ch;
          color: #fff5da;
          font-size: clamp(2.8rem, 5.2vw, 5.6rem);
          line-height: 0.94;
          letter-spacing: -0.04em;
        }

        .heroCopy {
          margin: 0;
          max-width: 760px;
          font-size: 17px;
        }

        .projectionChip {
          min-width: 170px;
          display: grid;
          gap: 8px;
          padding: 16px 18px;
          border-radius: 20px;
          border: 1px solid rgba(212, 175, 55, 0.12);
          background: rgba(212, 175, 55, 0.05);
          font-family:
            "IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono",
            Menlo, monospace;
          text-transform: uppercase;
        }

        .projectionChip span {
          font-size: 10px;
          letter-spacing: 0.18em;
        }

        .projectionChip strong {
          font-size: 1.4rem;
          line-height: 1.1;
        }

        .projectionOk {
          color: #87d38f;
        }

        .projectionFailing {
          color: #f59b7d;
        }

        .projectionOffline {
          color: #d8bb67;
        }

        .heroStats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .heroStatCard {
          padding: 18px;
          border-radius: 20px;
          border: 1px solid rgba(212, 175, 55, 0.1);
          background: linear-gradient(180deg, rgba(212, 175, 55, 0.08), rgba(212, 175, 55, 0.02));
        }

        .heroStatValue {
          margin-top: 10px;
          color: #fff2cf;
          font-size: clamp(1.4rem, 2.8vw, 2.15rem);
          line-height: 1;
        }

        .proofPanel {
          padding: 26px;
          display: grid;
          gap: 20px;
        }

        .proofPanelHeader {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: start;
          flex-wrap: wrap;
        }

        .proofCopy {
          margin: 10px 0 0;
          max-width: 620px;
        }

        .proofMeta {
          color: #9f9270;
          font-family:
            "IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono",
            Menlo, monospace;
          font-size: 12px;
          letter-spacing: 0.05em;
        }

        .lifecycleStrip {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 24px minmax(0, 1fr) 24px minmax(0, 1fr) 24px minmax(0, 1fr);
          align-items: center;
          gap: 10px;
        }

        .lifecycleNode {
          min-height: 122px;
          display: grid;
          align-content: start;
          gap: 18px;
          padding: 18px;
          border-radius: 22px;
          border: 1px solid rgba(212, 175, 55, 0.12);
          background: rgba(212, 175, 55, 0.04);
        }

        .lifecycleNodeAccent {
          background: linear-gradient(180deg, rgba(212, 175, 55, 0.12), rgba(212, 175, 55, 0.03));
          border-color: rgba(212, 175, 55, 0.2);
        }

        .nodeIndex {
          color: #a08c5b;
          font-family:
            "IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono",
            Menlo, monospace;
          font-size: 11px;
          letter-spacing: 0.18em;
        }

        .nodeLabel {
          color: #fff3d4;
          font-size: 15px;
          line-height: 1.4;
          text-transform: uppercase;
        }

        .lifecycleConnector {
          height: 1px;
          background: linear-gradient(90deg, rgba(212, 175, 55, 0.2), rgba(212, 175, 55, 0.7), rgba(212, 175, 55, 0.2));
        }

        .noticeStack {
          display: grid;
          gap: 12px;
        }

        .operatorCard,
        .runPanel,
        .noticeCard {
          padding: 16px 18px;
          border-radius: 18px;
          border: 1px solid rgba(212, 175, 55, 0.08);
          background: rgba(212, 175, 55, 0.04);
        }

        .operatorCard {
          display: grid;
          gap: 14px;
          background:
            linear-gradient(180deg, rgba(10, 9, 7, 0.98), rgba(17, 14, 10, 0.94));
        }

        .operatorHeader {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: start;
          flex-wrap: wrap;
        }

        .operatorTitle {
          color: #fff2cf;
          font-size: 1.15rem;
          line-height: 1.1;
        }

        .operatorText {
          margin: 0;
          color: #cbbd96;
          font-size: 14px;
          line-height: 1.7;
        }

        .operatorBadge {
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid rgba(212, 175, 55, 0.14);
          font-family:
            "IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono",
            Menlo, monospace;
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .operatorBadge-ready {
          color: #87d38f;
        }

        .operatorBadge-loading,
        .operatorBadge-sending {
          color: #fff2cf;
        }

        .operatorBadge-signed_out,
        .operatorBadge-unavailable {
          color: #d8bb67;
        }

        .operatorBadge-error {
          color: #f59b7d;
        }

        .operatorControls {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .operatorInput {
          min-width: min(100%, 320px);
          flex: 1 1 280px;
          padding: 14px 16px;
          border-radius: 16px;
          border: 1px solid rgba(212, 175, 55, 0.16);
          background: rgba(5, 5, 4, 0.88);
          color: #fff2cf;
          font-family:
            "IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono",
            Menlo, monospace;
          font-size: 12px;
          letter-spacing: 0.04em;
        }

        .operatorInput::placeholder {
          color: #8e7d54;
        }

        .operatorInput:disabled {
          opacity: 0.72;
        }

        .secondaryButton {
          padding: 13px 18px;
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 999px;
          background: rgba(212, 175, 55, 0.08);
          color: #f7edcf;
          font-family:
            "IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono",
            Menlo, monospace;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
        }

        .secondaryButton:disabled {
          opacity: 0.72;
          cursor: wait;
        }

        .operatorMessage {
          font-family:
            "IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono",
            Menlo, monospace;
          font-size: 11px;
          letter-spacing: 0.06em;
          line-height: 1.8;
          text-transform: uppercase;
        }

        .operatorMessage-ready {
          color: #87d38f;
        }

        .operatorMessage-loading,
        .operatorMessage-sending {
          color: #fff2cf;
        }

        .operatorMessage-signed_out,
        .operatorMessage-unavailable {
          color: #d8bb67;
        }

        .operatorMessage-error {
          color: #f59b7d;
        }

        .runPanel {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          align-items: center;
          background:
            linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(212, 175, 55, 0.03)),
            rgba(212, 175, 55, 0.04);
        }

        .runPanelCopy {
          display: grid;
          gap: 8px;
          max-width: 560px;
        }

        .runPanelTitle {
          color: #fff2cf;
          font-size: 1.25rem;
          line-height: 1.1;
        }

        .runPanelText {
          margin: 0;
          color: #cbbd96;
          font-size: 14px;
          line-height: 1.7;
        }

        .runPanelAction {
          min-width: 280px;
          display: grid;
          gap: 10px;
          justify-items: end;
        }

        .runButton {
          min-width: 220px;
          padding: 14px 18px;
          border: 1px solid rgba(212, 175, 55, 0.28);
          border-radius: 999px;
          background:
            linear-gradient(180deg, rgba(212, 175, 55, 0.26), rgba(212, 175, 55, 0.12));
          color: #fff4d5;
          font-family:
            "IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono",
            Menlo, monospace;
          font-size: 12px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          cursor: pointer;
          transition:
            transform 140ms ease,
            border-color 140ms ease,
            background 140ms ease;
        }

        .runButton:hover:not(:disabled) {
          transform: translateY(-1px);
          border-color: rgba(212, 175, 55, 0.45);
          background:
            linear-gradient(180deg, rgba(212, 175, 55, 0.34), rgba(212, 175, 55, 0.16));
        }

        .runButton:disabled {
          opacity: 0.72;
          cursor: wait;
        }

        .runStatus {
          max-width: 320px;
          text-align: right;
          font-family:
            "IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono",
            Menlo, monospace;
          font-size: 11px;
          letter-spacing: 0.08em;
          line-height: 1.8;
          text-transform: uppercase;
        }

        .runStatus-idle {
          color: #bfa85f;
        }

        .runStatus-running {
          color: #fff2cf;
        }

        .runStatus-success {
          color: #87d38f;
        }

        .runStatus-error {
          color: #f59b7d;
        }

        .runResultCard {
          padding: 16px 18px;
          border-radius: 18px;
          border: 1px solid rgba(212, 175, 55, 0.12);
          background: rgba(6, 6, 4, 0.52);
          display: grid;
          gap: 14px;
        }

        .runResultGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .runResultField {
          display: grid;
          gap: 6px;
          min-width: 0;
        }

        .runResultValue {
          color: #efe2bc;
          font-family:
            "IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono",
            Menlo, monospace;
          font-size: 12px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .noticeError {
          border-color: rgba(245, 155, 125, 0.16);
          background: rgba(245, 155, 125, 0.06);
        }

        .sections {
          display: grid;
          gap: 18px;
        }

        .streamSection {
          padding: 24px;
          display: grid;
          gap: 18px;
        }

        .streamHeader {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: start;
        }

        .sectionTitle {
          color: #fff2cf;
          font-size: 1.2rem;
          line-height: 1.1;
        }

        .sectionDescription {
          margin: 10px 0 0;
          max-width: 680px;
        }

        .sectionValue {
          color: #fff2cf;
          font-size: clamp(1.5rem, 3vw, 2.7rem);
          line-height: 1;
          white-space: nowrap;
        }

        .recordList {
          display: grid;
          gap: 12px;
        }

        .record {
          padding: 18px;
          display: grid;
          gap: 14px;
          border-radius: 20px;
          border: 1px solid rgba(212, 175, 55, 0.08);
          background:
            linear-gradient(180deg, rgba(18, 16, 12, 0.92), rgba(13, 11, 8, 0.92));
        }

        .recordTop {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: start;
          flex-wrap: wrap;
        }

        .recordIdentity {
          display: grid;
          gap: 6px;
        }

        .recordCode {
          color: #fff3d7;
          font-family:
            "IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono",
            Menlo, monospace;
          font-size: 13px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .recordSource {
          color: #bca871;
          font-size: 13px;
          line-height: 1.5;
        }

        .stateBadge {
          padding: 7px 10px;
          border-radius: 999px;
          border: 1px solid rgba(212, 175, 55, 0.12);
          background: rgba(212, 175, 55, 0.07);
          font-family:
            "IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono",
            Menlo, monospace;
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .state-open {
          color: #edcb72;
        }

        .state-resolved {
          color: #87d38f;
        }

        .state-failed {
          color: #f59b7d;
        }

        .fieldGrid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 12px;
        }

        .field {
          display: grid;
          gap: 6px;
          min-width: 0;
        }

        .fieldValue {
          color: #efe2bc;
          font-family:
            "IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono",
            Menlo, monospace;
          font-size: 12px;
          line-height: 1.65;
          overflow-wrap: anywhere;
        }

        .emptyState {
          padding: 22px 18px;
          border-radius: 18px;
          border: 1px dashed rgba(212, 175, 55, 0.18);
          color: #d1bb73;
          font-family:
            "IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono",
            Menlo, monospace;
          font-size: 12px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .rightRail {
          display: grid;
          align-content: start;
        }

        .statusStack {
          display: grid;
          gap: 12px;
          position: sticky;
          top: 24px;
        }

        .statusCard {
          padding: 18px;
          border-radius: 22px;
        }

        .statusValue {
          margin-top: 10px;
          color: #fff2cf;
          font-size: clamp(1.35rem, 2.8vw, 2.2rem);
          line-height: 1.05;
          overflow-wrap: anywhere;
        }

        @media (max-width: 1260px) {
          .frame {
            grid-template-columns: 1fr;
          }

          .leftRail,
          .statusStack {
            position: static;
          }

          .navList,
          .statusStack {
            grid-template-columns: repeat(5, minmax(0, 1fr));
          }
        }

        @media (max-width: 1024px) {
          .heroStats,
          .fieldGrid,
          .runResultGrid,
          .navList,
          .statusStack,
          .lifecycleStrip {
            grid-template-columns: 1fr;
          }

          .lifecycleConnector {
            width: 1px;
            height: 20px;
            justify-self: center;
          }

          .heroTop,
          .operatorHeader,
          .runPanel,
          .streamHeader,
          .proofPanelHeader {
            flex-direction: column;
          }

          .runPanelAction {
            min-width: 0;
            width: 100%;
            justify-items: stretch;
          }

          .runButton,
          .runStatus {
            max-width: none;
            width: 100%;
            text-align: left;
          }
        }

        @media (max-width: 720px) {
          .frame {
            padding: 14px;
            gap: 14px;
          }

          .leftRail,
          .heroPanel,
          .proofPanel,
          .streamSection,
          .statusCard {
            border-radius: 22px;
          }

          .leftRail,
          .heroPanel,
          .proofPanel,
          .streamSection,
          .statusCard {
            padding-left: 16px;
            padding-right: 16px;
          }

          h1 {
            font-size: 2.55rem;
          }
        }
      `}</style>
    </main>
  );
}
