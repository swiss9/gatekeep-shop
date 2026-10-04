# Gatekeep Shop

**A Telegram storefront, ready to sell.**

Deploy it, add products, start selling. No code editing required.

---

## What this is

A complete Telegram Mini App storefront. Your customers open it inside
Telegram, browse products, pay, and receive their order — all without
leaving the app.

You get:

- A **storefront** — product grid, search, categories, cart, checkout
- An **admin dashboard** — manage products, orders, categories, banner,
  team, and settings from inside Telegram
- **Six payment methods** — Telegram Stars, Stripe, bank transfer,
  crypto, cash on delivery, and "arrange with seller"
- **Digital delivery** — sell files (PDFs, ZIPs, audio, video). Buyers
  get download links automatically the moment payment is confirmed.
- **Team management** — invite admins, split roles, transfer ownership
- **Regional resilience** — a built-in storage proxy so the shop works
  even in countries that block Supabase

---

## What's not included

- **No payment processor account.** You connect Stripe or Telegram Stars
  yourself — no fees go to us.
- **No hosting.** You deploy to your own free accounts (Render, Vercel,
  Supabase).
- **No customer support for your shop.** Your buyers contact you, not us.

---

## Quick start

New here? Read **[SETUP.md](./SETUP.md)**. It walks through everything —
from creating your first Supabase account to opening your store for the
first time. No coding required.

The short version of what you'll do:

1. Create a Supabase project, run two SQL files
2. Create a Telegram bot
3. Deploy the server to Render (free)
4. Deploy the client to Vercel (free)
5. Register the Mini App with BotFather — **use short name `store`**
6. Open your shop in Telegram

**Total time:** about 30 minutes.

---

## What you'll need

All free. No credit card required for any of them.

- A **[Supabase](https://supabase.com)** account
- A **[Render](https://render.com)** account
- A **[Vercel](https://vercel.com)** account
- A **Telegram** account
- A **GitHub** account (to fork this repo)

For paid features, you'll also want:

- A **[Stripe](https://stripe.com)** account (for card payments)
- A **Telegram wallet** (for withdrawing Stars earnings)

---

## After it's running

Everything is configurable from inside the app:

| What | Where in the app |
|---|---|
| Store name, currency, shipping | Admin → Settings → Store |
| Payment methods | Admin → Settings → Payments |
| Home banner | Admin → Settings → Home banner |
| Product page perks | Admin → Settings → Product perks |
| Categories | Admin → Categories |
| Products | Admin → Products |
| Orders, receipts, confirmations | Admin → Orders |
| Invite other admins | Admin → Team |

No code editing needed for any of the above.

---

## For developers

If you want to modify the code:

- **Server:** `server/` — Fastify + TypeScript, runs on Bun or Node 22+
- **Client:** `client/` — React 18 + Vite
- **Database:** `supabase/schema.sql` — full schema in one file
- **Demo data:** `supabase/seed.sql` — 6 sample products

The storefront uses a custom design system with Inter, Space Grotesk,
and JetBrains Mono. Everything is plain CSS with variables in
`client/src/styles/globals.css`.

---

## Troubleshooting

For most issues, see the **Troubleshooting** section at the bottom of
[SETUP.md](./SETUP.md). It covers the common gotchas:

- "initData: invalid hash"
- Admin tab missing
- Images or downloads not loading (regional blocking)
- Stripe webhook failures
- Cart or checkout issues

---

## Support

**swiss9.dev@gmail.com**
**t.me/swiss9dev**
---

## License

Commercial single-use. See `LICENSE`. One license = one storefront.
