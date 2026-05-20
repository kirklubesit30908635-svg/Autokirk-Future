import type { NextApiRequest, NextApiResponse } from 'next'

type ActivationSessionResponse =
  | {
      ok: true
      paid: boolean
      session_id: string
      payment_status: string | null
      customer_email: string | null
      customer_name: string | null
      amount_total: number | null
      currency: string | null
    }
  | { ok: false; error: string }

type StripeCheckoutSession = {
  id?: string
  payment_status?: string | null
  customer_details?: {
    email?: string | null
    name?: string | null
  } | null
  customer_email?: string | null
  amount_total?: number | null
  currency?: string | null
}

function cleanSessionId(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw) return null

  const trimmed = raw.trim()
  if (!trimmed.startsWith('cs_')) return null
  if (trimmed.length > 300) return null

  return trimmed
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ActivationSessionResponse>,
): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' })
    return
  }

  const sessionId = cleanSessionId(req.query.session_id)
  if (!sessionId) {
    res.status(400).json({ ok: false, error: 'SESSION_ID_REQUIRED' })
    return
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (!stripeSecretKey) {
    res.status(500).json({ ok: false, error: 'STRIPE_SECRET_KEY_NOT_CONFIGURED' })
    return
  }

  try {
    const response = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      {
        method: 'GET',
        headers: {
          authorization: `Bearer ${stripeSecretKey}`,
        },
      },
    )

    const body = await response.json()

    if (!response.ok) {
      const message =
        typeof body?.error?.message === 'string'
          ? body.error.message
          : 'STRIPE_SESSION_LOOKUP_FAILED'
      res.status(response.status).json({ ok: false, error: message })
      return
    }

    const session = body as StripeCheckoutSession
    const paymentStatus = session.payment_status ?? null
    const customerEmail =
      session.customer_details?.email ?? session.customer_email ?? null

    res.status(200).json({
      ok: true,
      paid: paymentStatus === 'paid',
      session_id: session.id ?? sessionId,
      payment_status: paymentStatus,
      customer_email: customerEmail,
      customer_name: session.customer_details?.name ?? null,
      amount_total: session.amount_total ?? null,
      currency: session.currency ?? null,
    })
  } catch (err) {
    res.status(502).json({
      ok: false,
      error: err instanceof Error ? err.message : 'STRIPE_LOOKUP_FAILED',
    })
  }
}
