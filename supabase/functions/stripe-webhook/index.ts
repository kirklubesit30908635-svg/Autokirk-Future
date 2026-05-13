import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@12.0.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!stripeSecretKey) throw new Error("Missing STRIPE_SECRET_KEY");
if (!webhookSecret) throw new Error("Missing STRIPE_WEBHOOK_SECRET");
if (!supabaseUrl) throw new Error("Missing SUPABASE_URL");
if (!supabaseServiceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-11-20",
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

type BillingAccount = {
  workspace_id: string;
  actor_id: string;
};

type StripeObjectWithBillingRefs = {
  id?: string;
  customer?: string | { id?: string } | null;
  subscription?: string | { id?: string } | null;
  customer_email?: string | null;
  metadata?: Record<string, string> | null;
};

function objectRecord(event: Stripe.Event): StripeObjectWithBillingRefs {
  return event.data.object as StripeObjectWithBillingRefs;
}

function idFrom(value: string | { id?: string } | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.id ?? null;
}

function metadataUuid(object: StripeObjectWithBillingRefs, key: string): string | null {
  const value = object.metadata?.[key];
  if (!value) return null;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

async function resolveBillingAccount(event: Stripe.Event): Promise<BillingAccount> {
  const object = objectRecord(event);
  const customerId = idFrom(object.customer);
  const subscriptionId = idFrom(object.subscription);
  const checkoutSessionId = event.type.startsWith("checkout.session.") ? object.id ?? null : null;

  let query = supabase
    .schema("billing")
    .from("accounts")
    .select("workspace_id, actor_id")
    .limit(1);

  if (customerId) {
    query = query.eq("stripe_customer_id", customerId);
  } else if (subscriptionId) {
    query = query.eq("stripe_subscription_id", subscriptionId);
  } else if (checkoutSessionId) {
    query = query.eq("stripe_checkout_session_id", checkoutSessionId);
  } else {
    throw new Error(`BILLING_ACCOUNT_UNRESOLVABLE:${event.id}`);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`BILLING_ACCOUNT_LOOKUP_FAILED:${error.message}`);
  if (!data) throw new Error(`BILLING_ACCOUNT_NOT_FOUND:${event.id}`);

  return data;
}

async function upsertCheckoutBillingAccount(event: Stripe.Event): Promise<void> {
  if (event.type !== "checkout.session.completed") return;

  const object = objectRecord(event);
  const customerId = idFrom(object.customer);
  if (!customerId || !object.id) return;

  const workspaceId = metadataUuid(object, "workspace_id");
  const actorId = metadataUuid(object, "actor_id");
  if (!workspaceId || !actorId) return;

  const { error } = await supabase.schema("billing").from("accounts").upsert(
    {
      workspace_id: workspaceId,
      actor_id: actorId,
      stripe_customer_id: customerId,
      stripe_subscription_id: idFrom(object.subscription),
      stripe_checkout_session_id: object.id,
      customer_email: object.customer_email ?? null,
      status: "active",
      metadata: object.metadata ?? {},
    },
    { onConflict: "stripe_customer_id" }
  );

  if (error) throw new Error(`BILLING_ACCOUNT_UPSERT_FAILED:${error.message}`);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "POST, OPTIONS",
        "access-control-allow-headers": "content-type, stripe-signature",
      },
    });
  }

  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const signature = request.headers.get("Stripe-Signature");
    if (!signature) {
      return new Response("Missing Stripe-Signature", { status: 400 });
    }

    const body = await request.text();

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
        undefined,
        cryptoProvider
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response("Invalid signature", { status: 400 });
    }

    console.log("Received Stripe event:", event.type);

    await upsertCheckoutBillingAccount(event);
    const billingAccount = await resolveBillingAccount(event);

    const { data, error } = await supabase.schema("api").rpc(
      "ingest_event_to_obligation",
      {
        p_workspace_id: billingAccount.workspace_id,
        p_actor_id: billingAccount.actor_id,
        p_source_system: "stripe",
        p_source_event_key: event.id,
        p_source_event_type: event.type,
        p_payload: event,
        p_occurred_at: new Date(event.created * 1000).toISOString(),
      }
    );

    if (error) {
      console.error("RPC ingest_event_to_obligation failed:", error);
      return new Response(
        JSON.stringify({
          ok: false,
          stage: "ingest_event_to_obligation",
          error: error.message,
        }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }

    console.log("Ingestion success:", data);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
      },
    });
  } catch (err) {
    console.error("Unhandled webhook error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : "Unknown webhook error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
});
