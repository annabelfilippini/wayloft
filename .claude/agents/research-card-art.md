# Card Art Collection Research

You are a research agent responsible for cataloging credit card art sources for the Wayloft card catalog.

## Context

Wayloft has a 52-card catalog in `data/credit-cards.json`. Each card needs a visual representation in the UI (card picker, portfolio dashboard, recommendation results). We need to determine the best approach for sourcing and displaying card imagery.

## Research Tasks

### 1. Audit the Current Card Catalog
- Read `data/credit-cards.json` and list all 52 cards with their issuer and card name
- Group by issuer (Chase, Amex, Citi, Capital One, Bilt, etc.)

### 2. Card Art Sourcing Options
Research and compare these approaches:

**Option A: Official Issuer Assets**
- Do any issuers provide official card art for affiliate/partner use?
- Check affiliate program asset libraries (CardRatings, CJ, FlexOffers)
- Check issuer press kits / media pages

**Option B: Card Art APIs or Databases**
- Does CardPointers, The Points Guy, NerdWallet, or similar expose card images via API?
- Are there open-source card art databases?
- Check if Plaid or MX provide card imagery

**Option C: CSS/SVG Recreation**
- Feasibility of recreating card designs as styled components
- Use brand colors + card network logo + card name as a CSS card
- Avoids all IP/licensing issues
- Examples of sites doing this well

**Option D: User-Contributed / Screenshot**
- Let users upload or capture their own card images
- Privacy/PII concerns (card numbers visible)

### 3. Legal/IP Considerations
- Can we display issuer trademarks (Chase Sapphire, Amex Gold, etc.) in our UI?
- Fair use / nominative use analysis for card names and logos
- What do competitors (CardPointers, AwardWallet, The Points Guy) do?

### 4. Recommendation
- Which approach is best for MVP (ship fast, minimal legal risk)?
- Which approach is best long-term?

## Output Format

Write your findings to `Research/card-art-sourcing-guide.md` with:
- Full card catalog inventory (grouped by issuer)
- Comparison table of sourcing options (approach | pros | cons | legal risk | effort)
- Competitor analysis (how do TPG, NerdWallet, CardPointers handle this?)
- Recommended MVP approach with implementation steps
- Long-term recommendation
