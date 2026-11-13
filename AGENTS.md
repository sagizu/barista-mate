# Barista Mate — Mandatory Project Workflow & Rules

On **every new conversation** or **every new task** in this repository, you MUST follow the `barista-mate-workflow` skill at `.agents/skills/barista-mate-workflow/SKILL.md`:

1. **Read Context First:** Read `README.md` and `CODEMAP.md` to understand the project mission and architecture.
2. **Suggest What & How:** Before implementing, clearly propose what to implement and how (files, approach, verification).
3. **Implement:** Write clean code adhering to the project conventions below.
4. **Update Docs:** Update `README.md` and `CODEMAP.md` whenever features, architecture, routes, or files change.
5. **Verify:** Run `npm test` (`tsc --noEmit && vitest run`), `npm run lint`, `npm run build`, and any other relevant verification. All checks must pass after the final edit.
6. **Push:** Commit and `git push` to the repository once verification passes.
7. **Verify Vercel Deployment:** Confirm the resulting Vercel deployment succeeds with no build or runtime failures.
8. **Review Workflow & Rules:** At the end of each task, check if `AGENTS.md` or `.agents/skills/barista-mate-workflow/SKILL.md` need updates based on what didn't flow as expected or new conventions discovered.

---

## Project Conventions

### Language, UI & Styling
- Write UI labels, toasts, and UI-related comments in **Hebrew**.
- Use `shadcn/ui` components and Tailwind CSS inline classes with a dark "premium coffee" aesthetic (e.g., `#C67C4E`, `#1F1712`).
- Framework: **Next.js (App Router)**.

### Data & Types
- **Cloud Firestore (`users/{userId}/...`):** All permanent user data resides in Firestore. Do **not** store persistent user state in `localStorage`.
- Always validate shapes and structures strictly against `lib/types.ts`.
- **Spotlight Layout (Bean Library):** Keep `activeBean` visually decoupled at the top with inline date-setting (`HybridDateInput`).
- **Verification Index:** `global_beans` is isolated from user libraries; new unseen entries push to `pending_verification` upon user entry.

### Testing (Vitest)
- Use **Vitest** (not Jest). Run `npx vitest run <file>` for targeted debugging and `npm test` for full verification.
- Mock `firebase/firestore` with `vi.mock`, handling `onSnapshot` lifecycles appropriately.
- For UI tests with `lucide-react` SVG icons, prefer `getByRole` over exact `textContent` matching.
