Figure out what to work on next. This is research only — do NOT start building anything.

1. **Read all source files** — Read these in full:
   - `CLAUDE.md` — current status, what's built, what's next
   - `WAYLOFT-BUILD-PLAN.md` — consolidated build plan with checkboxes (single source of truth for progress)
   - `WAYLOFT-MASTER-PLAN-V3.md` — full specs, DB schemas, algorithm details, acceptance criteria (consolidated, includes v3.2 additions)

2. **Determine current state** — From the files above, identify:
   - The current priority level (P0, P1, P2, P3, etc.)
   - Which items within that priority are checked off
   - Which items remain unchecked
   - What the "Immediate Next Action" line says in WAYLOFT-BUILD-PLAN.md
   - Any UX issues flagged but not yet fixed

3. **Pick the next step** — Choose the single most impactful next task by applying these rules in order:
   - Finish the current priority before moving to the next one
   - Within a priority, prefer tasks that unblock other tasks
   - Prefer tasks that ship user-facing value over internal plumbing
   - Prefer tasks with clear specs in the master plan over underspecified ones
   - If multiple tasks are equally good, pick the smallest one (ship fast, iterate)


5. **Present the recommendation** — Output exactly this format:

   ```
   ## Next Up

   **Priority:** [P2/P3/etc] — [Priority Name]
   **Task:** [Specific task name from the build plan]
   **Why this one:** [1-2 sentences on why this is the right next step]

   ### What it involves
   - [Bullet list of concrete implementation steps]
   - [Include files to create/modify if known from the specs]
   - [Include any DB migrations needed]

   ### Dependencies / blockers
   - [Anything that needs to happen first, or "None"]

   ### Definition of done
   - [What "shipped" looks like for this task]
   ```

6. **Ask** — After presenting the recommendation, ask: "Ready to start, or want to pick a different task?"
