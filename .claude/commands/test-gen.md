Generate a test suite for a new feature. Do NOT start writing tests until the interview is complete.

**Step 1 — Interview (one question at a time):**

Ask these questions one at a time, waiting for an answer before continuing:
1. What does this feature do? Describe the happy path in one sentence.
2. What inputs does it take, and which are required vs optional?
3. What does it write to the database? Which tables?
4. What are the error states? (auth failure, validation failure, DB failure)
5. Are there any edge cases you're already aware of? (duplicates, empty inputs, race conditions)

**Step 2 — Confirm scope:**

After the interview, summarize what you heard and list the test cases you plan to write. Ask: "Does this look right, or did I miss anything?"

**Step 3 — Write the test suite:**

Follow the conventions in `.claude/rules/testing.md`:
- Mock Supabase — never hit live DB
- Test file mirrors source file path
- Cover: happy path, validation error, DB failure, plus any edge cases surfaced in the interview

Structure each test clearly:
```ts
describe("actionName", () => {
  it("returns success on valid input", async () => { ... });
  it("returns validation error when [specific field] is missing", async () => { ... });
  it("returns transient error when Supabase fails", async () => { ... });
  // edge cases from interview
});
```

After writing, ask: "Want me to run these, or are there more features to cover first?"
