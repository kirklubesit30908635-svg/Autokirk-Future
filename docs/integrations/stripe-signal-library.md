# AUTOKIRK — STRIPE SIGNAL LIBRARY
# Phase 6A — Integration Surface
# File: docs/integrations/stripe-signal-library.md
# Status: ACTIVE INTEGRATION
# Last updated: 2026-05-06

---

## Integration: Stripe

Source:          Stripe webhook delivery (events.stripe.com → AutoKirk ingress)
Ingress path:    supabase/functions/stripe-webhook/ (canonical single ingress)
                 Secondary projection: /api/intake/commit (for staged signals)
Idempotency:     Stripe event ID (e.g., evt_1Xxx...) used as p_source_event_key
Replay-safety:   Duplicate Stripe event IDs rejected by kernel idempotency_key
                 constraint on ledger.events. Replays produce no-op.
Auth:            Stripe-Signature header verified against STRIPE_WEBHOOK_SECRET
                 env var using Stripe SDK constructEvent(). Reject on mismatch.

---

## Event → Obligation Mapping

---

### payment_intent.succeeded

AutoKirk signal_type:   payment.succeeded
Obligation code:        payment_succeeded
Proof contract:         See PROOF_CONTRACTS_BY_OBLIGATION_CODE.md § payment_succeeded
Auto-commit:            YES — payment fact is system-authoritative. No operator
                        staging required. Kernel opens obligation immediately.
Due window:             4 hours from event timestamp

Payload extraction:
  p_source_event_key:   event.id                          (Stripe event ID)
  p_source_event_type:  "payment_intent.succeeded"
  p_source_system:      "stripe"
  p_obligation_code:    "payment_succeeded"
  p_occurred_at:        event.created (Unix → timestamptz)
  p_payload:
    payment_intent_id:  event.data.object.id
    amount_received:    event.data.object.amount_received
    currency:           event.data.object.currency
    customer_id:        event.data.object.customer
    description:        event.data.object.description
    metadata:           event.data.object.metadata

Commit condition:
  Auto-commit. Call api.ingest_event_to_obligation() directly from webhook handler.

Notes:
  - If metadata contains service_obligation: true, also open fulfill_promised_service
    in the same transaction. One payment can produce two obligations.
  - If payment_intent is attached to a subscription, check for active
    subscription_upcoming obligation for this customer and resolve it as
    'system_handled' if present.

---

### payment_intent.payment_failed

AutoKirk signal_type:   payment.failed
Obligation code:        (none — does not open obligation)
Auto-commit:            NO
Due window:             N/A

Payload extraction:
  N/A — informational only at intake

Commit condition:
  Does not open a new obligation. May be used as evidence to update
  an existing open payment obligation to failed status in a future
  obligation code (payment_collection_required). Not yet registered.

Notes:
  Log the event for audit purposes. Do not discard. Stage in ingest schema
  for future obligation code registration.

---

### customer.subscription.created

AutoKirk signal_type:   subscription.activated
Obligation code:        fulfill_promised_service
Proof contract:         See PROOF_CONTRACTS_BY_OBLIGATION_CODE.md § fulfill_promised_service
Auto-commit:            YES — subscription creation is a service promise.
Due window:             48 hours (or per service metadata)

Payload extraction:
  p_source_event_key:   event.id
  p_source_event_type:  "customer.subscription.created"
  p_source_system:      "stripe"
  p_obligation_code:    "fulfill_promised_service"
  p_occurred_at:        event.created (Unix → timestamptz)
  p_payload:
    subscription_id:    event.data.object.id
    customer_id:        event.data.object.customer
    plan_id:            event.data.object.items.data[0].price.id
    status:             event.data.object.status
    current_period_end: event.data.object.current_period_end (Unix → timestamptz)
    metadata:           event.data.object.metadata

Commit condition:
  Auto-commit only if subscription.status = 'active'. If status = 'trialing',
  stage and do not open obligation until trial converts.

Notes:
  Idempotency key = subscription_id. One active obligation per subscription at a time.

---

### customer.subscription.updated

AutoKirk signal_type:   subscription.renewal_approaching
Obligation code:        subscription_upcoming
Proof contract:         See PROOF_CONTRACTS_BY_OBLIGATION_CODE.md § subscription_upcoming
Auto-commit:            CONDITIONAL — only when days_until_due threshold is met
Due window:             Subscription renewal date (current_period_end)

Payload extraction:
  p_source_event_key:   event.id
  p_source_event_type:  "customer.subscription.updated"
  p_source_system:      "stripe"
  p_obligation_code:    "subscription_upcoming"
  p_occurred_at:        event.created (Unix → timestamptz)
  p_payload:
    subscription_id:    event.data.object.id
    customer_id:        event.data.object.customer
    current_period_end: event.data.object.current_period_end (Unix → timestamptz)
    cancel_at_period_end: event.data.object.cancel_at_period_end
    days_until_renewal: computed: (current_period_end - now) / 86400

Commit condition:
  Open obligation only when days_until_renewal <= 7.
  If days_until_renewal > 7, receive event but do not commit.

Notes:
  - Idempotency key = subscription_id + billing_period (current_period_end).
    Prevents duplicate obligations across multiple update events in one period.
  - If cancel_at_period_end = true, obligation purpose shifts to
    'confirm cancellation or reverse'. Proof contract still applies.

---

### customer.subscription.deleted

AutoKirk signal_type:   subscription.cancelled
Obligation code:        (none — terminal event, closes active obligations)
Auto-commit:            YES — system fact
Due window:             N/A

Payload extraction:
  N/A for new obligation. Resolve any open subscription_upcoming or
  fulfill_promised_service obligations for this subscription_id as
  'system_handled' or 'customer_cancellation' per proof contract.

Commit condition:
  Lookup open obligations by subscription_id in metadata.
  Resolve each via api.resolve_with_proof() with system actor.

Notes:
  This is a terminal event. It should close, not open.
  Do not stage. Execute resolution synchronously in webhook handler.

---

### invoice.payment_succeeded

AutoKirk signal_type:   payment.invoice_settled
Obligation code:        (none — currently informational)
Auto-commit:            NO
Due window:             N/A

Notes:
  Invoice settlement confirms a payment already captured by
  payment_intent.succeeded. Do not double-count. Stage event for audit.
  Future: if invoice lifecycle obligations are added, this will become
  a resolution trigger for invoice_review obligation code.

---

### invoice.payment_failed

AutoKirk signal_type:   payment.invoice_failed
Obligation code:        (none — currently informational)
Auto-commit:            NO
Due window:             N/A

Notes:
  Stage for audit. Future obligation code: payment_collection_required.
  Not yet registered. Do not open unclassified obligations on this event —
  drop it cleanly with a logged no-op.

---

### checkout.session.completed

AutoKirk signal_type:   payment.checkout_completed
Obligation code:        fulfill_promised_service
Proof contract:         See PROOF_CONTRACTS_BY_OBLIGATION_CODE.md § fulfill_promised_service
Auto-commit:            CONDITIONAL — only if mode = 'payment' (not subscription)
                        Subscription checkouts are handled by customer.subscription.created
Due window:             48 hours

Payload extraction:
  p_source_event_key:   event.id
  p_source_event_type:  "checkout.session.completed"
  p_source_system:      "stripe"
  p_obligation_code:    "fulfill_promised_service"
  p_occurred_at:        event.created (Unix → timestamptz)
  p_payload:
    session_id:         event.data.object.id
    payment_intent_id:  event.data.object.payment_intent
    customer_id:        event.data.object.customer
    amount_total:       event.data.object.amount_total
    currency:           event.data.object.currency
    mode:               event.data.object.mode
    metadata:           event.data.object.metadata

Commit condition:
  Auto-commit only when event.data.object.mode = 'payment'.
  If mode = 'subscription', do not commit — subscription.created will fire.

Notes:
  Idempotency key = session_id. Deduplicated against any payment_intent.succeeded
  obligation that may open from the same underlying payment.

---

## Events That Do Not Open Obligations

| Event | Reason |
|---|---|
| customer.created | No obligation until a payment or subscription exists |
| customer.updated | Administrative — no enforcement consequence |
| payment_method.attached | Infrastructure — no obligation |
| invoice.created | Invoice lifecycle not yet in obligation library |
| invoice.finalized | Informational — tracked in payment flow |
| charge.succeeded | Captured by payment_intent.succeeded — not double-counted |
| charge.failed | Informational — no current obligation code |
| radar.early_fraud_warning.created | Fraud signal — stage only, no current code |

All events not in the mapping table above are received and discarded with a
200 OK to Stripe. They must never produce unclassified obligations.
Implement an explicit allowlist in the webhook handler — reject unknown event
types at the handler level before any kernel call.

---

## Integration Configuration

Required setup in Stripe Dashboard:
  1. Create webhook endpoint pointing to:
       https://autokirk.com/api/integrations/stripe-webhook
       (or the canonical supabase function URL if routing through Edge Functions)
  2. Enable the following event types:
       payment_intent.succeeded
       payment_intent.payment_failed
       customer.subscription.created
       customer.subscription.updated
       customer.subscription.deleted
       invoice.payment_succeeded
       invoice.payment_failed
       checkout.session.completed
  3. Copy the webhook signing secret to Vercel environment

Environment variables required in Vercel:
  STRIPE_SECRET_KEY              — Stripe API key (server-side only)
  STRIPE_WEBHOOK_SECRET          — Webhook signing secret from Stripe Dashboard
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY — Client-safe publishable key (if needed)

---

## Adding New Event Mappings from Stripe

Before adding a new Stripe event to this library:
  1. Add the proof contract entry to PROOF_CONTRACTS_BY_OBLIGATION_CODE.md
  2. Add the obligation code to kernel.open_obligation_internal() classification
  3. Add the signal_type to the intake validation allowlist
  4. Add the event type to the Stripe webhook endpoint in Dashboard
  5. Add an assertion to the proof harness verify scripts
  6. Run npm run prove — all 5 markers must pass
  7. Add the event to this library
  8. Update the webhook handler allowlist

---

## Replay Safety Notes

Stripe may deliver any event more than once.
The kernel defends against this at two layers:

  Layer 1 — Idempotency key constraint on ledger.events:
    Each event is keyed by Stripe event ID (evt_...).
    Duplicate delivery produces a constraint conflict → no-op.
    Kernel truth is not double-written.

  Layer 2 — api.create_watchdog_emission() conflict guard:
    ON CONFLICT (obligation_id, delivery_target) DO NOTHING.
    Duplicate watchdog emissions for the same obligation are idempotent.

Never remove either layer. Never implement a "first one wins" approach
without the kernel-layer constraint as the final guard.
