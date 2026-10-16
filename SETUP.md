# Hillcreek Properties — Site Setup

The site is a static website (works on GitHub Pages) that reads its property list from
a free Supabase database. Until Supabase is connected it runs in **demo mode** with
sample data so you can preview everything locally.

## What's in this folder

| File | What it is |
|---|---|
| `index.html` | Home page: hero, Available Homes, Our Homes (with Leased ribbons + waitlist), About, Resident Portal (RentReadi) |
| `property.html` | A single home: gallery, stats, description, features, apply / waitlist |
| `contact.html` | Contact Us form (general questions, emails you + saved to Inbox) |
| `apply.html` | Application + tour request form (emails `admin@hillcreekproperties.com`, also saved to the dashboard Inbox) |
| `admin.html` | Owner dashboard: availability toggles, edit every detail, upload photos, read the Inbox |
| `assets/js/config.js` | **The only file you edit to configure the site** (keys, RentReadi link, email) |
| `supabase/schema.sql` | Paste into Supabase once to create the database |
| `CNAME` | Tells GitHub Pages the site lives at hillcreekproperties.com |
| `assets-from-me/` | Drop the logo and property photos here |

## Step 1 — Logo
Save the logo as `assets/img/logo.png`. Until it exists the site shows a text wordmark.

## Status (updated 2026-10-16)
- Supabase project **hillcreek** is live (org: Hillcreek Properties). Keys are already in `config.js`. Owner login: admin@hillcreekproperties.com.
- Code is on GitHub at https://github.com/jbiller518/hillcreekproperties and GitHub Pages is enabled with custom domain hillcreekproperties.com.
- Still to do: GoDaddy DNS (Step 4, item 5) and the Web3Forms key (Step 3).

## Step 2 — Supabase (free database + photo storage + owner login) — DONE
1. Go to https://supabase.com and create a free account, then **New project** (name it `hillcreek`, pick a strong database password, region: East US).
2. In the left sidebar open **SQL Editor** → **New query**, paste the entire contents of `supabase/schema.sql`, press **Run**.
3. Open **Authentication** → **Users** → **Add user** → **Create new user**. Enter your email + a password. Tick "Auto confirm user". This is your dashboard login.
4. Open **Project Settings** → **API**. Copy the **Project URL** and the **anon public** key into `assets/js/config.js`:
   ```js
   SUPABASE_URL: "https://xxxx.supabase.co",
   SUPABASE_ANON_KEY: "eyJ...",
   ```
5. Also in Authentication → **Providers** → Email, turn **off** "Allow new users to sign up" so nobody else can create a login.

## Step 3 — Email delivery for the Apply form (free)
1. Go to https://web3forms.com, enter `admin@hillcreekproperties.com`, and click the confirmation link that lands in that inbox.
2. Paste the access key it gives you into `config.js` → `WEB3FORMS_KEY`.
Applications, tour requests and waitlist sign-ups are *also* saved to the dashboard Inbox, so nothing is lost if an email goes astray.

## Step 4 — Publish on GitHub Pages — DONE except DNS
1. Create a GitHub account (if you don't have one) and a new **public** repository named `hillcreekproperties`.
2. Upload every file and folder in this directory **except** `assets-from-me/` and `SETUP.md` (those are fine to include, just not needed).
3. Repository **Settings** → **Pages** → Source: *Deploy from a branch*, Branch: `main` / root. Save.
4. In the same Pages screen set **Custom domain** to `hillcreekproperties.com` and tick *Enforce HTTPS* once it verifies.
5. At your domain registrar add these DNS records:
   - `A` records for `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` record for `www` → `jbiller518.github.io`
   - Also delete the domain **Forwarding** rule (currently points to a Zillow listing) under DNS → Forwarding, or it will override the A records.

## Updating the site later
Edit files in this folder, then in a terminal here run:
```bash
git add -A && git commit -m "Update site" && git push
```
GitHub Pages republishes within a minute or two.

## Day-to-day
- Go to **hillcreekproperties.com/admin.html**, sign in.
- Flip the switch next to a home → it appears under *Available Homes* instantly and becomes clickable.
- **Edit** a home to set rent, beds/baths, square feet, pets, available date, description, features, cover photo and gallery.
- The **Inbox** tab shows every application, tour request and waitlist sign-up.
- `SHOW_LEASED_HOMES` in `config.js` controls whether leased homes appear at all (with a ribbon + waitlist) or are hidden.

## Changing the RentReadi link or email later
Edit `assets/js/config.js` and re-upload that one file.
