# AutoKirk Future

Canonical build root for AutoKirk Future.

## Status
Early doctrine-first implementation.

## Active rule
This repo is the only active build root.
The old `autokirk-kernel` repo is reference-only.

## Immediate focus
Establish clean Future root discipline, then build the canonical path intentionally.

## Stripe webhook endpoint (important)
Stripe must post to the Supabase Edge Function endpoint, **not** the Next.js site URL.

- Canonical ingress: `supabase/functions/stripe-webhook/index.ts`
- Expected public endpoint format: `https://<PROJECT_REF>.supabase.co/functions/v1/stripe-webhook`

If Stripe is configured to post to your frontend domain (for example `https://your-site.com/webhook`), you'll typically see a Next.js 404 HTML response like `"404: This page could not be found"`.

### Quick verification
1. In Stripe Dashboard, open your webhook endpoint configuration.
2. Confirm the URL is exactly your Supabase function URL ending in `/functions/v1/stripe-webhook`.
3. Ensure the endpoint's signing secret matches `STRIPE_WEBHOOK_SECRET` configured for the function runtime.
