import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

type FailedWatchdogRow = {
  obligation_id: string
  entity_id: string
  obligation_code: string
  workspace_id: string
  obligation_created_at: string
  source_event_id: string | null
  source_system: string | null
  source_event_key: string | null
  source_event_type: string | null
  source_event_created_at: string | null
  receipt_id: string | null
  receipt_entity_id: string | null
  resolution_type: string | null
  proof_status: string | null
  receipt_emitted_at: string | null
  truth_burden: string
  due_at: string | null
  lifecycle_state: 'failed'
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

type EnforcementRow = FailedWatchdogRow & {
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

    const { data: failedRowsData, error: failedRowsError } = await supabase
      .from('overdue_failure_watchdog')
      .select('*')
      .order('obligation_created_at', { ascending: false })

    if (failedRowsError) {
      return res.status(500).json({ ok: false, error: failedRowsError.message })
    }

    const failedRows = (failedRowsData ?? []) as FailedWatchdogRow[]
    const obligationIds = failedRows.map((row) => row.obligation_id)

    const { data: emissionsData, error: emissionsError } = obligationIds.length === 0
      ? { data: [] as EmissionRow[], error: null }
      : await supabase
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

    const emissionByObligationId = new Map<string, EmissionRow>()
    for (const row of ((emissionsData ?? []) as EmissionRow[])) {
      emissionByObligationId.set(row.obligation_id, row)
    }

    const rows: EnforcementRow[] = failedRows.map((row) => {
      const emission = emissionByObligationId.get(row.obligation_id) ?? null

      return {
        ...row,
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
