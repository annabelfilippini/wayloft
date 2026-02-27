Audit the credit card catalog for accuracy. This is a research task — do NOT modify `credit-cards.json` directly. Present findings for human review.

1. **Load current catalog data** — Read `data/credit-cards.json` and extract all cards. For each card, note: slug, name, issuer, annual_fee_cents, signup_bonus (points + spend requirement), application_url.

2. **Check each issuer's cards** — Group cards by issuer. For each issuer, web-search for the current card lineup and offers:
   - Search: "[Issuer] credit cards current offers 2026"
   - Search: "[Issuer] [card name] signup bonus" for each card
   - Check if `application_url` is still valid (web-fetch the URL, check for redirects or 404s)

3. **Compare and flag discrepancies** — For each card, compare what you found online vs what's in the JSON. Flag:
   - **Signup bonus changed** — different points amount or spend requirement
   - **Annual fee changed** — different dollar amount
   - **Card discontinued** — application URL dead or redirects to a different product
   - **New card launched** — issuer has a card not in our catalog
   - **Name changed** — card was renamed or rebranded
   - **Terms changed** — earning rates, perks, or FTF changed (if visible on the page)

4. **Confidence scoring** — For each discrepancy, rate your confidence:
   - **High** — Multiple sources confirm the change, official issuer page matches
   - **Medium** — One source mentions it, issuer page is ambiguous
   - **Low** — Rumored or speculative, needs manual verification

5. **Output the report** — Present exactly this format:

   ```
   ## Card Catalog Audit Report
   **Date:** [today]
   **Cards checked:** [N]
   **Discrepancies found:** [N]

   ### Discrepancies

   #### [Card Name] (`[slug]`)
   - **Issue:** [what changed]
   - **Current JSON:** [what we have]
   - **Found online:** [what the source says]
   - **Source:** [URL]
   - **Confidence:** High/Medium/Low
   - **Suggested fix:** [exact JSON field + new value]

   [repeat for each discrepancy]

   ### New Cards Detected
   - [Card name] by [Issuer] — [brief description, application URL if found]

   ### Dead Links
   - `[slug]` — application_url returns [status/redirect info]

   ### All Clear
   - [List cards that checked out fine]
   ```

6. **Ask** — After the report, ask: "Want me to apply any of these changes to credit-cards.json?"

**Important:**
- Do NOT auto-edit the JSON. Signup bonus changes especially need human judgment (targeted vs public offers, limited-time vs permanent).
- Focus on the 10 issuers we track: Chase, Amex, Citi, Capital One, Bilt, Wells Fargo, Barclays, U.S. Bank, Bank of America, Discover.
- If an issuer page is behind a login wall or blocks scraping, note it and move on.
- Prioritize accuracy over speed. It's better to flag something as "Medium confidence, needs verification" than to miss it.
