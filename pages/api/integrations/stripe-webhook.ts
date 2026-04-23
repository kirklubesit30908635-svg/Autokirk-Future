import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const event = req.body

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const workspaceId = '<resolve-workspace>'
  const actorId = '<system-actor>'
  const entityId = '33333333-3333-3333-3333-333333333333' // AutoKirk Systems LLC

  const { data, error } = await supabase.rpc('ingest_event_to_obligation', {
    p_workspace_id: workspaceId,
    p_actor_id: actorId,
    p_entity_id: entityId,
    p_source_system: 'stripe',
    p_source_event_key: event.id,
    p_source_event_type: event.type,
    p_payload: event,
  })

  if (error) {
    console.error(error)
    return res.status(500).json({ ok: false })
  }

  return res.status(200).json({ ok: true })
}
