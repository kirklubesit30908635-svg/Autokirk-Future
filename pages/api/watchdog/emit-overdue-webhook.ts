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
  skipped?: boolean
  error?: string
}

type ApiResponse =
  | {
      ok: true
      scanned_count: number
      emitted_count: number
      delivered_count: number
      failed_count: number
      results: EmitResult[]
    }
  | { ok: false; error: string }

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
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' })
  }

  try {
    const expectedSecret = assertEnv('WATCHDOG_EMIT_SECRET', process.env.WATCHDOG_EMIT_SECRET)
    const authHeader = req.headers.authorization ?? ''
    const providedSecret = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : ''

    if (providedSecret !== expectedSecret) {
      return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' })
    }

    const url = assertEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL)
    const key = assertEnv('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY)
    const webhookUrl = assertEnv('WATCHDOG_OUTBOUND_WEBHOOK_URL', process.env.WATCHDOG_OUTBOUND_WEBHOOK_URL)

    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data, error } = await supabase
      .from('overdue_failure_emission_candidates')
      .select('*')
      .order('due_at', { ascending: true })

    if (error) {
      return res.status(500).json({ ok: false, error: error.message })
    }

    const rows = (data ?? []) as WatchdogRow[]
    const results: EmitResult[] = []

    for (const row of rows) {
      const eventKey = buildEventKey(row)

      const { data: inserted, error: insertError } = await supabase
        .schema('control')
        .from('watchdog_emissions')
        .insert({
          obligation_id: row.obligation_id,
          delivery_target: 'outbound-webhook',
          delivery_status: 'pending',
          payload: {
            event_type: 'watchdog.overdue_failure.detected',
            event_key: eventKey,
            source: 'public.overdue_failure_watchdog',
            data: row,
          },
        })
        .select('id, obligation_id')
        .single()

      if (insertError) {
        results.push({
          obligation_id: row.obligation_id,
          delivered: false,
          status: null,
          event_key: eventKey,
          skipped: true,
          error: insertError.message,
        })
        continue
      }

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

        const deliveryStatus = response.ok ? 'delivered' : 'failed'

        await supabase
          .schema('control')
          .from('watchdog_emissions')
          .update({ delivery_status: deliveryStatus })
          .eq('id', inserted.id)

        results.push({
          obligation_id: row.obligation_id,
          delivered: response.ok,
          status: response.status,
          event_key: eventKey,
          error: response.ok ? undefined : `HTTP_${response.status}`,
        })
      } catch (err) {
        await supabase
          .schema('control')
          .from('watchdog_emissions')
          .update({ delivery_status: 'failed' })
          .eq('id', inserted.id)

        results.push({
          obligation_id: row.obligation_id,
          delivered: false,
          status: null,
          event_key: eventKey,
          error: err instanceof Error ? err.message : 'UNKNOWN_ERROR',
        })
      }
    }

    const emittedCount = results.filter((r) => !r.skipped).length
    const deliveredCount = results.filter((r) => r.delivered).length
    const failedCount = results.filter((r) => !r.delivered && !r.skipped).length

    return res.status(200).json({
      ok: true,
      scanned_count: rows.length,
      emitted_count: emittedCount,
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
