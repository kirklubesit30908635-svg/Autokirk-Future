import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' })
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const workspaceId = process.env.SYSTEM_WORKSPACE_ID!
    const actorId = process.env.SYSTEM_ACTOR_ID!

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    const event = req.body

    // 🔒 Minimal ingestion call (no Stripe SDK yet)
    const { data, error } = await supabase.rpc(
      'ingest_event_to_obligation',
      {
        p_workspace_id: workspaceId,
        p_actor_id: actorId,
        p_source_system: 'stripe',
        p_source_event_key: event.id,
        p_source_event_type: event.type,
        p_payload: event,
      }
    )

    if (error) {
      console.error('INGEST ERROR:', error)
      return res.status(500).json({
        ok: false,
        error: 'INGEST_FAILED',
        detail: error.message,
      })
    }

    return res.status(200).json({
      ok: true,
      source_event_id: data?.source_event_id ?? null,
      obligation: data?.obligation ?? null,
    })
  } catch (err: any) {
    console.error('WEBHOOK ERROR:', err)

    return res.status(500).json({
      ok: false,
      error: 'UNHANDLED_EXCEPTION',
      detail: err?.message ?? 'unknown',
    })
  }
}
