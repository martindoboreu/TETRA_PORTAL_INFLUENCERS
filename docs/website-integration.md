# Brand site → Portal: attribution wiring

The Tetra Partner Studio owns all attribution data. The brand website
(`tetraeducacao.com.br`, separate Vercel project) only has to do three small
things. Once these are in place, every dashboard number — funnel, link
performance, commission, payouts — fills with live data automatically.

## How attribution flows

```
partner shares  →  portal /r/{slug}  →  302 to brand site ?ref={slug}
                       (records click)
brand site: capture ?ref into a first-party cookie (tetra_ref)
brand site: on form submit     →  POST {portal}/api/track/lead
brand site: on payment success →  POST {portal}/api/track/conversion
```

Last-click attribution, 30-day window. The coupon code is a fallback path when
the cookie is missing (e.g. the buyer pasted `IAREEL15` at checkout directly).

## Required env on the brand site

```
TETRA_PORTAL_URL = https://<your-portal-domain>
TETRA_INGEST_KEY = <same value as the portal's TETRA_INGEST_KEY>
```

`TETRA_INGEST_KEY` must never reach the browser — only call the track endpoints
from the website's server (API route / server action / webhook handler).

## 1. Capture the ref into a cookie

Drop this on every page (a `<script>` in the root layout is enough):

```js
;(function () {
  var ref = new URLSearchParams(location.search).get('ref')
  if (ref) {
    document.cookie =
      'tetra_ref=' + encodeURIComponent(ref) +
      '; path=/; max-age=' + 60 * 60 * 24 * 30 + '; samesite=lax'
  }
})()
```

## 2. Report a lead (server-side)

Call when a visitor submits a form (newsletter, "quero saber mais"). Read the
`tetra_ref` cookie on the server and forward it:

```ts
await fetch(`${process.env.TETRA_PORTAL_URL}/api/track/lead`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-tetra-ingest-key': process.env.TETRA_INGEST_KEY!,
  },
  body: JSON.stringify({
    ref: tetraRefCookie,        // from the cookie; omit if absent
    coupon: couponEntered,      // optional fallback
    buyer: email,               // masked on the portal — raw value is NOT stored
    external_id: leadFormSubmissionId, // optional, dedupes retries
  }),
})
```

## 3. Report a conversion (server-side, on paid)

Call from your payment webhook (Stripe/Pagar.me/etc.) when an order is **paid**.
`order_id` is the idempotency key — safe to call multiple times.

```ts
await fetch(`${process.env.TETRA_PORTAL_URL}/api/track/conversion`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-tetra-ingest-key': process.env.TETRA_INGEST_KEY!,
  },
  body: JSON.stringify({
    order_id: order.id,         // REQUIRED — idempotency key
    ref: tetraRefCookie,
    coupon: order.couponCode,   // fallback attribution
    course: order.productName,
    amount: order.totalPaid,    // number, BRL
    buyer: order.customerEmail, // masked on the portal
    status: 'confirmado',       // 'confirmado' on paid; see below
  }),
})
```

Commission is computed on the portal from the partner's current rate — you
never send it.

### Follow-up events (same `order_id`)

- **Refund/chargeback** → POST again with `status: 'reembolsado'`. The row is
  updated; revenue is not duplicated.
- **Settlement** is handled inside the portal's payout flow, so you normally
  don't send `status: 'pago'` — but if your provider is the source of truth for
  settlement, posting it with the same `order_id` will transition the row.

## Optional: referral links on the brand domain

By default referral links resolve to `https://<portal>/r/{slug}`. To make them
read as `https://tetraeducacao.com.br/r/{slug}` instead, add a rewrite in the
**brand site's** `next.config`:

```js
async rewrites() {
  return [
    { source: '/r/:slug', destination: 'https://<your-portal-domain>/r/:slug' },
  ]
}
```

Then set the portal's `NEXT_PUBLIC_REFERRAL_BASE_URL=https://tetraeducacao.com.br/r`.
The click is still recorded by the portal route; only the visible domain changes.

## Quick test

```bash
# record a click + see the redirect (uses a seeded slug)
curl -sI "https://<portal>/r/marina-iareel" | grep -i location

# record a conversion
curl -s -X POST "https://<portal>/api/track/conversion" \
  -H "content-type: application/json" \
  -H "x-tetra-ingest-key: $TETRA_INGEST_KEY" \
  -d '{"order_id":"test-001","coupon":"IAREEL15","course":"Curso de IA","amount":997}'
# → {"ok":true,"attributed":true,"commission":...}
```

The new click/conversion appears on that partner's dashboard immediately
(ranges are computed live).
