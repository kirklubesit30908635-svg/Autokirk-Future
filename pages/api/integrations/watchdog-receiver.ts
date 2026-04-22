import type { NextApiRequest, NextApiResponse } from 'next'

type ResponseBody = { ok: true } | { ok: false; error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' })
  }

  const expected = process.env.WATCHDOG_SHARED_SECRET
  const provided = req.headers['x-autokirk-signature']

  if (!expected || provided !== expected) {
    return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' })
  }

  console.log(JSON.stringify({
    type: 'overdue_failure_received',
    received_at: new Date().toISOString(),
    payload: req.body,
  }))

  return res.status(200).json({ ok: true })
}