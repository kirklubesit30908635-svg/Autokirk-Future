import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { serialize } from 'cookie'

import { supabaseUrl } from '../../../lib/board/signedBoardUrl'

type ReturningAccessResponse =
  | {
      ok: true
      workspace_id: string
      board_path: string
      billing_status: string
      linked_membership: boolean
    }
  | { ok: false; error: string }

type WorkspaceMembershipRow = {
  workspace_id: string
  role: string | null
}

type BillingAccountRow = {
  workspace_id: string
  status: string
}

const BILLING_ACCESS_STATUSES = ['active', 'trialing', 'past_due']

function appendSetCookie(res: NextApiResponse, cookie: string): void {
  const existing = res.getHeader('Set-Cookie')
  const cookies = existing
    ? Array.isArray(existing)
      ? existing
      : [String(existing)]
    : []

  res.setHeader('Set-Cookie', [...cookies, cookie])
}

function createUserSupabase(req: NextApiRequest, res: NextApiResponse) {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY
  if (!anonKey?.trim()) throw new Error('SUPABASE_ANON_KEY_NOT_CONFIGURED')

  return createServerClient(supabaseUrl(), anonKey, {
    cookies: {
      get(name) {
        return req.cookies[name]
      },
      set(name, value, options) {
        appendSetCookie(res, serialize(name, value, { path: '/', ...options }))
      },
      remove(name, options) {
        appendSetCookie(res, serialize(name, '', { path: '/', maxAge: 0, ...options }))
      },
    },
  })
}

function createServiceSupabase() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey?.trim()) throw new Error('SUPABASE_SERVICE_ROLE_KEY_NOT_CONFIGURED')

  return createClient(supabaseUrl(), serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ReturningAccessResponse>,
): Promise<void> {
  res.setHeader('Cache-Control', 'no-store, max-age=0')

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' })
    return
  }

  try {
    const userSupabase = createUserSupabase(req, res)
    const serviceSupabase = createServiceSupabase()
    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser()

    if (userError) {
      res.status(401).json({ ok: false, error: userError.message })
      return
    }

    if (!user?.id || !user.email) {
      res.status(401).json({ ok: false, error: 'AUTH_SESSION_REQUIRED' })
      return
    }

    const membershipResult = await serviceSupabase
      .schema('core')
      .from('workspace_members')
      .select('workspace_id,role')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (membershipResult.error) {
      res.status(500).json({ ok: false, error: `MEMBERSHIP_LOOKUP_FAILED:${membershipResult.error.message}` })
      return
    }

    if (membershipResult.data) {
      const membership = membershipResult.data as WorkspaceMembershipRow
      const billingResult = await serviceSupabase
        .schema('billing')
        .from('accounts')
        .select('workspace_id,status')
        .eq('workspace_id', membership.workspace_id)
        .in('status', BILLING_ACCESS_STATUSES)
        .limit(1)
        .maybeSingle()

      if (billingResult.error) {
        res.status(500).json({ ok: false, error: `BILLING_LOOKUP_FAILED:${billingResult.error.message}` })
        return
      }

      if (!billingResult.data) {
        res.status(402).json({ ok: false, error: 'BILLING_ACTIVE_OR_GRACE_REQUIRED' })
        return
      }

      const billing = billingResult.data as BillingAccountRow
      res.status(200).json({
        ok: true,
        workspace_id: membership.workspace_id,
        board_path: `/board/${membership.workspace_id}`,
        billing_status: billing.status,
        linked_membership: false,
      })
      return
    }

    const billingResult = await serviceSupabase
      .schema('billing')
      .from('accounts')
      .select('workspace_id,status')
      .ilike('customer_email', user.email.trim())
      .in('status', BILLING_ACCESS_STATUSES)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (billingResult.error) {
      res.status(500).json({ ok: false, error: `BILLING_LOOKUP_FAILED:${billingResult.error.message}` })
      return
    }

    if (!billingResult.data) {
      res.status(403).json({ ok: false, error: 'PAID_WORKSPACE_NOT_FOUND_FOR_EMAIL' })
      return
    }

    const billing = billingResult.data as BillingAccountRow
    const upsertResult = await serviceSupabase
      .schema('core')
      .from('workspace_members')
      .upsert(
        {
          workspace_id: billing.workspace_id,
          user_id: user.id,
          role: 'member',
        },
        { onConflict: 'workspace_id,user_id' },
      )

    if (upsertResult.error) {
      res.status(500).json({ ok: false, error: `MEMBERSHIP_LINK_FAILED:${upsertResult.error.message}` })
      return
    }

    res.status(200).json({
      ok: true,
      workspace_id: billing.workspace_id,
      board_path: `/board/${billing.workspace_id}`,
      billing_status: billing.status,
      linked_membership: true,
    })
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : 'RETURNING_ACCESS_FAILED',
    })
  }
}
