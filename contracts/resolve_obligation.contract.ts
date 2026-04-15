export const resolveObligationContract = {
  rpc: "api.command_resolve_obligation",

  invariants: [
    "obligation transitions to terminal state",
    "exactly one ledger event emitted",
    "exactly one receipt emitted",
    "receipt references obligation_id",
    "receipt references event_id",
    "idempotent replay produces no additional event or receipt"
  ],

  verify: {
    script: "scripts/verify_obligation_transition_runtime.ts"
  },

  expected: {
    event_count: 1,
    receipt_count: 1,
    terminal_state: true,
    idempotent_replay: true
  },

  failure_modes: [
    "multiple events emitted",
    "missing receipt",
    "receipt not linked to obligation",
    "receipt not linked to event",
    "non-idempotent replay"
  ]
} as const;
