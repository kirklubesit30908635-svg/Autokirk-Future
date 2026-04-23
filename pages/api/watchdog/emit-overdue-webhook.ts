import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

type WatchdogRow = {
  obligation_id: string
  entity_id: string
  obligation_code: string
  workspace_id: string
  obligation_created_at: string
  source_event_id: string
  source_system: string
  source_event_key: string
  source_event_type: string
  source_event_created_at: string
  receipt_id: string | null
  receipt_entity_id: string | null
  resolution_type: string | null
  proof_status: string | null
  receipt_emitted_at: string | null
  truth_burden: string
  due_at: string | null
  lifecycle_state: string
}

type InsertedEmission = {
  id: string
  obligation_id: string
  attempt_count?: number
  max_attempts?: number
}

type EmitResult = {
  obligation_id: string
  entity_id: string
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

function computeRetryOutcome(emission: InsertedEmission) {
  const currentAttempts = emission.attempt_count ?? 0
  const maxAttempts = emission.max_attempts ?? 5
  const nextAttemptCount = currentAttempts + 1

  if (nextAttemptCount >= maxAttempts) {
    return {
      deliveryStatus: 'exhausted',
      nextRetryAt: null,
    }
  }

  return {
    deliveryStatus: 'failed',
    nextRetryAt: new Date(Date.now() + 60_000).toISOString(),
  }
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
    const watchdogSharedSecret = assertEnv('WATCHDOG_SHARED_SECRET', process.env.WATCHDOG_SHARED_SECRET)

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
        .select('id, obligation_id, attempt_count, max_attempts')
        .single()

      if (insertError) {
        results.push({
          obligation_id: row.obligation_id,
          entity_id: row.entity_id,
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
            'x-autokirk-signature': watchdogSharedSecret,
          },
          body: JSON.stringify({
            event_type: 'watchdog.overdue_failure.detected',
            event_key: eventKey,
            emitted_at: new Date().toISOString(),
            source: 'public.overdue_failure_watchdog',
            data: row,
          }),
        })

        if (response.ok) {
          const { error: rpcError } = await supabase.rpc('record_watchdog_attempt', {
            p_emission_id: inserted.id,
            p_delivery_status: 'delivered',
            p_next_retry_at: null,
          })

          if (rpcError) {
            results.push({
              obligation_id: row.obligation_id,
              entity_id: row.entity_id,
              delivered: false,
              status: response.status,
              event_key: eventKey,
              error: rpcError.message,
            })
            continue
          }

          results.push({
            obligation_id: row.obligation_id,
            entity_id: row.entity_id,
            delivered: true,
            status: response.status,
            event_key: eventKey,
          })

          continue
        }

        const retryOutcome = computeRetryOutcome(inserted as InsertedEmission)

        const { error: rpcError } = await supabase.rpc('record_watchdog_attempt', {
          p_emission_id: inserted.id,
          p_delivery_status: retryOutcome.deliveryStatus,
          p_next_retry_at: retryOutcome.nextRetryAt,
        })

        results.push({
          obligation_id: row.obligation_id,
          entity_id: row.entity_id,
          delivered: false,
          status: response.status,
          event_key: eventKey,
          error: rpcError ? rpcError.message : `HTTP_${response.status}`,
        })
      } catch (err) {
        const retryOutcome = computeRetryOutcome(inserted as InsertedEmission)

        const { error: rpcError } = await supabase.rpc('record_watchdog_attempt', {
          p_emission_id: inserted.id,
          p_delivery_status: retryOutcome.deliveryStatus,
          p_next_retry_at: retryOutcome.nextRetryAt,
        })

        results.push({
          obligation_id: row.obligation_id,
          entity_id: row.entity_id,
          delivered: false,
          status: null,
          event_key: eventKey,
          error: rpcError
            ? rpcError.message
            : err instanceof Error
              ? err.message
              : 'UNKNOWN_ERROR',
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
