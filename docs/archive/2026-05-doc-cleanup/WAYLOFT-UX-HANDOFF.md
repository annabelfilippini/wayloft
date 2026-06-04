# Wayloft — UX Handoff Document

**Last updated:** March 21, 2026
**Purpose:** Complete reference for building/iterating on Wayloft's UI in Stitch or any design tool.

---

## What Wayloft Is

Travel rewards optimization platform. Users add their credit cards, track signup bonuses, see where to use each card for max points, explore transfer partners, search flights, and get recommendations for new cards. Think "Mint for credit card points."

**Target user:** 22–35, has 2–5 travel credit cards, wants to maximize value but doesn't want to become a spreadsheet person.

**Tone:** Premium but approachable. Not a finance app — a travel app that happens to involve credit cards. Think Apple Wallet meets Google Flights.

---

## Design System

### Colors

**Dark mode (default):**
- Background: Deep navy (`oklch(0.16 0.03 260)`)
- Card surfaces: Slightly lighter navy (`oklch(0.20 0.035 260)`)
- Foreground text: Off-white (`oklch(0.93 0.01 90)`)
- Primary/accent: Warm amber-gold (`oklch(0.75 0.15 75)`)
- Borders: Subtle navy (`oklch(0.30 0.03 260)`)
- Muted text: ~60% opacity foreground
- Sidebar: Darker navy (`oklch(0.14 0.03 260)`) with amber active states

**Semantic colors:**
- Success/active: Green
- Warning/urgent: Amber
- Critical/overdue: Red
- Info: Blue
- Neutral/automatic: Slate/gray

### Typography

- **Display font:** Instrument Serif (weight 400) — used for page titles, hero text, logo, marketing headlines
- **Body font:** DM Sans — everything else (UI labels, body text, buttons, inputs)
- **Hierarchy:**
  - Page title: display font, text-2xl–3xl, font-bold
  - Section header: text-lg, font-bold, DM Sans
  - Card/row title: text-base or text-sm, font-semibold
  - Body: text-sm
  - Labels/meta: text-xs, uppercase, tracking-wider, muted
  - Micro text: text-[11px] or text-[10px]

### Spacing & Radius

- Cards: `rounded-2xl` with `shadow-sm border`, padding `p-5` or `p-6`
- Buttons: `rounded-xl` (primary actions) or `rounded-lg`
- Badges: `rounded-full`, padding `px-2 py-0.5`
- Page max-width: `max-w-3xl` (card detail), `max-w-2xl` (quiz), `max-w-7xl` (dashboard)
- Section spacing: `space-y-4` between major sections

### Component Library

Built on **shadcn/ui** (New York style, Neutral base). Active components: button, card, input, badge, dialog, dropdown-menu, command, progress, separator, skeleton, select, textarea, tooltip.

---

## App Structure

### Layout: Sidebar + Main Content

```
┌──────────┬─────────────────────────────────┐
│          │                                 │
│ Sidebar  │     Main Content Area           │
│ (240px)  │     (scrollable)                │
│          │                                 │
│ Logo     │     Page content here           │
│ ──────── │                                 │
│ Dashboard│                                 │
│ My Cards │                                 │
│ Optimizer│                                 │
│ Find Card│                                 │
│ Flights  │                                 │
│ Bonuses  │                                 │
│ Reviews  │                                 │
│ Settings │                                 │
│          │                                 │
│ ──────── │                                 │
│ User     │                                 │
│ Theme    │                                 │
│ Sign Out │                                 │
└──────────┴─────────────────────────────────┘
```

- Sidebar hidden on mobile (< md breakpoint), no hamburger menu yet
- Active nav item: amber highlight on dark navy
- Footer has user name, email, theme toggle (sun/moon), sign out

---

## Pages — Detailed Layouts

### 1. Dashboard (`/dashboard`)

The home screen after login. Urgency-first layout — surfaces what needs attention.

```
┌─────────────────────────────────────────────┐
│ [Card Deck — horizontal scroll of user's    │
│  credit cards with card art]                │
├─────────────────────────────────────────────┤
│ [Ask Wayloft — AI chat interface (stub)]    │
├─────────────────────────────────────────────┤
│ ── Opportunities ──────────────────────────  │
│ [BonusSpotlight — active transfer bonuses]  │
├─────────────────────────────────────────────┤
│ ── Your To-Do List ────────────────────────  │
│                                             │
│ ┌─ Deadlines & Reminders ─────────────────┐ │
│ │ • Signup spend: CSP — 42 days left      │ │
│ │ • Annual fee: Amex Plat — Mar 2026      │ │
│ │ • Expiring points: Delta — 89 days      │ │
│ └─────────────────────────────────────────┘ │
│ ┌─ Perks to Activate ────────────────────┐  │
│ │ • Global Entry (Amex Plat) — ~$100/yr  │  │
│ │ • Uber Credits (Amex Plat) — ~$200/yr  │  │
│ └────────────────────────────────────────┘  │
│ ┌─ Payments ─────────────────────────────┐  │
│ │ • CSR due Apr 15 — 24 days             │  │
│ │ • Missing autopay: Amex Gold           │  │
│ └────────────────────────────────────────┘  │
├─────────────────────────────────────────────┤
│ ── Quick Reference ────────────────────────  │
│ [QuickOptimizer — best card per category]   │
│ [NextCardWidget — recommendation hint]      │
└─────────────────────────────────────────────┘
```

**Section dividers:** Label (text-xs uppercase tracking-widest, muted) + horizontal line.

**Action rows:** Each item has title (left), subtitle (left, muted), days-remaining badge (right), urgency color (right). Links to relevant card detail page.

---

### 2. My Cards (`/cards`)

Portfolio view. Grid of all user's credit cards.

```
┌─────────────────────────────────────────────┐
│ My Cards                    [+ Add Card ▾]  │
│ 4 cards · $1,185/yr fees · $1,850 credits   │
├─────────────────────────────────────────────┤
│ [5/24 Counter — "2 of 5 slots used"]        │
├─────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│ │ Card Art │ │ Card Art │ │ Card Art │     │
│ │          │ │          │ │          │     │
│ │ CSR      │ │ Amex Plat│ │ Amex Gold│     │
│ │ UR · $550│ │ MR ·$695 │ │ MR · $250│     │
│ │ ████░░ 60%│ │          │ │          │     │
│ │ 42d left │ │ AF: 30d  │ │          │     │
│ └──────────┘ └──────────┘ └──────────┘     │
└─────────────────────────────────────────────┘
```

**Card tiles:**
- Card art placeholder (issuer-colored gradient, 1.586:1 aspect ratio — standard credit card shape)
- Card name (text-base, font-semibold)
- Currency + annual fee (text-xs, muted)
- Bonus progress bar (amber, if active)
- Urgency badges (amber/red for deadlines)
- Actions menu (three-dot dropdown, top-right)
- Clicking card → card detail page

**Card art placeholder colors by issuer:**
- Chase: Blue (#003087 → #0056b3)
- Amex: Dark teal (#006271 → #00847c)
- Citi: Navy (#003B70 → #1a5fa3)
- Capital One: Red (#C41230 → #d4385b)
- Bilt: Dark charcoal (#1a1a2e → #333366)
- Each has issuer name (top-left), card name (bottom-left), network badge (bottom-right), accent stripe (right 1/3)

**Empty state:** CreditCard icon + "No cards yet" + "Add your first card" button

**Add card flow:** Dropdown → search dialog → fuzzy-match against 52-card catalog → pick card + "card since" date → add

---

### 3. Card Detail (`/cards/[id]`)

The deepest page. Premium single-card view. Max-width `max-w-3xl`.

```
┌─────────────────────────────────────────────┐
│ ← Back to cards                             │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ ┌────────┐                    $550/yr > │ │
│ │ │Card Art│ Chase Sapphire Reserve       │ │
│ │ │        │ Annual fee · $550/yr         │ │
│ │ └────────┘                              │ │
│ │─────────────────────────────────────────│ │
│ │ Earn 60,000 points                      │ │
│ │ Spend $4,000 by Jun 15                  │ │
│ │                                         │ │
│ │ $2,400 / $4,000            $4,000       │ │
│ │ ████████████░░░░░░░░░░░░░░  60%         │ │
│ │ 6 weeks left · ~$23/day                 │ │
│ │                                         │ │
│ │ [+ Log Recent Purchase]                 │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─ Payment Due ───────────────────────────┐ │
│ │ 💳 Payment Due              Apr 15      │ │
│ │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │ │
│ │ 🔔 Autopay enabled          24 days     │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─ ★ Earnings ────────────────────────────┐ │
│ │ ┌──────────┐ ┌──────────┐ ┌──────────┐ │ │
│ │ │ 10x      │ │ 3x       │ │ 3x       │ │ │
│ │ │Chase Trvl│ │ Dining   │ │ Travel   │ │ │
│ │ └──────────┘ └──────────┘ └──────────┘ │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─ ★ Card Benefits ──── 11 · ~$1,400/yr ─┐ │
│ │  [Accordion — click to expand]     ▼    │ │
│ │                                         │ │
│ │  When expanded:                         │ │
│ │  Estimated annual value: $1,400+        │ │
│ │                                         │ │
│ │  ┌ $200 Airline Credit ──── [Unused] ─┐ │ │
│ │  │ Use at airline of choice            │ │ │
│ │  │ ████░░░░  $0 / $200  Exp: Dec 31   │ │ │
│ │  └────────────────────────────────────┘ │ │
│ │  ┌ $300 Travel Credit ──── [Used] ────┐ │ │
│ │  │ Use at Chase Travel                 │ │ │
│ │  │ ████████  $300 / $300               │ │ │
│ │  └────────────────────────────────────┘ │ │
│ │  ┌ Priority Pass ──── [Always active] ┐ │ │
│ │  │ Automatic benefit                   │ │ │
│ │  └────────────────────────────────────┘ │ │
│ │  ┌ Global Entry ──── [Not set up] ────┐ │ │
│ │  │ Requires activation                 │ │ │
│ │  └────────────────────────────────────┘ │ │
│ │  ┌ No Foreign Transaction Fees ─ [Auto]┐│ │
│ │  │ Good for international travel       │ │ │
│ │  └────────────────────────────────────┘ │ │
│ │                                         │ │
│ │  [Manage Benefits ▼]                    │ │
│ │  (expands PerkChecklist + CreditTracker)│ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─ 🧭 Travel With Your Points ── 13 + 3 ─┐│
│ │  [Accordion — click to expand]     ▼    │ │
│ │                                         │ │
│ │  When expanded:                         │ │
│ │  POPULAR REDEMPTION PATHS               │ │
│ │  ┌────────┐ ┌────────┐ ┌────────┐      │ │
│ │  │ Tokyo  │ │ Paris  │ │NYC→LA  │ ←scroll│
│ │  │ photo  │ │ photo  │ │ photo  │      │ │
│ │  │60k pts │ │55k pts │ │12k pts │      │ │
│ │  │Instant │ │Deals   │ │Best dom│      │ │
│ │  └────────┘ └────────┘ └────────┘      │ │
│ │                                         │ │
│ │  RECOMMENDED PROGRAMS                   │ │
│ │  ┌ ✈ United MileagePlus ── [Instant]──┐│ │
│ │  │   Best for domestic + Europe [Rec'd]│ │ │
│ │  └────────────────────────────────────┘ │ │
│ │  ┌ 🏨 World of Hyatt ── [Great value]─┐│ │
│ │  │   Best hotel redemption value       │ │ │
│ │  └────────────────────────────────────┘ │ │
│ │                                         │ │
│ │  [Explore all transfer programs →]      │ │
│ │  (opens full-screen modal with search,  │ │
│ │   all airlines + hotels, badges, ratios)│ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─ ⚙ Card Settings ──────────────────────┐ │
│ │  [Accordion — click to expand]     ▼    │ │
│ │                                         │ │
│ │  When expanded:                         │ │
│ │  > Annual Fee (Apr 2026)               │ │
│ │  > Retention Call Log                   │ │
│ │  > Card Timeline                        │ │
│ │  > Payment Tracking                     │ │
│ │  (each row expands to show content)     │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Bonus states:**
- **Active bonus:** Large "Earn X points" headline, gold progress bar, urgency text, "+ Log Recent Purchase" button
- **Bonus met (points pending):** Green progress bar, trophy icon, "You did it!" celebration, "Start planning where to use your points" CTA
- **Bonus earned:** Permanent trophy badge with point value estimate through portal

**Transfer Programs Modal** (opens from "Explore all"):
- Full dialog overlay, max-w-3xl, max-h-85vh
- Search bar at top
- Airlines section (2-column grid) + Hotels section (2-column grid)
- Each program card: icon, name, descriptor, ratio, transfer time, badges
- Badge colors: gold (Great value, Recommended), green (Instant, Easy), slate (neutral)

---

### 4. Spending Optimizer (`/optimizer`)

Shows which card to use for each spending category.

```
┌─────────────────────────────────────────────┐
│ Spending Optimizer                          │
├─────────────────────────────────────────────┤
│ ┌─ Dining ────────────────────────────────┐ │
│ │ 🍽 Best: Amex Gold (4x MR)             │ │
│ │    Also: CSR (3x UR)                    │ │
│ └─────────────────────────────────────────┘ │
│ ┌─ Travel ────────────────────────────────┐ │
│ │ ✈ Best: CSR (3x UR)                    │ │
│ └─────────────────────────────────────────┘ │
│ ┌─ Groceries ── 💡 Suggestion ────────────┐│
│ │ None of your cards earn bonus here.      │ │
│ │ Consider: Amex Gold (4x) or BCP (6%)    │ │
│ └─────────────────────────────────────────┘ │
│ ...13 categories total                      │
└─────────────────────────────────────────────┘
```

- 13 canonical spending categories
- CPP-weighted tie-breaking
- Amber "suggestion" rows for uncovered categories (dining, gas, groceries, streaming, transit)
- Expandable rows showing full card ranking

---

### 5. Find a Card / Quiz (`/recommend`)

5-step spending quiz → personalized card recommendations.

**Quiz flow:**
```
Step 0: Monthly spending (6 category inputs)
Step 1: Credit score + cards opened
Step 2: Existing cards (multi-select search)
Step 3: AF comfort + travel goal
Step 4: Review + submit
```

**Results:**
```
┌─────────────────────────────────────────────┐
│ 🏆 Your Top Card Recommendations           │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ ① Chase Sapphire Preferred              │ │
│ │    Chase · $95/yr                       │ │
│ │    First-year value: $1,247    ☐        │ │
│ │    ⚠ Chase 5/24: 3 of 5 slots used     │ │
│ │                                         │ │
│ │    Value breakdown:                     │ │
│ │    Ongoing rewards    $612              │ │
│ │    Signup bonus       $750              │ │
│ │    Credits            $0               │ │
│ │    Goal bonus         +$0              │ │
│ │    Annual fee         -$95             │ │
│ │    ─────────────────────────            │ │
│ │    First-year net     $1,247            │ │
│ │                                         │ │
│ │    Top earnings: 3x Dining, 2x Travel   │ │
│ │    [Apply Now]  [Learn More]            │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ ② Amex Gold Card                        │ │
│ │    ...                                  │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ═══ Sticky Comparison Bar (bottom) ═══════  │
│ [Card1 ✕] [Card2 ✕]    Clear | [Compare]   │
└─────────────────────────────────────────────┘
```

- Select up to 3 cards via checkboxes for comparison
- Comparison panel: side-by-side value, earnings, features, transfer partner overlap
- Warning badges: amber for hard rules (Chase 5/24), blue for info (Amex once-per-lifetime)

---

### 6. Transfer Bonuses (`/bonuses`)

Active and historical transfer bonus promotions.

**3 tabs:** My Bonuses | All Bonuses | History

```
┌─────────────────────────────────────────────┐
│ Transfer Bonuses                            │
│ Active promotions across all bank partners  │
├─────────────────────────────────────────────┤
│ [My Bonuses] [All Bonuses] [History]        │
├─────────────────────────────────────────────┤
│ Bank: [All] [Chase] [Amex] [Citi] [C1]     │
│ Type: [All] [Airlines] [Hotels]             │
├─────────────────────────────────────────────┤
│ ┌─ Chase → British Airways ── 30% ───────┐ │
│ │ Transfer bonus: 30% extra              │ │
│ │ 🔴 Ends in 2 days                      │ │
│ │ Your balance: 85,000 UR                │ │
│ └─────────────────────────────────────────┘ │
│ ┌─ Amex → Hilton ── 40% ────────────────┐  │
│ │ Transfer bonus: 40% extra              │  │
│ │ 🟡 Ends in 6 days                      │  │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Urgency colors:** Red < 48hrs, amber < 7 days, green > 7 days

**History tab:** Pattern analysis cards showing frequency, typical bonus %, overdue detection, expandable timeline

---

### 7. Flight Search (`/search`)

```
┌─────────────────────────────────────────────┐
│ Flight Search                               │
│ Search flights and see which card earns most│
├─────────────────────────────────────────────┤
│ ┌─ Search Form ──────────────────────────┐  │
│ │ From: [SFO ▾]  To: [NRT ▾]            │  │
│ │ Date: [Jun 15]  Passengers: [1]        │  │
│ │ Cabin: [Economy ▾]  [Search]           │  │
│ └────────────────────────────────────────┘  │
├─────────────────────────────────────────────┤
│ 12 flights found    [Cash | Points | ¢/pt]  │
│                                             │
│ ┌─ United UA 837 ────────────────────────┐  │
│ │ SFO → NRT  10:30a → 3:15p+1  Nonstop  │  │
│ │ $1,247 cash · 42,000 pts · 2.97¢/pt   │  │
│ │ Best card: CSR (3x on travel)          │  │
│ └────────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

- PriceToggle: switch between cash price, points needed, and cents-per-point value
- Portfolio-aware: recommends which card to book with based on user's cards

---

### 8. Settings (`/settings`)

Standard settings page. Max-w-3xl.

Sections: Profile form, Notification preferences, Subscription (Free plan, Pro coming soon), Data & privacy, Sign out.

---

## Marketing / Public Pages

### Landing Page (`/`)

Full dark navy background with radial gradient. No sidebar — standalone layout.

```
┌─────────────────────────────────────────────┐
│ [Wayloft logo]  Cards  Features  Sign In [Join]│
├─────────────────────────────────────────────┤
│                                             │
│         Travel rewards, optimized           │
│                                             │
│      Your points are                        │
│        worth more                           │
│                                             │
│   Stop leaving value on the table.          │
│   We track your cards, monitor bonuses,     │
│   and tell you exactly which card to use.   │
│                                             │
│      [Get Started]  [See how it works]      │
│                                             │
│   52+ Cards  ·  5 Currencies  ·  Real-time  │
│                                             │
├─────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │Card      │  │Transfer  │  │Flight    │  │
│  │Portfolio │  │Bonuses   │  │Search    │  │
│  │Track your│  │Never miss│  │Find best │  │
│  │cards...  │  │a bonus.. │  │deals...  │  │
│  └──────────┘  └──────────┘  └──────────┘  │
├─────────────────────────────────────────────┤
│        [CTA section + footer]               │
└─────────────────────────────────────────────┘
```

- Hero text uses `clamp(2.6rem, 6.5vw, 5.4rem)` for responsive scaling
- "worth more" in lower opacity (white/40) for emphasis contrast
- Stat pills below CTA buttons
- Feature cards with hover effects (border opacity increase)

### Card Reviews Index (`/credit-cards`)

Marketing header + footer (no sidebar). Shows all 52 cards.

- Issuer filter pills (Chase, Amex, Citi, Capital One, etc.)
- Search input with fuzzy matching
- Card grid: card art + name + issuer + AF + best_for tags
- Each card links to `/credit-cards/[slug]`

### Individual Card Review (`/credit-cards/[slug]`)

10-section editorial review page. Statically generated for all 52 cards.

1. Hero (card art + name + quick stats + Apply button)
2. Affiliate disclosure (FTC compliance text)
3. Quick stats grid (AF, signup bonus, spend req, FTF, credit score, currency)
4. Earning rates table
5. Transfer partners (airlines + hotels grid)
6. Perks & benefits (grouped by category)
7. Statement credits
8. Editorial review (pros/cons/verdict — conditional, only on reviewed cards)
9. Related cards (3 similar cards)
10. Quiz CTA banner

### Best-For Articles (`/credit-cards/best-for/[category]`)

5 categories: dining, travel, cash-back, no-annual-fee, hotels.

- Category nav pills for cross-navigation
- "At a Glance" comparison table (rank, card, AF, signup bonus, best for)
- Individual card breakdowns with earning rates grid + top perks
- Apply buttons (affiliate links) on each card
- Quiz CTA at bottom

---

## Interactive Patterns

### Accordions
Used for Card Benefits, Travel With Your Points, Card Settings. Header bar is clickable with chevron rotation animation. Shows summary stats when collapsed (e.g., "11 benefits · ~$1,400/yr").

### Modals/Dialogs
- Transfer Programs: full directory, searchable, 85vh max height, scrollable body
- Add Card: search-based card picker with fuzzy matching
- Add Balance: form dialog for loyalty balances

### Progress Bars
- Signup bonus: amber fill, rounded-full, h-2.5
- Statement credits: amber fill, h-1.5, with dollar amounts below
- Bonus completion: green fill (100%)

### Badges
- Status: green (active/used), amber (unused/warning), slate (automatic), indigo (upcoming)
- Urgency: red (< 48hrs), amber (< 7 days), green (> 7 days)
- Category: amber background for best_for tags
- Transfer partner: gold (value), green (speed), slate (neutral)

### Empty States
- Centered icon + heading + description + primary CTA button
- Consistent across all pages

---

## Responsive Behavior

| Breakpoint | Cards Grid | Sidebar | Layout |
|------------|-----------|---------|--------|
| < 640px    | 1 column  | Hidden  | Full-width, stacked |
| 640px (sm) | 2 columns | Hidden  | Slightly wider |
| 768px (md) | 2 columns | Visible | Sidebar + content |
| 1024px (lg)| 3 columns | Visible | Full desktop layout |

- Destination cards in Travel section: horizontal scroll on all sizes
- Tables: horizontal scroll on mobile
- Marketing hero text: fluid scaling with clamp()

---

## Data: Card Catalog

52 cards across 9 issuers. Each card has:
- `name`, `slug`, `issuer`, `network` (visa/mastercard/amex)
- `annual_fee_cents`, `signup_bonus_points`, `signup_spend_cents`, `signup_spend_months`
- `earning_rates` (object: category → multiplier)
- `earning_caps` (array: category caps per period)
- `currency` (UR, MR, TYP, C1, BILT, or cashback variants)
- `transfer_partners` (boolean — does this currency transfer?)
- `portal_cpp` (cents-per-point through issuer travel portal)
- `foreign_transaction_fee` (boolean)
- `credits` (array: name, amount, period, merchants)
- `perks` (structured array: id, name, category, type, description, value)
- `key_perks` (string array fallback)
- `best_for` (string array: tags like "dining", "travel", "no AF")
- `payment_info`, `retention_data`, `downgrade_options`
- `editorial` (optional: tagline, pros, cons, verdict, rating)

**Transfer partners:** 5 currencies (UR, MR, TYP, C1, BILT) with airline + hotel partners, each having ratio, transfer time, alliance info.

---

## What Needs UX Work

### Currently built but could use polish:
- Dashboard layout and card ordering
- Card detail page (just rebuilt — needs visual review)
- Optimizer page
- Settings page
- Mobile responsiveness across all pages

### Not yet built:
- Mobile navigation (hamburger menu or bottom tabs)
- Onboarding flow polish
- Notification/alert design
- Loading/skeleton states (basic ones exist, could be better)
- Error pages (404, 500)
- Stripe billing / plan selection UI
- Browser extension popup UI
