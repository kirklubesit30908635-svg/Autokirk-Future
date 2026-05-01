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
  const controlClient = supabase.schema('control') as any

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

  const { data: inserted, error: insertError } = await controlClient
    .from('watchdog_emissions')
    .insert({
      obligation_id: row.obligation_id,
      delivery_target: row.delivery_target,
      delivery_status: 'pending',
    })
    .select('id, obligation_id, delivery_status, next_retry_at, attempt_count, max_attempts')
    .single()

  if (!insertError) {
    return { emission: inserted as InsertedEmission }
  }

  if (insertError.code !== '23505') {
    return { emission: null, error: insertError.message }
  }

  const { data: existing, error: existingError } = await controlClient
    .from('watchdog_emissions')
    .select('id, obligation_id, delivery_status, next_retry_at, attempt_count, max_attempts')
    .eq('obligation_id', row.obligation_id)
    .eq('delivery_target', row.delivery_target)
    .single()

  if (existingError) {
    return { emission: null, error: existingError.message }
  }

  return { emission: existing as InsertedEmission }
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
    emission: data ? (data as InsertedEmission) :
