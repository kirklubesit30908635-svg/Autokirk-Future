import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

type FailedObligationRow = {
  obligation_id: string
  obligation_code: string | null
  workspace_id: string
  obligation_created_at: string
  source_event_id: string | null
  source_system: string | null
  source_event_key: string | null
  source_event_type: string | null
  source_event_created_at: string | null
  receipt_id: string | null
  resolution_type: string | null
  proof_status: string | null
  receipt_emitted_at: string | null
  truth_burden: string | null
  due_at: string | null
  lifecycle_state: string
}

type ErrorBody = {
  ok: false
  error: string
}

type SuccessBody = {
  ok: true
  data: FailedObligationRow[]
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ErrorBody | SuccessBody>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({
      ok: false,
      error: 'METHOD_NOT_ALLOWED',
    })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return res.status(500).json({
      ok: false,
      error: 'SUPABASE_ENV_MISSING',
    })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

  const { data, error } = await supabase
    .from('overdue_failure_watchdog')
    .select(`
      obligation_id,
      obligation_code,
      workspace_id,
      obligation_created_at,
      source_event_id,
      source_system,
      source_event_key,
      source_event_type,
      source_event_created_at,
      receipt_id,
      resolution_type,
      proof_status,
      receipt_emitted_at,
      truth_burden,
      due_at,
      lifecycle_state
    `)
    .order('obligation_created_at', { ascending: false })

  if (error) {
    return res.status(500).json({
      ok: false,
      error: error.message,
    })
  }

  return res.status(200).json({
    ok: true,
    data: (data ?? []) as FailedObligationRow[],
  })
}
