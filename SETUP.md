# Gatekeep Shop — Setup Guide

This guide walks you through deploying your own Telegram storefront.
Written for people who have never deployed anything before. Every step
tells you exactly where to click and what to copy.

**Total time:** about 30 minutes.

If you get stuck at any point, jump to the **Troubleshooting** section
at the bottom.

---

## Before you start

You will create accounts on these websites. All are free. None require
a credit card.

| Service | What it's for |
|---|---|
| **[Supabase](https://supabase.com)** | Your database (product info, orders, customers) |
| **[Render](https://render.com)** | Runs your server |
| **[Vercel](https://vercel.com)** | Hosts your storefront |
| **[GitHub](https://github.com)** | Stores the code (you already have it) |
| **Telegram** | Where your bot and customers live |

**Sign in to each with GitHub or email.** Whichever is easier for you.

---

## Step 1 — Set up Supabase

Supabase is your database. It stores everything: products, orders,
customer info, uploaded images.

### 1a. Create a project

1. Go to [supabase.com](https://supabase.com) and click **Start your project**
2. Sign in (GitHub is easiest)
3. Click **New project**
4. Fill in:
   - **Name:** anything (e.g. `gatekeep-shop`)
   - **Database Password:** click "Generate a password" and **save it
     somewhere safe**. You probably won't need it, but keep it.
   - **Region:** pick the one closest to where most of your customers
     live
5. Click **Create new project**
6. Wait ~2 minutes while Supabase sets everything up

### 1b. Run the database schema

This creates all the tables your shop needs.

1. In Supabase, look at the left sidebar. Click **SQL Editor** (icon
   looks like a small terminal)
2. Click **New query**
3. Open the file `supabase/schema.sql` from your copy of this project
4. Copy **all** the content of that file
5. Paste it into the Supabase SQL Editor
6. Click **Run** (or press Ctrl+Enter / Cmd+Enter)

You should see **"Success. No rows returned"** at the bottom.

If you see a red error, jump to Troubleshooting.

### 1c. (Optional) Add demo products

Same steps as above, but paste the contents of `supabase/seed.sql`
instead. This adds 6 sample products and 4 categories so your shop isn't
empty when you first open it.

You can delete these later from the admin dashboard.

### 1d. Copy your four Supabase values

These are what connect your shop to your database.

1. In Supabase, click the **gear icon** at the bottom of the left
   sidebar (Settings)
2. Click **API** in the settings menu
3. You'll see these values on the page. Copy each one into a notepad
   or text file (you'll need them in Step 3):

   | Label on this page | What to copy |
   |---|---|
   | **Project URL** | The `https://xxxxx.supabase.co` URL |
   | **anon / public** | A long string starting with `eyJ...` |
   | **service_role / secret** | Another long string. Click "Reveal" to see it. |

4. Now scroll down on the same page to the section **JWT Settings**.
   Click **Reveal** next to **JWT Secret**.
5. Copy that too. It's another long string.

**You now have 4 values from Supabase.** Keep them in your notepad.

⚠️ **Important:** The `service_role` key and the JWT secret are
passwords. Never share them publicly, never put them in GitHub.

---

## Step 2 — Create your Telegram bot

The bot is what your customers message. It's also how they open your
store.

### 2a. Create the bot

1. Open Telegram and search for **@BotFather**
2. Start a chat and send `/newbot`
3. BotFather asks for a **name** — anything you want (e.g. `My Shop`)
4. Then it asks for a **username** — this must end in "bot"
   (e.g. `MyShopBot`)
5. BotFather replies with a message containing your bot **token**. It
   looks like:
   ```text
   1234567890:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
6. **Copy that token.** Save it in your notepad.

### 2b. Find your Telegram user ID

1. In Telegram, search for **@userinfobot**
2. Start a chat and send `/start`
3. It replies with your user ID — a number like `123456789`
4. **Copy that number.** Save it.

This ID becomes the "owner" of your shop. That account always has full
access, even if you accidentally lock yourself out later.

### 2c. Note your bot username

Look at BotFather's reply again. Your bot's username (without the `@`)
goes in your notepad too. Example: if the bot is `@MyShopBot`, you save
`MyShopBot`.

**You now have 3 values from Telegram:**
- Bot token
- Your Telegram user ID
- Bot username (without @)

---

## Step 3 — Deploy the server to Render

Render runs the backend of your shop — the part that talks to Supabase,
Stripe, and Telegram.

### 3a. Create the service

1. Go to [render.com](https://render.com) and sign in
2. Click **New +** → **Web Service**
3. Connect your GitHub account if prompted
4. Find and select your **Gatekeep Shop** repository
5. Fill in these settings:

   | Setting | Value |
   |---|---|
   | **Name** | anything (e.g. `gatekeep-shop-server`) |
   | **Region** | closest to your Supabase region |
   | **Branch** | `main` |
   | **Root Directory** | `server` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install --include=dev && npm run build` |
   | **Start Command** | `node dist/index.js` |
   | **Instance Type** | **Free** |

6. Click **Create Web Service**. It'll start building. **Don't wait for
   it yet** — it will fail because we haven't added environment
   variables. That's fine.

### 3b. Add environment variables

1. In Render, once the service is created, click the **Environment** tab
   on the left
2. Click **Add Environment Variable** for each of these. Copy the values
   from your notepad:

   | Key | Value | Where it came from |
   |---|---|---|
   | `PORT` | `8080` | Just type this |
   | `NODE_ENV` | `production` | Just type this |
   | `SUPABASE_URL` | your Supabase **Project URL** | Step 1d |
   | `SUPABASE_ANON_KEY` | your Supabase **anon** key | Step 1d |
   | `SUPABASE_SERVICE_ROLE_KEY` | your Supabase **service_role** key | Step 1d |
   | `SUPABASE_JWT_SECRET` | your Supabase **JWT Secret** | Step 1d |
   | `TELEGRAM_BOT_TOKEN` | your bot token | Step 2a |
   | `ADMIN_TELEGRAM_ID` | your Telegram user ID | Step 2b |
   | `TELEGRAM_BOT_USERNAME` | your bot username (no @) | Step 2c |
   | `CLIENT_ORIGIN` | `https://placeholder.vercel.app` | Temporary — we'll fix this in Step 4 |
   | `MINI_APP_URL` | `https://placeholder.vercel.app` | Temporary |
   | `PUBLIC_SERVER_URL` | `https://placeholder.onrender.com` | Temporary — we'll fix this in Step 3c |

   Click **Save Changes** when done.

   ⚠️ **Note:** `CLIENT_ORIGIN`, `MINI_APP_URL`, and `PUBLIC_SERVER_URL`
   are placeholders for now. We'll replace them after we deploy the
   client. Render will keep failing until then — that's expected.

### 3c. Get your Render URL

1. After you save the env vars, wait ~1 minute for the service to
   restart.
2. At the top of the Render page, you'll see a URL like:
   ```text
   https://gatekeep-shop-server.onrender.com
   ```
   (The actual name depends on what you typed in "Name".)
3. **Copy that URL.** Save it in your notepad.

4. Now go back to **Environment** and update `PUBLIC_SERVER_URL` to that
   URL. Click **Save Changes**.

Render will restart again. You should see a green "Live" status at the
top and logs saying:
```text
Gatekeep Shop server listening on :8080
[bot] long-polling started
```

If you see those two lines, the server is running.

---

## Step 4 — Deploy the client to Vercel

Vercel hosts your storefront — the actual page customers see.

### 4a. Create the project

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New...** → **Project**
3. Find your **Gatekeep Shop** repo and click **Import**
4. Fill in:

   | Setting | Value |
   |---|---|
   | **Framework Preset** | `Vite` |
   | **Root Directory** | `client` |

5. **Before clicking Deploy**, expand the **Environment Variables**
   section and add these:

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | your Render URL from Step 3c |
   | `VITE_SUPABASE_URL` | your Supabase Project URL |
   | `VITE_SUPABASE_ANON_KEY` | your Supabase anon key |
   | `VITE_BOT_USERNAME` | your bot username (no @) |

   For each one: type the key, type the value, click **Add**.

6. Click **Deploy**. Wait ~1 minute.

### 4b. Get your Vercel URL

Vercel shows you the deployed URL — something like:
```text
https://gatekeep-shop.vercel.app
```

**Copy that URL.** Save it.

### 4c. Close the loop

Now we go back and replace the placeholders we left in Render.

1. Go back to **Render** → your server → **Environment**
2. Update these three variables to your real Vercel URL:

   | Key | New value |
   |---|---|
   | `CLIENT_ORIGIN` | your Vercel URL |
   | `MINI_APP_URL` | your Vercel URL |

3. Click **Save Changes**. Render restarts.

---

## Step 5 — Register the Mini App with Telegram

This step is what makes invite links and direct links work. Don't skip it.

### 5a. Register the app

1. Open Telegram and go to **@BotFather**
2. Send `/newapp`
3. Select your bot from the list
4. BotFather asks you to fill in:

   | Field | What to enter |
   |---|---|
   | **Title** | anything (e.g. `My Shop`) |
   | **Description** | anything short |
   | **Photo** | upload any image — recommended 640×360 |
   | **Web App URL** | your Vercel URL from Step 4b |
   | **Short name** | **type exactly: `store`** |

5. BotFather confirms and gives you your Mini App link, e.g.
   `t.me/YourBotUsername/store`

⚠️ **The short name must be `store`.** The code in this template
   builds invite links as `t.me/<bot>/store?startapp=inv_...`. If you
   choose a different short name, invite links will break.

   *If you really want a different short name:* after finishing `/newapp`,
   open `client/src/pages/admin/Team.tsx` and change the line:

   ```ts
   const APP_SHORT_NAME = 'store';
   ```

   Set it to whatever short name you chose in BotFather, then redeploy
   the client.

### 5b. Set the menu button

1. Still in BotFather, send `/mybots` → your bot → **Bot Settings** → **Menu Button**
2. Set the URL to your Vercel URL

This adds a button in the chat that opens your shop with one tap.

---

## Step 6 — Open your shop

1. Open Telegram
2. Search for your bot's username
3. Click the **Menu** button (bottom left of the chat)
4. Your storefront opens

You'll see the shop with your demo products (if you ran `seed.sql`) and
the **Admin** tab at the bottom (because your Telegram ID is the
`ADMIN_TELEGRAM_ID`).

**Try this first:**

1. Tap **Admin** → **Products** → **Add product**
2. Give it a name, price, and save
3. Tap **Shop** to see it appear

If it does, you're live.

---

## Optional — Enable Stripe card payments

Skip this if you don't want to take card payments.

### 1. Get your Stripe keys

1. Go to [stripe.com](https://stripe.com) and create an account (or
   sign in)
2. In the Stripe dashboard, make sure you're in **Test mode** first
   (top-right toggle). Test mode lets you test payments without using
   real money.
3. Go to **Developers** → **API keys**
4. Copy the **Secret key** (starts with `sk_test_...` for test mode, or
   `sk_live_...` for real payments)
5. Save it in your notepad

### 2. Set up the webhook

1. Still in Stripe, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. **Endpoint URL:** your Render URL + `/api/payments/stripe/webhook`
   (example: `https://gatekeep-shop-server.onrender.com/api/payments/stripe/webhook`)
4. **Events to send:** click **Select events** and add exactly these two:
   - `checkout.session.completed`
   - `checkout.session.expired`
5. Click **Add endpoint**
6. On the next page, click **Reveal** next to **Signing secret**
7. Copy that value. Save it.

### 3. Add Stripe env vars to Render

1. Render → your server → **Environment**
2. Add these two variables:

   | Key | Value |
   |---|---|
   | `STRIPE_SECRET_KEY` | your Stripe secret key |
   | `STRIPE_WEBHOOK_SECRET` | your webhook signing secret |

3. Save. Render restarts.

### 4. Enable Stripe in your shop

1. Open the shop in Telegram
2. Go to **Admin** → **Settings**
3. Scroll down to the **Payments** section
4. Find **Card (Stripe)** and toggle it on
5. Scroll down and click **Save payment settings**

Test it by buying your own product with card
`4242 4242 4242 4242` (any future expiry, any CVC). When Stripe's test
payment succeeds, the order will flip to **Paid** automatically and you
can refund it in Stripe.

When you're ready for real payments, switch back to live mode in Stripe
and replace the two env vars with the live versions.

---

## Optional — Fix for blocked regions

Some ISPs — notably in **India, Myanmar, UAE, and parts of the Middle
East** — block `*.supabase.co` at the DNS level. If your customers are
in those regions, images and downloads won't load for them.

Gatekeep Shop ships with a built-in proxy that solves this. The proxy
lives on your Render server (which isn't blocked) and forwards storage
requests through to Supabase.

**To enable it:**

If you followed Step 3b, it's already on — `PUBLIC_SERVER_URL` is set
and the server registers the `/sb/*` route automatically.

**One extra step if you already added products:**

Any products added before you enabled the proxy might have image URLs
pointing directly at Supabase. Run this in your Supabase SQL Editor to
rewrite them:

```sql
update public.products
set image_url = replace(
  image_url,
  'https://YOUR-PROJECT-REF.supabase.co',
  'https://YOUR-RENDER-URL.onrender.com/sb'
)
where image_url like 'https://YOUR-PROJECT-REF.supabase.co%';
```

Replace:
- `YOUR-PROJECT-REF` — the subdomain from your Supabase Project URL
  (e.g. `xyzabcdefghijklm`)
- `YOUR-RENDER-URL` — your Render URL without `https://` (e.g.
  `gatekeep-shop-server.onrender.com`)

New products uploaded after this are automatically proxied — no action
needed.

---

## How to invite other admins

You might want a second person to help manage orders.

1. In your shop, tap **Admin** → **Team**
2. Tap **Invite admin**
3. A one-time link is copied to your clipboard
4. Send it to whoever should become an admin
5. When they open it in Telegram, they're promoted

The link expires in **48 hours** and can only be used once.

To invite someone as a **superadmin** (full control including removing
other admins), tap **Invite superadmin** instead — you'll only see that
button if you're already a superadmin.

---

## Customizing your shop

Everything is done from inside the app. No code changes needed.

| What you want to change | Where to go in the app |
|---|---|
| Store name, tagline, currency | **Admin → Settings** → Store section |
| Free shipping threshold | **Admin → Settings** → Store section |
| Payment methods | **Admin → Settings** → Payments section |
| Home banner | **Admin → Settings** → Home banner section |
| Perks shown on product pages | **Admin → Settings** → Product perks section |
| Categories | **Admin → Categories** |
| Products (add, edit, delete) | **Admin → Products** |
| Orders (view, confirm, ship) | **Admin → Orders** |
| Team members | **Admin → Team** |

---

## Troubleshooting

### "Open this app from inside Telegram."

You're opening the storefront in a regular browser. Open Telegram
instead, find your bot, and use its menu button.

### "initData: invalid hash"

Your `TELEGRAM_BOT_TOKEN` on Render doesn't match the bot that opened
the app. Check that the token in Render's Environment tab is the same
one BotFather gave you.

### The Admin tab is missing

Your Telegram user ID isn't in `ADMIN_TELEGRAM_ID` on Render. Check
that it matches your numeric ID from `@userinfobot` exactly (no spaces,
no `@`).

### "Failed to fetch" / images won't load / downloads don't work

If you're in India, Myanmar, UAE, or a similar region, your ISP may be
blocking `*.supabase.co`. Enable the storage proxy (see **Optional —
Fix for blocked regions** above).

If your region isn't blocked and you still see this, check that
`PUBLIC_SERVER_URL` on Render is set to your actual Render URL.

### CORS error in the browser console

`CLIENT_ORIGIN` on Render doesn't match your Vercel URL exactly. Make
sure it's the full URL with `https://` and no trailing slash.

### Stripe payment doesn't complete

1. Check Render's logs for errors
2. In Stripe, go to **Developers → Webhooks → your endpoint** and look
   at **Recent deliveries**. Every event should have a green 200
   response.
3. If they show timeouts, your Render service is sleeping. The free tier
   sleeps after 15 minutes of inactivity — first request takes ~10
   seconds to wake it. Stripe retries on its own.

### "Permission denied for table X"

Your Supabase grants weren't applied. Re-run `supabase/schema.sql` in
the SQL Editor.

### "Missing environment variables on boot"

Check Render's logs. It'll tell you exactly which variable is missing
or malformed. Compare against Step 3b.

### Invite link doesn't promote the person

Two things must be true:

1. **You've completed `/newapp` in BotFather.** Without it, Telegram
   never passes the `startapp=` parameter to your Mini App, and the
   server has nothing to redeem. See Step 5.

2. **The app short name in BotFather matches the code.** The default
   is `store`. If you chose a different short name in BotFather, open
   `client/src/pages/admin/Team.tsx` and update the `APP_SHORT_NAME`
   constant to match, then redeploy.

Also: links are single-use and expire 48 hours after creation. If a
link doesn't work, revoke it and create a fresh one.

### I want to start over

1. Delete the Supabase project, create a new one, re-run `schema.sql`
2. On Render, use the "Clear build cache & deploy" option
3. On Vercel, trigger a new deployment from the Deployments tab

Nothing is permanent except your data.

### Something else

Email **swiss9.dev@gmail.com** with:
- What you were trying to do
- What happened (screenshot if possible)
- Any error messages from Render's or Vercel's logs

---

## What to do after launch

Once your shop is running:

1. **Add your real products** — deactivate the demo ones (Admin →
   Products → toggle off) or delete them
2. **Customize the banner** — Admin → Settings → Home banner
3. **Set up payment methods** you actually want — Admin → Settings →
   Payments
4. **Invite a second admin** if you have staff — Admin → Team
5. **Test a real order** end-to-end before announcing your shop

Once you're confident, share the bot link with your customers:
`https://t.me/YourBotUsername`

That's it. Good luck.
