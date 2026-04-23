import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CommitIntakeBody

    const supabase = createRouteHandlerClient({ cookies })

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { ok: false, error: 'UNAUTHENTICATED' },
        { status: 401 }
      )
    }

    if (!body.workspace_id?.trim()) {
      return NextResponse.json(
        { ok: false, error: 'WORKSPACE_ID_REQUIRED' },
        { status: 400 }
      )
    }

    const { data: membership, error: membershipError } = await supabase
      .from('core.workspace_members')
      .select('workspace_id,user_id')
      .eq('user_id', user.id)
      .eq('workspace_id', body.workspace_id)
      .maybeSingle()

    if (membershipError) {
      return NextResponse.json(
        {
          ok: false,
          error: 'MEMBERSHIP_LOOKUP_FAILED',
          detail: membershipError.message,
        },
        { status: 500 }
      )
    }

    if (!membership) {
      return NextResponse.json(
        { ok: false, error: 'INVALID_WORKSPACE_ACCESS' },
        { status: 403 }
      )
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
      return NextResponse.json(
        { ok: false, error: 'COMMIT_INTAKE_FAILED', detail: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ ok: true, result: data }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'INTAKE_COMMIT_ROUTE_FAILED',
        detail: error instanceof Error ? error.message : 'unknown_error',
      },
      { status: 500 }
    )
  }
}
