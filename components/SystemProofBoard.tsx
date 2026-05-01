import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/router";
import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import {
  activeProofScenario,
  createProofScenarioDraft,
  enabledProofScenarios,
  getProofScenario,
  getProofScenarioDraftError,
  getProofScenarioResultValue,
  toProofScenarioDraft,
  toProofScenarioPayload,
  type ProofScenarioDraft,
  type ProofScenarioFieldConfig,
  type ProofScenarioId,
  type ProofScenarioRecord,
} from "../lib/proofScenarios";

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
  scenario_id: ProofScenarioId;
  event: Record<string, unknown>;
  obligation: Record<string, unknown>;
  resolution: Record<string, unknown>;
  receipt: Record<string, unknown>;
  service_record?: ProofScenarioRecord;
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
const serverRenderTimeZone = "UTC";
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

function formatTimestamp(
  value: string | null,
  timeZone = serverRenderTimeZone
): string {
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
    timeZone,
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
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const isLocalhost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]";
    const siteUrl = publicAppUrl || (isLocalhost ? window.location.origin : undefined);

    if (!siteUrl) {
      return undefined;
    }

    return new URL(window.location.pathname || "/", siteUrl).toString();
  }

  return publicAppUrl ? new URL("/", publicAppUrl).toString() : undefined;
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

function ServiceRecordInput({
  label,
  placeholder,
  value,
  onChange,
  disabled,
  fullWidth = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  fullWidth?: boolean;
}) {
  return (
    <label className={fullWidth ? "serviceField serviceFieldFull" : "serviceField"}>
      <span className="fieldLabel">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="serviceInput"
        placeholder={placeholder}
        disabled={disabled}
      />
    </label>
  );
}

function ServiceRecordTextarea({
  label,
  placeholder,
  value,
  onChange,
  disabled,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <label className="serviceField serviceFieldFull">
      <span className="fieldLabel">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="serviceTextarea"
        placeholder={placeholder}
        rows={4}
        disabled={disabled}
      />
    </label>
  );
}

function getServiceDraftValue(
  draft: ProofScenarioDraft,
  field: ProofScenarioFieldConfig
): string {
  return draft[field.draftKey] ?? "";
}

function RowRecord({
  row,
  timeZone,
  highlighted = false,
  onSelect,
  selected = false,
}: {
  row: LifecycleRow;
  timeZone: string;
  highlighted?: boolean;
  onSelect?: (row: LifecycleRow) => void;
  selected?: boolean;
}) {
  const className = [
    "record",
    highlighted ? "recordHighlight" : "",
    selected ? "recordSelected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={className}
      onClick={() => onSelect?.(row)}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={(event) => {
        if (!onSelect) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(row);
        }
      }}
    >
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
        <RowField
          label="OPENED"
          value={formatTimestamp(row.obligation_created_at, timeZone)}
        />
        <RowField label="DUE" value={formatTimestamp(row.due_at, timeZone)} />
      </div>
    </article>
  );
}

function StreamSection({
  title,
  value,
  description,
  rows,
  timeZone,
  highlightedRowIds = new Set<string>(),
  highlightedReceipt = null,
  selectedObligationId = null,
  onSelectObligation,
}: {
  title: string;
  value: SummaryValue;
  description: string;
  rows: LifecycleRow[];
  timeZone: string;
  highlightedRowIds?: Set<string>;
  highlightedReceipt?: string | null;
  selectedObligationId?: string | null;
  onSelectObligation?: (row: LifecycleRow) => void;
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
          rows.map((row) => {
            const isNew =
              row.receipt_id === highlightedReceipt ||
              highlightedRowIds.has(row.obligation_id);
            return (
              <RowRecord
                key={row.obligation_id}
                row={row}
                timeZone={timeZone}
                highlighted={isNew}
                selected={row.obligation_id === selectedObligationId}
                onSelect={onSelectObligation}
              />
            );
          })
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
  const [selectedScenarioId, setSelectedScenarioId] = useState<ProofScenarioId>(
    activeProofScenario.id
  );
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [authMessage, setAuthMessage] = useState(
    "Checking for an authenticated operator session..."
  );
  const [operatorSession, setOperatorSession] = useState<Session | null>(null);
  const [serviceRecord, setServiceRecord] = useState<ProofScenarioDraft>(() =>
    createProofScenarioDraft(activeProofScenario)
  );
  const [runStatus, setRunStatus] = useState<
    "idle" | "running" | "success" | "error"
  >("idle");
  const [runMessage, setRunMessage] = useState<string>(
    activeProofScenario.ui.idleMessage
  );
  const [runResult, setRunResult] = useState<LiveProofRunSuccess | null>(null);
  const [renderTimeZone, setRenderTimeZone] = useState(serverRenderTimeZone);
  const [highlightedReceipt, setHighlightedReceipt] = useState<string | null>(null);
  const [runState, setRunState] = useState<
    "idle" | "opening" | "resolving" | "receipted"
  >("idle");
  const [highlightedRowIds, setHighlightedRowIds] = useState<Set<string>>(
    () => new Set<string>()
  );
  const [timelinePhase, setTimelinePhase] = useState<1 | 2 | 3 | 4>(2);
  const [selectedObligationId, setSelectedObligationId] = useState<string | null>(null);
  const selectedScenario = getProofScenario(selectedScenarioId);
  const resultScenario = runResult
    ? getProofScenario(runResult.scenario_id)
    : selectedScenario;

  useEffect(() => {
    const nextTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (nextTimeZone) {
      setRenderTimeZone((current) =>
        current === nextTimeZone ? current : nextTimeZone
      );
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedScenario = enabledProofScenarios.find((scenario) =>
      Boolean(window.sessionStorage.getItem(scenario.run.resultStorageKey))
    );

    if (!storedScenario) {
      return;
    }

    const stored = window.sessionStorage.getItem(storedScenario.run.resultStorageKey);

    window.sessionStorage.removeItem(storedScenario.run.resultStorageKey);

    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as LiveProofRunSuccess;
      const restoredScenario = getProofScenario(
        parsed.scenario_id ?? storedScenario.id
      );
      setSelectedScenarioId(restoredScenario.id);
      setRunStatus("success");
      setRunMessage(restoredScenario.ui.restoredMessage);
      setServiceRecord(toProofScenarioDraft(parsed.service_record, restoredScenario));
      setRunResult(parsed);
      setHighlightedReceipt(
        typeof parsed.receipt?.id === "string" ? parsed.receipt.id : null
      );
      setRunState("receipted");
    } catch {
      window.sessionStorage.removeItem(storedScenario.run.resultStorageKey);
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
        setAuthMessage(selectedScenario.ui.signInRequiredMessage);
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
  }, [selectedScenario.ui.signInRequiredMessage]);

  useEffect(() => {
    if (authState === "signed_out") {
      setAuthMessage(selectedScenario.ui.signInRequiredMessage);
    }

    if (runStatus === "idle") {
      setRunMessage(selectedScenario.ui.idleMessage);
    }
  }, [authState, runStatus, selectedScenario]);

  const projection = String(summary.projection ?? "NO LIVE DATA");
  const projectionTone = getProjectionTone(projection);
  const lifecycleOutcome = getLifecycleOutcome(lifecycleRows);
  const receiptOutcome = getReceiptOutcome(lifecycleRows);
  const latestServiceRecord = runResult?.service_record;
  const latestLifecycleRow = lifecycleRows[0] ?? watchdogRows[0] ?? null;
  const latestVisibleEventType = String(
    runResult?.event["source_event_type"] ??
      latestLifecycleRow?.source_event_type ??
      "NO SOURCE EVENT TYPE"
  );
  const latestVisibleObligation = String(
    runResult?.obligation["obligation_code"] ??
      latestLifecycleRow?.obligation_code ??
      "NO OBLIGATION LOADED"
  );
  const latestVisibleReceipt =
    String(
      runResult?.receipt["id"] ??
        latestLifecycleRow?.receipt_id ??
        latestLifecycleRow?.receipt_entity_id ??
        ""
    ) || "RECEIPT NOT EMITTED";
  const latestVisibleResolution =
    latestLifecycleRow?.resolution_type?.replaceAll("_", " ").toUpperCase() ??
    (runResult ? "RESOLVE WITH PROOF" : "NO RESOLUTION RECORDED");
  const latestProofStatus =
    latestLifecycleRow?.proof_status?.replaceAll("_", " ").toUpperCase() ??
    (runResult ? "SUFFICIENT" : "PROOF NOT VISIBLE");
  const latestLifecycleState =
    runResult?.lifecycle_state ?? latestLifecycleRow?.lifecycle_state ?? "open";
  const latestSourceSystem = String(
    runResult?.event["source_system"] ?? latestLifecycleRow?.source_system ?? "—"
  );
  const stripeIngressDetected =
    latestSourceSystem.toLowerCase().includes("stripe") ||
    latestVisibleEventType.toLowerCase().startsWith("stripe.");
  const operatorStateLabel =
    latestLifecycleState === "resolved"
      ? "RESOLVED"
      : latestLifecycleState === "failed"
      ? "FAILED"
      : latestLifecycleState === "open"
      ? "AWAITING PROOF"
      : "OPEN";
  const operatorStateTone =
    latestLifecycleState === "resolved"
      ? "resolved"
      : latestLifecycleState === "failed"
      ? "failed"
      : "open";
  const operatorHeadline =
    latestLifecycleState === "resolved"
      ? "Latest work item is proven and receipt-backed."
      : latestLifecycleState === "failed"
      ? "Latest work item is failed until valid proof is supplied."
      : latestLifecycleRow
      ? "Latest work item is still open and waiting for proof."
      : "No work item is loaded in the current projection snapshot.";
  const operatorSummary =
    latestLifecycleState === "resolved"
      ? `${latestVisibleEventType} opened ${latestVisibleObligation}, and the system emitted ${latestVisibleReceipt}.`
      : latestLifecycleState === "failed"
      ? `${latestVisibleEventType} opened ${latestVisibleObligation}, but the current truth is failed and still visible.`
      : latestLifecycleRow
      ? `${latestVisibleEventType} opened ${latestVisibleObligation}, and the system has not emitted a receipt yet.`
      : "The board is live, but no current event and obligation pair is available to summarize.";
  const missingSummary =
    latestLifecycleState === "resolved"
      ? "Nothing missing. Proof is accepted and the receipt is already emitted."
      : latestLifecycleState === "failed"
      ? "Accepted proof is missing or rejected. The failed state remains until doctrine-valid proof exists."
      : latestLifecycleRow
      ? "Accepted proof and receipt are still missing from the latest work item."
      : "A live obligation row is missing from the current projection snapshot.";
  const nextOperatorAction =
    authState !== "ready"
      ? selectedScenario.ui.signInRequiredMessage
      : latestLifecycleState === "failed"
      ? "Inspect the failed item in the system trace, then resubmit doctrine-valid proof if the work is complete."
      : latestLifecycleState === "resolved"
      ? "Review the receipt or switch scenarios to handle the next work item."
      : selectedScenario.ui.idleMessage;

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
  const missedCounter = useMemo(() => {
    const openCount = typeof summary.open === "number" ? summary.open : 0;
    const failedCount = typeof summary.failed === "number" ? summary.failed : 0;
    return openCount + failedCount;
  }, [summary.open, summary.failed]);

  const heroStats = [
    { label: "Source Events", value: summary.sourceEvents },
    { label: "Obligations", value: summary.obligations },
    { label: "Receipts", value: summary.receipts },
  ];

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const snapshotKey = "autokirk:lifecycle-obligation-ids";
    const previousRaw = window.sessionStorage.getItem(snapshotKey);
    const previousIds = new Set<string>(
      previousRaw ? (JSON.parse(previousRaw) as string[]) : []
    );
    const currentIds = lifecycleRows.map((row) => row.obligation_id);
    const freshIds = currentIds.filter((id) => !previousIds.has(id));

    window.sessionStorage.setItem(snapshotKey, JSON.stringify(currentIds));

    if (!freshIds.length) {
      return;
    }

    const next = new Set(freshIds);
    setHighlightedRowIds(next);
    const timer = window.setTimeout(() => {
      setHighlightedRowIds(new Set<string>());
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [lifecycleRows]);

  useEffect(() => {
    if (runStatus === "running") {
      setTimelinePhase(2);
      return;
    }

    if (runStatus !== "success") {
      setTimelinePhase(2);
      return;
    }

    let cancelled = false;
    setTimelinePhase(2);

    const first = window.setTimeout(() => {
      if (!cancelled) {
        setTimelinePhase(3);
      }
    }, 250);

    const second = window.setTimeout(() => {
      if (!cancelled) {
        setTimelinePhase(4);
      }
    }, 600);

    return () => {
      cancelled = true;
      window.clearTimeout(first);
      window.clearTimeout(second);
    };
  }, [runStatus]);

  const rightRail = [
    { label: "OPEN", value: summary.open },
    { label: "FAILED", value: summary.failed },
    { label: "OVERDUE", value: summary.overdue },
    { label: "RETRIES", value: summary.retries },
    { label: "PROJECTION", value: projection },
  ];
  const selectedObligationRow = useMemo(
    () =>
      lifecycleRows.find((row) => row.obligation_id === selectedObligationId) ??
      null,
    [lifecycleRows, selectedObligationId]
  );

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
        setRunState("idle");
        return;
      }

      const validationError = getProofScenarioDraftError(
        serviceRecord,
        selectedScenario
      );

      if (validationError) {
        setRunStatus("error");
        setRunMessage(validationError);
        setRunState("idle");
        return;
      }

      const serviceRecordPayload = toProofScenarioPayload(
        serviceRecord,
        selectedScenario
      );

      setRunStatus("running");
      setRunMessage(selectedScenario.ui.runningMessage);
      setRunResult(null);
      setRunState("opening");

      try {
        const response = await fetch("/api/live-proof/run", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            scenario_id: selectedScenario.id,
            ...serviceRecordPayload,
          }),
        });

        const payload = (await response.json()) as LiveProofRunResponse;

        if (!response.ok || !payload.ok) {
          throw new Error(
            toApiError(payload, `SERVICE_PROOF_REQUEST_FAILED_${response.status}`)
          );
        }

        setRunStatus("success");
        const responseScenario = getProofScenario(payload.scenario_id);
        setSelectedScenarioId(responseScenario.id);
        setRunMessage(responseScenario.ui.successMessage);
        setServiceRecord(
          toProofScenarioDraft(payload.service_record, responseScenario)
        );
        setRunResult(payload);
        setHighlightedReceipt(
          typeof payload.receipt?.id === "string" ? payload.receipt.id : null
        );
        setRunState("resolving");

        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(
            responseScenario.run.resultStorageKey,
            JSON.stringify(payload)
          );
          window.setTimeout(() => setRunState("receipted"), 300);
          window.setTimeout(() => router.reload(), 1200);
        }
      } catch (runError) {
        setRunStatus("error");
        setRunMessage(
          runError instanceof Error
            ? runError.message
            : "SERVICE_PROOF_REQUEST_FAILED"
        );
        setRunState("idle");
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
    setAuthMessage(selectedScenario.ui.signInSendingMessage);

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
    setAuthMessage(selectedScenario.ui.signInCheckEmailMessage);
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
    setRunMessage(selectedScenario.ui.idleMessage);
    setRunState("idle");
  }

  function handleScenarioSelect(nextScenarioId: ProofScenarioId) {
    if (nextScenarioId === selectedScenarioId) {
      return;
    }

    const nextScenario = getProofScenario(nextScenarioId);

    setSelectedScenarioId(nextScenario.id);
    setServiceRecord(createProofScenarioDraft(nextScenario));
    setRunResult(null);
    setRunStatus("idle");
    setRunMessage(nextScenario.ui.idleMessage);
    setRunState("idle");

    if (authState === "signed_out") {
      setAuthMessage(nextScenario.ui.signInRequiredMessage);
    }
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
            <div className="railTimestamp">
              {formatTimestamp(generatedAt, renderTimeZone)}
            </div>
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
              <div className="heroStatCard heroStatCardAlert">
                <div className="heroStatLabel">This Would Have Been Missed</div>
                <div className="heroStatValue">{formatValue(missedCounter)}</div>
              </div>
            </div>
            <div className="caughtBanner">
              {formatValue(missedCounter)} missed actions caught and forced to
              resolution
            </div>
            <section className="consequencePanel" aria-label="Before and after simulation">
              <div className="consequenceBlock consequenceBlockWithout">
                <div className="noticeLabel">Without Proof</div>
                <ul className="consequenceList">
                  <li>Obligation remains open</li>
                  <li>Marked overdue</li>
                  <li>Escalated by watchdog</li>
                </ul>
              </div>
              <div className="consequenceArrow">→</div>
              <div className="consequenceBlock consequenceBlockWith">
                <div className="noticeLabel">With AutoKirk</div>
                <ul className="consequenceList">
                  <li>Obligation created</li>
                  <li>Proof required</li>
                  <li>Receipt emitted</li>
                </ul>
              </div>
            </section>
          </header>

          <section className="proofPanel">
            <div className="proofPanelHeader">
              <div>
                <div className="sectionLabel">{selectedScenario.ui.sectionLabel}</div>
                <p className="proofCopy">{selectedScenario.ui.sectionDescription}</p>
              </div>
              <div className="proofMeta">
                {formatTimestamp(generatedAt, renderTimeZone)}
              </div>
            </div>

            <div className="scenarioSelector" aria-label="Proof scenarios">
              {enabledProofScenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  type="button"
                  className={
                    scenario.id === selectedScenarioId
                      ? "scenarioButton scenarioButtonActive"
                      : "scenarioButton"
                  }
                  onClick={() => handleScenarioSelect(scenario.id)}
                >
                  {scenario.ui.selectorLabel}
                </button>
              ))}
            </div>

            <div className="lifecycleStrip">
              <div className={timelinePhase >= 1 ? "lifecycleNode lifecycleNodeLive" : "lifecycleNode"}>
                <span className="nodeIndex">01</span>
                <span className="nodeLabel">
                  {selectedScenario.ui.lifecycleStartLabel}
                </span>
              </div>
              <div className="lifecycleConnector" />
              <div className={timelinePhase >= 2 ? "lifecycleNode lifecycleNodeLive" : "lifecycleNode"}>
                <span className="nodeIndex">02</span>
                <span className="nodeLabel">
                  {selectedScenario.ui.lifecycleOpenLabel}
                </span>
              </div>
              <div className="lifecycleConnector" />
              <div
                className={
                  timelinePhase >= 3
                    ? "lifecycleNode lifecycleNodeAccent lifecycleNodeLive"
                    : "lifecycleNode lifecycleNodeAccent"
                }
              >
                <span className="nodeIndex">03</span>
                <span className="nodeLabel">{lifecycleOutcome}</span>
              </div>
              <div className="lifecycleConnector" />
              <div
                className={
                  timelinePhase >= 4
                    ? "lifecycleNode lifecycleNodeAccent lifecycleNodeLive"
                    : "lifecycleNode lifecycleNodeAccent"
                }
              >
                <span className="nodeIndex">04</span>
                <span className="nodeLabel">{receiptOutcome}</span>
              </div>
            </div>

            <div className={`operatorSummaryCard operatorSummaryCard-${operatorStateTone}`}>
              <div className="operatorSummaryHeader">
                <div>
                  <div className="noticeLabel">Operator Answer</div>
                  <div className="operatorSummaryTitle">{operatorHeadline}</div>
                </div>
                <div className={`operatorSummaryBadge operatorSummaryBadge-${operatorStateTone}`}>
                  {operatorStateLabel}
                </div>
              </div>
              <p className="operatorSummaryText">{operatorSummary}</p>
              <div className="operatorSummaryGrid">
                <div className="operatorSummaryItem">
                  <div className="fieldLabel">What Happened</div>
                  <div className="operatorSummaryValue">
                    {latestVisibleEventType}
                    {" -> "}
                    {latestVisibleObligation}
                  </div>
                </div>
                <div className="operatorSummaryItem">
                  <div className="fieldLabel">Was It Proven</div>
                  <div className="operatorSummaryValue">
                    {latestLifecycleState === "resolved"
                      ? "Yes. Receipt emitted."
                      : latestLifecycleState === "failed"
                      ? "No. Failure remains visible."
                      : "Not yet."}
                  </div>
                </div>
                <div className="operatorSummaryItem">
                  <div className="fieldLabel">What Is Missing</div>
                  <div className="operatorSummaryValue">{missingSummary}</div>
                </div>
                <div className="operatorSummaryItem">
                  <div className="fieldLabel">Next Operator Action</div>
                  <div className="operatorSummaryValue">{nextOperatorAction}</div>
                </div>
              </div>
            </div>

            <div className="explanationPanel">
              <div className="noticeLabel">Current Proof Story</div>
              <div className="explanationGrid">
                <div className="explanationCard">
                  <div className="fieldLabel">Event</div>
                  <div className="explanationValue">{latestVisibleEventType}</div>
                  <p className="explanationCopy">
                    This is the latest source event currently visible to the board.
                  </p>
                </div>
                <div className="explanationCard">
                  <div className="fieldLabel">Obligation</div>
                  <div className="explanationValue">{latestVisibleObligation}</div>
                  <p className="explanationCopy">
                    This is the governed obligation opened from that event.
                  </p>
                </div>
                <div className="explanationCard">
                  <div className="fieldLabel">Resolution</div>
                  <div className="explanationValue">{latestVisibleResolution}</div>
                  <p className="explanationCopy">
                    Proof status: {latestProofStatus}.
                  </p>
                </div>
                <div className="explanationCard">
                  <div className="fieldLabel">Receipt</div>
                  <div className="explanationValue">{latestVisibleReceipt}</div>
                  <p className="explanationCopy">
                    {latestLifecycleState === "resolved"
                      ? "Receipt identity is present."
                      : "Receipt identity is still missing from the current work item."}
                  </p>
                </div>
              </div>
            </div>

            <div className="explanationPanel">
              <div className="noticeLabel">Live Stripe Flow</div>
              <div className="flowLine">
                <div className="flowStep">
                  <div className="fieldLabel">Stripe Event</div>
                  <div className={stripeIngressDetected ? "flowValue flowValueOn" : "flowValue"}>
                    {stripeIngressDetected ? "INGRESSED" : "NOT DETECTED"}
                  </div>
                </div>
                <div className="flowArrow">→</div>
                <div className="flowStep">
                  <div className="fieldLabel">Obligation</div>
                  <div className={latestVisibleObligation !== "NO OBLIGATION LOADED" ? "flowValue flowValueOn" : "flowValue"}>
                    {latestVisibleObligation !== "NO OBLIGATION LOADED" ? "OPENED" : "MISSING"}
                  </div>
                </div>
                <div className="flowArrow">→</div>
                <div className="flowStep">
                  <div className="fieldLabel">Proof</div>
                  <div className={latestLifecycleState === "resolved" ? "flowValue flowValueOn" : "flowValue"}>
                    {latestLifecycleState === "resolved" ? "ACCEPTED" : "REQUIRED"}
                  </div>
                </div>
                <div className="flowArrow">→</div>
                <div className="flowStep">
                  <div className="fieldLabel">Receipt</div>
                  <div className={latestLifecycleState === "resolved" ? "flowValue flowValueOn" : "flowValue"}>
                    {latestLifecycleState === "resolved" ? "EMITTED" : "PENDING"}
                  </div>
                </div>
              </div>
              <p className="explanationCopy">
                Source: {latestSourceSystem} | Event: {latestVisibleEventType}
              </p>
            </div>

            <div className="noticeStack">
              {selectedObligationRow ? (
                <div className="runResultCard">
                  <div className="noticeLabel">Obligation Verification</div>
                  <div className="runResultGrid">
                    <ResultField
                      label="OBLIGATION ID"
                      value={selectedObligationRow.obligation_id}
                    />
                    <ResultField
                      label="OBLIGATION CODE"
                      value={selectedObligationRow.obligation_code}
                    />
                    <ResultField
                      label="LIFECYCLE STATE"
                      value={selectedObligationRow.lifecycle_state.toUpperCase()}
                    />
                    <ResultField
                      label="PROOF STATUS"
                      value={(selectedObligationRow.proof_status ?? "—").toUpperCase()}
                    />
                    <ResultField
                      label="RECEIPT ID"
                      value={selectedObligationRow.receipt_id ?? "—"}
                    />
                    <ResultField
                      label="ENTITY ID"
                      value={selectedObligationRow.entity_id ?? "—"}
                    />
                  </div>
                </div>
              ) : null}

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

                <p className="operatorText">{selectedScenario.ui.operatorDescription}</p>

                <div className="operatorControls">
                  <input
                    type="email"
                    value={operatorEmail}
                    onChange={(event) => setOperatorEmail(event.target.value)}
                    className="operatorInput"
                    placeholder={selectedScenario.ui.operatorEmailPlaceholder}
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
                  <div className="noticeLabel">{selectedScenario.ui.recordEyebrow}</div>
                  <div className="runPanelTitle">{selectedScenario.ui.recordTitle}</div>
                  <p className="runPanelText">{selectedScenario.ui.recordDescription}</p>
                  <p className="runPanelText">
                    Proof submitted: <code>{selectedScenario.run.proofType}</code>.{" "}
                    {selectedScenario.ui.proofDescription}
                  </p>
                  <div className="serviceRecordGrid">
                    {selectedScenario.fields.map((fieldConfig) => {
                      const field = fieldConfig as ProofScenarioFieldConfig;

                      return field.multiline ? (
                        <ServiceRecordTextarea
                          key={field.draftKey}
                          label={field.label}
                          placeholder={field.placeholder}
                          value={getServiceDraftValue(serviceRecord, field)}
                          onChange={(value) =>
                            setServiceRecord((current) => ({
                              ...current,
                              [field.draftKey]: value,
                            }))
                          }
                          disabled={isRunning}
                        />
                      ) : (
                        <ServiceRecordInput
                          key={field.draftKey}
                          label={field.label}
                          placeholder={field.placeholder}
                          value={getServiceDraftValue(serviceRecord, field)}
                          onChange={(value) =>
                            setServiceRecord((current) => ({
                              ...current,
                              [field.draftKey]: value,
                            }))
                          }
                          disabled={isRunning}
                          fullWidth={field.fullWidth}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="runPanelAction">
                  <button
                    type="button"
                    className="proofRunButton"
                    onClick={handleRunLoop}
                    disabled={isRunning || authState !== "ready"}
                  >
                    {isRunning ? "RUNNING..." : "RUN PROOF DEMO"}
                  </button>
                  <div className="demoProgress">
                    <div className={`step ${runState !== "idle" ? "active" : ""}`}>
                      OPEN
                    </div>
                    <div
                      className={`step ${
                        runState === "resolving" || runState === "receipted"
                          ? "active"
                          : ""
                      }`}
                    >
                      RESOLVE
                    </div>
                    <div
                      className={`step ${
                        runState === "receipted" ? "active" : ""
                      }`}
                    >
                      RECEIPT
                    </div>
                  </div>
                  <div className={`runStatus runStatus-${runStatus}`}>
                    {runMessage}
                  </div>
                </div>
              </div>

              {runResult ? (
                <div className="runResultCard">
                  <div className="noticeLabel">{resultScenario.ui.resultTitle}</div>
                  <div className="runResultGrid">
                    {resultScenario.fields.map((fieldConfig) => {
                      const field = fieldConfig as ProofScenarioFieldConfig;

                      return (
                        <ResultField
                          key={field.draftKey}
                          label={field.resultLabel}
                          value={getProofScenarioResultValue(field, latestServiceRecord)}
                        />
                      );
                    })}
                    <ResultField
                      label="EVENT TYPE"
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
                      label="RECEIPT"
                      value={String(
                        runResult.receipt["id"] ?? runResult.receipt_entity_id ?? "—"
                      )}
                    />
                    <ResultField
                      label="STATE"
                      value={runResult.lifecycle_state.toUpperCase()}
                    />
                  </div>
                </div>
              ) : (
                <div className="runResultCard">
                  <div className="noticeLabel">Visible Proof On This Surface</div>
                  <p className="runPanelText">
                    Proof note and photo are only visible here after an operator
                    submission on this surface. The read model currently shows{" "}
                    {latestLifecycleState === "resolved"
                      ? "the receipt-backed state, but not the note/photo payload."
                      : latestLifecycleState === "failed"
                      ? "a failed or rejected state without accepted proof."
                      : "an unresolved item that still needs proof."}
                  </p>
                </div>
              )}

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

          <details className="traceDetails">
            <summary className="traceSummary">
              <span>View System Trace</span>
              <span className="traceSummaryMeta">
                {formatValue(summary.obligations)} obligations · {formatValue(summary.failed)} failed ·{" "}
                {formatValue(summary.receipts)} receipts
              </span>
            </summary>
            <div className="sections">
              <StreamSection
                title="Source Events"
                value={summary.sourceEvents}
                description="Latest recorded events attached to obligation truth."
                rows={sourceRows}
                timeZone={renderTimeZone}
                highlightedRowIds={highlightedRowIds}
                highlightedReceipt={highlightedReceipt}
                selectedObligationId={selectedObligationId}
                onSelectObligation={(row) => setSelectedObligationId(row.obligation_id)}
              />
              <StreamSection
                title="Obligations"
                value={summary.obligations}
                description="Open and recent obligations in the projection stream."
                rows={obligationRows}
                timeZone={renderTimeZone}
                highlightedRowIds={highlightedRowIds}
                highlightedReceipt={highlightedReceipt}
                selectedObligationId={selectedObligationId}
                onSelectObligation={(row) => setSelectedObligationId(row.obligation_id)}
              />
              <StreamSection
                title="Receipts"
                value={summary.receipts}
                description="Receipt-backed lifecycle proofs emitted by the system."
                rows={receiptRows}
                timeZone={renderTimeZone}
                highlightedRowIds={highlightedRowIds}
                highlightedReceipt={highlightedReceipt}
                selectedObligationId={selectedObligationId}
                onSelectObligation={(row) => setSelectedObligationId(row.obligation_id)}
              />
              <StreamSection
                title="Failed"
                value={summary.failed}
                description="Failure states remain visible until doctrine-valid proof exists."
                rows={failedRows}
                timeZone={renderTimeZone}
                highlightedRowIds={highlightedRowIds}
                highlightedReceipt={highlightedReceipt}
                selectedObligationId={selectedObligationId}
                onSelectObligation={(row) => setSelectedObligationId(row.obligation_id)}
              />
              <StreamSection
                title="Overdue"
                value={summary.overdue}
                description="Watchdog rows surfaced from the overdue failure read model."
                rows={overdueRows}
                timeZone={renderTimeZone}
                highlightedRowIds={highlightedRowIds}
                highlightedReceipt={highlightedReceipt}
                selectedObligationId={selectedObligationId}
                onSelectObligation={(row) => setSelectedObligationId(row.obligation_id)}
              />
              <StreamSection
                title="Projection Status"
                value={projection}
                description="Current projection health with unresolved or receipt-absent rows."
                rows={projectionRows}
                timeZone={renderTimeZone}
                highlightedRowIds={highlightedRowIds}
                highlightedReceipt={highlightedReceipt}
                selectedObligationId={selectedObligationId}
                onSelectObligation={(row) => setSelectedObligationId(row.obligation_id)}
              />
            </div>
          </details>
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
          --bg-0: #06131b;
          --bg-1: #0b1f2a;
          --panel-0: rgba(8, 25, 35, 0.94);
          --panel-1: rgba(6, 18, 26, 0.94);
          --line: rgba(115, 210, 255, 0.16);
          --line-strong: rgba(115, 210, 255, 0.32);
          --text: #e8f6ff;
          --text-muted: #9dc1d2;
          --accent: #5fd0ff;
          --accent-strong: #21b7f3;
          --warning: #ffcc66;
          --fail: #ff8e8e;
          --ok: #7bf0ad;
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at top left, rgba(95, 208, 255, 0.18), transparent 34%),
            radial-gradient(circle at 85% 0%, rgba(58, 176, 224, 0.12), transparent 26%),
            linear-gradient(180deg, var(--bg-0) 0%, var(--bg-1) 58%, #081923 100%);
          color: var(--text);
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
          background: #3bb7e8;
        }

        .ambientGlowRight {
          top: 14rem;
          right: -14rem;
          background: #1a6f94;
        }

        .frame {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr);
          grid-template-areas:
            "left workspace"
            "right workspace";
          gap: 24px;
          padding: 24px;
          max-width: 1560px;
          margin: 0 auto;
        }

        .leftRail,
        .heroPanel,
        .proofPanel,
        .streamSection,
        .statusCard {
          border: 1px solid var(--line);
          background:
            linear-gradient(180deg, var(--panel-0), var(--panel-1));
          box-shadow:
            inset 0 1px 0 rgba(200, 241, 255, 0.06),
            0 18px 60px rgba(1, 11, 18, 0.38);
        }

        .leftRail {
          grid-area: left;
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
          color: var(--accent);
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
          color: var(--text-muted);
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
          border: 1px solid var(--line);
          background: rgba(38, 132, 171, 0.16);
          color: var(--text);
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
          background: var(--accent);
          box-shadow: 0 0 18px rgba(95, 208, 255, 0.6);
        }

        .workspace {
          grid-area: workspace;
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
          color: #eefaff;
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
          border: 1px solid var(--line-strong);
          background: rgba(33, 183, 243, 0.12);
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
          color: var(--ok);
        }

        .projectionFailing {
          color: var(--fail);
        }

        .projectionOffline {
          color: var(--warning);
        }

        @keyframes nodePulse {
          0% {
            transform: translateY(2px);
            opacity: 0.76;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes recordReveal {
          0% {
            transform: translateY(4px);
            opacity: 0.7;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes flashIn {
          0% {
            background: rgba(245, 185, 95, 0.35);
            transform: scale(1.02);
          }
          100% {
            background: transparent;
            transform: scale(1);
          }
        }

        .heroStats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .heroStatCard {
          padding: 18px;
          border-radius: 20px;
          border: 1px solid var(--line);
          background: linear-gradient(180deg, rgba(95, 208, 255, 0.14), rgba(95, 208, 255, 0.04));
        }

        .heroStatCardAlert {
          border-color: rgba(255, 204, 102, 0.52);
          background: linear-gradient(180deg, rgba(255, 204, 102, 0.24), rgba(255, 204, 102, 0.08));
        }

        .caughtBanner {
          margin: 20px 0;
          padding: 16px;
          border-radius: 12px;
          background: rgba(95, 208, 255, 0.15);
          border: 1px solid rgba(95, 208, 255, 0.45);
          font-weight: 700;
          text-align: center;
        }

        .consequencePanel {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 14px;
          align-items: stretch;
        }

        .consequenceBlock {
          border-radius: 16px;
          padding: 16px;
          border: 1px solid var(--line);
          background: rgba(5, 24, 36, 0.55);
        }

        .consequenceBlockWithout {
          border-color: rgba(255, 142, 142, 0.35);
          background: rgba(60, 14, 14, 0.3);
        }

        .consequenceBlockWith {
          border-color: rgba(123, 240, 173, 0.35);
          background: rgba(8, 52, 35, 0.36);
        }

        .consequenceList {
          margin: 10px 0 0;
          padding-left: 18px;
          display: grid;
          gap: 8px;
          color: var(--text);
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .consequenceArrow {
          align-self: center;
          color: var(--accent);
          font-size: 28px;
          font-weight: 800;
          line-height: 1;
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

        .scenarioSelector {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .scenarioButton {
          padding: 11px 16px;
          border: 1px solid var(--line);
          border-radius: 999px;
          background: rgba(95, 208, 255, 0.08);
          color: var(--text-muted);
          font-family:
            "IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono",
            Menlo, monospace;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          transition:
            border-color 140ms ease,
            background 140ms ease,
            color 140ms ease;
        }

        .scenarioButton:hover {
          border-color: var(--line-strong);
          color: var(--text);
        }

        .scenarioButtonActive {
          border-color: var(--line-strong);
          background:
            linear-gradient(180deg, rgba(95, 208, 255, 0.28), rgba(95, 208, 255, 0.12));
          color: var(--text);
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

        .lifecycleNodeLive {
          animation: nodePulse 440ms ease-out;
          border-color: rgba(245, 185, 95, 0.52);
          box-shadow: 0 0 0 1px rgba(245, 185, 95, 0.18) inset;
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

        .operatorSummaryCard,
        .explanationPanel {
          padding: 18px;
          border-radius: 20px;
          border: 1px solid rgba(212, 175, 55, 0.12);
          background:
            linear-gradient(180deg, rgba(212, 175, 55, 0.1), rgba(12, 10, 7, 0.7));
          display: grid;
          gap: 14px;
        }

        .operatorSummaryCard-resolved {
          border-color: rgba(135, 211, 143, 0.22);
        }

        .operatorSummaryCard-failed {
          border-color: rgba(245, 155, 125, 0.22);
        }

        .operatorSummaryCard-open {
          border-color: rgba(212, 175, 55, 0.2);
        }

        .operatorSummaryHeader {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: start;
          flex-wrap: wrap;
        }

        .operatorSummaryTitle {
          color: #fff2cf;
          font-size: clamp(1.35rem, 3.3vw, 2rem);
          line-height: 1.1;
        }

        .operatorSummaryText,
        .explanationCopy {
          margin: 0;
          color: #d6c59c;
          font-size: 14px;
          line-height: 1.7;
        }

        .operatorSummaryBadge {
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid rgba(212, 175, 55, 0.18);
          font-family:
            "IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono",
            Menlo, monospace;
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .operatorSummaryBadge-resolved {
          color: #87d38f;
        }

        .operatorSummaryBadge-failed {
          color: #f59b7d;
        }

        .operatorSummaryBadge-open {
          color: #edcb72;
        }

        .operatorSummaryGrid,
        .explanationGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .flowLine {
          display: grid;
          grid-template-columns: 1fr auto 1fr auto 1fr auto 1fr;
          gap: 10px;
          align-items: center;
        }

        .flowStep {
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 10px;
          background: rgba(5, 5, 4, 0.5);
        }

        .flowValue {
          margin-top: 6px;
          color: var(--warning);
          font-family:
            "IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono",
            Menlo, monospace;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .flowValueOn {
          color: var(--ok);
        }

        .flowArrow {
          color: var(--accent);
          font-size: 18px;
          font-weight: 800;
        }

        .operatorSummaryItem,
        .explanationCard {
          display: grid;
          gap: 8px;
          min-width: 0;
          padding: 14px;
          border-radius: 16px;
          border: 1px solid rgba(212, 175, 55, 0.1);
          background: rgba(5, 5, 4, 0.5);
        }

        .operatorSummaryValue,
        .explanationValue {
          color: #fff0c7;
          font-family:
            "IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono",
            Menlo, monospace;
          font-size: 12px;
          line-height: 1.7;
          overflow-wrap: anywhere;
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
          align-items: start;
          background:
            linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(212, 175, 55, 0.03)),
            rgba(212, 175, 55, 0.04);
        }

        .runPanelCopy {
          display: grid;
          gap: 12px;
          max-width: 720px;
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

        .runPanelText code {
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(212, 175, 55, 0.12);
          color: #f7edcf;
          font-family:
            "IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono",
            Menlo, monospace;
          font-size: 12px;
        }

        .serviceRecordGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .serviceField {
          display: grid;
          gap: 8px;
          min-width: 0;
        }

        .serviceFieldFull {
          grid-column: 1 / -1;
        }

        .serviceInput,
        .serviceTextarea {
          width: 100%;
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

        .serviceTextarea {
          min-height: 108px;
          resize: vertical;
        }

        .serviceInput::placeholder,
        .serviceTextarea::placeholder {
          color: #8e7d54;
        }

        .serviceInput:disabled,
        .serviceTextarea:disabled {
          opacity: 0.72;
        }

        .runPanelAction {
          min-width: 280px;
          display: grid;
          gap: 10px;
          justify-items: end;
        }

        .proofRunButton {
          margin-top: 20px;
          padding: 14px 20px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(180deg, #84defd, #21b7f3);
          color: #052031;
          font-weight: 800;
          cursor: pointer;
        }

        .proofRunButton:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .demoProgress {
          display: flex;
          gap: 10px;
          margin-top: 14px;
          width: 100%;
        }

        .step {
          flex: 1;
          padding: 8px;
          text-align: center;
          border-radius: 8px;
          background: #222;
          opacity: 0.4;
          font-size: 12px;
        }

        .step.active {
          background: linear-gradient(180deg, #84defd, #21b7f3);
          color: #052031;
          opacity: 1;
          transition: all 0.3s ease;
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

        .traceDetails {
          border: 1px solid var(--line);
          border-radius: 24px;
          background:
            linear-gradient(180deg, var(--panel-0), var(--panel-1));
          box-shadow:
            inset 0 1px 0 rgba(255, 245, 215, 0.04),
            0 18px 60px rgba(0, 0, 0, 0.28);
          overflow: hidden;
        }

        .traceSummary {
          list-style: none;
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: center;
          padding: 20px 24px;
          cursor: pointer;
          color: #fff0c7;
          font-family:
            "IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono",
            Menlo, monospace;
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .traceSummary::-webkit-details-marker {
          display: none;
        }

        .traceSummaryMeta {
          color: #bca871;
          font-size: 11px;
          letter-spacing: 0.08em;
        }

        .traceDetails .sections {
          padding: 0 0 24px;
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

        .record[role="button"] {
          cursor: pointer;
        }

        .recordHighlight {
          border-color: rgba(245, 185, 95, 0.45);
          box-shadow:
            0 0 0 1px rgba(245, 185, 95, 0.16) inset,
            0 0 24px rgba(245, 185, 95, 0.16);
          animation: recordReveal 700ms ease-out;
        }

        .recordSelected {
          border-color: rgba(95, 208, 255, 0.65);
          box-shadow:
            0 0 0 1px rgba(95, 208, 255, 0.3) inset,
            0 0 22px rgba(95, 208, 255, 0.24);
        }

        .rowHighlight {
          animation: flashIn 1.2s ease-out;
          border: 1px solid #f5b95f;
          box-shadow: 0 0 18px rgba(245, 185, 95, 0.45);
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
          grid-area: right;
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
            grid-template-areas:
              "left"
              "workspace"
              "right";
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
          .consequencePanel,
          .operatorSummaryGrid,
          .explanationGrid,
          .flowLine,
          .fieldGrid,
          .runResultGrid,
          .serviceRecordGrid,
          .navList,
          .statusStack,
          .lifecycleStrip {
            grid-template-columns: 1fr;
          }

          .serviceFieldFull {
            grid-column: auto;
          }

          .lifecycleConnector {
            width: 1px;
            height: 20px;
            justify-self: center;
          }

          .heroTop,
          .operatorSummaryHeader,
          .operatorHeader,
          .runPanel,
          .streamHeader,
          .proofPanelHeader,
          .traceSummary {
            flex-direction: column;
          }

          .runPanelAction {
            min-width: 0;
            width: 100%;
            justify-items: stretch;
          }

          .proofRunButton,
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
