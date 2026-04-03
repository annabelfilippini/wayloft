# Design System — Wayloft

## Product Context
- **What this is:** Travel rewards optimization platform. Manages credit card portfolios, tracks transfer bonuses, searches flights, maximizes points/miles value.
- **Who it's for:** Credit card enthusiasts who optimize their rewards. Range from beginners to advanced churners.
- **Space/industry:** Travel rewards, personal finance, fintech.
- **Project type:** Authenticated web app (dashboard) + public SEO content (card reviews, comparison articles, landing page).

## Aesthetic Direction
- **Direction:** The Signal — data IS the interface. No decoration except what communicates. Color earns its place.
- **Decoration level:** Minimal — zero ornament. Lines, spacing, and type weight create hierarchy.
- **Mood:** Competent, precise, utilitarian. Like a Bloomberg terminal designed by Linear. The user feels like they're using a serious instrument, not browsing a lifestyle brand.
- **Competitive differentiation:** Every competitor in this space (Point.me, CardPointers, Seats.aero) uses purple/blue SaaS aesthetics with generic sans-serif type. Wayloft's dark surfaces, monospace data, and amber-only accent are instantly distinctive.

## Dual-Track System
- **App track (authenticated):** Dark surfaces (Carbon #0F0F0F), tight spacing, monospace data, full Signal treatment. This is the product.
- **Content track (SEO/marketing):** Light surfaces (Warm White #FAFAF6), same fonts, same color accents, comfortable reading density and generous line-height (1.7 for body). This is the content layer that drives affiliate revenue.
- **Both tracks share:** Typography (Geist/Geist Mono), accent color (Amber), component patterns, brand identity.
- **Dark mode:** User toggle in settings. App defaults to light. Both dark and light modes are fully designed.
- **System preference:** Disabled. User's explicit choice via theme toggle controls mode.

## Brand Identity
- **Wordmark:** WAYLOFT in Geist Mono 700, -0.04em tracking, Amber (#D4A020). This is the primary logo.
- **Compact mark:** WL in Geist Mono 700. Used for favicon, mobile bottom tab icon, browser tab only.
- **Never use:** Inter, Instrument Serif, or any other font for the logo. The monospace wordmark IS the brand.

## Typography
- **Display/Hero:** Geist, 700 weight, -0.03em tracking
- **Body:** Geist, 400 weight
- **Labels:** Geist Mono, 500 weight, 0.05em tracking, uppercase, 10-11px
- **Data/Tables:** Geist Mono, 400 weight, tabular-nums
- **Code:** Geist Mono
- **Loading:** Google Fonts CDN (`family=Geist:wght@100..900&family=Geist+Mono:wght@100..900`)

### Type Scale
```
DISPLAY
  display-xl:  56px / Geist 700 / -0.03em / 1.05 lh  — hero, landing page
  display:     48px / Geist 700 / -0.02em / 1.1 lh   — section hero
  title-lg:    32px / Geist 600 / -0.02em / 1.15 lh  — page title
  title:       28px / Geist 600 / -0.02em / 1.15 lh  — section title
  title-sm:    20px / Geist 600 / -0.01em / 1.2 lh   — card title, subsection

BODY
  body-lg:     16px / Geist 400 / 1.6 lh             — intro text, content lead
  body:        15px / Geist 400 / 1.6 lh             — default body
  body-sm:     13px / Geist 400 / 1.5 lh             — compact body, descriptions
  caption:     12px / Geist 400 / 1.4 lh             — metadata
  label:       10px / Geist Mono 500 / 0.05em / uppercase  — section labels, tags

DATA (Geist Mono, tabular-nums)
  data-xl:     36px / 400 weight                      — hero metrics (portfolio value)
  data-lg:     28px / 400 weight                      — card metrics
  data:        20px / 400 weight                      — inline metrics
  data-sm:     13px / 400 weight                      — table cells
  data-xs:     11px / 400 weight                      — badges, small data
```

### Content Track Line Heights
Body text on SEO/content pages uses 1.7 line-height (not 1.6) for comfortable long-form reading.

## Color

### Palette
- **Approach:** Restrained — monochrome surfaces, color only for status and action.
- **Amber #D4A020** — brand accent, attention, gold thread. The ONLY brand color. Connects to credit card premium positioning (Amex Gold, etc.) without being literal.

#### Surfaces
| Token | Dark Mode | Light Mode | Usage |
|-------|-----------|------------|-------|
| bg-primary | #0F0F0F (Carbon) | #FAFAF6 (Warm White) | Page background |
| bg-elevated | #1A1A1A (Graphite) | #FFFFFF | Cards, panels, elevated surfaces |
| bg-hover | #222222 | #F0EFE9 | Hover states, interactive surfaces |

#### Text & Chrome
| Token | Dark Mode | Light Mode | Usage |
|-------|-----------|------------|-------|
| text-primary | #E8E4DD (Ink) | #1C1C1C (Charcoal) | Primary text |
| text-muted | #8A8A8A | #666660 | Muted text, labels, secondary content |
| border | #2A2A2A (Wire) | #E5E5E0 (Mist) | Borders, dividers |
| accent | #D4A020 (Amber) | #D4A020 (Amber) | Brand accent (same both modes) |

#### Semantic
| Token | Value | Usage |
|-------|-------|-------|
| success | #22C55E | Positive status, good value, active |
| error | #EF4444 | Error, urgency, expiring soon |
| info | #3B82F6 | Informational, links |
| warning | #D4A020 | Attention needed (shares Amber) |

### Contrast Ratios (WCAG AA verified)
- text-primary on bg-primary: ~14.5:1 (dark), ~13.8:1 (light) ✓
- text-muted on bg-primary: ~5.5:1 (dark), ~5.6:1 (light) ✓
- accent on bg-primary: ~7.5:1 (dark) ✓
- error on bg-primary: ~4.8:1 (dark) ✓

## Spacing
- **Base unit:** 4px
- **Density:** Compact (app), Comfortable (content)
- **Scale:** 2xs(2) xs(4) sm(8) md(16) lg(24) xl(32) 2xl(48) 3xl(64)

## Layout
- **Approach:** Grid-disciplined (app), Hybrid (content/marketing)
- **Grid:** 12 columns. App: 24px gutter. Content: 32px gutter.
- **Max content width:** 1200px (app), 720px (article body), 1200px (article full-width sections)
- **Border radius:**
  - none (0px) — default. Sharp edges are the identity.
  - sm (2px) — subtle softening where needed
  - md (4px) — buttons, inputs
  - lg (8px) — credit card art only
  - full (9999px) — pills, tags, avatar

### Responsive Breakpoints
| Breakpoint | Width | Layout |
|------------|-------|--------|
| sm | < 640px | Single column. Bottom tab nav. Card deck snap-scroll. |
| md | 640-1024px | 2-column where appropriate. Top nav. |
| lg | > 1024px | Full layout. Top nav with all items visible. |

### Navigation
- **Desktop (lg):** Top horizontal bar. WAYLOFT wordmark left. Dashboard / Cards / Find a Card / Travel. User avatar right.
- **Tablet (md):** Same top bar, items may compress.
- **Mobile (sm):** Bottom tab bar. 4 tabs with icons + small monospace labels. Top bar becomes just WAYLOFT wordmark + notification icon.

## Motion
- **Approach:** Minimal-functional — only transitions that aid comprehension.
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:** micro(50-100ms) short(150-250ms) medium(250-400ms)
- **Rules:** No entrance animations. No scroll effects. No decorative motion. Transitions only for: hover states, panel open/close, data loading skeletons, mode toggle.

## Components

### Implementation Strategy
Restyle shadcn/ui to match Signal tokens. Keep shadcn's behavior layer (keyboard nav, focus trap, ARIA). Override CSS variables in globals.css. This is a theme swap, not a rebuild.

### Button States
| State | Primary (Amber) | Secondary | Ghost | Danger |
|-------|-----------------|-----------|-------|--------|
| Rest | amber bg, carbon text | transparent, border | transparent, muted text | transparent, red border |
| Hover | brightness(1.1) | bg-hover, border-muted | text-primary | red bg 10% |
| Focus | 2px amber outline, 2px offset | 2px amber outline | 2px amber outline | 2px red outline |
| Active | brightness(0.9) | deeper bg-hover | muted text | red bg 15% |
| Disabled | 40% opacity | 40% opacity | 40% opacity | 40% opacity |
| Loading | spinner + text | spinner | spinner | — |

- Min-height: 44px (touch target)
- Focus visible on `:focus-visible` only (keyboard nav, not mouse click)

### Input States
| State | Treatment |
|-------|-----------|
| Rest | bg-elevated, border, text-primary |
| Focus | border-accent, box-shadow: 0 0 0 1px amber |
| Error | border-error, red helper text below |
| Disabled | 40% opacity, cursor-not-allowed |

### Badges
Geist Mono, 10px, 500 weight. Background at 15% opacity of the semantic color.
- `badge-amber`: rgba(212,160,32,0.15) text amber
- `badge-green`: rgba(34,197,94,0.15) text green
- `badge-red`: rgba(239,68,68,0.15) text red
- `badge-muted`: bg-hover, text-muted

### Cards
- bg-elevated, 1px border, 0 border-radius (sharp)
- Padding: 20px
- No box-shadow (shadows are decoration)

### Progress Bars
- Track: border color, 4px height
- Fill: semantic color (amber for spend progress, green for complete, red for expiring)

### Toast / Notifications
Restyle shadcn Sonner to Signal tokens:
- Background: bg-elevated
- Border: 1px border
- Text: text-primary
- Accent border-left: 3px semantic color (only for status toasts)

## Interaction Patterns

### Empty States — Data-Shaped Void
Show the container/grid/layout exactly as it would look WITH data, but with ghost placeholders in bg-hover color. Include:
- One line of context text (Geist, body-sm, text-muted)
- Primary action button (amber) to add the first item
- The interface holds its shape even when empty

### Loading — Skeleton Screens
Pulsing animation: bg-hover → bg-elevated, 1.5s ease-in-out. No spinners on page-level loads. Spinners only on inline button actions.

### Error States
Inline red text below the failing element. Never toast-only for form validation errors. Toast for fire-and-forget actions (affiliate clicks, background saves).

### Progressive Activation (First-Time Users)
Dashboard sections appear as data fills them. After onboarding:
1. Card deck appears first (populated from onboarding quiz)
2. Tasks section activates when cards generate actionable items
3. Optimizer activates when 2+ cards exist
4. Transfer bonuses activate when user has cards with transferable currencies
Each section "boots up" like a system coming online.

## Information Architecture

### Dashboard Hero
Portfolio value is the dominant element (data-xl, Geist Mono, amber). "Welcome back, [Name]" is smaller, secondary context above or beside it. The number IS the greeting.

### Dashboard Layout
- Transfer Bonuses / Tasks: 40/60 column split. Tasks are weighted heavier because they're the primary action driver.
- Card deck: horizontal scroll, snap on mobile

### Copy Register
Signal uses utilitarian language, not editorial:
- "The Concierge Task List" → "Tasks"
- "Your Personal Briefing" → "Briefing" or omit
- "Strategic Opportunities" → "Transfer Bonuses"
- "Ask Wayloft" → keep (it's a product feature name, not marketing copy)
Data speaks. Marketing language does not.

## Accessibility
- All text/background combinations pass WCAG AA (4.5:1 for normal text, 3:1 for large text)
- Focus indicators: 2px accent outline, 2px offset, `:focus-visible` only
- Touch targets: 44px minimum on all interactive elements
- Keyboard navigation: full support via shadcn's behavior layer
- Screen readers: ARIA landmarks on all major sections
- Color is never the sole indicator of status (always paired with text or icon)

## Anti-Patterns (never use)
- Purple/violet/indigo gradients or blue-to-purple schemes
- 3-column feature grid with icons in colored circles
- Centered-everything layouts
- Uniform bubbly border-radius
- Decorative blobs, floating circles, wavy SVG dividers
- Emoji as design elements
- Box shadows for decoration
- Generic hero copy ("Welcome to...", "Unlock the power of...")
- Cookie-cutter section rhythm (hero → features → testimonials → pricing)
- Overused fonts: Inter, Roboto, Poppins, Montserrat, Open Sans

## Card Art
Credit card representations use issuer-colored gradients, hand-styled per card family:
- Chase: navy to deep blue (#1a1f71 → #0a0e3a)
- Amex: gold metallics (#c6993e → #b8922f)
- Capital One: charcoal to dark (#1a1a1a → #0f0f0f)
- Citi: teal blue (#005f9e → #003d6b)
- All cards: 8px border-radius (real cards have rounded corners), gold chip element

## Migration Notes
- **From:** Instrument Serif (display) + DM Sans (body) + Material Design 3 tokens
- **To:** Geist (display + body) + Geist Mono (data) + Signal tokens
- **Strategy:** Single PR. Update Tailwind theme, shadcn CSS variables, Google Fonts imports. All 60+ pages change at once. No gradual rollout (two visual systems is worse than one migration PR).
- **Font swap:** Replace `next/font/google` imports from Instrument Serif + DM Sans to Geist + Geist Mono.
- **Color swap:** Replace MD3 tokens (surface-container, on-surface-variant, etc.) with Signal tokens (bg-primary, text-muted, etc.).

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-01 | Direction: The Signal | Data-forward, industrial aesthetic. Distinctive against generic SaaS competitors. |
| 2026-04-01 | Dual-track: dark app / light content | App identity preserved while SEO content gets readable surfaces for affiliate conversion. |
| 2026-04-01 | Geist + Geist Mono replaces Instrument Serif + DM Sans | Monospace data is core to Signal identity. Geist Mono pair is natural. |
| 2026-04-01 | Amber (#D4A020) as sole brand color | Gold thread connects to premium card positioning. Distinctive against purple/blue competitors. |
| 2026-04-01 | Hero: portfolio value dominant | In Signal, the number IS the greeting. Data-forward hierarchy. |
| 2026-04-01 | Empty states: data-shaped void | Interface holds its shape when empty. Ghost placeholders + amber CTA. |
| 2026-04-01 | First-time UX: progressive activation | Sections boot up as data arrives. Avoids empty apartment feeling. |
| 2026-04-01 | shadcn: restyle, not replace | Keep accessibility behavior, swap visual tokens. Theme change, not rebuild. |
| 2026-04-01 | Dark mode: user toggle | Both modes fully designed. Default light, user can switch in settings. |
| 2026-04-01 | Logo: WAYLOFT wordmark | Geist Mono 700, amber. WL compact mark for favicon only. |
| 2026-04-01 | Mobile nav: bottom tab bar | 4 tabs with icons + monospace labels. Standard financial app pattern. |
| 2026-04-01 | Top nav replaces sidebar | Horizontal nav for desktop, bottom tabs for mobile. Sidebar removed. |
| 2026-04-01 | Steel fixed for a11y | Mode-aware: #8A8A8A (dark) / #666660 (light). WCAG AA verified. |
| 2026-04-01 | Copy: utilitarian register | Signal doesn't do marketing language in the app. Data speaks. |
| 2026-04-02 | Anti-pattern cleanup | Removed decorative shadows, oversized border-radius, purple/violet colors. Signal is sharp edges, no shadows, amber-only accent. |
| 2026-04-02 | Labels: Geist Mono | Labels use Geist Mono (not Geist). Monospace labels reinforce the data-forward Bloomberg-meets-Linear feel. |
| 2026-04-02 | Nav: Dashboard/Cards/Find a Card/Travel | Updated from Portfolio/Cards/Transfers/Search to match 4-page app architecture. |
