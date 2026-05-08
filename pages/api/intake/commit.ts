import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

type CommitIntakeBody = {
  workspace_id: string
  candidate_ref: string
  obligation_code: string
  trigger_text: string
  source_signal_ref: string
  object_anchor: string
  action_anchor: string
  trigger_anchor: string
  operator_note?: string | null
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' })
  }

  try {
    const body = req.body as CommitIntakeBody
    const authHeader = req.headers.authorization
    const accessToken =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length)
        : null

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    if (!accessToken) {
      return res.status(401).json({ ok: false, error: 'UNAUTHENTICATED' })
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken)

    if (userError || !user) {
      return res.status(401).json({ ok: false, error: 'UNAUTHENTICATED' })
    }

    if (!body.workspace_id?.trim()) {
      return res.status(400).json({ ok: false, error: 'WORKSPACE_ID_REQUIRED' })
    }

    const { data: membership, error: membershipError } = await supabase
      .schema('core')
      .from('workspace_members')
      .select('workspace_id,user_id')
      .eq('user_id', user.id)
      .eq('workspace_id', body.workspace_id)
      .maybeSingle()

    if (membershipError) {
      return res.status(500).json({
        ok: false,
        error: 'MEMBERSHIP_LOOKUP_FAILED',
        detail: membershipError.message,
      })
    }

    if (!membership) {
      return res.status(403).json({
        ok: false,
        error: 'INVALID_WORKSPACE_ACCESS',
      })
    }

    const { data, error } = await supabase.rpc('commit_intake_candidate', {
      p_workspace_id: body.workspace_id,
      p_actor_user_id: user.id,
      p_candidate_ref: body.candidate_ref,
      p_obligation_code: body.obligation_code,
      p_trigger_text: body.trigger_text,
      p_source_signal_ref: body.source_signal_ref,
      p_object_anchor: body.object_anchor,
      p_action_anchor: body.action_anchor,
      p_trigger_anchor: body.trigger_anchor,
      p_operator_note: body.operator_note ?? null,
    })

    if (error) {
      return res.status(400).json({
        ok: false,
        error: 'COMMIT_INTAKE_FAILED',
        detail: error.message,
      })
    }

    return res.status(200).json({ ok: true, result: data })
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: 'INTAKE_COMMIT_ROUTE_FAILED',
      detail: error instanceof Error ? error.message : 'unknown_error',
    })
  }
}
