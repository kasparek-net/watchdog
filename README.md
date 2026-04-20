# Watchdog

[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](LICENSE)
[![Built with Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org)
[![Deploy on Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kasparek-net/watchdog)

> Tohle je template pro vlastní self-hosted instanci. **Veřejnou hostovanou verzi neprovozuju** — forkni a deployni si vlastní (free na Vercel + Neon + Resend + Clerk).

Self-hosted hlídač změn na webových stránkách. Zadáš URL, klikneš na element, a aplikace ho hodinu co hodinu zkontroluje. Když se text změní, dorazí email. Naskladnění zboží, změny cen, výskyt textu — bez měsíčních poplatků placeným službám typu Visualping nebo Distill.io.

## Features

- 🖱 **Vizuální picker** — najedeš myší v náhledu, klikneš a aplikace si zapamatuje CSS selector.
- ⏰ **Hodinové checky** přes GitHub Actions cron (zdarma).
- 📧 **Email notifikace** přes Resend (3 000 mailů / měsíc zdarma).
- 👥 **Multi-user** — každý má svoje hlídání i email (Clerk auth).
- 🔒 **Bezpečné** — sandboxed iframe picker, SSRF ochrana s DNS-rebind kontrolou, rate limity, timing-safe cron secret.
- 💸 **Zdarma** na Vercel Hobby + Neon free tier + Resend free tier + Clerk free tier.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Prisma · Postgres · Clerk · Resend · cheerio.

## Quick start (lokální vývoj)

```bash
git clone https://github.com/kasparek-net/watchdog
cd watchdog
npm install
cp .env.example .env
# vyplň DATABASE_URL, NEXT_PUBLIC_CLERK_*, CLERK_SECRET_KEY, RESEND_API_KEY, CRON_SECRET
npm run db:push          # vytvoří tabulky v DB
npm run dev
```

Otevři <http://localhost:3000>, zaregistruj se přes Clerk, vytvoř první hlídání.

Ruční trigger checku:

```bash
curl -X POST http://localhost:3000/api/cron/check \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Deploy na Vercel

1. Forkni repo a propoj s Vercelem (nebo klikni na "Deploy on Vercel" badge výše).
2. Vercel Marketplace → přidej **Neon Postgres**, **Clerk**, **Resend** (env proměnné se napojí automaticky).
3. Doplň `CRON_SECRET` (`openssl rand -hex 32`) a `APP_URL` (např. `https://watchdog.vercel.app`).
4. Po prvním deployi: `vercel env pull && npm run db:push`.
5. GitHub repo → Settings → Secrets and variables → Actions → přidej `APP_URL` a `CRON_SECRET`. Workflow `.github/workflows/cron.yml` pak každou hodinu volá `/api/cron/check`.

## Jak funguje picker

- `/watches/new` → zadáš URL → server stáhne HTML, sanitizuje (žádné `<script>`, `<form>`, `on*` atributy, žádný `<iframe>`), injectne `<base href>` a `/picker.js`.
- HTML jde do `<iframe srcdoc>` se `sandbox="allow-scripts"` (bez `allow-same-origin` = izolovaný od session, žádný přístup k cookies).
- V iframe `picker.js` na hover obtáhne element červeně, na klik spočítá unikátní CSS selector a pošle ho přes `postMessage` rodičovi.

Limitace: SPA stránky (React/Vue rendered klientem) v iframe neoživí — picker funguje na server-rendered HTML. Pro pokročilé případy lze selector vyplnit ručně.

## Cron flow

1. GitHub Actions (každou hodinu) → `POST /api/cron/check` s bearer tokenem.
2. Endpoint načte všechny aktivní watches, paralelně (limit 5) udělá `fetch` + cheerio extrakci podle CSS selectoru.
3. Spočítá SHA-256 hash. Když se liší od `lastHash`, vytvoří `Change` row a pošle email přes Resend.

## Bezpečnost

- `/api/preview` a `/api/watches` (POST) chrání rate limit per uživatel.
- URL fetcher (`/api/preview`, vytváření watches) blokuje privátní IP rozsahy a localhost — DNS lookup proběhne před fetchem (ochrana proti DNS rebindingu).
- Iframe picker běží v `sandbox="allow-scripts"` — žádný přístup k user session.
- `CRON_SECRET` se ověřuje timing-safe porovnáním. Bez nastaveného secretu endpoint vrací 503.
- Per-user limit počtu hlídání (`MAX_WATCHES_PER_USER`, default 50).

Reportuj bezpečnostní problémy podle [SECURITY.md](SECURITY.md).

## Contributing

PRs vítané. CI běží na každém pushi (typecheck + build). Žádné testy zatím nejsou — pokud něco přidáš, super.

Drobnější změny rovnou jako PR. Větší (refactor, nový provider, jiný DB driver) → otevři issue s návrhem.

## License

[MIT](LICENSE) © Jakub Kašpárek a contributors.

Použití na vlastní riziko.
