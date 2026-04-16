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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const WORKSPACE_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const ACTOR_ID = "11111111-1111-1111-1111-111111111111";

Deno.serve(async (request) => {
  try {
    const signature = request.headers.get("Stripe-Signature");
    if (!signature) {
      return new Response("Missing Stripe-Signature", { status: 400 });
    }

    const body = await request.text();

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response("Invalid signature", { status: 400 });
    }

    console.log("Received Stripe event:", event.type);

    const { data, error } = await supabase.rpc("ingest_event_to_obligation", {
      p_workspace_id: WORKSPACE_ID,
      p_actor_id: ACTOR_ID,
      p_source_system: "stripe",
      p_source_event_key: event.id,
      p_source_event_type: event.type,
      p_payload: event,
      p_occurred_at: new Date(event.created * 1000).toISOString(),
    });

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
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    console.error("Unhandled webhook error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
});