# AUTOKIRK — STRIPE SIGNAL LIBRARY
# Phase 6A — Integration Surface
# File: docs/integrations/stripe-signal-library.md
# Status: ACTIVE INTEGRATION
# Last updated: 2026-05-11

---

## Integration: Stripe

Source:          Stripe webhook delivery (events.stripe.com → AutoKirk ingress)  
Ingress path:    supabase/functions/stripe-webhook/ (canonical single ingress)  
Secondary path:  /api/intake/commit (for staged/manual signals only)  
Idempotency:     Stripe event ID (e.g., evt_1Xxx...) used as p_source_event_key  
Replay-safety:   Duplicate Stripe event IDs rejected by kernel idempotency_key
                 constraint on ledger.events. Replays produce no-op.  
Auth:            Stripe-Signature header verified against STRIPE_WEBHOOK_SECRET
                 env var using Stripe SDK constructEvent(). Reject on mismatch
                 before any kernel call.

---

## Core Doctrine

Stripe events are source facts.

They should not automatically become obligations unless something remains:

- owed
- provable
- resolvable
- contractually meaningful
- operationally actionable

AutoKirk must not become a Stripe event mirror.

The valid lifecycle is:

Stripe source fact -> classified signal -> governed obligation or governed resolution -> receipt

A Stripe event may do one of four things:

1. Open a governed obligation
2. Resolve an existing governed obligation
3. Stage an informational signal for audit or future classification
4. No-op cleanly with audit logging

Unknown or unmapped Stripe events must never create unclassified obligations.

---

## Event → Obligation / Resolution Mapping

---

### payment_intent.succeeded

AutoKirk signal_type:   payment.succeeded  
Primary obligation:     none by default — Stripe payment success is a source fact  
Possible obligation:    fulfill_promised_service  
Possible resolution:    subscription_upcoming  
Auto-commit:            CONDITIONAL — only when the payment creates or resolves
                        a governed obligation  
Due window:             48 hours if fulfill_promised_service is opened

Payload extraction:

    p_source_event_key:   event.id                          (Stripe event ID)
    p_source_event_type:  "payment_intent.succeeded"
    p_source_system:      "stripe"
    p_occurred_at:        event.created (Unix -> timestamptz)
    p_payload:
      payment_intent_id:  event.data.object.id
      amount_received:    event.data.object.amount_received
      currency:           event.data.object.currency
      customer_id:        event.data.object.customer
      description:        event.data.object.description
      metadata:           event.data.object.metadata

Commit condition:

`payment_intent.succeeded` is an authoritative Stripe payment fact.

It does not open a `payment_succeeded` obligation merely to prove Stripe was paid.

It may open `fulfill_promised_service` only when the payment creates a service-delivery obligation, for example:

    metadata.service_obligation = true

When opened:

    p_obligation_code: "fulfill_promised_service"

Resolution condition:

If the `payment_intent` is attached to a subscription or customer with an open `subscription_upcoming` obligation for the matching billing period, resolve that obligation through `api.resolve_with_proof()` as `system_handled`.

Notes:

- Do not create a standalone `payment_succeeded` obligation unless a proof contract defines an actual post-payment duty.
- If a future obligation is needed for internal payment handling, prefer a semantically accurate code such as `payment_operationalization_required`.
- Never double-count this event with `invoice.payment_succeeded`, `charge.succeeded`, or `checkout.session.completed`.

---

### payment_intent.payment_failed

AutoKirk signal_type:   payment.failed  
Obligation code:        none — does not open obligation  
Auto-commit:            NO  
Due window:             N/A

Payload extraction:

N/A — informational only at intake.

Commit condition:

Does not open a new obligation.

May be used as evidence to update an existing open payment obligation to failed status in a future obligation code such as `payment_collection_required`.

Notes:

- Log the event for audit purposes.
- Do not discard.
- Stage in ingest schema for future obligation code registration.
- Until `payment_collection_required` is registered with a proof contract, this event must not open an obligation.

---

### customer.subscription.created

AutoKirk signal_type:   subscription.activated  
Obligation code:        fulfill_promised_service  
Proof contract:         See `PROOF_CONTRACTS_BY_OBLIGATION_CODE.md` § `fulfill_promised_service`  
Auto-commit:            CONDITIONAL — active subscriptions only  
Due window:             48 hours, or per service metadata

Payload extraction:

    p_source_event_key:   event.id
    p_source_event_type:  "customer.subscription.created"
    p_source_system:      "stripe"
    p_obligation_code:    "fulfill_promised_service"
    p_occurred_at:        event.created (Unix -> timestamptz)
    p_payload:
      subscription_id:    event.data.object.id
      customer_id:        event.data.object.customer
      plan_id:            event.data.object.items.data[0].price.id
      status:             event.data.object.status
      current_period_end: event.data.object.current_period_end (Unix -> timestamptz)
      metadata:           event.data.object.metadata

Commit condition:

Open `fulfill_promised_service` only when:

    subscription.status = "active"

If:

    subscription.status = "trialing"

stage the event and do not open the obligation until trial conversion or active subscription confirmation.

Notes:

- Subscription creation is a service promise only once the subscription is active.
- Idempotency key should be based on `subscription_id + service_period`.
- There should be only one active service-fulfillment obligation per subscription period unless policy explicitly allows multiple scoped obligations.

---

### customer.subscription.updated

AutoKirk signal_type:   subscription.renewal_approaching  
Obligation code:        subscription_upcoming  
Proof contract:         See `PROOF_CONTRACTS_BY_OBLIGATION_CODE.md` § `subscription_upcoming`  
Auto-commit:            CONDITIONAL — only when renewal threshold is met  
Due window:             subscription renewal date, `current_period_end`

Payload extraction:

    p_source_event_key:      event.id
    p_source_event_type:     "customer.subscription.updated"
    p_source_system:         "stripe"
    p_obligation_code:       "subscription_upcoming"
    p_occurred_at:           event.created (Unix -> timestamptz)
    p_payload:
      subscription_id:       event.data.object.id
      customer_id:           event.data.object.customer
      current_period_end:    event.data.object.current_period_end (Unix -> timestamptz)
      cancel_at_period_end:  event.data.object.cancel_at_period_end
      days_until_renewal:    computed: (current_period_end - now) / 86400

Commit condition:

Open `subscription_upcoming` only when:

    days_until_renewal <= 7

If:

    days_until_renewal > 7

receive and log the event, but do not commit an obligation.

Notes:

- Idempotency key should be based on `subscription_id + current_period_end`.
- This prevents duplicate obligations across multiple update events in one billing period.
- If `cancel_at_period_end = true`, obligation purpose shifts to cancellation confirmation or reversal handling.
- The proof contract still applies.

---

### customer.subscription.deleted

AutoKirk signal_type:   subscription.cancelled  
Obligation code:        none — terminal event, closes active obligations  
Auto-commit:            YES — system fact  
Due window:             N/A

Payload extraction:

N/A for new obligation.

Commit condition:

This event closes or resolves existing obligations. It does not open a new one.

Lookup open obligations by `subscription_id` in obligation metadata, including:

- `subscription_upcoming`
- `fulfill_promised_service`

Resolve matching obligations through `api.resolve_with_proof()` with a system actor and appropriate resolution reason:

    system_handled
    customer_cancellation

Notes:

- This is a terminal Stripe lifecycle event.
- It should close, not open.
- Do not stage as pending work.
- Execute governed resolution synchronously in the webhook handler.

---

### invoice.payment_succeeded

AutoKirk signal_type:   payment.invoice_settled  
Obligation code:        none — currently informational  
Auto-commit:            NO  
Due window:             N/A

Commit condition:

Informational only.

Stage for audit.

Notes:

- Invoice settlement usually confirms payment already captured by `payment_intent.succeeded`.
- Do not double-count.
- Future: if invoice lifecycle obligations are added, this may become a resolution trigger for `invoice_review` or `invoice_settlement_required`.

---

### invoice.payment_failed

AutoKirk signal_type:   payment.invoice_failed  
Obligation code:        none — currently informational  
Auto-commit:            NO  
Due window:             N/A

Commit condition:

Informational only.

Stage for audit.

Notes:

- Future obligation code candidate: `payment_collection_required`.
- Not yet registered.
- Do not open unclassified obligations on this event.
- No-op cleanly with logging.

---

### checkout.session.completed

AutoKirk signal_type:   payment.checkout_completed  
Obligation code:        fulfill_promised_service  
Proof contract:         See `PROOF_CONTRACTS_BY_OBLIGATION_CODE.md` § `fulfill_promised_service`  
Auto-commit:            CONDITIONAL — only if mode = `payment` and service delivery is owed  
Due window:             48 hours

Payload extraction:

    p_source_event_key:   event.id
    p_source_event_type:  "checkout.session.completed"
    p_source_system:      "stripe"
    p_obligation_code:    "fulfill_promised_service"
    p_occurred_at:        event.created (Unix -> timestamptz)
    p_payload:
      session_id:         event.data.object.id
      payment_intent_id:  event.data.object.payment_intent
      customer_id:        event.data.object.customer
      amount_total:       event.data.object.amount_total
      currency:           event.data.object.currency
      mode:               event.data.object.mode
      metadata:           event.data.object.metadata

Commit condition:

Open `fulfill_promised_service` only when:

    event.data.object.mode = "payment"

and the checkout session creates a service-delivery obligation.

If:

    event.data.object.mode = "subscription"

do not commit. Subscription checkouts are handled by `customer.subscription.created`.

Notes:

- Idempotency key should be based on `session_id`.
- Also deduplicate against any service obligation opened from the same underlying `payment_intent.succeeded`.
- Do not create two service obligations for one purchase.

---

## Events That Do Not Open Obligations

| Event | Reason |
|---|---|
| `customer.created` | No obligation until payment, subscription, or service promise exists |
| `customer.updated` | Administrative — no enforcement consequence |
| `payment_method.attached` | Infrastructure — no obligation |
| `invoice.created` | Invoice lifecycle not yet in obligation library |
| `invoice.finalized` | Informational — tracked in payment flow |
| `invoice.payment_succeeded` | Informational unless future invoice obligation exists |
| `invoice.payment_failed` | Informational until `payment_collection_required` is registered |
| `charge.succeeded` | Captured by `payment_intent.succeeded` — do not double-count |
| `charge.failed` | Informational — no current obligation code |
| `radar.early_fraud_warning.created` | Fraud signal — stage only, no current obligation code |

All events not explicitly mapped above are received and acknowledged with `200 OK` to Stripe after signature verification and audit logging.

They must never produce unclassified obligations.

The webhook handler must implement an explicit allowlist and reject unknown event types before any kernel call.

---

## Integration Configuration

Required setup in Stripe Dashboard:

1. Create webhook endpoint pointing to:

    https://autokirk.com/api/integrations/stripe-webhook

or the canonical Supabase Edge Function URL if routing directly through Edge Functions.

2. Enable the following event types:

    payment_intent.succeeded
    payment_intent.payment_failed
    customer.subscription.created
    customer.subscription.updated
    customer.subscription.deleted
    invoice.payment_succeeded
    invoice.payment_failed
    checkout.session.completed

3. Copy the webhook signing secret to the deployment environment.

Environment variables required:

    STRIPE_SECRET_KEY
    STRIPE_WEBHOOK_SECRET
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

Notes:

- `STRIPE_SECRET_KEY` is server-side only.
- `STRIPE_WEBHOOK_SECRET` is server-side only.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is client-safe only if client Stripe flows are used.

---

## Adding New Event Mappings from Stripe

Before adding a new Stripe event to this library:

1. Add or confirm the proof contract entry in `PROOF_CONTRACTS_BY_OBLIGATION_CODE.md`
2. Add or confirm the obligation code in kernel classification
3. Add the `signal_type` to the intake validation allowlist
4. Add the Stripe event type to the Stripe Dashboard webhook endpoint
5. Add handler-level allowlist coverage
6. Add idempotency-key logic
7. Add an assertion to the proof harness verify scripts
8. Run `npm run prove`
9. Confirm all proof markers pass
10. Add the event to this library
11. Update the webhook handler allowlist

No new Stripe event may create an obligation without a registered obligation code and proof contract.

---

## Replay Safety Notes

Stripe may deliver any event more than once.

The kernel defends against duplicate truth writes at two layers.

### Layer 1 — Event idempotency

Each Stripe event is keyed by:

    event.id

Duplicate delivery must produce constraint conflict or equivalent no-op behavior.

Kernel truth must not be double-written.

### Layer 2 — Downstream emission idempotency

`api.create_watchdog_emission()` must preserve conflict protection:

    ON CONFLICT (obligation_id, delivery_target) DO NOTHING

Duplicate watchdog emissions for the same obligation and delivery target are idempotent.

Never remove either layer.

Never implement a “first one wins” approach without kernel-layer idempotency as the final guard.

---

## Non-Negotiable Rules

1. Stripe events are facts, not automatically obligations.
2. Unknown Stripe events must never create obligations.
3. Informational events must be staged or logged, not silently converted.
4. Payment facts must not be double-counted across payment intent, checkout, invoice, and charge events.
5. All mutations must go through governed `api.*` or kernel-approved paths.
6. No webhook handler may write directly to `core.*`, `ledger.*`, `receipts.*`, or `control.*`.
7. Every new obligation-producing mapping requires a proof contract first.
8. Every new mapping requires proof-harness coverage.
9. Replay safety must be enforced at the kernel layer.
10. Customer-facing interpretation must come from governed projections, not raw Stripe event data.
    
