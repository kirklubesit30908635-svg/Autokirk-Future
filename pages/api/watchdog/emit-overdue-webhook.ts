import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

type WatchdogRow = {
  obligation_id: string
  obligation_code: string
  workspace_id: string
  obligation_created_at: string
  source_event_id: string
  source_system: string
  source_event_key: string
  source_event_type: string
  source_event_created_at: string
  receipt_id: string | null
  resolution_type: string | null
  proof_status: string | null
  receipt_emitted_at: string | null
  truth_burden: string
  due_at: string | null
  lifecycle_state: string
}

type EmitResult = {
  obligation_id: string
  delivered: boolean
  status: number | null
  event_key: string
  error?: string
}

type ApiResponse = {
  ok: boolean
  scanned_count: number
  delivered_count: number
  failed_count: number
  results: EmitResult[]
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const internalTriggerSecret = process.env.WATCHDOG_EMIT_SECRET
const outboundWebhookUrl = process.env.WATCHDOG_OUTBOUND_WEBHOOK_URL

function assertEnv(name: string, value: string | undefined): string {
  if (!value || !value.trim()) {
    throw new Error(`${name}_REQUIRED`)
  }
  return value
}

function buildEventKey(row: WatchdogRow): string {
  return `watchdog.overdue.${row.obligation_id}`
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse | { ok: false; error: string }>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' })
  }

  try {
    const expectedSecret = assertEnv('WATCHDOG_EMIT_SECRET', internalTriggerSecret)
    const authHeader = req.headers.authorization ?? ''
    const providedSecret = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : ''

    if (providedSecret !== expectedSecret) {
      return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' })
    }

    const url = assertEnv('NEXT_PUBLIC_SUPABASE_URL', supabaseUrl)
    const key = assertEnv('SUPABASE_SERVICE_ROLE_KEY', supabaseServiceRoleKey)
    const webhookUrl = assertEnv('WATCHDOG_OUTBOUND_WEBHOOK_URL', outboundWebhookUrl)

    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data, error } = await supabase
      .from('overdue_failure_watchdog')
      .select('*')
      .order('due_at', { ascending: true })

    if (error) {
      return res.status(500).json({ ok: false, error: error.message })
    }

    const rows = (data ?? []) as WatchdogRow[]
    const results: EmitResult[] = []

    for (const row of rows) {
      const eventKey = buildEventKey(row)

      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-autokirk-event-key': eventKey,
            'x-autokirk-event-type': 'watchdog.overdue_failure.detected',
          },
          body: JSON.stringify({
            event_type: 'watchdog.overdue_failure.detected',
            event_key: eventKey,
            emitted_at: new Date().toISOString(),
            source: 'public.overdue_failure_watchdog',
            data: row,
          }),
        })

        results.push({
          obligation_id: row.obligation_id,
          delivered: response.ok,
          status: response.status,
          event_key: eventKey,
          error: response.ok ? undefined : `HTTP_${response.status}`,
        })
      } catch (err) {
        results.push({
          obligation_id: row.obligation_id,
          delivered: false,
          status: null,
          event_key: eventKey,
          error: err instanceof Error ? err.message : 'UNKNOWN_ERROR',
        })
      }
    }

    const deliveredCount = results.filter((r) => r.delivered).length
    const failedCount = results.length - deliveredCount

    return res.status(200).json({
      ok: true,
      scanned_count: rows.length,
      delivered_count: deliveredCount,
      failed_count: failedCount,
      results,
    })
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : 'UNKNOWN_ERROR',
    })
  }
}
