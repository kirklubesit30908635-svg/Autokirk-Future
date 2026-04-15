import type { NextApiRequest, NextApiResponse } from 'next'
import { buffer } from 'micro'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const config = {
  api: {
    bodyParser: false,
  },
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' })
  }

  const signature = req.headers['stripe-signature']
  if (!signature || Array.isArray(signature)) {
    return res.status(400).json({ ok: false, error: 'MISSING_STRIPE_SIGNATURE' })
  }

  let event: Stripe.Event

  try {
    const rawBody = await buffer(req)

    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    )
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown webhook verification error'
    console.error('Stripe webhook signature failed:', message)
    return res.status(400).send(`Webhook Error: ${message}`)
  }

  try {
    const { error } = await supabase.rpc('ingest_event_to_obligation', {
      p_workspace_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      p_actor_id: '11111111-1111-1111-1111-111111111111',
      p_source_system: 'stripe',
      p_source_event_key: event.id,
      p_source_event_type: event.type,
      p_payload: event,
      p_occurred_at: new Date(event.created * 1000).toISOString(),
    })

    if (error) {
      console.error('Supabase ingestion failed:', error)
      return res.status(500).json({
        ok: false,
        error: 'SUPABASE_INGEST_FAILED',
        detail: error.message,
      })
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown ingestion error'
    console.error('Webhook processing failed:', message)
    return res.status(500).json({
      ok: false,
      error: 'WEBHOOK_PROCESSING_FAILED',
      detail: message,
    })
  }

  return res.status(200).json({ ok: true, received: true, eventType: event.type })
}
