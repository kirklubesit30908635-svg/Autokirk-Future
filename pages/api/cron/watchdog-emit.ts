/**
 * AutoKirk Future — Vercel Cron entry point for watchdog emission.
 *
 * Target path in repo: pages/api/cron/watchdog-emit.ts
 *
 * Why this file exists:
 *   vercel.json declares a cron at "/api/cron/watchdog-emit" every 5 minutes,
 *   but no route by that name existed — so Vercel was firing into a 404 and
 *   no autonomous emission was happening in production. This is the missing
 *   wrapper.
 *
 * Auth model:
 *   - Vercel cron jobs send `Authorization: Bearer ${CRON_SECRET}` automatically
 *     when the CRON_SECRET environment variable is set on the project.
 *   - The downstream emit route guards on `WATCHDOG_EMIT_SECRET`, which is a
 *     different secret with a different lifetime. We translate auth here so
 *     the emit route's existing contract does not need to change.
 *
 * Doctrine compliance:
 *   - This route does NOT mutate any core/ledger/receipts/control table.
 *   - It only forwards an authenticated request into the existing emit route,
 *     which itself goes through api.* RPCs.
 *   - It is a transport surface, not an authority surface (Constitution §1).
 *
 * Required env vars on Vercel (all environments):
 *   CRON_SECRET                — set by `vercel env add CRON_SECRET`
 *   WATCHDOG_EMIT_SECRET       — already in use by the emit route
 *
 * After deploy, verify cron is firing via the Vercel "Crons" dashboard tab.
 */

import type { NextApiRequest, NextApiResponse } from 'next'

type CronResponse =
  | { ok: true; forwarded_status: number; forwarded_body: unknown }
  | { ok: false; error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CronResponse>,
): Promise<void> {
  // Vercel cron only ever issues GET. Reject everything else so this route
  // cannot become a sneaky second mutation entry point.
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' })
    return
  }

  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    res.status(500).json({ ok: false, error: 'CRON_SECRET_NOT_CONFIGURED' })
    return
  }

  const auth = req.headers.authorization ?? ''
  if (auth !== `Bearer ${cronSecret}`) {
    res.status(401).json({ ok: false, error: 'UNAUTHORIZED' })
    return
  }

  const emitSecret = process.env.WATCHDOG_EMIT_SECRET
  if (!emitSecret) {
    res
      .status(500)
      .json({ ok: false, error: 'WATCHDOG_EMIT_SECRET_NOT_CONFIGURED' })
    return
  }

  // Reconstruct an absolute URL to the emit route on this same deployment.
  // `req.headers.host` is the deployment hostname Vercel routed the request
  // through, which is correct for both production and preview environments.
  const host = req.headers.host
  if (!host) {
    res.status(500).json({ ok: false, error: 'HOST_HEADER_MISSING' })
    return
  }
  const protocol = host.startsWith('localhost') || host.startsWith('127.')
    ? 'http'
    : 'https'
  const target = `${protocol}://${host}/api/watchdog/emit-overdue-webhook`

  try {
    const response = await fetch(target, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${emitSecret}`,
      },
    })

    const text = await response.text()
    let body: unknown
    try {
      body = JSON.parse(text)
    } catch {
      body = text
    }

    res.status(200).json({
      ok: true,
      forwarded_status: response.status,
      forwarded_body: body,
    })
  } catch (err) {
    res.status(502).json({
      ok: false,
      error: err instanceof Error ? err.message : 'FORWARD_FAILED',
    })
  }
}
