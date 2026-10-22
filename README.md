# Kela Counter

Report who "kela kha liya", climb (or dodge) the weekly leaderboard, share the card.

A mobile-first React app (Vite) on Supabase: Google sign-in, Postgres with row-level security, live leaderboard, photo storage and scheduled jobs. Everything free-tier.

```
supabase/setup.sql   the whole database: tables, rules, functions, weekly jobs, photo bucket
src/pages/           one file per screen
src/lib/             Supabase client, sign-in, game rules, share-card renderer
public/soch-lo.webp  the self-report cutout
```

---

## Setup, step by step (about 30 minutes, once)

You need three free accounts: **Supabase** (backend), **Google Cloud** (for "Continue with Google") and **Vercel** (hosting). Dashboard button names change now and then; if one isn't exactly where described, look for the closest match.

### 1. Create the Supabase project

1. Go to **supabase.com** → Sign up (use GitHub or Google).
2. Click **New project**.
   - Name: `kela-counter`
   - Database password: click **Generate**, then save it somewhere safe.
   - Region: the one nearest Pakistan (e.g. **Mumbai** or **Singapore**).
3. Wait about 2 minutes for it to finish setting up.

### 2. Turn on the scheduler

1. Left sidebar → **Database** → **Extensions**.
2. Search **pg_cron** → switch it **on**.

This runs the Monday 12 AM reset and the 24-hour Barra kela expiry.

### 3. Create the database

1. Left sidebar → **SQL Editor** → **New query**.
2. Open `supabase/setup.sql` from this project, copy **all** of it, paste it in.
3. Click **Run**. You should see "Success. No rows returned".

### 4. Set up Google sign-in

**In Google Cloud:**

1. Go to **console.cloud.google.com** → top bar project picker → **New project** → name it `kela-counter` → Create.
2. Search for **"OAuth consent screen"** (Google Auth Platform) → **Get started**.
   - App name: `Kela Counter`, support email: yours.
   - Audience: **External**.
   - Finish the steps and create it.
3. Under **Audience**, click **Publish app** so anyone with a Google account can sign in. (While it's in "Testing", only people you add as test users can.) The app only asks for name and email, so Google doesn't need to review it.
4. Go to **Clients** (or **Credentials**) → **Create client** → type **Web application**.
   - Name: `Kela Counter web`
   - Under **Authorized redirect URIs** add:
     `https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback`
     (Your project ID is in your Supabase URL; see step 5.)
   - Create, then copy the **Client ID** and **Client secret**.

**Back in Supabase:**

5. Left sidebar → **Authentication** → **Sign In / Providers** (or **Providers**) → **Google** → switch on, paste the Client ID and secret → **Save**.

### 5. Copy your two keys

Supabase → **Project Settings** (gear icon) → **API** / **Data API**. Copy:

- **Project URL**, like `https://abcdefgh.supabase.co`
- **anon public** key (a long string starting with `eyJ`, or a `sb_publishable_…` key)

These are safe to put in the website; the database rules protect the data.

### 6. Put the site online with Vercel

1. Go to **vercel.com** → Sign up **with GitHub**.
2. **Add New → Project** → pick the `kela-counter` repository → **Import**.
3. Framework: **Vite** (detected automatically).
4. Open **Environment Variables** and add both:
   - `VITE_SUPABASE_URL` = your Project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon public key
5. Click **Deploy**. You'll get a link like `https://kela-counter.vercel.app`.

### 7. Tell Supabase where the site lives

Supabase → **Authentication** → **URL Configuration**:

- **Site URL**: your Vercel link, e.g. `https://kela-counter.vercel.app`
- **Redirect URLs** → add:
  - `https://kela-counter.vercel.app/auth`
  - `http://localhost:5173/auth` (only needed if you run it on your own computer)

Save.

### 8. Try it

1. Open your Vercel link on your phone → **Start a realm** → Continue with Google.
2. Make your profile, create **The Realm**, tap **Share on WhatsApp** and send it to Shery, Ayaan and Huzaifa.
3. Once they've joined, report your first kela.

Tip: on the phone, use **Add to Home Screen** and it opens like an app.

---

## Using your own domain later

Vercel → your project → **Settings → Domains** → add it and follow the DNS steps. Then update the **Site URL** and **Redirect URLs** in Supabase step 7 to the new domain. Invite links automatically use whatever address the site is opened on.

## Running it on your computer (optional)

Needs Node.js 18+.

```bash
cp .env.example .env.local   # then fill in your two keys
npm install
npm run dev                  # opens http://localhost:5173
```

## How the rules are enforced

All game rules live in the database (`supabase/setup.sql`), so nobody can cheat by editing the page:

| Rule | Where |
|---|---|
| +1 / +2 / +3 kele; self-reports half and counted instantly | `report_kela` |
| Barra kela pending until 1 confirmation (not by the reporter or the eater) | `report_kela`, `confirm_report` |
| Unconfirmed Barra kela drops to +2 after 24 hours | `expire_pending` (every 15 min) |
| 4th report within 60 minutes → 15-minute cooldown | `report_kela` |
| Feeder is recorded but never visible | `report_meta` table has no read access |
| Only admins delete reports, remove members, make admins | `delete_report`, `remove_member`, `make_admin` |
| The only admin can't leave while others are in the realm | `leave_realm` |
| Weekly close Monday 12:00 AM PKT, Sultan = #1 (ties: whoever got there first) | `close_week` (Sunday 19:00 UTC) |

## Changing things

- **Severity labels, meme captions, icons, colours**: `src/lib/kela.js`
- **Share card layout**: `src/lib/shareCard.js`
- **Self-report cutout**: replace `public/soch-lo.png`
- **Look and feel**: `src/styles.css`

---

## Desktop and link previews

- **Desktop layout** kicks in at 900px wide: realms show as a grid, the realm page puts the report panel beside the leaderboard, and sheets open as centred pop-ups. On a laptop, `1` `2` `3` set severity, `Enter` reports and `Esc` closes pop-ups.
- **Link previews**: WhatsApp and other apps show `public/og.png` when someone pastes an invite link. The tags need the site's full address. On Vercel this is filled in automatically from your production domain. If you add a custom domain, also add an environment variable `VITE_SITE_URL` = `https://your-domain.com` and redeploy.
