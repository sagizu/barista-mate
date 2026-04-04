# Barista Mate | Antigravity AI Instructions

This file serves as the strict context and ruleset for AI coding assistant interactions within the Barista Mate repository.

## 1. Project Overview & Rules
1. **Language & Styling:** Always write UI labels, toasts, and comments relating to the UI in **Hebrew**. Use `shadcn/ui` components exclusively. Any styling rules must use Tailwind CSS inline classes. Use vibrant, modern coloring targeting a dark "premium coffee" aesthetic (e.g., `#C67C4E`, `#1F1712`).
2. **Framework:** Next.js (App Router, Version 16.2.1+).
3. **Database Rules:** **ALL** permanent user data resides in Cloud Firestore (`users/{userId}/...`). Do *not* write logic storing persistent state to LocalStorage (migrated fully to Firestore in V2).
4. **Validation:** Always verify shapes and structures strictly against `lib/types.ts`.

## 2. Testing Constraints
- We use **Vitest** for testing (not Jest). 
- Run `npx vitest run` strictly when debugging individual files. When verifying system stability, run `npm test`.
- **Mocking Firestore:** `lib/storage.ts` logic mapping was deleted. When writing tests, rely strictly on mocking `firebase/firestore` with `vi.mock` handling `onSnapshot` lifecycles appropriately.
- **UI Tests:** For testing-library assertions on components with SVG icons (`lucide-react`), structure assertions via `getByRole` rather than exact `textContent` matching due to inner DOM elements separating text.

## 3. Architecture V2 Conventions
- **Spotlight Layout (Bean Library):** The component architecture decouples `activeBean` visually. The active bean displays inherently at the top with inline date-setting mechanisms (`HybridDateInput`). Always preserve this strict separation.
- **Verification Index:** Global beans (`global_beans`) are isolated conceptually from user libraries. New unseen entries push to `pending_verification` automatically upon new user entries.

## 4. Key Developer Commands
- `npm run dev`: Standard development loop.
- `npm run build`: Required verification command after sweeping architectural changes to ensure Next.js compiler alignment and valid routing.
