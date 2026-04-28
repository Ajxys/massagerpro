export async function onRequestPost({ request, env }: { request: Request; env: Record<string, string | undefined> }) {
  const body = await request.json().catch(() => ({})) as { orderId?: string; email?: string }
  const orderId = body.orderId
  const email = body.email

  if (!orderId || typeof orderId !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing orderId' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  const stripeSecretKey = env.STRIPE_SECRET_KEY
  const stripePriceId = env.STRIPE_PRICE_ID

  if (!stripeSecretKey || !stripePriceId) {
    return new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }

  const origin = new URL(request.url).origin
  const successUrl = `${origin}/success?session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = `${origin}/cancel`

  const params = new URLSearchParams()
  params.set('mode', 'payment')
  params.set('success_url', successUrl)
  params.set('cancel_url', cancelUrl)
  params.set('client_reference_id', orderId)
  params.set('line_items[0][price]', stripePriceId)
  params.set('line_items[0][quantity]', '1')
  if (typeof email === 'string' && email.trim().length > 0) params.set('customer_email', email)

  const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  })

  const stripeJson = await stripeRes.json().catch(() => null) as any
  if (!stripeRes.ok) {
    return new Response(JSON.stringify({ error: 'Stripe error', details: stripeJson }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  return new Response(JSON.stringify({ id: stripeJson?.id, url: stripeJson?.url }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}
