import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

type ObligationRow = {
  id: string
  obligation_code: string
  workspace_id: string
  created_at: string
  truth_burden: string
  due_at: string | null
}

type ObligationSourceRow = {
  obligation_id: string
  source_event_id: string
}

type SourceEventRow = {
  id: string
  source_system: string
  source_event_key: string
  source_event_type: string
  created_at: string
}

type ReceiptRow = {
  id: string
  obligation_id: string
  resolution_type: string | null
  proof_status: string | null
  emitted_at: string | null
}

type EmissionRow = {
  id: string
  obligation_id: string
  delivery_target: string
  delivery_status: string
  created_at: string
  attempt_count: number
  last_attempt_at: string | null
  next_retry_at: string | null
  max_attempts: number
}

type EnforcementRow = {
  obligation_id: string
  obligation_code: string
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
  truth_burden: string
  due_at: string | null
  lifecycle_state: 'failed'
  emission_id: string | null
  delivery_target: string | null
  delivery_status: string | null
  emission_created_at: string | null
  attempt_count: number | null
  last_attempt_at: string | null
  next_retry_at: string | null
  max_attempts: number | null
}

type ApiResponse =
  | { ok: true; count: number; rows: EnforcementRow[] }
  | { ok: false; error: string }

function assertEnv(name: string, value: string | undefined): string {
  if (!value || !value.trim()) {
    throw new Error(`${name}_REQUIRED`)
  }
  return value
}

function isOverdue(dueAt: string | null): boolean {
  return !!dueAt && new Date(dueAt).getTime() < Date.now()
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' })
  }

  try {
    const url = assertEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL)
    const key = assertEnv('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY)

    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: obligationsData, error: obligationsError } = await supabase
      .schema('core')
      .from('obligations')
      .select('id, obligation_code, workspace_id, created_at, truth_burden, due_at')
      .order('created_at', { ascending: false })

    if (obligationsError) {
      return res.status(500).json({ ok: false, error: obligationsError.message })
    }

    const obligations = (obligationsData ?? []) as ObligationRow[]
    const obligationIds = obligations.map((o) => o.id)

    const { data: sourcesData, error: sourcesError } = await supabase
      .schema('core')
      .from('obligation_sources')
      .select('obligation_id, source_event_id')
      .in('obligation_id', obligationIds)

    if (sourcesError) {
      return res.status(500).json({ ok: false, error: sourcesError.message })
    }

    const sources = (sourcesData ?? []) as ObligationSourceRow[]
    const sourceEventIds = sources.map((s) => s.source_event_id)

    const { data: eventsData, error: eventsError } = await supabase
      .schema('ingest')
      .from('source_events')
      .select('id, source_system, source_event_key, source_event_type, created_at')
      .in('id', sourceEventIds)

    if (eventsError) {
      return res.status(500).json({ ok: false, error: eventsError.message })
    }

    const { data: receiptsData, error: receiptsError } = await supabase
      .schema('receipts')
      .from('receipts')
      .select('id, obligation_id, resolution_type, proof_status, emitted_at')
      .in('obligation_id', obligationIds)

    if (receiptsError) {
      return res.status(500).json({ ok: false, error: receiptsError.message })
    }

    const { data: emissionsData, error: emissionsError } = await supabase
      .schema('control')
      .from('watchdog_emissions')
      .select(`
        id,
        obligation_id,
        delivery_target,
        delivery_status,
        created_at,
        attempt_count,
        last_attempt_at,
        next_retry_at,
        max_attempts
      `)
      .in('obligation_id', obligationIds)

    if (emissionsError) {
      return res.status(500).json({ ok: false, error: emissionsError.message })
    }

    const sourceByObligationId = new Map<string, ObligationSourceRow>()
    for (const row of sources) sourceByObligationId.set(row.obligation_id, row)

    const eventById = new Map<string, SourceEventRow>()
    for (const row of ((eventsData ?? []) as SourceEventRow[])) eventById.set(row.id, row)

    const receiptByObligationId = new Map<string, ReceiptRow>()
    for (const row of ((receiptsData ?? []) as ReceiptRow[])) receiptByObligationId.set(row.obligation_id, row)

    const emissionByObligationId = new Map<string, EmissionRow>()
    for (const row of ((emissionsData ?? []) as EmissionRow[])) emissionByObligationId.set(row.obligation_id, row)

    const rows: EnforcementRow[] = obligations
      .filter((o) => {
        const receipt = receiptByObligationId.get(o.id) ?? null

        if (!receipt) return isOverdue(o.due_at)
        if (receipt.proof_status === 'insufficient' || receipt.proof_status === 'rejected') return true
        return false
      })
      .map((o) => {
        const source = sourceByObligationId.get(o.id) ?? null
        const event = source ? eventById.get(source.source_event_id) ?? null : null
        const receipt = receiptByObligationId.get(o.id) ?? null
        const emission = emissionByObligationId.get(o.id) ?? null

        return {
          obligation_id: o.id,
          obligation_code: o.obligation_code,
          workspace_id: o.workspace_id,
          obligation_created_at: o.created_at,
          source_event_id: source?.source_event_id ?? null,
          source_system: event?.source_system ?? null,
          source_event_key: event?.source_event_key ?? null,
          source_event_type: event?.source_event_type ?? null,
          source_event_created_at: event?.created_at ?? null,
          receipt_id: receipt?.id ?? null,
          resolution_type: receipt?.resolution_type ?? null,
          proof_status: receipt?.proof_status ?? null,
          receipt_emitted_at: receipt?.emitted_at ?? null,
          truth_burden: o.truth_burden,
          due_at: o.due_at,
          lifecycle_state: 'failed',
          emission_id: emission?.id ?? null,
          delivery_target: emission?.delivery_target ?? null,
          delivery_status: emission?.delivery_status ?? null,
          emission_created_at: emission?.created_at ?? null,
          attempt_count: emission?.attempt_count ?? null,
          last_attempt_at: emission?.last_attempt_at ?? null,
          next_retry_at: emission?.next_retry_at ?? null,
          max_attempts: emission?.max_attempts ?? null,
        }
      })

    return res.status(200).json({
      ok: true,
      count: rows.length,
      rows,
    })

  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err instanceof Error ? `${err.name}: ${err.message}` : 'UNKNOWN_ERROR',
    })
  }
}
