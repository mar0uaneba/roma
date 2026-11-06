# Roma Pack

Public website and admin dashboard for Roma Pack, a packaging trader (négociant) based in Rabat.

The public site is bilingual, **French and Arabic** (`/fr/...` and `/ar/...`, Arabic rendered right-to-left). Product copy lives in `lib/catalog.ts` (French fields plus an `ar` block) and can be replaced from the admin once Supabase is connected. The admin stays in French. Legal identity on the site uses the public registry record: SARL AU, ICE `003990345000040`, RC `201269`, Rabat.

## What works without credentials

- The marketing site, catalogue, sector pages, and quote form validation.
- The admin screens in read-only configuration mode at `/admin`.
- Category chart based on the published editorial catalogue.

## What does not work until configured

- Saving a quote. The form says so instead of pretending the request was received.
- Admin login and product editing.
- Quote notification emails.
- WhatsApp buttons. They stay hidden until `NEXT_PUBLIC_WHATSAPP_NUMBER` is set.
- Phone, public email, and street address. They stay hidden until set. The city shown is Rabat.

## Languages

- Routes live under `app/[lang]`. `proxy.ts` sends `/`, `/produits`, etc. to `/fr/...` or `/ar/...` using the `NEXT_LOCALE` cookie, then the browser's `Accept-Language`, then French.
- Interface text: `lib/i18n/dictionaries/fr.ts` and `ar.ts` (same keys; TypeScript fails the build if one is missing).
- Catalogue, categories and sectors: `lib/catalog.ts`. Database products have `*_ar` columns; an empty Arabic field falls back to French.
- Fonts: Outfit + Fraunces for French, IBM Plex Sans Arabic + Noto Kufi Arabic for Arabic (`app/fonts.ts`).
- RTL: layout uses logical utilities (`ms-`, `pe-`, `start-`, `end-`), and `app/globals.css` removes letter-spacing and italics on Arabic text.
- Quote requests store the visitor's language (`quote_requests.locale`) and show an `AR` badge in the admin. Product, range and sector values sent by the form stay in French so the team reads one language.

## Scripts

```bash
npm install
npm run dev
npm run build
npm run lint
```

Open `http://localhost:3000` (redirects to `/fr` or `/ar`).

## Environment

Copy `.env.example` to `.env.local`. Set values before deploying. `NEXT_PUBLIC_*` values are read at build time.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for metadata and the sitemap |
| `NEXT_PUBLIC_PHONE` | Public phone |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Public email |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | International number, digits, for `wa.me` links |
| `NEXT_PUBLIC_ADDRESS` | Street address |
| `NEXT_PUBLIC_ADDRESS_AR` | Street address in Arabic (optional, falls back to the French one) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` | Verified sender, for example `Roma Pack <devis@your-domain.com>` |
| `QUOTE_NOTIFY_EMAIL` | Inbox that receives quote notifications |

## Supabase

1. Create a project.
2. Run `supabase/setup.sql` in the SQL editor (it contains migrations 001, 002 and 003 and can be re-run). On an existing project that already has 001 and 002, run only `supabase/migrations/003_i18n.sql`.
3. In Authentication, create a user.
4. Promote that user:

```sql
update public.profiles
set role = 'admin'
where email = 'you@example.com';
```

5. Put the project URL and anon key in `.env.local`, then restart the app.
6. Sign in at `/admin/login`.
7. On Produits, use **Importer** to copy the editorial catalogue into the database.

Published database rows override the same slug. An unpublished row hides that editorial product. The public catalogue is cached for about an hour and refreshes when an admin saves a product.

The `product-images` bucket is created by the migration. Admins can upload from the product form. If storage policies fail in your project, paste an image URL instead.

Row level security:

- Anyone can submit a quote.
- Only an `admin` profile can read quotes and write products.
- The public catalogue is served by `public_products()`, which returns full content for published rows and only the slug for hidden ones, so a draft does not replace the editorial text in the open.

## Resend

All three Resend variables must be set. A notification is sent only after the quote has been stored. The form reports when email is not configured or when sending fails.

## WhatsApp

Set `NEXT_PUBLIC_WHATSAPP_NUMBER` to the full number without spaces, for example `212612345678`. Links open a prefilled conversation. This is not the WhatsApp Business API.

## Deploy on Vercel

The app is a Next.js App Router project. Import the repository, set the same environment variables, and deploy. `proxy.ts` handles the language redirect and protects `/admin` once Supabase is configured. Do not set `runtime = 'edge'`.

Add the production URL to Supabase Authentication redirect URLs if you later add magic links. Email and password sign-in uses the browser client and does not need a redirect URL.

## Photographs

Images in `public/images` come from Unsplash and Pexels under their standard licenses. They illustrate packaging types. They are not photographs of Roma Pack stock. Credits are stated on the legal page.

## Stack

Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn-style UI primitives, Motion, Lucide, Supabase, Zod, React Hook Form, Recharts, Resend.
