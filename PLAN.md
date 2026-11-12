# Barista Mate — Prioritized Implementation & Fix Plan

## Task Checklist & Status

- [x] **Task 1 (Priority 1 — Urgent Bug): Overhaul Android Maintenance Push Notification Pipeline** *(Completed & Tested — Commit `8d069cf`)*
  - [x] Fallback default frequencies (`180 / 60 / 60`) in `/api/cron/maintenance` when `preferences.maintenanceFrequencies` is unset in Firestore.
  - [x] Multi-device `pushTokens` support in `lib/fcm.ts`, `/api/cron/maintenance`, and `/api/test-push`, with automatic cleanup of unregistered tokens.
  - [x] Explicit `/firebase-messaging-sw.js` registration before `getToken()` and Android-safe `registration.showNotification()` in foreground handler.
  - [x] High-urgency `webpush` headers (`Urgency: 'high'`, RTL/Hebrew metadata, icon, badge) and `notificationclick` handler in `public/firebase-messaging-sw.js`.
  - [x] Per-device permission state check & in-app **"שלח התראת בדיקה"** button in `components/maintenance-log.tsx`.
  - [x] Unit tests (`components/__tests__/maintenance-log.test.tsx`, `lib/__tests__/cron-maintenance.test.ts`) and `next build` verified.

- [x] **Task 1.5 (Security — Dependabot Alerts): Resolve All 20 Open GitHub Dependabot Alerts** *(Completed & Tested)*
  - [x] Upgraded `next` (`16.4.6`), `vitest` (`4.1.12`), `@vitest/mocker` (`4.1.12`), `vite` (`6.4.6`), `fast-xml-parser` (`5.12.0`), `source-map-js` (`1.2.2`), `@fastify/busboy` (`3.2.5`), and `@grpc/grpc-js` (`1.14.7`).
  - [x] Dismissed withdrawn `braces` advisory (#117, `GHSA-vfj7-8cjw-p6xm`).

- [ ] **Task 2 (Priority 2 — Critical Security & Firestore Rules): Secure API Endpoints & Fix `firestore.rules`**
  - [ ] Strip invalid markdown fences from `firestore.rules` and add rules for `global_roasters`, `global_beans`, `pending_verification`, and `collectionGroup('beans')`.
  - [ ] Fix `request.url.includes("localhost")` auth bypass in `/api/cron/maintenance`.
  - [ ] Require Firebase Auth ID token verification in `/api/test-push`.

- [ ] **Task 3 (Priority 3 — Functional Accuracy): Fix Extraction Stopwatch Drift & Align Overdue Math**
  - [ ] Refactor `SmartDialIn` stopwatch to compute elapsed time via `Date.now()` delta and clean up interval on unmount.
  - [ ] Align overdue day comparison (`>=` vs `>`) across UI and Cron.
  - [ ] Fix truncated footer text in `components/dashboard.tsx`.

- [ ] **Task 4 (Priority 3 — Data & Storage Integrity): Clean Up Orphaned Images & Dangling Active Bean**
  - [ ] Clear `settings.general.activeBeanId` when deleting the active bean in `lib/firestore.ts`.
  - [ ] Delete Firebase Storage images inside `deleteUserData()` in `lib/user-service.ts`.
  - [ ] Revoke blob preview URLs (`URL.revokeObjectURL`) in `components/add-bean-dialog.tsx`.

- [ ] **Task 5 (Priority 4 — Code Quality & CI): Fix Test Suite TypeScript Errors & Deduplicate Firestore Listeners**
  - [ ] Resolve all TypeScript errors in `components/__tests__/*` and include tests in `tsconfig.json`.
  - [ ] Consolidate duplicate Firestore `onSnapshot` listeners across `Dashboard`, `BeanLibrary`, and `MaintenanceLog`.
  - [ ] Update `.github/workflows/ci.yml` to run `vitest run` and `npm run build`.

- [ ] **Task 6 (Priority 4 — Feature Enhancements): Smart Dial-In Active Bean Sync, Freshness Window & Quick-Add**
  - [ ] Pre-fill `SmartDialIn` from the active bean and allow one-tap grind setting update.
  - [ ] Add optional `roastDate` and freshness badge on the active bean card.
  - [ ] Add one-tap "Add to Library" on `BeanSuggestions` and `CommunitySpotlight` cards.
  - [ ] Support upgrading Guest accounts to Google accounts via `linkWithPopup`.
