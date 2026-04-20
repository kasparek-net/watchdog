# Watchdog

Self-hosted hlídač změn na webových stránkách. Zadáš URL, klikneš na element, aplikace ho hodinu co hodinu zkontroluje a při změně ti pošle email. Sleduj naskladnění zboží, ceny, výskyt textu — bez měsíčních poplatků.

Stack: Next.js 16 (App Router) · TypeScript · Tailwind v4 · Prisma · Postgres · Clerk · Resend.

## Lokální vývoj

```bash
npm install
cp .env.example .env
# vyplň DATABASE_URL, NEXT_PUBLIC_CLERK_*, CLERK_SECRET_KEY, RESEND_API_KEY
npm run db:push       # vytvoří tabulky v DB
npm run dev
```

Otevři <http://localhost:3000>, registruj se, vytvoř hlídání.

Ruční trigger checku (v jiném terminálu):

```bash
curl -X POST http://localhost:3000/api/cron/check \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Deploy na Vercel

1. Napushni repo na GitHub a propoj s Vercelem.
2. Vercel Marketplace → přidej **Neon Postgres**, **Clerk**, **Resend** (env proměnné se napojí automaticky).
3. Doplň `CRON_SECRET` (`openssl rand -hex 32`) a `APP_URL` (např. `https://watchdog.vercel.app`).
4. Po prvním deployi spusť migraci: `vercel env pull && npm run db:push`.
5. V GitHub repo → Settings → Secrets and variables → Actions přidej `APP_URL` a `CRON_SECRET`. Workflow `.github/workflows/cron.yml` pak každou hodinu volá `/api/cron/check`.

## Jak funguje picker

- `/watches/new` → zadáš URL → server stáhne HTML, sanitizuje (žádné `<script>`, `<form>`, `on*` atributy), injectne `<base href>` a `/picker.js`.
- HTML jde do `<iframe srcdoc>` se `sandbox="allow-scripts"` (bez `allow-same-origin` = izolovaný od session).
- V iframe `picker.js` na hover obtáhne element červeně, na klik spočítá unikátní CSS selector a pošle ho přes `postMessage` rodičovi.

Limitace: SPA stránky (React/Vue rendered klientem) v iframe nedoběhnou — picker funguje na server-rendered HTML. Pro pokročilé případy lze selector zadat ručně.

## Cron flow

1. GitHub Actions (každou hodinu) → `POST /api/cron/check` s bearer tokenem.
2. Endpoint načte všechny aktivní watches, paralelně (limit 5) udělá `fetch` + cheerio extrakci podle CSS selectoru.
3. Spočítá SHA-256 hash z extrahovaného textu. Když se liší od `lastHash`, vytvoří `Change` row a pošle email přes Resend.
