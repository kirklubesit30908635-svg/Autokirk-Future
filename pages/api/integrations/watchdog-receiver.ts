import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

type ResponseBody = { ok: true } | { ok: false; error: string }

function assertEnv(name: string, value: string | undefined): string {
  if (!value || !value.trim()) {
    throw new Error(`${name}_REQUIRED`)
  }
  return value
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' })
  }

  try {
    const expected = assertEnv('WATCHDOG_SHARED_SECRET', process.env.WATCHDOG_SHARED_SECRET)
    const provided = req.headers['x-autokirk-signature']

    if (provided !== expected) {
      return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' })
    }

    const url = assertEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL)
    const key = assertEnv('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY)

    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const body = req.body

    if (!body?.event_key || !body?.data?.obligation_id) {
      return res.status(400).json({ ok: false, error: 'INVALID_PAYLOAD' })
    }

    const obligationId = body.data.obligation_id

    const { data: existing, error: fetchError } = await supabase
      .from('overdue_failure_watchdog')
      .select('lifecycle_state')
      .eq('obligation_id', obligationId)
      .maybeSingle()

    if (fetchError) {
      return res.status(500).json({ ok: false, error: fetchError.message })
    }

    if (existing?.lifecycle_state === 'failed') {
      console.log(JSON.stringify({
        type: 'watchdog_receiver_skip_terminal',
        obligation_id: obligationId,
        event_key: body.event_key,
      }))

      return res.status(200).json({ ok: true })
    }

    const { error: rpcError } = await supabase.rpc('record_obligation_transition', {
      p_obligation_id: obligationId,
      p_next_state: 'failed_enforced',
      p_metadata: {
        source: 'watchdog_receiver',
        event_key: body.event_key,
        received_at: new Date().toISOString(),
      },
    })

    if (rpcError) {
      return res.status(500).json({ ok: false, error: rpcError.message })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : 'UNKNOWN_ERROR',
    })
  }
}
