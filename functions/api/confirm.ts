async function updateOrderStatus({
  supabaseUrl,
  supabaseServiceKey,
  orderId,
  status
}: {
  supabaseUrl: string
  supabaseServiceKey: string
  orderId: string
  status: string
}) {
  const endpoint = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`
  const res = await fetch(endpoint, {
    method: 'PATCH',
    headers: {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify({ status })
  })
  return res.ok
}

export async function onRequestGet({ request, env }: { request: Request; env: Record<string, string | undefined> }) {
  const url = new URL(request.url)
  const sessionId = url.searchParams.get('session_id')

  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Missing session_id' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  const stripeSecretKey = env.STRIPE_SECRET_KEY
  if (!stripeSecretKey) {
    return new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }

  const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${stripeSecretKey}` }
  })
  const session = await stripeRes.json().catch(() => null) as any

  if (!stripeRes.ok || !session) {
    return new Response(JSON.stringify({ error: 'Stripe error', details: session }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  const paymentStatus = session.payment_status
  const orderId = session.client_reference_id

  if (paymentStatus !== 'paid') {
    return new Response(JSON.stringify({ ok: true, paid: false, payment_status: paymentStatus }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  if (!orderId || typeof orderId !== 'string') {
    return new Response(JSON.stringify({ ok: true, paid: true, updated: false, reason: 'missing_client_reference_id' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  const supabaseUrl = env.SUPABASE_URL
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY || env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ ok: true, paid: true, updated: false, reason: 'missing_supabase_env' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  const updated = await updateOrderStatus({ supabaseUrl, supabaseServiceKey, orderId, status: 'Opłacone' })
  return new Response(JSON.stringify({ ok: true, paid: true, updated }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

