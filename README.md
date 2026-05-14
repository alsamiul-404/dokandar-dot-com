<div align="center">

![দোকানদার.app](./public/icons/icon-192.svg)

# দোকানদার.অ্যাপ

**ক্ষুদ্র ব্যবসায়ীদের ডিজিটাল সঙ্গী**

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)](https://www.prisma.io/)

</div>

দোকানদার.অ্যাপ is a **Progressive Web App (PWA)** for small retailers in Bangladesh: **বাকি খাতা**, **স্টক**, **POS বিক্রয়**, **দৈনিক রিপোর্ট**, **SMS রিমাইন্ডার**, and **PDF রিপোর্ট**—with **OTP লগইন** powered by **SSL Wireless** SMS where configured.

For architecture, data model, and engineering decisions, see **[GUIDE.md](./GUIDE.md)**.

---

## Tech stack

| Layer              | Choice                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------- |
| Framework          | **Next.js 14** (App Router, React Server Components where applicable)                    |
| API                | **Route Handlers** under `src/app/api` (same deploy unit as the UI)                      |
| Data               | **Prisma** + **PostgreSQL** (local Docker / Supabase / Neon; same stack in dev and prod) |
| Auth               | **NextAuth.js** (credentials / OTP flow)                                                 |
| Client HTTP        | **Axios** (`src/lib/axios-instance.ts`, `withCredentials`)                               |
| Server state       | **TanStack Query v5** (`src/hooks/dokandar.ts`)                                          |
| Forms & validation | **react-hook-form** + **Zod**                                                            |
| Money              | **decimal.js**                                                                           |
| PDF                | **jsPDF** + Bengali-aware helpers                                                        |
| PWA                | **next-pwa** (Workbox runtime caching)                                                   |
| SMS                | **SSL Wireless** (ISMS+ JSON v3 or legacy push API) — `src/lib/sms.ts`                   |
| UI                 | **Tailwind CSS**, **shadcn/ui**-style primitives, **Lucide** icons                       |

---

## Key features

- **বাকি খাতা** — গ্রাহক, লেনদেন লাইন, বাকি ব্যালেন্স, পেমেন্ট / অ্যাডজাস্টমেন্ট এন্ট্রি
- **স্টক হিসাব** — পণ্য, ক্রয়/বিক্রয় মূল্য, স্টক অ্যাডজাস্টমেন্ট ও লগ
- **দৈনিক বিক্রি ও লাভ** — ড্যাশবোর্ড সারি, রিপোর্ট API, তারিখ ফিল্টার
- **POS / চেকআউট** — লাইন আইটেম, নগদ + বাকি, গ্রাহক লিঙ্কড বাকি
- **SMS রিমাইন্ডার** — বাকি টেমপ্লেট (SSL Wireless env থেকে)
- **PDF রিপোর্ট** — দৈনিক বিক্রি ও গ্রাহক লেজার (ক্লায়েন্ট-সাইড জেনারেশন)

---

## Prerequisites

- **Node.js 20+** (LTS recommended)
- **npm** 9+ (or compatible package manager)

---

## Local setup

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd Dokandar.app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` at minimum:
   - `DATABASE_URL` — **PostgreSQL**; on Supabase use the **transaction pooler** (port **6543**, `pgbouncer=true`) — see `.env.example`
   - `DIRECT_DATABASE_URL` — for **Prisma migrate**: Supabase **direct** URI (host **`db.<project-ref>.supabase.co`**, user **`postgres`**, port **5432**) — not the pooler hostname. Copy both strings from **Supabase → Project Settings → Database**
   - `NEXTAUTH_SECRET` — long random string ([generate](https://generate-secret.vercel.app/32))
   - `NEXTAUTH_URL` — production / `npm run start` target. For **`npm run dev`**, `scripts/dev.mjs` sets **`NEXTAUTH_URL=http://127.0.0.1:<port>`** to match the dev server (same host as Next’s **Local:** line).
   - **Do not set `PORT` in `.env` for local dev** — it can make Next retry other ports so logs no longer match. `npm run dev` passes **`next dev -p …`** (prefers **3000**, then **5000**, then fallbacks). Set **`PORT`** only when you run **`npm run start`**. On many Windows PCs, **2945–3044** are reserved (Hyper-V), so **3000** often cannot bind (`EACCES`).
   - Optional: `NEXT_PUBLIC_API_URL` — defaults to same-origin `/api`
   - For real OTP SMS: `SSL_WIRELESS_API_KEY`, `SSL_WIRELESS_SENDER_ID`, etc. (see `.env.example`)

   If Prisma fails downloading engines with **certificate** errors, the npm scripts already set `NODE_OPTIONS=--use-system-ca` (Windows / corporate TLS).

   **Local PostgreSQL** (Docker one-liner):

   ```bash
   docker run --name dokandar-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=dokandar -p 5432:5432 -d postgres:16
   ```

   Then set `DATABASE_URL` to e.g. `postgresql://postgres:postgres@localhost:5432/dokandar?schema=public`.

4. **Prisma client & database**

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

   - **`db:migrate`** runs `prisma migrate dev` and applies versioned SQL under `prisma/migrations/` (use this for day-to-day schema changes).
   - **`db:push`** (`prisma db push`) is still available for disposable scratch databases only; it does not replace migrations for team/production workflows.

5. **Run the dev server**

   ```bash
   npm run dev
   ```

   **`npm run dev`** runs `scripts/dev.mjs`: picks a free port (**3000 → 5000 → …**), runs **`next dev -H 127.0.0.1 -p <that port>`**, and sets **`NEXTAUTH_URL`** for that process so it matches the server.

   Open the URL Next prints as **Local:** (e.g. `http://127.0.0.1:5000`). That line is the source of truth—there is no separate `[dokandar]` port line anymore.

   If you see **`EADDRINUSE`**, stop the other `next dev` (or any app on that port), then run `npm run dev` again.

---

## Scripts

| Command                     | Description                                                                                         |
| --------------------------- | --------------------------------------------------------------------------------------------------- |
| `npm run dev`               | `scripts/dev.mjs` — prefers **:3000**, then **:5000**, else next free port + session `NEXTAUTH_URL` |
| `npm run build`             | Production build                                                                                    |
| `npm run start`             | Start production server                                                                             |
| `npm run lint`              | ESLint (Next.js config + Prettier compatibility)                                                    |
| `npm run format`            | Prettier — write                                                                                    |
| `npm run format:check`      | Prettier — check only                                                                               |
| `npm run db:generate`       | `prisma generate`                                                                                   |
| `npm run db:migrate`        | `prisma migrate dev` (development)                                                                  |
| `npm run db:migrate:deploy` | `prisma migrate deploy` (CI / production)                                                           |
| `npm run db:push`           | `prisma db push` (throwaway DBs only)                                                               |
| `npm run db:studio`         | Prisma Studio                                                                                       |

---

## Deployment (Vercel + Supabase)

1. **Supabase**
   - Create a project → **Settings → Database** → copy the **URI** (use **Transaction** or **Session** mode as recommended by Prisma docs for serverless).
   - Set `DATABASE_URL` in Vercel to that URI (often with `?pgbouncer=true` / `sslmode=require` as required).

2. **Prisma migrations**
   - The datasource is already **PostgreSQL**. Deploy migrations from CI or locally:

     ```bash
     npm run db:migrate:deploy
     ```

   **Migrate errors (Supabase)**
   - **`P1000` Authentication failed** — wrong password or wrong connection string. In **Settings → Database**, reset the DB password if unsure, then paste the **Transaction pooler** URI into `DATABASE_URL` and either the **Session pooler** (port **5432**, same pooler host) or **Direct connection** URI into `DIRECT_DATABASE_URL` (host like `db.<project-ref>.supabase.co`, user **`postgres`**). Both must use the **same** DB password. URL-encode special characters in the password (`#` → `%23`, `@` → `%40`).
   - **`P1001` Can't reach server** — typo in host, VPN/firewall, or wrong **project ref** in `db.<ref>.supabase.co`; copy the URI from the dashboard instead of guessing.

3. **Vercel**
   - Import the Git repository.
   - Set all env vars from `.env.example` (especially `NEXTAUTH_URL` to your production URL, `NEXTAUTH_SECRET`, `DATABASE_URL`, SSL Wireless keys if using SMS).

4. **PWA**
   - `next-pwa` generates `public/sw.js` at build time; ensure `.gitignore` continues to ignore generated Workbox files if you do not commit them.

---

## Dependency audit (maintenance)

All **direct** dependencies in `package.json` are referenced by application code (UI, API, PDF, SMS, auth, or tooling). Nothing obvious to remove without changing product scope.

**Optional future slimming** (not required today):

- **`framer-motion`** — only used on the marketing hero (`src/components/shared/home-hero.tsx`). Removing it would shrink the landing bundle if you replace animations with CSS.

Run **`npm audit`** periodically for transitive vulnerabilities; use judgment before `npm audit fix --force` on a production app.

---

## Documentation

- **[GUIDE.md](./GUIDE.md)** — System design, schema relationships, security, and UX rationale.

Visual ERD (Mermaid): open **`docs/dokandar_db_schema.html`** in a browser.

---

## License

Private / proprietary unless you add an explicit `LICENSE` file.
