import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

type WatchdogDeliveryCandidate = {
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
  delivery_target: string
  emission_id: string | null
  delivery_status: string | null
  emission_created_at: string | null
  attempt_count: number | null
  last_attempt_at: string | null
  next_retry_at: string | null
  max_attempts: number | null
}

type InsertedEmission = {
  id: string
  obligation_id: string
  delivery_status?: string | null
  next_retry_at?: string | null
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

function buildEventKey(row: WatchdogDeliveryCandidate): string {
  return `watchdog.overdue.${row.obligation_id}`
}

function buildWebhookData(row: WatchdogDeliveryCandidate) {
  return {
    obligation_id: row.obligation_id,
    entity_id: row.entity_id,
    obligation_code: row.obligation_code,
    workspace_id: row.workspace_id,
    obligation_created_at: row.obligation_created_at,
    source_event_id: row.source_event_id,
    source_system: row.source_system,
    source_event_key: row.source_event_key,
    source_event_type: row.source_event_type,
    source_event_created_at: row.source_event_created_at,
    receipt_id: row.receipt_id,
    receipt_entity_id: row.receipt_entity_id,
    resolution_type: row.resolution_type,
    proof_status: row.proof_status,
    receipt_emitted_at: row.receipt_emitted_at,
    truth_burden: row.truth_burden,
    due_at: row.due_at,
    lifecycle_state: row.lifecycle_state,
  }
}

async function getOrCreateEmission(
  supabase: any,
  row: WatchdogDeliveryCandidate
): Promise<{ emission: InsertedEmission | null; skipped?: string; error?: string }> {
  if (row.emission_id) {
    return {
      emission: {
        id: row.emission_id,
        obligation_id: row.obligation_id,
        delivery_status: row.delivery_status,
        next_retry_at: row.next_retry_at,
        attempt_count: row.attempt_count ?? 0,
        max_attempts: row.max_attempts ?? 5,
      },
    }
  }

  const { data, error } = await supabase.rpc('create_watchdog_emission', {
    p_obligation_id: row.obligation_id,
    p_delivery_target: row.delivery_target,
  })

  if (error) {
    return { emission: null, error: error.message }
  }

  return { emission: data as InsertedEmission }
}

async function claimEmission(
  supabase: any,
  emissionId: string
): Promise<{ emission: InsertedEmission | null; error?: string }> {
  const { data, error } = await supabase.rpc('claim_watchdog_emission', {
    p_emission_id: emissionId,
  })

  if (error) {
    return { emission: null, error: error.message }
  }

  return {
    emission: data ? (data as InsertedEmission) : null,
  }
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
    const receiverSecret = assertEnv('WATCHDOG_RECEIVER_SECRET', process.env.WATCHDOG_RECEIVER_SECRET)

    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data, error } = await supabase
      .from('watchdog_delivery_candidates')
      .select('*')
      .order('receipt_emitted_at', { ascending: true })
      .order('obligation_created_at', { ascending: true })
      .order('obligation_id', { ascending: true })

    if (error) {
      return res.status(500).json({ ok: false, error: error.message })
    }

    const rows = (data ?? []) as WatchdogDeliveryCandidate[]
    const results: EmitResult[] = []

    for (const row of rows) {
      const eventKey = buildEventKey(row)

      const emissionResult = await getOrCreateEmission(supabase, row)
      if (emissionResult.error) {
        results.push({
          obligation_id: row.obligation_id,
          entity_id: row.entity_id,
          delivered: false,
          status: null,
          event_key: eventKey,
          skipped: true,
          error: emissionResult.error,
        })
        continue
      }

      if (!emissionResult.emission) {
        results.push({
          obligation_id: row.obligation_id,
          entity_id: row.entity_id,
          delivered: false,
          status: null,
          event_key: eventKey,
          skipped: true,
          error: emissionResult.skipped ?? 'EMISSION_NOT_ELIGIBLE',
        })
        continue
      }

      const claimResult = await claimEmission(supabase, emissionResult.emission.id)
      if (claimResult.error) {
        results.push({
          obligation_id: row.obligation_id,
          entity_id: row.entity_id,
          delivered: false,
          status: null,
          event_key: eventKey,
          skipped: true,
          error: claimResult.error,
        })
        continue
      }

      if (!claimResult.emission) {
        results.push({
          obligation_id: row.obligation_id,
          entity_id: row.entity_id,
          delivered: false,
          status: null,
          event_key: eventKey,
          skipped: true,
          error: 'EMISSION_ALREADY_CLAIMED',
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
            'x-watchdog-secret': receiverSecret,
          },
          body: JSON.stringify({
            event_type: 'watchdog.overdue_failure.detected',
            event_key: eventKey,
            emitted_at: new Date().toISOString(),
            source: 'public.watchdog_delivery_candidates',
            data: buildWebhookData(row),
          }),
        })

        if (response.ok) {
          const { error: rpcError } = await supabase.rpc('record_watchdog_attempt', {
            p_emission_id: claimResult.emission.id,
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

        const retryOutcome = computeRetryOutcome(claimResult.emission)

        const { error: rpcError } = await supabase.rpc('record_watchdog_attempt', {
          p_emission_id: claimResult.emission.id,
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
        const retryOutcome = computeRetryOutcome(claimResult.emission)

        const { error: rpcError } = await supabase.rpc('record_watchdog_attempt', {
          p_emission_id: claimResult.emission.id,
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
