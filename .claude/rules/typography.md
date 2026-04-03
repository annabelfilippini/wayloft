---
globs: ["apps/web/components/**", "apps/web/app/**/*.tsx", "apps/web/app/globals.css"]
---

# Typography Rules

## Font Consistency

**All text on the site MUST use Geist or Geist Mono.** No exceptions, no fallbacks to system fonts.

- **Body/display text:** Uses Geist via the `font-sans` Tailwind class (mapped to `var(--font-sans)` in globals.css). This is the default — don't add any other font-family declarations.
- **Data/numbers:** Uses Geist Mono via the `mono` utility class (defined in globals.css). Use this for: dollar amounts, percentages, point counts, rates, dates, countdowns, and any tabular data.
- **Labels:** Uses the `label-signal` utility class (Geist Mono, 10px, uppercase, tracking-wide). Use this for section labels and small category tags.

## Never Do

- Never use `font-[family-name:var(--font-display)]` — this was the old Instrument Serif reference
- Never import or reference DM Sans, Instrument Serif, Inter, Roboto, Poppins, or any other font
- Never use inline `font-family` styles
- Never add font-related npm packages without approval
- If a component's text looks different from the rest of the site, check that `font-sans` is inherited from the body (it should be automatic)

## Data Display Pattern

All numerical/financial data should use the `mono` class:
```tsx
// Correct
<span className="mono">$4,000</span>
<span className="mono text-primary">+30%</span>
<span className="mono text-2xl font-light">$12,450</span>

// Wrong — missing mono class
<span className="text-2xl font-bold">$12,450</span>
<span className="tabular-nums">45%</span>
```

## Heading Pattern

All section headings should use consistent Signal typography:
```tsx
// Page/section titles
<span className="text-lg font-semibold tracking-[-0.01em]">Section Title</span>

// Section labels (uppercase mono)  
<span className="label-signal text-muted-foreground">SECTION LABEL</span>
```
