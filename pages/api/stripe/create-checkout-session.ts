import type { NextApiRequest, NextApiResponse } from 'next'

type CreateCheckoutResponse =
  | { ok: true; id: string; url: string }
  | { ok: false; error: string }

type StripeCheckoutSession = {
  id?: string
  url?: string | null
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function getBaseUrl(req: NextApiRequest): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)

  if (configured) return configured.replace(/\/$/, '')

  const origin = req.headers.origin
  if (typeof origin === 'string' && /^https?:\/\//.test(origin)) {
    return origin.replace(/\/$/, '')
  }

  const host = req.headers.host
  if (typeof host === 'string' && host.length > 0) {
    const proto = host.includes('localhost') ? 'http' : 'https'
    return `${proto}://${host}`
  }

  return 'https://autokirk.com'
}

function checkoutMode(): 'payment' | 'subscription' {
  return process.env.STRIPE_CHECKOUT_MODE === 'payment' ? 'payment' : 'subscription'
}

function requireUuidEnv(name: string): string {
  const value = process.env[name]
  if (!value || !UUID_PATTERN.test(value)) {
    throw new Error(`${name}_NOT_CONFIGURED`)
  }
  return value
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateCheckoutResponse>,
): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' })
    return
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  const stripePriceId = process.env.STRIPE_PRICE_ID

  if (!stripeSecretKey) {
    res.status(500).json({ ok: false, error: 'STRIPE_SECRET_KEY_NOT_CONFIGURED' })
    return
  }

  if (!stripePriceId) {
    res.status(500).json({ ok: false, error: 'STRIPE_PRICE_ID_NOT_CONFIGURED' })
    return
  }

  let workspaceId: string
  let actorId: string
  try {
    workspaceId = requireUuidEnv('AUTOKIRK_PLATFORM_WORKSPACE_ID')
    actorId = requireUuidEnv('AUTOKIRK_PLATFORM_ACTOR_ID')
  } catch (err) {
    res.status(500).json({ ok: false, error: err instanceof Error ? err.message : 'BILLING_MAPPING_NOT_CONFIGURED' })
    return
  }

  const baseUrl = getBaseUrl(req)
  const mode = checkoutMode()
  const params = new URLSearchParams({
    mode,
    success_url: `${baseUrl}/login?session_id={CHECKOUT_SESSION_ID}&next=/platform`,
    cancel_url: `${baseUrl}/platform?checkout=cancelled`,
    'line_items[0][price]': stripePriceId,
    'line_items[0][quantity]': '1',
    allow_promotion_codes: 'true',
    billing_address_collection: 'auto',
    'metadata[source]': 'autokirk_platform_activation',
    'metadata[workspace_id]': workspaceId,
    'metadata[actor_id]': actorId,
    'client_reference_id': workspaceId,
  })

  if (mode === 'subscription') {
    params.set('subscription_data[metadata][source]', 'autokirk_platform_activation')
    params.set('subscription_data[metadata][workspace_id]', workspaceId)
    params.set('subscription_data[metadata][actor_id]', actorId)
  }

  const customerEmail = typeof req.body?.email === 'string' ? req.body.email.trim() : ''
  if (customerEmail.includes('@') && customerEmail.length <= 254) {
    params.set('customer_email', customerEmail)
  }

  try {
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${stripeSecretKey}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const body = await response.json()

    if (!response.ok) {
      const message =
        typeof body?.error?.message === 'string'
          ? body.error.message
          : 'STRIPE_CHECKOUT_CREATION_FAILED'
      res.status(response.status).json({ ok: false, error: message })
      return
    }

    const session = body as StripeCheckoutSession
    if (!session.id || !session.url) {
      res.status(502).json({ ok: false, error: 'STRIPE_CHECKOUT_SESSION_INCOMPLETE' })
      return
    }

    res.status(200).json({ ok: true, id: session.id, url: session.url })
  } catch (err) {
    res.status(502).json({
      ok: false,
      error: err instanceof Error ? err.message : 'STRIPE_CHECKOUT_CREATION_FAILED',
    })
  }
}
