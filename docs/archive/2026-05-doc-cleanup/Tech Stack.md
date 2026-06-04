echnology Stack

### Frontend
| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js 15 (App Router)** | SSR for SEO. API routes eliminate separate backend. |
| Styling | **Tailwind CSS v4** | Utility-first. |
| Components | **shadcn/ui** | Accessible, customizable. |
| State | **TanStack Query + Zustand** | Server state + client state. |
| Forms | **React Hook Form + Zod** | Type-safe validation. |
| PWA | **Serwist** | Installable, push notifications. |

### Backend
| Layer | Choice | Why |
|-------|--------|-----|
| API | **Next.js API Routes + Hono (edge)** | Hybrid approach. |
| Jobs | **Trigger.dev** | TS-native scheduled jobs. |
| Scraping | **Python (Playwright + BeautifulSoup)** | Bank transfer bonus pages. Railway hosting. |

### Browser Extension
| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Chrome Extension Manifest V3** | Required for Chrome Web Store. |
| UI | **React + Tailwind** (popup/options) | Same stack as web app. |
| Content Scripts | **TypeScript** | DOM reading, overlay injection. |
| Storage | **chrome.storage.sync** | Cross-device settings sync. |
| Messaging | **Chrome runtime messaging** | Content script ↔ background worker communication. |

### Data Layer
| Layer | Choice | Why |
|-------|--------|-----|
| Database | **Supabase (PostgreSQL)** | Free tier. Auth. RLS. Real-time. |
| Cache | **Upstash Redis** | Serverless. Flight cache, rate limiting. |
| File Storage | **Cloudflare R2** | Zero egress. |
| Search | **pg_trgm → Meilisearch** | Start Postgres trigram, upgrade later. |
- **Supabase** = open-source Firebase alternative. Gives you a full backend stack out of the box:
	- **Postgres database** — real SQL, not NoSQL
	- **Auth** — email/password, OAuth (Google, GitHub, etc.), magic links
	- **Realtime** — live subscriptions to database changes (chat, live updates)
	- **Storage** — file uploads (images, videos, docs)
	- **Edge Functions** — serverless functions (like AWS Lambda)
	- **Auto-generated API** — instant REST & GraphQL from your tables
### Infrastructure
| Layer | Choice | Why |
|-------|--------|-----|
| App Hosting | **Vercel** | Native Next.js. |
| Edge Workers | **Cloudflare Workers** | Hono edge functions. |
| Scraper Hosting | **Railway** | Python containers. $5/mo. |
| Monorepo | **Turborepo** | Manages all packages. |
| CI/CD | **GitHub Actions** | Lint, type-check, test, deploy. |
| Errors | **Sentry** | Runtime error tracking. |
| Analytics | **PostHog** | Product analytics, session replay. |
| Email | **Resend** | Transactional + marketing. |
| Payments | **Stripe** | Subscriptions. |
