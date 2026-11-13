---
name: barista-mate-workflow
description: >-
  Mandatory end-to-end development workflow for Barista Mate. Use at the start
  of every new conversation or task in this repository to read README.md and
  CODEMAP.md, propose what to implement and how, implement changes, update
  documentation, run all verification checks, push to Git, and verify the
  Vercel deployment.
---

# Barista Mate Development Workflow

Follow this workflow for every new conversation and every new task in the `barista-mate` repository.

## 1. Understand the Mission & Context

Before proposing or writing any code:
1. Read `README.md` to understand the product mission, features, and setup.
2. Read `CODEMAP.md` to understand the current architecture, file layout, data models, and component responsibilities.
3. Keep the project conventions in `AGENTS.md` in mind (Hebrew UI labels/toasts, `shadcn/ui` + Tailwind CSS, Cloud Firestore persistence, `lib/types.ts` types, Vitest).

## 2. Suggest What to Implement and How

Before making changes:
1. Summarize what needs to be implemented or changed and why it fits the mission.
2. Outline **how** you will implement it:
   - Affected files and components
   - Data model / Firestore / API changes (if any)
   - Verification plan
3. If requirements are ambiguous or there are meaningful design trade-offs, ask the user before proceeding.

## 3. Implement

- Follow existing patterns in `CODEMAP.md` and `AGENTS.md`.
- Keep changes minimal, clean, and well-typed against `lib/types.ts`.
- Add or update Vitest tests for new or modified behavior.

## 4. Update Documentation

After implementing:
- Update `README.md` if user-facing features, setup steps, scripts, or environment requirements changed.
- Update `CODEMAP.md` if files, routes, components, hooks, API endpoints, or Firestore schemas were added, moved, or changed.

## 5. Verify Everything Passes

Run all required checks after your final edit:
1. **Typecheck & Tests**: `npm test` (runs `tsc --noEmit && vitest run`) — all tests must pass with zero failures.
2. **Lint**: `npm run lint` — no lint errors.
3. **Production Build**: `npm run build` — Next.js build must succeed cleanly.
4. **Additional Checks**: Run any extra verification relevant to the change (e.g., Firestore rules verification if `firestore.rules` changed, or UI/runtime checks).

Do not proceed to pushing if any check fails.

## 6. Push to Repository

Once all verification checks pass:
1. Check `git status` and `git diff` to ensure no unintended files or secrets are included.
2. Commit your changes with a clear, descriptive commit message.
3. Push to the remote repository (`git push`).

## 7. Verify Vercel Deployment

After pushing:
1. Check the Vercel deployment triggered by the push (using `vercel ls` / `vercel inspect <url> --logs` via the `vercel-cli` skill, or checking deployment status).
2. Confirm the deployment reaches `Ready` / `Succeeded` with no build errors, runtime errors, or configuration issues.
3. Report the verified deployment status (and URL if available) to the user.
