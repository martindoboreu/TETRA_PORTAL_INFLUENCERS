# Linking tetraeducacao.com.br → Portal Afiliado

How the brand website (Next.js on Vercel) feeds the affiliate portal so every
dashboard number — clicks, leads, conversions, commission — fills with live data.

## Attribution model (coupon-first)

Hosted checkouts (Guru, Onprofit) don't carry our cookie, but they **always
carry the coupon code**. Each partner has a unique `discount_code`, so the
coupon is the reliable attribution key. The `ref` (from `/r/{slug}`) is a backup
for clicks/leads on the site itself.

```
partner shares  tetraeducacao.com.br/r/{slug}
      → portal records the CLICK, 302s to the site with ?ref={slug}
      → site stores ref cookie; the partner's COUPON is shown/pre-applied at checkout
lead form submit  → site POSTs to portal /api/track/lead         (ref or coupon)
purchase paid     → Guru/Onprofit POST their webhook → portal     (coupon → partner)
```

Commission is always computed in the portal from the partner's rate — never sent by anyone.

---

## Phase A — Portal env (set in the portal's Vercel project)

| var | value |
|---|---|
| `TETRA_INGEST_KEY` | long random secret (lead endpoint) |
| `GURU_WEBHOOK_TOKEN` | long random secret — also goes in the Guru webhook URL |
| `ONPROFIT_WEBHOOK_TOKEN` | long random secret — also goes in the Onprofit webhook URL |

Generate each with `openssl rand -hex 32`. Redeploy the portal after setting them.

---

## Phase B — Point the checkout webhooks at the portal

This is what makes **conversions** appear. No website code needed — it's dashboard config.

**Guru (Digital Manager Guru):** Settings → Webhooks → add:
```
https://portal.tetraeducacao.com.br/api/track/webhook/guru?token=<GURU_WEBHOOK_TOKEN>
```
Subscribe to the paid/approved and refund/chargeback events.

**Onprofit:** Integrations/Webhooks → add:
```
https://portal.tetraeducacao.com.br/api/track/webhook/onprofit?token=<ONPROFIT_WEBHOOK_TOKEN>
```

The adapter maps `approved/paid/aprovado/pago → confirmado` and
`refunded/chargeback/estornado → reembolsado`, extracts the coupon, amount,
product and buyer, and records the conversion against the matching partner.

> **First-sale check:** set `WEBHOOK_DEBUG=1` in the portal env temporarily. The
> first real webhook logs its full payload to Vercel logs. If any field (coupon,
> amount, product) didn't map, send me that payload and I'll adjust the field
> paths in `lib/webhooks.ts`. Turn `WEBHOOK_DEBUG` back off afterward.

### Make sure the coupon reaches checkout

Attribution depends on the partner's coupon being on the order. Two ways:
- **Simplest:** partners promote their coupon; buyers enter it at checkout.
- **Automatic:** when the site sends a visitor to checkout, pre-apply the coupon
  from the `tetra_ref` cookie (map slug→coupon, or pass the coupon in the
  checkout URL Guru/Onprofit accept). Ask me and I'll wire this once I see your
  checkout link format.

---

## Phase C — Website code (Next.js repo)

### 1. Referral links on the brand domain — `next.config.js`

```js
// tetraeducacao.com.br repo
module.exports = {
  async rewrites() {
    return [
      { source: '/r/:slug', destination: 'https://portal.tetraeducacao.com.br/r/:slug' },
    ]
  },
}
```
Now `tetraeducacao.com.br/r/{slug}` records the click in the portal and redirects on.

### 2. Capture the ref — root layout

```tsx
// app/layout.tsx — inside <body>, before children
<Script id="tetra-ref" strategy="afterInteractive">{`
  var r = new URLSearchParams(location.search).get('ref');
  if (r) document.cookie = 'tetra_ref=' + encodeURIComponent(r) +
    '; path=/; max-age=' + 60*60*24*30 + '; samesite=lax';
`}</Script>
```

### 2b. Personalize the visit — resolve the ref (THE core flow)

When a visitor arrives via an influencer link, turn the site into "their copy":
auto-apply the influencer's coupon at checkout and credit them on the page. The
portal exposes a public resolver:

```
GET https://portal.tetraeducacao.com.br/api/ref/{slug}
→ { valid: true, coupon: "IAREEL15", partner: { name, handle, initials } }
```

Use it server-side to read the `tetra_ref` cookie and stamp the experience:

```ts
// lib/attribution.ts (website repo)
export async function getAttribution(slug?: string) {
  if (!slug) return null
  const res = await fetch(`${process.env.TETRA_PORTAL_URL}/api/ref/${slug}`, {
    next: { revalidate: 300 },
  })
  const data = await res.json()
  return data.valid ? data : null   // { coupon, partner: { name, handle } }
}
```

Then, in your layout / checkout:
- **Auto-apply the coupon:** append `data.coupon` to every Guru/Onprofit
  checkout URL (or pre-fill the coupon field) so the buyer never types it and
  the sale attributes automatically.
- **Credit the influencer ("link back"):** render a small banner like
  *“Indicado por @{data.partner.handle}”* — the personalized touch that makes it
  the influencer's copy of the site.

Because attribution rides the coupon, the conversion is credited even if the
buyer bounces and returns days later — Guru/Onprofit still send the coupon in
the webhook.

### 3. Report leads — API route + form

Website env: `TETRA_PORTAL_URL=https://portal.tetraeducacao.com.br`,
`TETRA_INGEST_KEY=<same as portal>`.

```ts
// app/api/lead/route.ts  (website repo)
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { email, coupon } = await req.json()
  const ref = (await cookies()).get('tetra_ref')?.value
  await fetch(`${process.env.TETRA_PORTAL_URL}/api/track/lead`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-tetra-ingest-key': process.env.TETRA_INGEST_KEY! },
    body: JSON.stringify({ ref, coupon, buyer: email }),
  })
  return NextResponse.json({ ok: true })
}
```
Point your "quero saber mais" / newsletter form's submit at `POST /api/lead`
with the visitor's email. (Conversions come from the webhooks in Phase B — the
form only needs to report the lead.)

---

## Phase D — Verify end to end

```bash
# referral redirect works on the brand domain
curl -sI "https://tetraeducacao.com.br/r/<real-slug>" | grep -i location   # → 302 to site

# webhook auth gate
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  "https://portal.tetraeducacao.com.br/api/track/webhook/guru"             # → 401 (no token)
```
Then make one real R$ test purchase with a partner's coupon → it lands on that
partner's dashboard and the admin program totals within seconds (ranges are live).

For load/realism without real sales, use the simulation harness — see
[load-testing.md](load-testing.md).
