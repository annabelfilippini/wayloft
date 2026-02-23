# Wayloft Master Plan — Additions for v3.2

These sections are written to paste directly into WAYLOFT-MASTER-PLAN-V3.md. Each section notes where it should go in the existing document.

---

## ADDITION 1: Spending Optimizer Engine

**PASTE INTO:** Track 4 → Phase 1, as a new "Loop 1.5" between Loop 1 (Auth + Card Portfolio) and Loop 2 (Card Recommendation Engine). This is the core daily-use feature.

---

#### Loop 1.5: Spending Optimizer — "Which Card to Use" Engine (Week 4)

**Goal:** For any spending category, instantly tell the user which card in their wallet earns the most. This is the #1 reason people open Wayloft daily.

This is different from Loop 2 (Card Recommendation Engine). Loop 2 answers "what card should I *get* next?" This answers "what card should I *use* right now?" Loop 2 runs once every few months. This runs every time someone pulls out their wallet.

**How It Works:**
1. User adds cards to their wallet (Loop 1).
2. System reads each card's earning rates from credit-cards.json.
3. For every spending category, the system compares multipliers across all of the user's active cards.
4. The output is a personalized "wallet guide" — a grid showing the best card per category.
5. The guide recalculates any time a card is added, removed, or a rotating category changes.

**Canonical Spending Categories:**

These are the standard categories used across all cards in credit-cards.json. Every card must have an earning rate for every category (default to the base rate if no bonus).

| Category Slug | Display Name | What It Covers |
|--------------|-------------|----------------|
| `dining` | Dining | Restaurants, bars, cafes, fast food, food delivery (DoorDash, Uber Eats, Grubhub) |
| `travel` | Travel | Airlines, hotels, car rentals, cruises, travel agencies, OTAs |
| `grocery` | Groceries | Supermarkets, grocery stores. Excludes superstores (Walmart, Target, Costco) |
| `gas` | Gas | Gas stations, EV charging stations |
| `streaming` | Streaming | Netflix, Spotify, Hulu, Disney+, YouTube Premium, HBO Max, Apple TV+ |
| `online_shopping` | Online Shopping | General online retail (Amazon, etc.) |
| `transit` | Transit & Rideshare | Uber, Lyft, public transit, tolls, parking |
| `drugstore` | Drugstores | Pharmacies (CVS, Walgreens, Rite Aid) |
| `home_improvement` | Home Improvement | Hardware stores, home improvement (Home Depot, Lowe's) |
| `entertainment` | Entertainment | Movies, concerts, sporting events, amusement parks, live events |
| `rent` | Rent | Rent payments (only Bilt earns points here — a key differentiator) |
| `bills` | Bills & Utilities | Phone, internet, insurance, utilities |
| `everything_else` | Everything Else | Base/default earn rate for uncategorized purchases |

**Earning Rates in credit-cards.json:**

Add this to each card entry in the catalog:

```json
{
  "slug": "chase-sapphire-reserve",
  "earning_rates": [
    { "category": "dining", "multiplier": 3, "cap_monthly_cents": null, "notes": null },
    { "category": "travel", "multiplier": 3, "cap_monthly_cents": null, "notes": "Includes tolls, parking, rideshare" },
    { "category": "grocery", "multiplier": 1, "cap_monthly_cents": null, "notes": null },
    { "category": "gas", "multiplier": 1, "cap_monthly_cents": null, "notes": null },
    { "category": "streaming", "multiplier": 1, "cap_monthly_cents": null, "notes": null },
    { "category": "online_shopping", "multiplier": 1, "cap_monthly_cents": null, "notes": null },
    { "category": "transit", "multiplier": 3, "cap_monthly_cents": null, "notes": "Coded as travel" },
    { "category": "drugstore", "multiplier": 1, "cap_monthly_cents": null, "notes": null },
    { "category": "home_improvement", "multiplier": 1, "cap_monthly_cents": null, "notes": null },
    { "category": "entertainment", "multiplier": 1, "cap_monthly_cents": null, "notes": null },
    { "category": "rent", "multiplier": 0, "cap_monthly_cents": null, "notes": "No points on rent" },
    { "category": "bills", "multiplier": 1, "cap_monthly_cents": null, "notes": null },
    { "category": "everything_else", "multiplier": 1, "cap_monthly_cents": null, "notes": null }
  ],
  "rotating_categories": null
}
```

**Cards with spending caps:**

Some cards cap bonus earning at a monthly or annual threshold. After the cap, purchases earn the base rate. The optimizer must account for this.

```json
{
  "slug": "citi-custom-cash",
  "earning_rates": [
    { "category": "dining", "multiplier": 5, "cap_monthly_cents": 50000, "notes": "5x on your top eligible spend category each billing cycle, up to $500" },
    { "category": "everything_else", "multiplier": 1, "cap_monthly_cents": null, "notes": null }
  ]
}
```

The Citi Custom Cash auto-detects the user's highest spend category each month and earns 5x on it, capped at $500/month. The optimizer should note: "⚠️ 5x up to $500/month spend, then 1x."

**Rotating/Quarterly Categories:**

Cards like Chase Freedom Flex and Discover It rotate their 5x categories every quarter and require manual activation.

```json
{
  "slug": "chase-freedom-flex",
  "earning_rates": [
    { "category": "dining", "multiplier": 3, "cap_monthly_cents": null, "notes": null },
    { "category": "drugstore", "multiplier": 3, "cap_monthly_cents": null, "notes": null },
    { "category": "everything_else", "multiplier": 1, "cap_monthly_cents": null, "notes": null }
  ],
  "rotating_categories": {
    "multiplier": 5,
    "cap_quarterly_cents": 150000,
    "activation_required": true,
    "activation_url": "https://creditcards.chase.com/freedom-credit-cards/activate",
    "schedule": [
      { "quarter": "2026-Q1", "categories": ["grocery", "fitness"], "active_from": "2026-01-01", "active_to": "2026-03-31" },
      { "quarter": "2026-Q2", "categories": ["gas", "home_improvement"], "active_from": "2026-04-01", "active_to": "2026-06-30" }
    ]
  }
}
```

**Tracking activation status on user_cards:**

```sql
-- Add to user_cards table or create new table
CREATE TABLE public.user_card_activations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_card_id UUID REFERENCES public.user_cards(id) ON DELETE CASCADE,
  quarter TEXT NOT NULL,                -- "2026-Q1"
  activated BOOLEAN DEFAULT false,
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_card_id, quarter)
);

ALTER TABLE public.user_card_activations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own activations" ON public.user_card_activations
  FOR ALL USING (
    user_card_id IN (SELECT id FROM public.user_cards WHERE user_id = auth.uid())
  );
```

**Optimization Algorithm:**

For each spending category:
1. Gather all user's active cards.
2. For each card, look up the earning rate for this category (including any active rotating bonus).
3. If a card has a spending cap and the user is past the cap this period, use the base rate instead.
4. Rank by effective value: `multiplier × estimated_cpp_for_that_currency`.
5. Tie-break when two cards produce the same effective value:
   a. Transferable points > airline/hotel miles > cash back (flexibility premium).
   b. If same currency type, prefer the card with broader transfer partner access.
   c. If still tied, use user preference (if they've set a preferred program).
   d. If still tied, show both with a note.

**Estimated CPP values (configurable in transfer-partners.json):**

| Currency | Estimated CPP | Reasoning |
|----------|--------------|-----------|
| Amex MR | 2.0¢ | High transfer partner value, especially ANA and airline partners |
| Chase UR | 1.8¢ | Strong Hyatt transfer, 1.5x portal via Sapphire Reserve |
| Capital One Miles | 1.5¢ | Good transfer partners, growing list |
| Citi TYP | 1.5¢ | Decent partners, fewer sweet spots |
| Bilt Points | 1.8¢ | Hyatt transfer + unique rent earning |
| Cash Back | 1.0¢ | Dollar is a dollar |
| Airline Miles (general) | 1.3¢ | Less flexible, program-dependent |
| Hotel Points (general) | 0.6¢ | Varies wildly by property |

These are defaults. Advanced users can override them in settings.

**Frontend Tasks:**

| Task | Acceptance Criteria |
|------|-------------------|
| **Wallet Guide page** | Full-screen grid showing best card per category with card art, multiplier, currency, and estimated value. Updates instantly when cards change. The hero feature — first thing users see after onboarding. |
| **Category detail drill-down** | Tap a category → see all user's cards ranked for that category with full reasoning |
| **Rotating category banner** | "Q2 bonus categories are live! Chase Freedom Flex: 5x on Gas & Home Improvement. Tap to activate." Shown at top of wallet guide when a new quarter starts. |
| **Activation CTA** | Deep link or instructions to activate quarterly categories, with confirmation toggle |
| **Spending cap indicator** | "⚠️ 5x up to $500/mo" badge on cards with caps. If user tracks spend, show remaining cap. |
| **Quick-reference card** | Lockscreen-friendly summary: a simple list of "Dining → Gold, Travel → Reserve, Gas → Freedom" that users can screenshot or reference at checkout |
| **"You used the wrong card" retroactive alert** | (Phase 3 / Plaid) "You spent $85 at a restaurant on Freedom Unlimited (1.5x). Amex Gold would have earned 4x — 212 extra points missed." |

**Backend Tasks:**

| Task | Acceptance Criteria |
|------|-------------------|
| /api/user/optimizer | GET: Returns the optimized wallet guide for the authenticated user. Computes best card per category across all active user_cards. Cached per user, invalidated when cards change. |
| /api/user/optimizer/category/[slug] | GET: Returns all user's cards ranked for a specific category with reasoning. |
| Optimizer computation engine | Pure function: takes array of user cards + catalog data + current quarter → returns ranked card per category. Unit testable. |
| Rotating category updater | Trigger.dev job: At the start of each quarter, update the active rotating categories in the catalog. Notify users who have cards with rotating categories to activate. |

**Notifications (add to Card Deadline Notifier Agent):**

| Notification | Trigger | Message |
|-------------|---------|---------|
| `quarterly_category_activation` | 1st of Jan/Apr/Jul/Oct | "New quarter! Your Chase Freedom Flex earns 5x on [categories] this quarter. Activate now to start earning." |
| `quarterly_category_reminder` | 7 days into quarter if not activated | "You haven't activated your Q2 bonus categories yet. You're missing 5x earnings on gas and home improvement." |
| `optimizer_changed` | User adds/removes a card | "Your wallet guide has been updated. [Category] now optimized for [new card]." |

**SKILL USED:** next-api-route, ui-component, test-generator.

---

## ADDITION 2: Statement Credit Tracker & Reminder System

**PASTE INTO:** Track 4 → Phase 1, as an addition to Loop 1 (Auth + Card Portfolio). This extends the card detail view with credit tracking.

---

#### Statement Credit Tracker (Add to Loop 1, Week 4)

**Goal:** Track every statement credit across all user cards, show usage status, send reminders before credits expire, and calculate the true effective annual fee.

Statement credits are where users lose the most money. A card like the Amex Platinum has 6-7 different credits (Uber $15/mo, Saks $50/half, airline $200/yr, entertainment $20/mo, Walmart+ $12.98/mo, hotel $200/yr) — each with different reset periods, enrollment requirements, and eligible merchants. Without tracking, users routinely leave $500-1,000+ on the table annually.

**Data Structure — Add `credits` array to credit-cards.json:**

```json
{
  "slug": "amex-platinum",
  "credits": [
    {
      "credit_slug": "amex-plat-uber",
      "name": "Uber Credit",
      "amount_cents": 1500,
      "period": "monthly",
      "period_reset": "calendar_month",
      "december_amount_cents": 2000,
      "category_description": "Uber rides and Uber Eats orders",
      "activation_required": false,
      "activation_instructions": null,
      "auto_applied": true,
      "eligible_merchants": ["Uber", "Uber Eats"],
      "how_to_use": "Add your Amex Platinum as payment method in the Uber app. Credit applies automatically.",
      "gotchas": "Must use the specific Platinum card, not another Amex. $15/month, $20 in December. Does NOT roll over."
    },
    {
      "credit_slug": "amex-plat-airline",
      "name": "Airline Fee Credit",
      "amount_cents": 20000,
      "period": "annual",
      "period_reset": "calendar_year",
      "december_amount_cents": null,
      "category_description": "Incidental airline fees: checked bags, seat upgrades, in-flight purchases, lounge day passes",
      "activation_required": true,
      "activation_instructions": "Select one qualifying airline in the Amex Benefits portal at the start of each calendar year. Cannot be changed after selection.",
      "auto_applied": true,
      "eligible_merchants": ["selected_airline_only"],
      "how_to_use": "Choose your airline in the Amex portal, then pay for incidental fees with this card.",
      "gotchas": "Does NOT cover airfare or ticket purchases. Only incidental fees. Airline selection locks for the full calendar year."
    },
    {
      "credit_slug": "amex-plat-saks",
      "name": "Saks Fifth Avenue Credit",
      "amount_cents": 5000,
      "period": "semi_annual",
      "period_reset": "calendar_half",
      "december_amount_cents": null,
      "category_description": "Purchases at Saks Fifth Avenue stores or saks.com",
      "activation_required": false,
      "activation_instructions": null,
      "auto_applied": true,
      "eligible_merchants": ["Saks Fifth Avenue", "saks.com"],
      "how_to_use": "Shop at Saks or saks.com with your Platinum card. Credit appears on your statement.",
      "gotchas": "$50 per half-year (Jan-Jun and Jul-Dec). Does not roll over. Enroll card in ShopRunner for free 2-day shipping."
    },
    {
      "credit_slug": "amex-plat-entertainment",
      "name": "Digital Entertainment Credit",
      "amount_cents": 2000,
      "period": "monthly",
      "period_reset": "calendar_month",
      "december_amount_cents": null,
      "category_description": "Select streaming and media subscriptions",
      "activation_required": true,
      "activation_instructions": "Enroll each eligible subscription separately via Amex Offers in the app or online portal.",
      "auto_applied": true,
      "eligible_merchants": ["Disney+", "Hulu", "ESPN+", "The New York Times", "The Wall Street Journal", "Peacock"],
      "how_to_use": "Enroll in Amex Offers, then pay for eligible subscriptions with this card.",
      "gotchas": "Up to $20/month total across all eligible services. Must enroll EACH subscription individually. New services may be added — check portal periodically."
    },
    {
      "credit_slug": "amex-plat-walmart",
      "name": "Walmart+ Membership Credit",
      "amount_cents": 1298,
      "period": "monthly",
      "period_reset": "calendar_month",
      "december_amount_cents": null,
      "category_description": "Walmart+ monthly membership fee",
      "activation_required": true,
      "activation_instructions": "Sign up for Walmart+ and select your Platinum card as the payment method.",
      "auto_applied": true,
      "eligible_merchants": ["Walmart"],
      "how_to_use": "Enroll in Walmart+ using your Platinum card. Monthly fee is automatically credited.",
      "gotchas": "Covers $12.95/month + tax. Only covers the membership fee, not Walmart purchases."
    },
    {
      "credit_slug": "amex-plat-hotel",
      "name": "Hotel Credit",
      "amount_cents": 20000,
      "period": "annual",
      "period_reset": "calendar_year",
      "december_amount_cents": null,
      "category_description": "Prepaid hotel bookings through amextravel.com",
      "activation_required": false,
      "activation_instructions": null,
      "auto_applied": true,
      "eligible_merchants": ["amextravel.com"],
      "how_to_use": "Book a prepaid hotel stay through the Amex Travel portal using your Platinum card.",
      "gotchas": "Must book through Amex Travel, not direct with hotel or third-party OTA. Prepaid rate only."
    }
  ]
}
```

Another example — a simpler card:

```json
{
  "slug": "chase-sapphire-reserve",
  "credits": [
    {
      "credit_slug": "csr-travel",
      "name": "Annual Travel Credit",
      "amount_cents": 30000,
      "period": "annual",
      "period_reset": "cardmember_year",
      "december_amount_cents": null,
      "category_description": "Travel purchases including flights, hotels, car rentals, rideshare, tolls, transit, parking",
      "activation_required": false,
      "activation_instructions": null,
      "auto_applied": true,
      "eligible_merchants": [],
      "how_to_use": "Use your Sapphire Reserve for any travel purchase. Credit applies automatically.",
      "gotchas": "Very broad travel definition — includes Uber, Lyft, parking garages, tolls, public transit. Resets on cardmember anniversary, NOT calendar year."
    }
  ]
}
```

**Credit Period Types:**

| Period | Reset Logic | Example |
|--------|-----------|---------|
| `monthly` | 1st of each calendar month. No rollover. | Uber credit: $15/month, use it or lose it. |
| `quarterly` | 1st of Jan, Apr, Jul, Oct. No rollover. | Rare. Some cashback bonus schedules. |
| `semi_annual` | Jan 1 and Jul 1. No rollover. | Saks credit: $50 per half. |
| `annual` | Depends on `period_reset`. No rollover. | Airline fee credit: $200/year. |
| `cardmember_year` | Resets on anniversary of card open date. | CSR travel credit: $300/cardmember year. |
| `calendar_year` | Resets January 1. | Amex airline credit: $200/calendar year. |

**Database — User Credit Tracking:**

```sql
-- Tracks usage of each credit for each period
CREATE TABLE public.user_credit_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_card_id UUID REFERENCES public.user_cards(id) ON DELETE CASCADE,
  credit_slug TEXT NOT NULL,              -- References credit_slug in credit-cards.json
  period_key TEXT NOT NULL,               -- "2026-01", "2026-Q1", "2026-H1", "2026", "cy-2026-03" (cardmember year starting month 3)
  amount_used_cents INTEGER DEFAULT 0,
  amount_available_cents INTEGER NOT NULL, -- From catalog
  status TEXT DEFAULT 'unused',            -- "unused", "partial", "used", "expired"
  enrolled BOOLEAN DEFAULT false,          -- For credits requiring activation
  enrolled_at TIMESTAMPTZ,
  notes TEXT,                              -- User notes ("selected Delta as airline")
  expires_at TIMESTAMPTZ NOT NULL,         -- When this period's credit expires
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_card_id, credit_slug, period_key)
);

ALTER TABLE public.user_credit_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own credit usage" ON public.user_credit_usage
  FOR ALL USING (
    user_card_id IN (SELECT id FROM public.user_cards WHERE user_id = auth.uid())
  );
CREATE INDEX idx_credit_usage_expiry ON public.user_credit_usage(expires_at);
CREATE INDEX idx_credit_usage_status ON public.user_credit_usage(status);

-- View: Upcoming credit expirations
CREATE OR REPLACE VIEW public.expiring_credits AS
SELECT
  uc.user_id,
  ucu.credit_slug,
  ucu.amount_available_cents - ucu.amount_used_cents AS remaining_cents,
  ucu.expires_at,
  ucu.enrolled,
  ucu.status,
  uc.card_slug,
  CASE
    WHEN ucu.expires_at - NOW() <= INTERVAL '3 days' THEN 'critical'
    WHEN ucu.expires_at - NOW() <= INTERVAL '7 days' THEN 'warning'
    WHEN ucu.expires_at - NOW() <= INTERVAL '14 days' THEN 'upcoming'
    ELSE 'ok'
  END AS urgency
FROM public.user_credit_usage ucu
JOIN public.user_cards uc ON ucu.user_card_id = uc.id
WHERE ucu.status != 'used'
  AND ucu.status != 'expired'
  AND ucu.expires_at > NOW();
```

**Auto-generation of credit periods:**

When a user adds a card, a Trigger.dev job (or Postgres function) should auto-generate `user_credit_usage` rows for the current period of each credit on that card. At the start of each new period (monthly on the 1st, quarterly, semi-annually, annually), a scheduled job generates the next period's rows and marks the previous period as "expired" if unused.

**Annual Fee Offset Calculator:**

For each card, compute and display:

```
Amex Platinum — Annual Fee Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Annual Fee:                              $695

Credits (if fully used):
  Airline Fee Credit:                   -$200
  Uber Credit ($15/mo + $20 Dec):       -$200
  Saks Credit ($50 × 2):               -$100
  Digital Entertainment ($20/mo):       -$240
  Walmart+ ($12.98/mo):                -$156
  Hotel Credit:                         -$200
  ────────────────────────────────────
  Total Credits:                        -$1,096

Your Usage This Year:
  Credits actually used:                -$743  (68% utilization)
  Credits missed/expired:               -$353

Effective Annual Fee:                   -$48  (net positive based on your usage)
Effective Fee if 100% utilized:         -$401  (net positive)

Recommendation: KEEP — even at your current utilization, you're ahead.
Tip: You've missed 3 months of Uber credit ($45). Set a monthly reminder.
```

**Frontend Tasks:**

| Task | Acceptance Criteria |
|------|-------------------|
| **Credit tracker dashboard** | For each user card, show all credits with status badges: ✅ Used, 🟡 Partially Used ($X of $Y), ❌ Not Yet Used, ⚠️ Requires Enrollment. Grouped by card. |
| **Credit detail view** | Tap a credit → see how_to_use instructions, gotchas, eligible merchants, enrollment status, usage history |
| **Enrollment CTA** | For credits with `activation_required: true`, show prominent "Enroll Now" button with instructions. Track enrollment status. |
| **Expiration countdown** | "Your $15 Uber credit expires in 5 days" with countdown timer on dashboard |
| **Annual fee offset calculator** | Per-card breakdown showing fee, credits available, credits used, effective fee, and recommendation |
| **Credit calendar view** | Monthly calendar showing which credits reset when, upcoming expirations, enrollment deadlines |
| **Mark as used** | Simple tap to mark a credit as used (full) or enter partial amount used |
| **Monthly credit summary notification** | Email/push: "January Credit Summary: You used $165 of $247 available. Here's what expired." |

**Backend Tasks:**

| Task | Acceptance Criteria |
|------|-------------------|
| /api/user/credits | GET: All credits across all user cards with current period status. Joined with catalog data. |
| /api/user/credits/[id]/use | PATCH: Mark credit as used (full or partial amount). |
| /api/user/credits/[id]/enroll | PATCH: Mark credit as enrolled. |
| /api/user/credits/summary | GET: Annual fee offset calculation per card. |
| Credit period generator | Trigger.dev job: Generate new credit usage rows at the start of each period. Mark expired rows. Runs daily at midnight. |
| Credit expiration checker | Part of Card Deadline Notifier Agent: Check for expiring credits and trigger notifications. |

**Notifications (add to Card Deadline Notifier Agent):**

| Notification | Trigger | Message |
|-------------|---------|---------|
| `credit_expiring_soon` | 5 days before period end, credit unused or partial | "You have $15 in Uber credit expiring on Jan 31. Open the Uber app and order something!" |
| `credit_expired` | Period ended, credit not fully used | "You missed $15 in Uber credit last month. Set a reminder so you don't miss February's." |
| `credit_enrollment_needed` | Credit requires activation, user hasn't enrolled | "Your Amex Platinum Digital Entertainment credit requires enrollment. You're missing $20/month. Enroll now." |
| `credit_period_new` | New period starts | "Your February credits are now active: $15 Uber, $20 Entertainment, $12.98 Walmart+. Total: $47.98 available." |
| `credit_monthly_summary` | 1st of each month | "January Credit Report: Used $165 of $247 across 4 cards. Missed $82. Here's how to do better this month." |
| `annual_fee_approaching_with_value` | 30 days before AF posts | "Your Amex Platinum $695 annual fee posts Feb 28. You've used $743 in credits this year — you're $48 ahead. Recommendation: Keep." |

**SKILL USED:** next-api-route, supabase-migration, ui-component, react-email-template.

---

## ADDITION 3: Perks & Benefits Reference

**PASTE INTO:** Track 4 → Phase 1, as an addition to Loop 1 card detail view. Data goes in credit-cards.json.

---

#### Perks & Benefits Reference (Add to Loop 1, card detail view)

**Goal:** Catalog every non-earning, non-credit benefit of each card so users know what they have and actually use it. Many users don't know their card includes primary rental car insurance, trip delay coverage, or free hotel elite status.

**Data Structure — Add `perks` array to credit-cards.json:**

```json
{
  "slug": "chase-sapphire-reserve",
  "perks": [
    {
      "perk_slug": "csr-lounge-access",
      "name": "Airport Lounge Access",
      "category": "travel",
      "description": "Priority Pass Select membership with access to 1,400+ lounges worldwide. Cardholder + 2 guests free.",
      "estimated_annual_value_cents": 40000,
      "action_required": "Register for Priority Pass via the Chase Benefits portal. You'll receive a card in the mail.",
      "one_time_setup": true,
      "setup_completed_field": true
    },
    {
      "perk_slug": "csr-global-entry",
      "name": "Global Entry / TSA PreCheck Credit",
      "category": "travel",
      "description": "Up to $100 statement credit for Global Entry application fee (includes TSA PreCheck) or up to $85 for standalone TSA PreCheck. Renews every 4 years.",
      "estimated_annual_value_cents": 2500,
      "action_required": "Apply for Global Entry at ttp.cbp.dhs.gov and pay the $100 fee with this card. Credit appears on your statement automatically.",
      "one_time_setup": true,
      "setup_completed_field": true
    },
    {
      "perk_slug": "csr-rental-car",
      "name": "Primary Rental Car Insurance",
      "category": "insurance",
      "description": "Primary collision damage waiver (CDW) for rental cars. Covers theft and collision damage up to the cash value of the vehicle. PRIMARY means it pays FIRST — you don't need to file with your personal auto insurance.",
      "estimated_annual_value_cents": 5000,
      "action_required": "Decline the rental company's CDW/LDW at the counter. Pay for the entire rental with this card. File claims through Chase Benefit Center.",
      "one_time_setup": false,
      "setup_completed_field": false
    },
    {
      "perk_slug": "csr-trip-delay",
      "name": "Trip Delay Insurance",
      "category": "insurance",
      "description": "Reimburses up to $500 per ticket for meals, lodging, toiletries, and essentials when your trip is delayed 6+ hours or requires an overnight stay. Covers the cardholder and immediate family.",
      "estimated_annual_value_cents": 0,
      "action_required": "Purchase the flight/trip with this card. If delayed 6+ hours, keep all receipts and file a claim within 60 days through the Chase Benefit Center.",
      "one_time_setup": false,
      "setup_completed_field": false
    },
    {
      "perk_slug": "csr-trip-cancel",
      "name": "Trip Cancellation / Interruption Insurance",
      "category": "insurance",
      "description": "Up to $10,000 per person and $20,000 per trip for prepaid, non-refundable travel expenses if your trip is cancelled or cut short due to covered reasons (illness, severe weather, jury duty, etc.).",
      "estimated_annual_value_cents": 0,
      "action_required": "Purchase the trip with this card. File a claim through Chase Benefit Center with documentation of the covered reason.",
      "one_time_setup": false,
      "setup_completed_field": false
    },
    {
      "perk_slug": "csr-purchase-protection",
      "name": "Purchase Protection",
      "category": "insurance",
      "description": "Covers new purchases against damage or theft for 120 days from purchase date. Up to $500 per claim, $50,000 per account.",
      "estimated_annual_value_cents": 0,
      "action_required": "File a claim within 120 days of purchase if the item is damaged or stolen. Have the original receipt and the card statement showing the purchase.",
      "one_time_setup": false,
      "setup_completed_field": false
    },
    {
      "perk_slug": "csr-extended-warranty",
      "name": "Extended Warranty",
      "category": "insurance",
      "description": "Extends the manufacturer's US warranty by 1 additional year on warranties of 3 years or less. Covers items up to $10,000.",
      "estimated_annual_value_cents": 0,
      "action_required": "Keep your original receipt and warranty documentation. File a claim when the item fails after the manufacturer warranty expires but within the extended period.",
      "one_time_setup": false,
      "setup_completed_field": false
    },
    {
      "perk_slug": "csr-no-ftf",
      "name": "No Foreign Transaction Fees",
      "category": "financial",
      "description": "No 3% foreign transaction fee on purchases made outside the US or in foreign currencies. Saves ~3% on every international purchase.",
      "estimated_annual_value_cents": 0,
      "action_required": "None. Use this card for all international purchases automatically.",
      "one_time_setup": false,
      "setup_completed_field": false
    },
    {
      "perk_slug": "csr-doordash",
      "name": "Complimentary DashPass Membership",
      "category": "lifestyle",
      "description": "Free DashPass membership ($0 delivery fees on eligible orders $12+). Normally $9.99/month.",
      "estimated_annual_value_cents": 12000,
      "action_required": "Activate DashPass through the Chase DoorDash partnership page. Link your Sapphire Reserve card.",
      "one_time_setup": true,
      "setup_completed_field": true
    }
  ]
}
```

**Perk Categories:**

| Category | What It Covers |
|----------|---------------|
| `travel` | Lounge access, Global Entry/PreCheck, hotel status, airline perks, priority boarding |
| `insurance` | Trip delay, trip cancellation, rental car CDW, purchase protection, extended warranty, cell phone protection, lost luggage, baggage delay |
| `lifestyle` | DashPass, streaming, dining programs, concierge service |
| `financial` | No foreign transaction fees, price protection, return protection, APR benefits |

**User Perk Tracking:**

```sql
-- Track one-time setup perks (did the user actually activate them?)
CREATE TABLE public.user_perk_setup (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_card_id UUID REFERENCES public.user_cards(id) ON DELETE CASCADE,
  perk_slug TEXT NOT NULL,
  setup_completed BOOLEAN DEFAULT false,
  setup_completed_at TIMESTAMPTZ,
  notes TEXT,                         -- "Priority Pass card #: PP12345"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_card_id, perk_slug)
);

ALTER TABLE public.user_perk_setup ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own perk setup" ON public.user_perk_setup
  FOR ALL USING (
    user_card_id IN (SELECT id FROM public.user_cards WHERE user_id = auth.uid())
  );
```

**Frontend Tasks:**

| Task | Acceptance Criteria |
|------|-------------------|
| **Perks section on card detail page** | Grouped by category (travel, insurance, lifestyle, financial). Each perk shows name, description, action required, and estimated value. |
| **Setup checklist** | For one-time perks (lounge, Global Entry, DashPass), show ☐/☑ checklist. "3 of 5 perks activated." |
| **Unused perk alerts** | Dashboard widget: "You have 2 perks you haven't set up yet" with CTAs |
| **Scenario-based tips** | Contextual tips that surface at the right time (future: based on upcoming trips, rental car bookings, etc.). MVP: static tips on card detail page. |
| **Perk comparison view** | Compare perks across 2-3 cards side-by-side: "Both cards have lounge access, but the Reserve includes 2 guests vs Gold includes none." |
| **Perk value estimator** | Sum estimated_annual_value_cents across all perks on a card. Display alongside annual fee offset calculator: "Perks estimated value: $595/year." |

**Backend Tasks:**

| Task | Acceptance Criteria |
|------|-------------------|
| /api/user/perks | GET: All perks across all user cards with setup status. |
| /api/user/perks/[id]/setup | PATCH: Mark perk as set up. |
| Perk data in catalog API | /api/cards/catalog/[slug] already returns card detail — ensure perks array is included. |

**Scenario-Based Tip Examples (Static MVP, contextual later):**

| Scenario | Tip |
|----------|-----|
| Renting a car | "Use your Sapphire Reserve and decline the rental counter's CDW. You have primary rental car insurance — saves $15-30/day." |
| International trip | "Use cards with no foreign transaction fees: your Sapphire Reserve and Amex Gold both qualify. Avoid your Freedom Flex (3% FTF)." |
| Flight delayed | "If your flight is delayed 6+ hours, your Sapphire Reserve covers up to $500 in meals and hotels. Keep all receipts." |
| Buying electronics | "Purchase protection covers damage/theft for 120 days on your Sapphire Reserve, and extended warranty adds 1 year. Buy it on the Reserve." |
| Phone cracked | "If you pay your phone bill with your Ink Preferred, you have cell phone protection up to $600 (with $100 deductible)." |

**SKILL USED:** data-seed-builder (for perk data), ui-component (for perk UI components).

---

## ADDITION 4: Annual Fee Decision Helper

**PASTE INTO:** Track 4 → Phase 1, expand the existing AF reminder in Loop 1 / Card Deadline Notifier Agent.

---

#### Annual Fee Decision Helper (Expand existing AF reminder, Week 4)

**Goal:** When a user's annual fee is approaching, provide a comprehensive value analysis that helps them decide: keep, downgrade, or cancel — with specific next steps for each option.

This expands the existing annual fee reminder from a simple "AF posts in 30 days" alert into a full decision support tool.

**Data Structure — Add `downgrade_paths` and `retention_data` to credit-cards.json:**

```json
{
  "slug": "chase-sapphire-reserve",
  "annual_fee_cents": 55000,
  "downgrade_options": [
    {
      "to_card_slug": "chase-sapphire-preferred",
      "annual_fee_cents": 9500,
      "preserves_points": true,
      "preserves_credit_line": true,
      "preserves_account_history": true,
      "what_you_lose": ["3x earning on dining/travel drops to 2x", "Priority Pass lounge access", "Primary rental car insurance (becomes secondary)", "$300 travel credit", "DashPass membership", "1.5x portal redemption drops to 1.25x"],
      "what_you_keep": ["Chase Ultimate Rewards points", "Transfer partners", "Trip cancellation insurance", "Purchase protection"]
    },
    {
      "to_card_slug": "chase-freedom-unlimited",
      "annual_fee_cents": 0,
      "preserves_points": false,
      "preserves_credit_line": true,
      "preserves_account_history": true,
      "what_you_lose": ["All travel perks", "Transfer partner access (unless you have another Sapphire/Ink)", "Elevated earning rates on dining/travel", "Lounge access", "Travel credit"],
      "what_you_keep": ["Credit line", "Account history/age", "1.5% flat cashback earning"]
    }
  ],
  "retention_data": {
    "common_offers": [
      { "type": "statement_credit", "typical_value_cents": 15000, "typical_spend_requirement_cents": 400000, "notes": "$150 after $4,000 spend in 3 months" },
      { "type": "bonus_points", "typical_value_cents": 10000, "typical_spend_requirement_cents": 0, "notes": "10,000 bonus UR points, no spend requirement" }
    ],
    "best_time_to_call": "Call the number on the back of your card 30-60 days before your annual fee posts. Say you're considering closing due to the annual fee.",
    "success_rate_estimate": "moderate",
    "source_notes": "Based on aggregated reports from Reddit r/creditcards, FlyerTalk, Doctor of Credit."
  }
}
```

**Decision Analysis Logic:**

When the AF reminder triggers (30 days before posting), compute:

```
1. CREDITS VALUE
   Sum all credits used in the past cardmember year (from user_credit_usage).
   Also show: credits available but unused (missed value).

2. EARNING VALUE
   If user tracks spending or has Plaid connected:
     Total points earned on this card × estimated CPP for that currency.
   If not:
     Skip this section or estimate from signup bonus tracking spend data.

3. PERK VALUE
   Sum estimated_annual_value_cents for perks the user has actually activated
   (from user_perk_setup where setup_completed = true).
   Conservative: only count perks they've set up.

4. TOTAL VALUE vs ANNUAL FEE
   total_value = credits_used + earning_value + perk_value
   net = total_value - annual_fee
   If net > 0: Recommend KEEP
   If net < 0 but close: Recommend CALL FOR RETENTION OFFER
   If net significantly negative: Recommend DOWNGRADE or CANCEL

5. DOWNGRADE OPTIONS
   Show each downgrade path with what you lose, what you keep, and the new effective cost.

6. RETENTION OFFER STRATEGY
   Show common offers, when to call, and the script to use.
```

**Frontend Tasks:**

| Task | Acceptance Criteria |
|------|-------------------|
| **AF Decision page** | Full analysis page accessible from the AF reminder notification and from card detail view. Shows value breakdown, recommendation, and action buttons. |
| **Value breakdown visualization** | Bar chart or stacked view: green bars for credits/perks/earnings, red bar for annual fee. Visual answer to "am I ahead or behind?" |
| **Downgrade comparison** | Side-by-side: current card vs each downgrade option. What you lose, what you keep, new effective fee. |
| **Retention offer guide** | "Call this number. Say this. Common offers you might receive." With a log to record what offer was made. |
| **Action buttons** | "Keep Card" (dismiss reminder), "Call for Retention" (shows phone number + script), "Downgrade" (shows options), "Cancel" (shows implications) |
| **Retention offer log** | After calling, user logs: offer received (yes/no), offer type, value, spend requirement, accepted/declined. Feeds back into retention_data over time. |

**Backend Tasks:**

| Task | Acceptance Criteria |
|------|-------------------|
| /api/user/cards/[id]/af-analysis | GET: Computes the full annual fee decision analysis for a specific card. |
| /api/user/cards/[id]/retention-log | POST: Log a retention offer attempt and outcome. |
| AF analysis computation | Pure function: takes card data, credit usage, perk setup, optional earning data → returns structured analysis with recommendation. |

**Notification update (Card Deadline Notifier Agent):**

Change the existing 30-day AF notification from:

> "Your $550 annual fee posts in 30 days. Call for retention offer or downgrade?"

To:

> "Your Chase Sapphire Reserve $550 annual fee posts Feb 28. Based on your usage: you've extracted $823 in value this year (credits: $300, perks: ~$523). You're $273 ahead. Tap to see full analysis, downgrade options, and retention offer strategy."

**SKILL USED:** next-api-route, ui-component, react-email-template.

---

## ADDITION 5: User Personas & Adaptive Complexity

**PASTE INTO:** Track 4 → Loop 1, as part of the onboarding flow and a new presentation layer config.

---

#### User Personas & Adaptive Complexity (Add to Loop 1 onboarding, Week 3)

**Goal:** Make Wayloft usable and valuable for everyone from a college student with their first Discover It to a business owner managing 15 cards. Same data, different presentation.

**Onboarding addition:**

Add one screen to the existing onboarding quiz (currently: "What cards do you have?" → dates):

```
Screen 0 (NEW): "How experienced are you with credit card rewards?"

○ I'm just getting started (Beginner)
  "I have 1-2 cards and I'm learning how points work."

○ I know the basics (Intermediate)
  "I use a few cards strategically and understand points and miles."

○ I optimize everything (Advanced)
  "I have multiple cards, track transfer partners, and know CPP valuations."
```

**Experience level stored on profile:**

```sql
ALTER TABLE public.profiles ADD COLUMN experience_level TEXT DEFAULT 'beginner'
  CHECK (experience_level IN ('beginner', 'intermediate', 'advanced'));
```

**How experience level affects the UI:**

| Element | Beginner | Intermediate | Advanced |
|---------|----------|-------------|----------|
| **Wallet guide** | "Use this card at restaurants" with card art only | Card name + multiplier + currency | Card + multiplier + currency + effective CPP + cap status |
| **Points display** | "You have ~$1,200 worth of travel rewards" (dollar value only) | "80,000 UR points (~$1,440)" | "80,000 UR × 1.8cpp = $1,440 (transfer) / $1,200 (portal 1.5x) / $800 (statement)" |
| **Transfer partners** | Hidden by default. Show "Learn more about using points for flights" link | Listed with "Transfer to [airline] for flights" | Full detail: ratios, transfer times, sweet spots, current bonuses |
| **CPP values** | Never shown. Everything in dollar estimates. | Shown on hover/tap. | Shown inline everywhere. |
| **Card recommendations** | "Great first rewards card" / "Good for groceries" | Earning rates + annual fee math | Full scoring breakdown, issuer rules, optimal application order |
| **Signup bonus tracker** | "Spend $4,000 in 3 months to earn a $1,600 travel bonus" | "Spend $4,000 in 90 days → 80,000 UR points (~$1,440)" | "$4,000 MSR in 90 days → 80K UR. Historical high: 100K. Chase 5/24 status: 3/24." |
| **Statement credits** | "You have $15 free Uber money this month!" | "$15 Uber credit expires Jan 31" | "$15/mo Uber credit, $20 Dec. Calendar year reset. Period 1/12." |
| **Annual fee analysis** | "This card costs $250/year but gives you back about $1,100 in value. It's worth keeping!" | Full breakdown with numbers | Full breakdown + CPP sensitivity analysis + downgrade math |
| **Jargon** | No jargon. Plain English. | Light jargon with hover definitions. | Full terminology, no training wheels. |
| **Tooltips** | Everywhere. "What are points?" "What does 4x mean?" | On complex concepts only. | None unless user enables them. |

**Implementation approach:**

This is a presentation layer concern, not a data layer concern. The API returns the same data regardless of experience level. The frontend checks `profile.experience_level` and conditionally renders detail, tooltips, and formatting.

Create a utility:
```typescript
// lib/experience.ts
export function formatPoints(points: number, cpp: number, level: ExperienceLevel): string {
  switch (level) {
    case 'beginner':
      return `~$${Math.round(points * cpp / 100)} in travel value`;
    case 'intermediate':
      return `${points.toLocaleString()} points (~$${Math.round(points * cpp / 100)})`;
    case 'advanced':
      return `${points.toLocaleString()} × ${cpp}cpp = $${Math.round(points * cpp / 100)}`;
  }
}
```

Users can change their level anytime in settings. The app should also detect natural progression — if a beginner user has 5+ cards and has used the app for 3+ months, suggest: "You've leveled up! Want to see more detail in your dashboard?"

**SKILL USED:** ui-component.

---

## ADDITION 6: Education Layer

**PASTE INTO:** Track 3 (Design System) as a new component set, and referenced in Loop 1 onboarding.

---

#### Education Layer — Contextual Learning Components

**Goal:** Teach credit card concepts inline, at the moment they're relevant. Not a separate "learn" section. Wayloft becomes the tool that makes people smarter about their cards while they use it.

**Components to build:**

| Component | Purpose | Where Used |
|-----------|---------|-----------|
| `<Tooltip term="transferable_points">` | Hover/tap tooltip that explains a concept in plain language. Pulls from a glossary. | Everywhere jargon appears |
| `<ExplainerCard>` | Collapsible card with a "💡 What does this mean?" header. 2-3 sentence explanation + optional "Learn more" link. | Wallet guide, card detail, bonus tracker |
| `<FirstTimeHint>` | One-time dismissible hint shown the first time a user encounters a feature. | Dashboard, credit tracker, optimizer |
| `<GlossaryModal>` | Searchable glossary of all credit card terms. Accessible from settings and from any tooltip. | Global |
| `<ComparisonHelper>` | "Why is Card A better than Card B for this?" explanation block. | Wallet guide category drill-down |

**Glossary entries (store as JSON, render contextually):**

```json
{
  "terms": [
    {
      "slug": "transferable_points",
      "term": "Transferable Points",
      "short": "Points you can move to different airline and hotel programs.",
      "full": "Some credit card points (like Chase Ultimate Rewards, Amex Membership Rewards, and Capital One Miles) can be transferred to airline frequent flyer programs and hotel loyalty programs. This is powerful because the same points might be worth 1 cent as cashback but 2-5 cents when transferred to the right airline for a flight. Wayloft shows you all your transfer options.",
      "example": "80,000 Chase UR points → transfer to United → book a round-trip to Europe in economy.",
      "show_for_levels": ["beginner", "intermediate"]
    },
    {
      "slug": "cpp",
      "term": "Cents Per Point (CPP)",
      "short": "How much each point is worth in real dollars.",
      "full": "CPP measures the value you get per point when you redeem them. If you use 50,000 points for a $750 flight, that's 1.5 cents per point (750 ÷ 50,000 = 0.015 = 1.5cpp). Higher CPP means you're getting more value. Wayloft calculates this automatically for every redemption option.",
      "example": "1.0cpp = baseline (cashback). 1.5-2.0cpp = good transfer value. 3.0cpp+ = excellent sweet spot redemption.",
      "show_for_levels": ["beginner"]
    },
    {
      "slug": "signup_bonus",
      "term": "Sign-Up Bonus",
      "short": "A big chunk of points you earn for opening a new card and spending a certain amount.",
      "full": "When you open a new credit card, the issuer often offers a large one-time bonus (like 60,000-100,000 points) if you spend a minimum amount within a set timeframe (usually $3,000-$5,000 in 3 months). This is often the biggest single source of points value. The key is to time your applications around large planned purchases so the minimum spend happens naturally.",
      "example": "Chase Sapphire Preferred: Spend $4,000 in 3 months → earn 60,000 UR points (~$1,080 toward flights).",
      "show_for_levels": ["beginner"]
    },
    {
      "slug": "annual_fee",
      "term": "Annual Fee",
      "short": "A yearly charge for having the card. Many premium cards offset this with credits and perks.",
      "full": "Premium credit cards charge $95-$695+ per year. The annual fee is worth paying when the credits, perks, and earning rates you actually use exceed the fee. Wayloft calculates your 'effective annual fee' by subtracting the credits and perks you've used. Many cards with high fees actually cost nothing — or even save you money — if you use all the benefits.",
      "example": "Chase Sapphire Reserve: $550 fee - $300 travel credit = $250 effective fee. If you also use the lounge access ($400+ value), you're way ahead.",
      "show_for_levels": ["beginner"]
    },
    {
      "slug": "statement_credit",
      "term": "Statement Credit",
      "short": "Free money back on your card for specific purchases.",
      "full": "Statement credits are automatic refunds that appear on your credit card bill when you make qualifying purchases. For example, the Amex Platinum gives you $15/month back on Uber rides. You pay normally, and the $15 shows up as a credit on your next statement. The catch: most credits expire if you don't use them (monthly ones reset each month), and some require enrollment first. Wayloft tracks all of these for you.",
      "example": "Your Amex Platinum has $15/month Uber credit. If you take one $15 Uber ride, your statement shows the charge AND a -$15 credit, so it's free.",
      "show_for_levels": ["beginner", "intermediate"]
    },
    {
      "slug": "minimum_spend",
      "term": "Minimum Spend Requirement (MSR)",
      "short": "The amount you need to spend on a new card to earn the sign-up bonus.",
      "full": "When you open a new card with a sign-up bonus, you typically need to spend a certain amount (the MSR) within a set timeframe (usually 3 months) to trigger the bonus. Tips: use the card for bills you already pay (groceries, gas, utilities, subscriptions), prepay upcoming expenses, or time your application before a large planned purchase. Never spend money you wouldn't otherwise spend just to hit the MSR.",
      "example": "Card requires $4,000 in 3 months. That's ~$1,333/month. If you spend $600/month on groceries, $200 on gas, $300 on dining, and $200 on bills, you're at $1,300 — almost there naturally.",
      "show_for_levels": ["beginner"]
    },
    {
      "slug": "chase_524",
      "term": "Chase 5/24 Rule",
      "short": "Chase denies most cards if you've opened 5+ cards (from any bank) in 24 months.",
      "full": "Chase tracks how many new credit cards you've opened across ALL issuers in the past 24 months. If the count is 5 or more, Chase will automatically deny most applications. This means if you want Chase cards, you should get them early in your credit card strategy. Wayloft tracks your 5/24 count and warns you before you hit the limit.",
      "example": "You opened 3 cards this year and 1 last year. Your 5/24 count is 4. You can get one more Chase card before you're locked out for a while.",
      "show_for_levels": ["beginner", "intermediate"]
    },
    {
      "slug": "transfer_partner",
      "term": "Transfer Partner",
      "short": "An airline or hotel you can send your credit card points to for booking flights or stays.",
      "full": "Cards with transferable points (Chase, Amex, Capital One, Citi, Bilt) let you move points to partner airline and hotel loyalty programs, usually at a 1:1 ratio. This is where points become most valuable — a point worth 1 cent as cashback might be worth 2-5 cents when transferred to the right airline for a business class flight. Wayloft shows you all your transfer options and which ones give the best value.",
      "example": "Transfer 60,000 Amex MR to ANA → book a round-trip business class to Tokyo (normally $5,000+ in cash). That's ~8 cents per point.",
      "show_for_levels": ["beginner", "intermediate"]
    },
    {
      "slug": "rotating_categories",
      "term": "Rotating Bonus Categories",
      "short": "Some cards change their bonus earning categories every 3 months. You have to activate them.",
      "full": "Cards like Chase Freedom Flex and Discover It offer 5% cashback (or 5x points) on categories that change every quarter — for example, grocery stores in Q1, gas stations in Q2. The catch: you must manually activate the bonus each quarter, usually through the issuer's website or app. If you don't activate, you only earn 1%. Wayloft reminds you to activate and updates your wallet guide when categories change.",
      "example": "Q2 2026: Chase Freedom Flex earns 5x on gas and home improvement (up to $1,500 in purchases). Activate at chase.com/freedom.",
      "show_for_levels": ["beginner", "intermediate"]
    },
    {
      "slug": "primary_vs_secondary_insurance",
      "term": "Primary vs Secondary Insurance",
      "short": "Primary insurance pays first. Secondary only pays what your personal insurance doesn't.",
      "full": "Some credit cards offer rental car insurance. 'Primary' means the card's insurance pays the full claim directly — you never involve your personal auto insurance, so your rates don't go up. 'Secondary' means your personal auto insurance pays first, and the card only covers the remainder. Primary is much more valuable. The Chase Sapphire Reserve offers primary; the Sapphire Preferred offers secondary.",
      "example": "You rent a car with your Sapphire Reserve, decline the rental counter's $15/day insurance, and get in a fender bender. Chase pays the claim directly. Your personal auto insurance is never involved.",
      "show_for_levels": ["beginner", "intermediate"]
    }
  ]
}
```

**Display rules:**
- Beginner users see tooltips automatically on all tagged terms.
- Intermediate users see tooltips only on complex terms.
- Advanced users see no tooltips unless they re-enable them in settings.
- All users can access the full glossary from the settings/help menu.
- `<FirstTimeHint>` components track dismissal in `localStorage` (or a user preferences table) and never show again once dismissed.

**SKILL USED:** ui-component.

---

## ADDITION 7: Credit Score Impact Awareness

**PASTE INTO:** Track 4 → Loop 2 (Card Recommendation Engine), as part of the recommendation output.

---

#### Credit Score Impact Awareness (Add to Loop 2, Week 5)

**Goal:** When recommending a new card or when a user is considering an application, surface credit health information. Positions Wayloft as a trusted advisor, not just an affiliate funnel.

**Data to track on user profile:**

```sql
ALTER TABLE public.profiles ADD COLUMN credit_score_range TEXT
  CHECK (credit_score_range IN ('building', 'fair', 'good', 'very_good', 'excellent'));
-- building: <580, fair: 580-669, good: 670-739, very_good: 740-799, excellent: 800+

ALTER TABLE public.profiles ADD COLUMN cards_opened_24mo INTEGER DEFAULT 0;
-- Can be auto-calculated from user_cards where card_since > NOW() - INTERVAL '24 months'
```

**Where to surface credit awareness:**

| Context | What to Show |
|---------|-------------|
| **Card recommendation results** | "Applying for this card will add 1 hard inquiry to your credit report. Hard inquiries typically lower your score by 5-10 points temporarily and fall off after 2 years." (Beginner only) |
| **Chase 5/24 counter** | "You've opened [X] cards in the last 24 months. Chase will deny most applications at 5. You have [5-X] Chase slots remaining." (All levels) |
| **Issuer velocity warnings** | "You opened 2 cards in the last 30 days. Some issuers may flag rapid applications. Consider waiting 60-90 days before your next application." (All levels) |
| **Application timeline** | When recommending multiple cards, suggest an application order and spacing: "Apply for the Chase card first (most restrictive). Wait 3 months. Then apply for the Amex." (Intermediate+) |
| **Downgrade vs cancel** | "Canceling this card may reduce your total available credit and shorten your average account age. Consider downgrading to the no-annual-fee version to keep the credit line open." (All levels) |

**5/24 Counter Widget (Dashboard):**

Auto-calculated from the user's cards:

```
Chase 5/24 Status: 3/24
━━━━━━━━━━━●━━━━━━━━━━━
[■ ■ ■ □ □]

Cards opened in last 24 months:
• Amex Gold (opened Mar 2025)
• Chase Freedom Flex (opened Aug 2025)
• Capital One Venture X (opened Nov 2025)

2 Chase slots remaining.
Next card falls off 5/24: Mar 2027 (Amex Gold)
```

**Frontend Tasks:**

| Task | Acceptance Criteria |
|------|-------------------|
| **5/24 counter widget** | Dashboard widget showing current count, cards contributing, next card to fall off |
| **Credit health banner on recommendations** | Non-dismissible but concise. Shows inquiry impact + 5/24 status + issuer velocity warnings. |
| **Application timeline view** | If user has queued up desired cards, show optimal application order with spacing |
| **Downgrade advisory on cancel flow** | When user considers canceling, show credit impact and downgrade alternatives |

**Backend Tasks:**

| Task | Acceptance Criteria |
|------|-------------------|
| 5/24 calculator | Auto-compute from user_cards WHERE card_since > NOW() - INTERVAL '24 months'. Include cards that are closed (they still count toward 5/24). |
| /api/user/credit-health | GET: Returns 5/24 count, velocity warnings, next card to fall off, recommended spacing |
| Issuer rule check in recommendation engine | Before recommending a card, check if user violates issuer rules (5/24, Amex lifetime, etc.). If so, either exclude or flag with explanation. |

**SKILL USED:** card-recommendation, ui-component.

---

## ADDITION 8: Household / Multi-User Card Management

**PASTE INTO:** Track 4 → Phase 3 (Growth, Month 6-7). Pro-tier feature.

---

#### Household Card Management (Phase 3, Month 6-7)

**Goal:** Allow families, couples, and households to share a unified wallet view. The spending optimizer considers all cards across all household members and tells each person which card to use.

**Why this matters:** Many families split card strategy across two people. One spouse carries the Amex Gold for 4x on groceries, the other carries the Sapphire Reserve for 3x on travel. Without a shared view, they can't coordinate. Wayloft should tell each person: "For groceries, have [partner name] use the Amex Gold. For travel, you use the Sapphire Reserve."

**Database:**

```sql
CREATE TABLE public.households (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,                    -- "Filippini Family"
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.household_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  display_name TEXT,                     -- "Tom", "Sarah"
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, user_id)
);

ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Household members can view" ON public.households
  FOR SELECT USING (id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));
CREATE POLICY "Household members can view members" ON public.household_members
  FOR SELECT USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));
```

**Household Optimizer Output:**

```
🍽️ Dining        → Sarah's Amex Gold (4x MR)
✈️ Travel        → Tom's Sapphire Reserve (3x UR)
🛒 Grocery       → Sarah's Amex Gold (4x MR)
⛽ Gas           → Tom's Freedom Flex (5x Q2 bonus — activated ✅)
🎬 Streaming     → Tom's Savor (3x entertainment)
🏠 Rent          → Sarah's Bilt Mastercard (1x on rent — only card that earns!)
📦 Everything Else → Tom's Citi Double Cash (2x)
```

**Features:**
- Invite household members via email link.
- Each member's card portfolio is visible to the household (read-only).
- Household optimizer considers all cards across all members.
- Credit tracker and notifications remain per-individual.
- Owner can remove members. Members can leave.

**Tier gate:** Household management is a Pro feature.

**SKILL USED:** next-api-route, supabase-migration.

---

## ADDITION 9: Spending Auto-Detection via Plaid

**PASTE INTO:** Track 4 → Phase 3 (Growth), Month 7-8. Add to the existing Phase 3 timeline.

---

#### Spending Auto-Detection via Plaid (Phase 3, Month 7-8)

**Goal:** Connect to users' bank accounts via Plaid to automatically categorize transactions and retroactively score whether they used the optimal card.

This turns the spending optimizer from a reference tool into an active coach.

**How it works:**
1. User connects their credit card accounts via Plaid Link.
2. Wayloft reads transactions (category, merchant, amount, card used).
3. For each transaction, the system checks: did the user use the optimal card?
4. If not, it calculates the points they missed and surfaces it.

**"Wrong Card" Alert Example:**

> "Yesterday you spent $127.43 at Whole Foods on your Chase Freedom Unlimited (1.5x = 191 UR points). Your Amex Gold earns 4x on groceries — that would have been 510 MR points (~$10.20 value). You missed $6.37 in value."

**Monthly Optimization Report:**

> "February Optimization Score: 78%
> You used the optimal card for 78% of your spending. If you'd used the optimal card for everything, you would have earned an additional 4,230 points (~$76 value).
>
> Top misses:
> - Grocery at Whole Foods (3 transactions) → Should use Amex Gold
> - Gas at Shell (2 transactions) → Should use Freedom Flex (Q1 5x bonus)
> - Uber rides (4 transactions) → Should use Sapphire Reserve (3x travel)"

**Database:**

```sql
CREATE TABLE public.plaid_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  plaid_item_id TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  institution_name TEXT,
  card_slug TEXT,                         -- Map Plaid account to user's card
  last_synced_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  plaid_connection_id UUID REFERENCES public.plaid_connections(id),
  plaid_transaction_id TEXT UNIQUE,
  date DATE NOT NULL,
  merchant_name TEXT,
  amount_cents INTEGER NOT NULL,
  category TEXT,                          -- Mapped to our canonical categories
  card_used_slug TEXT,                    -- Which card was actually used
  optimal_card_slug TEXT,                 -- Which card should have been used
  points_earned INTEGER,                  -- Actual points earned
  points_optimal INTEGER,                 -- Points that would have been earned optimally
  points_missed INTEGER,                  -- Difference
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Tier gate:** Plaid integration is a Pro feature. Free tier shows the spending optimizer (which card to use) but not the retroactive scoring.

**Timeline:** Month 7-8 in Phase 3. Requires Plaid partnership ($500/mo base + per-connection fees).

---

## ADDITION 10: Updated credit-cards.json Schema Summary

**PASTE INTO:** Loop 1 backend tasks, as a reference for the complete card catalog schema.

---

#### Updated credit-cards.json Complete Schema

Each card entry in the catalog should now include all of these top-level fields:

```json
{
  "slug": "chase-sapphire-reserve",
  "name": "Chase Sapphire Reserve",
  "issuer": "Chase",
  "network": "Visa",
  "currency": "Chase Ultimate Rewards",
  "currency_code": "UR",
  "annual_fee_cents": 55000,
  "card_image_url": "/images/cards/chase-sapphire-reserve.png",
  "card_tier": "premium",
  "credit_score_recommended": "very_good",
  "foreign_transaction_fee": false,
  "earning_rates": [ ... ],
  "rotating_categories": null,
  "signup_bonus": {
    "bonus_amount": 60000,
    "bonus_currency": "Ultimate Rewards points",
    "estimated_value_cents": 108000,
    "minimum_spend_cents": 400000,
    "timeframe_days": 90,
    "is_currently_available": true,
    "historical_high_bonus": 100000,
    "restrictions": "Not available if you received a Sapphire bonus in the last 48 months."
  },
  "credits": [ ... ],
  "perks": [ ... ],
  "transfer_partners": ["united", "hyatt", "southwest", "british_airways", "air_canada", "virgin_atlantic", "iberia", "singapore", "iff"],
  "downgrade_options": [ ... ],
  "retention_data": { ... },
  "best_for": ["travel", "dining", "lounge_access", "rental_cars"],
  "ideal_user": "Frequent travelers who value lounge access, travel insurance, and flexible point redemptions. Best paired with Chase Freedom Flex for 5x quarterly categories that pool into the same UR balance.",
  "pros": [
    "3x earning on travel and dining",
    "$300 annual travel credit (broad definition)",
    "Priority Pass lounge access with 2 guests",
    "Primary rental car insurance",
    "1.5x value when redeeming through Chase Travel portal",
    "Strong transfer partner list (Hyatt is a standout)"
  ],
  "cons": [
    "$550 annual fee (effective ~$250 after travel credit)",
    "Not the best for groceries or everyday spend",
    "Subject to Chase 5/24 rule",
    "Sapphire family restriction (can't hold both Preferred and Reserve)"
  ]
}
```

This schema supports every feature: the spending optimizer (earning_rates), credit tracker (credits), perk reference (perks), annual fee decision helper (downgrade_options, retention_data), card recommendations (best_for, ideal_user, pros, cons, signup_bonus), and the education layer (all contextual data needed for tooltips and explainers).

---

## ADDITION 11: Updated Notifications Master List

**PASTE INTO:** Track 7 (Operations), as an addition to the Card Deadline Notifier Agent scope.

---

#### Complete Notification Catalog

| Notification Slug | Source Feature | Trigger | Priority | Channel |
|------------------|---------------|---------|----------|---------|
| `signup_bonus_30d` | Bonus Tracker | 30 days before MSR deadline | High | Email + Push |
| `signup_bonus_14d` | Bonus Tracker | 14 days before MSR deadline | Critical | Email + Push |
| `signup_bonus_7d` | Bonus Tracker | 7 days before MSR deadline | Critical | Email + Push |
| `signup_bonus_at_risk` | Bonus Tracker | Projected to miss MSR based on pace | High | Email + Push |
| `signup_bonus_completed` | Bonus Tracker | MSR threshold met | Low | Push |
| `annual_fee_30d` | AF Decision Helper | 30 days before AF posts | High | Email + Push |
| `annual_fee_analysis` | AF Decision Helper | Same as above, includes value analysis | High | Email |
| `credit_expiring_5d` | Credit Tracker | 5 days before period end, credit unused | High | Push |
| `credit_expiring_1d` | Credit Tracker | 1 day before period end, credit unused | Critical | Push |
| `credit_expired` | Credit Tracker | Period ended, credit not fully used | Medium | Push |
| `credit_enrollment_needed` | Credit Tracker | Credit requires activation, not enrolled | High | Email + Push |
| `credit_period_new` | Credit Tracker | New period starts (monthly/quarterly) | Low | Push |
| `credit_monthly_summary` | Credit Tracker | 1st of each month | Medium | Email |
| `quarterly_category_activation` | Spending Optimizer | 1st of Jan/Apr/Jul/Oct | High | Email + Push |
| `quarterly_category_reminder` | Spending Optimizer | 7 days into quarter, not activated | High | Push |
| `optimizer_changed` | Spending Optimizer | User adds/removes card | Low | Push |
| `transfer_bonus_new` | Transfer Bonus Monitor | New bonus detected | High | Email + Push |
| `transfer_bonus_ending` | Transfer Bonus Monitor | Bonus ending in 48 hours | Medium | Push |
| `points_expiring_90d` | Points Tracker | Points expire in 90 days | Medium | Email |
| `points_expiring_30d` | Points Tracker | Points expire in 30 days | High | Email + Push |
| `unused_perk_reminder` | Perk Reference | Monthly check: one-time perks not activated | Low | Email |
| `wrong_card_used` | Plaid (Phase 3) | Transaction on suboptimal card > $50 | Medium | Push |
| `monthly_optimization_report` | Plaid (Phase 3) | 1st of each month | Medium | Email |
| `new_card_recommendation` | Recommendation Engine | Quarterly or on profile update | Low | Email |
| `issuer_rule_warning` | Credit Health | Approaching 5/24 or other limits | High | Email + Push |

**Notification preferences:** Users control which notifications they receive and through which channel. Default to all on for email, opt-in for push. Respect frequency caps: max 2 push notifications per day, max 3 emails per week.

---

## ADDITION 12: Updated One-Sentence Strategy

**PASTE INTO:** Replace the existing one-sentence strategy at the bottom of the document.

---

## The One-Sentence Strategy

**Build the self-reliant credit card intelligence platform — powered by a spending optimizer, credit tracker, and education layer that serves everyone from first-time cardholders to expert optimizers — monetized primarily through affiliate revenue and enhanced by a browser extension, flight search, and crowdsourced data.**

---

## Summary of v3.2 Changes

**v3.2 changes (February 20, 2026):**
- **Spending Optimizer Engine (Loop 1.5):** "Which card to use" engine with 13 canonical spending categories, earning rate comparison across all user cards, CPP-weighted tie-breaking, rotating/quarterly category tracking with activation reminders. The core daily-use feature.
- **Statement Credit Tracker:** Full lifecycle tracking for every statement credit (monthly, quarterly, semi-annual, annual, cardmember year). Enrollment tracking, expiration countdowns, annual fee offset calculator. New DB table: `user_credit_usage`. New notification types: `credit_expiring`, `credit_enrollment_needed`, `credit_monthly_summary`.
- **Perks & Benefits Reference:** Non-earning perks cataloged (insurance, travel, lifestyle, financial) with setup checklists, scenario-based tips, and estimated value. New DB table: `user_perk_setup`.
- **Annual Fee Decision Helper:** Expanded from simple reminder to full value analysis with credit usage data, perk value, downgrade paths, retention offer strategy, and keep/downgrade/cancel recommendation.
- **User Personas & Adaptive Complexity:** Three experience levels (beginner/intermediate/advanced) control UI detail, jargon, tooltips, and CPP visibility. Same data, different presentation.
- **Education Layer:** Contextual glossary with 10+ terms, inline tooltips, first-time hints, and explainer cards. Makes Wayloft accessible to credit card beginners.
- **Credit Score Impact Awareness:** 5/24 counter widget, issuer velocity warnings, inquiry impact notices, application timeline optimization. Added to card recommendation engine output.
- **Household Management (Phase 3):** Multi-user wallet with cross-household spending optimization. Pro-tier feature.
- **Plaid Transaction Scoring (Phase 3):** Retroactive "wrong card" detection and monthly optimization reports. Pro-tier feature.
- **credit-cards.json schema expanded:** Now includes `earning_rates`, `rotating_categories`, `credits`, `perks`, `downgrade_options`, `retention_data`, `best_for`, `ideal_user`, `pros`, `cons`.
- **Notification catalog expanded:** 25 notification types across all features with channel preferences and frequency caps.
- **One-sentence strategy updated** to reflect broader audience and credit card intelligence positioning.
