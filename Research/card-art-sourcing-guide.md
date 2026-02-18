# Card Art Sourcing Guide

**Date:** February 18, 2026
**Status:** Research Complete
**Classification:** INTERNAL -- Design & Implementation

---

## Executive Summary

**Recommendation: CSS/SVG card recreation for MVP, upgrade to affiliate images over time.**

The 52-card catalog needs visual representations for the card picker, portfolio dashboard, and recommendation results. After evaluating 4 approaches, CSS/SVG recreation is the clear MVP winner: zero legal risk, 100% catalog coverage, ships in 1-2 days, no external dependencies. CardPointers (the most relevant competitor) validates this hybrid approach.

---

## 1. Card Catalog Inventory (52 Cards)

### Chase (14 cards)
chase-sapphire-reserve, chase-sapphire-preferred, chase-freedom-unlimited, chase-freedom-flex, chase-ink-preferred, chase-ink-business-cash, chase-ink-business-unlimited, chase-ihg-premier, chase-ihg-one-rewards-traveler, chase-united-explorer, chase-world-of-hyatt, chase-marriott-bonvoy-boundless, chase-southwest-plus, chase-southwest-priority

### Amex (14 cards)
amex-platinum, amex-gold, amex-green, amex-blue-business-plus, amex-business-platinum, amex-hilton-honors-surpass, amex-hilton-honors-aspire, amex-hilton-honors, amex-hilton-honors-business, amex-marriott-bonvoy-brilliant, amex-delta-gold, amex-delta-platinum, amex-blue-cash-preferred, amex-blue-cash-everyday

### Citi (5 cards)
citi-strata-premier, citi-custom-cash, citi-double-cash, citi-aadvantage-executive, citi-aadvantage-platinum-select

### Capital One (5 cards)
capital-one-venture-x, capital-one-venture, capital-one-savor-one, capital-one-quicksilver, capital-one-venture-x-business

### Other Issuers (14 cards)
bilt-mastercard, barclays-aadvantage-aviator-red, barclays-jetblue-plus, barclays-wyndham-earner-plus, boa-premium-rewards, boa-customized-cash, boa-unlimited-cash, us-bank-altitude-reserve, us-bank-altitude-go, wells-fargo-autograph-journey, wells-fargo-autograph, wells-fargo-active-cash, discover-it-cash-back, discover-it-miles

---

## 2. Sourcing Options Comparison

| Approach | Visual Fidelity | Legal Risk | Effort | Time to Ship | Coverage | Cost |
|----------|:-:|:-:|:-:|:-:|:-:|:-:|
| **A: Affiliate Assets** | Highest | Very Low (licensed) | Low | Week 9+ (after approval) | ~80% | Free |
| **B: Card Art APIs** | High | Low | Medium-High | 2-3 weeks | Partial | $$$ |
| **C: CSS/SVG Recreation** | Medium | None | Low | 1-2 days | 100% | Free |
| **D: User-Contributed** | Variable | HIGH (PCI/PII) | Very High | 2-4 weeks | User-dependent | $$ |

---

## 3. Option Details

### Option A: Official Issuer Assets (via Affiliate Programs)
- CardRatings, CJ Affiliate, FlexOffers provide card images to approved affiliates
- Highest quality photography with standardized dimensions
- **Blocker:** Requires active affiliate approval (not available until ~Week 9+)
- Covers ~80% of catalog (some niche cards may lack assets)

### Option B: Card Art APIs/Databases
- Plaid and MX provide card imagery for linked accounts only (not catalog browsing)
- No open-source card art databases found
- **Blocker:** API costs and limited to linked-account scenarios

### Option C: CSS/SVG Recreation (RECOMMENDED FOR MVP)
- Rounded rectangle with 1.586:1 aspect ratio (standard card proportions)
- CSS gradient background from card's brand color palette
- Card network SVG logo in bottom-right corner
- Card name text in upper/center area
- Optional EMV chip icon

**Pros:** Zero legal risk, instant availability, 100% coverage, tiny bundle size, dark mode compatible, accessible (real text), no network requests
**Cons:** Lower fidelity than photographs, can't replicate distinctive textures (Amex Platinum metal)

**Sites doing this well:** Stripe (payment UI), Apple Wallet (gradient + logo), CardPointers (hybrid), Robinhood

### Option D: User-Contributed Images
- **Non-starter for MVP** due to PCI DSS exposure
- Card photos contain PAN, CVV, expiration, cardholder name
- Would require Level 1 PCI compliance ($50k-$200k/year)
- Defer to Phase 4+ if ever

---

## 4. Competitor Analysis

| Competitor | Approach | Notes |
|-----------|---------|-------|
| The Points Guy | Official images (affiliate/direct) | Owned by Red Ventures -- deepest issuer relationships |
| NerdWallet | Official images (affiliate/direct) | "Image courtesy of issuer" attribution pattern |
| CardPointers | Hybrid (official + CSS fallback) | **Best model to emulate** |
| AwardWallet | Program logos + card badges | Different use case (account tracking) |

---

## 5. Legal/IP Analysis

| Usage | Legal Risk | Notes |
|-------|-----------|-------|
| Card names in text ("Chase Sapphire Reserve") | Very Low | Nominative fair use -- protected |
| Card features/terms (factual) | Very Low | Factual reporting |
| Card network logos (Visa/MC/Amex/Discover) | Low | Standard fintech practice |
| CSS-recreated cards with brand colors + name | Very Low | No copyrighted imagery reproduced |
| Official images from affiliate library | Very Low | Licensed use |
| Images sourced WITHOUT affiliate agreement | Medium-High | Copyright infringement risk |
| Screenshots from issuer websites | High | Don't do this |

---

## 6. MVP Implementation Plan

### Step 1: Build `<CreditCardVisual />` component (Day 1)

```typescript
interface CreditCardVisualProps {
  slug: string;
  name: string;
  issuer: string;
  network: "visa" | "mastercard" | "amex" | "discover";
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}
```

### Step 2: Create card color config (Day 1)

Create `apps/web/lib/card-styles.ts` mapping each slug to gradient colors.

### Step 3: Add network SVG logos (Day 1)

Source from each network's brand resource center. White/mono versions for overlay.

### Step 4: Integrate across UI (Day 2)

Card picker, dashboard "My Cards," recommendation results, transfer bonus tracker.

---

## 7. Color Reference (All 52 Cards)

### Chase
| Slug | Primary | Secondary |
|------|---------|-----------|
| chase-sapphire-reserve | `#0a2540` | `#1a4a7a` |
| chase-sapphire-preferred | `#1a3a5c` | `#2a6a9c` |
| chase-freedom-unlimited | `#0077b6` | `#00a0e0` |
| chase-freedom-flex | `#004c6d` | `#0077b6` |
| chase-ink-preferred | `#1a1a2e` | `#2a2a4e` |
| chase-ink-business-cash | `#2d2d2d` | `#4a4a4a` |
| chase-ink-business-unlimited | `#2d2d2d` | `#4a4a4a` |
| chase-ihg-premier | `#2b2d42` | `#4a4e69` |
| chase-ihg-one-rewards-traveler | `#5c6b73` | `#8e9eab` |
| chase-united-explorer | `#1b2a4a` | `#2c3e6a` |
| chase-world-of-hyatt | `#1a1a2e` | `#3a3a5e` |
| chase-marriott-bonvoy-boundless | `#3a1a5c` | `#5a2a8c` |
| chase-southwest-plus | `#003876` | `#0058a6` |
| chase-southwest-priority | `#003876` | `#0058a6` |

### Amex
| Slug | Primary | Secondary |
|------|---------|-----------|
| amex-platinum | `#b0b0b0` | `#d4d4d4` |
| amex-gold | `#c5a04e` | `#e8c96a` |
| amex-green | `#2d6a4f` | `#40916c` |
| amex-blue-business-plus | `#1a73e8` | `#4a9af5` |
| amex-business-platinum | `#a0a0a0` | `#c8c8c8` |
| amex-hilton-honors-surpass | `#003b5c` | `#005580` |
| amex-hilton-honors-aspire | `#1a1a2e` | `#2a2a4e` |
| amex-hilton-honors | `#e8e8e8` | `#f5f5f5` |
| amex-hilton-honors-business | `#003b5c` | `#005580` |
| amex-marriott-bonvoy-brilliant | `#5c2d82` | `#7a3fa5` |
| amex-delta-gold | `#c5a04e` | `#dbb65c` |
| amex-delta-platinum | `#5c2d82` | `#7a3fa5` |
| amex-blue-cash-preferred | `#1a73e8` | `#4a9af5` |
| amex-blue-cash-everyday | `#1a73e8` | `#82b1ff` |

### Citi
| Slug | Primary | Secondary |
|------|---------|-----------|
| citi-strata-premier | `#003b5c` | `#00537a` |
| citi-custom-cash | `#1a3a5c` | `#2a5a8c` |
| citi-double-cash | `#4a4e69` | `#6b6f8e` |
| citi-aadvantage-executive | `#1a1a2e` | `#2a2a4e` |
| citi-aadvantage-platinum-select | `#c0c0c0` | `#e0e0e0` |

### Capital One
| Slug | Primary | Secondary |
|------|---------|-----------|
| capital-one-venture-x | `#1a1a2e` | `#2d2d44` |
| capital-one-venture | `#1a3a5c` | `#2a5a8c` |
| capital-one-savor-one | `#2d2d2d` | `#4a4a4a` |
| capital-one-quicksilver | `#c0c0c0` | `#e0e0e0` |
| capital-one-venture-x-business | `#1a1a2e` | `#2a2a3e` |

### Other Issuers
| Slug | Primary | Secondary |
|------|---------|-----------|
| bilt-mastercard | `#1a1a1a` | `#333333` |
| barclays-aadvantage-aviator-red | `#b30000` | `#d40000` |
| barclays-jetblue-plus | `#003087` | `#0050b7` |
| barclays-wyndham-earner-plus | `#0065a3` | `#0085d3` |
| boa-premium-rewards | `#c0c0c0` | `#e0e0e0` |
| boa-customized-cash | `#d40000` | `#ff1a1a` |
| boa-unlimited-cash | `#d40000` | `#ff3333` |
| us-bank-altitude-reserve | `#1a1a2e` | `#2d2d44` |
| us-bank-altitude-go | `#00274c` | `#004080` |
| wells-fargo-autograph-journey | `#d40000` | `#ff1a1a` |
| wells-fargo-autograph | `#b30000` | `#d40000` |
| wells-fargo-active-cash | `#d40000` | `#ff1a1a` |
| discover-it-cash-back | `#ff6600` | `#ff8533` |
| discover-it-miles | `#ff6600` | `#ff9966` |

---

## 8. Long-Term Roadmap

| Phase | Timeline | Approach |
|-------|----------|----------|
| Phase 1 (MVP) | Now -- Week 8 | CSS/SVG only |
| Phase 2 | Week 9-14 | Hybrid: affiliate images + CSS fallback |
| Phase 3 | Month 6+ | Full affiliate coverage (~80-90%) |
| Phase 4 | Month 9+ | Premium features (variants, lifestyle imagery) |

---

*Colors are approximations. Fine-tune by visual comparison with actual cards when building the component.*
