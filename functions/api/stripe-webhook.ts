function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let out = 0
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return out === 0
}

async function hmacSha256Hex(secret: string, message: string) {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function parseStripeSignature(header: string | null) {
  if (!header) return null
  const parts = header.split(',').map((p) => p.trim())
  const kv: Record<string, string[]> = {}
  for (const part of parts) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    const k = part.slice(0, idx)
    const v = part.slice(idx + 1)
    if (!kv[k]) kv[k] = []
    kv[k].push(v)
  }
  const t = kv.t?.[0]
  const v1 = kv.v1?.[0]
  if (!t || !v1) return null
  return { t, v1 }
}

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

async function fetchOrder({
  supabaseUrl,
  supabaseServiceKey,
  orderId
}: {
  supabaseUrl: string
  supabaseServiceKey: string
  orderId: string
}) {
  const base = supabaseUrl.replace(/\/$/, '')
  const url = `${base}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}&select=order_id,name,email,status,total,address,additional_info,created_at`
  const res = await fetch(url, {
    headers: {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`
    }
  })
  const data = await res.json().catch(() => null) as any
  if (!res.ok || !Array.isArray(data) || !data[0]) return null
  return data[0] as {
    order_id: string | null
    name: string | null
    email: string | null
    status: string | null
    total: string | null
    address: string | null
    additional_info: string | null
    created_at: string | null
  }
}

async function sendResendEmail({
  resendApiKey,
  from,
  to,
  subject,
  html
}: {
  resendApiKey: string
  from: string
  to: string
  subject: string
  html: string
}) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from, to, subject, html })
  })
  return res.ok
}

export async function onRequestPost({ request, env }: { request: Request; env: Record<string, string | undefined> }) {
  const secret = env.STRIPE_WEBHOOK_SECRET
  const stripeSig = request.headers.get('stripe-signature')

  if (!secret) {
    return new Response('Server not configured', { status: 500 })
  }

  const rawBody = await request.text()
  const parsed = parseStripeSignature(stripeSig)
  if (!parsed) return new Response('Bad signature header', { status: 400 })

  const timestamp = Number(parsed.t)
  if (!Number.isFinite(timestamp)) return new Response('Bad signature', { status: 400 })
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - timestamp) > 300) return new Response('Signature timestamp out of tolerance', { status: 400 })

  const signedPayload = `${parsed.t}.${rawBody}`
  const computed = await hmacSha256Hex(secret, signedPayload)
  if (!timingSafeEqual(computed, parsed.v1)) return new Response('Signature mismatch', { status: 400 })

  const event = JSON.parse(rawBody) as any
  if (event?.type !== 'checkout.session.completed') return new Response('ok', { status: 200 })

  const session = event?.data?.object
  const paymentStatus = session?.payment_status
  const orderId = session?.client_reference_id

  if (paymentStatus !== 'paid' || typeof orderId !== 'string') return new Response('ok', { status: 200 })

  const supabaseUrl = env.SUPABASE_URL
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY || env.SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseServiceKey) return new Response('ok', { status: 200 })

  const resendApiKey = env.RESEND_API_KEY
  const resendFrom = env.RESEND_FROM
  const resendTo = env.RESEND_TO

  const order = await fetchOrder({ supabaseUrl, supabaseServiceKey, orderId })
  if (!order) return new Response('ok', { status: 200 })
  if (order.status === 'Opłacone') return new Response('ok', { status: 200 })

  await updateOrderStatus({ supabaseUrl, supabaseServiceKey, orderId, status: 'Opłacone' })

  if (resendApiKey && resendFrom && resendTo) {
    const subject = order?.order_id ? `Nowe zamówienie ${order.order_id} (Opłacone)` : 'Nowe zamówienie (Opłacone)'
    const html = `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;">
        <h2 style="margin:0 0 12px;">Nowe zamówienie</h2>
        <p style="margin:0 0 16px;">Status: <strong>Opłacone</strong></p>
        <table cellpadding="0" cellspacing="0" style="border-collapse: collapse; width:100%;">
          <tr><td style="padding:6px 0; color:#64748b;">ID</td><td style="padding:6px 0;"><strong>${order?.order_id ?? ''}</strong></td></tr>
          <tr><td style="padding:6px 0; color:#64748b;">Klient</td><td style="padding:6px 0;">${order?.name ?? ''}</td></tr>
          <tr><td style="padding:6px 0; color:#64748b;">Email</td><td style="padding:6px 0;">${order?.email ?? ''}</td></tr>
          <tr><td style="padding:6px 0; color:#64748b;">Kwota</td><td style="padding:6px 0;">${order?.total ?? ''}</td></tr>
          <tr><td style="padding:6px 0; color:#64748b;">Adres</td><td style="padding:6px 0;">${order?.address ?? ''}</td></tr>
          <tr><td style="padding:6px 0; color:#64748b;">Dodatkowe info</td><td style="padding:6px 0;">${order?.additional_info ?? ''}</td></tr>
        </table>
      </div>
    `
    await sendResendEmail({ resendApiKey, from: resendFrom, to: resendTo, subject, html })
  }

  if (resendApiKey && resendFrom && order.email) {
    const subject = order.order_id ? `Order confirmed: ${order.order_id}` : 'Order confirmed'
    const html = `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;">
        <h2 style="margin:0 0 12px;">Your order is confirmed</h2>
        <p style="margin:0 0 16px;">Thanks for your purchase. We received your payment and accepted your order.</p>
        <table cellpadding="0" cellspacing="0" style="border-collapse: collapse; width:100%;">
          <tr><td style="padding:6px 0; color:#64748b;">Order</td><td style="padding:6px 0;"><strong>${order?.order_id ?? ''}</strong></td></tr>
          <tr><td style="padding:6px 0; color:#64748b;">Total</td><td style="padding:6px 0;">${order?.total ?? ''}</td></tr>
          <tr><td style="padding:6px 0; color:#64748b;">Shipping address</td><td style="padding:6px 0;">${order?.address ?? ''}</td></tr>
        </table>
        <p style="margin:16px 0 0; color:#64748b; font-size:12px;">If you have any questions, reply to this email.</p>
      </div>
    `
    await sendResendEmail({ resendApiKey, from: resendFrom, to: order.email, subject, html })
  }

  return new Response('ok', { status: 200 })
}
