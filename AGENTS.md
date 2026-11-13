# Barista Mate — Mandatory Project Workflow

On **every new conversation** or **every new task** in this repository, you MUST follow the `barista-mate-workflow` skill at `.agents/skills/barista-mate-workflow/SKILL.md`:

1. **Read Context First:** Read `README.md` and `CODEMAP.md` (and follow `rules.md` conventions) to understand the project mission and architecture.
2. **Suggest What & How:** Before implementing, clearly propose what to implement and how (files, approach, verification).
3. **Implement:** Write clean code adhering to project conventions (`lib/types.ts`, Hebrew UI text, `shadcn/ui` + Tailwind, Firestore persistence, Vitest tests).
4. **Update Docs:** Update `README.md` and `CODEMAP.md` whenever features, architecture, routes, or files change.
5. **Verify:** Run `npm test` (`tsc --noEmit && vitest run`), `npm run lint`, `npm run build`, and any other relevant verification. All checks must pass after the final edit.
6. **Push:** Commit and `git push` to the repository once verification passes.
7. **Verify Vercel Deployment:** Confirm the resulting Vercel deployment succeeds with no build or runtime failures.
