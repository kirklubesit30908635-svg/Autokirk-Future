import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

type ApiResponse =
  | { ok: true; count: number; rows: unknown[] }
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

    const { data, error } = await supabase
      .from('overdue_failure_watchdog')
      .select('*')
      .order('due_at', { ascending: true })

    if (error) {
      return res.status(500).json({ ok: false, error: error.message })
    }

    return res.status(200).json({
      ok: true,
      count: (data ?? []).length,
      rows: data ?? [],
    })
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : 'UNKNOWN_ERROR',
    })
  }
}
