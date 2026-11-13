# Barista Mate — Prioritized Implementation & Fix Plan

## Task Checklist & Status

- [x] **Task 1 (Priority 1 — Urgent Bug): Overhaul Android Maintenance Push Notification Pipeline** *(Completed & Tested — Commit `8d069cf`)*
  - [x] Fallback default frequencies (`180 / 60 / 60`) in `/api/cron/maintenance` when `preferences.maintenanceFrequencies` is unset in Firestore.
  - [x] Multi-device `pushTokens` support in `lib/fcm.ts`, `/api/cron/maintenance`, and `/api/test-push`, with automatic cleanup of unregistered tokens.
  - [x] Explicit `/firebase-messaging-sw.js` registration before `getToken()` and Android-safe `registration.showNotification()` in foreground handler.
  - [x] High-urgency `webpush` headers (`Urgency: 'high'`, RTL/Hebrew metadata, icon, badge) and `notificationclick` handler in `public/firebase-messaging-sw.js`.
  - [x] Per-device permission state check & in-app **"שלח התראת בדיקה"** button in `components/maintenance-log.tsx`.
  - [x] Unit tests (`components/__tests__/maintenance-log.test.tsx`, `lib/__tests__/cron-maintenance.test.ts`) and `next build` verified.

- [x] **Task 1.5 (Security — Dependabot Alerts): Resolve All Open GitHub Dependabot Alerts (0 Remaining)** *(Completed, Tested & Pushed — Commits `16681fd`, `c6ed674`, `6617640`)*
  - [x] Upgraded `next` (`16.4.6`), `vitest` (`4.1.12`), `@vitest/mocker` (`4.1.12`), `vite` (`6.4.6`), `fast-xml-parser` (`5.12.0`), `source-map-js` (`1.2.2`), `@fastify/busboy` (`3.2.5`), and `@grpc/grpc-js` (`1.14.7`).
  - [x] Added transitive dependency overrides for `node-forge` (`^1.4.3`), `minimatch` (`^11.0.1`), `postcss-selector-parser` (`^6.1.5`), and `brace-expansion` (`^5.0.12`).
  - [x] Dismissed withdrawn `braces` advisory (#117, `GHSA-vfj7-8cjw-p6xm`).

- [x] **Task 2 (Priority 1 — Urgent S25 Push Fix): Fix `firebase-admin` Server Crash (`ERR_REQUIRE_ESM`) & S25 Foreground Delivery** *(Completed & Tested)*
  - [x] Replaced breaking ESM-only `"uuid": "^14.0.0"` and `"@tootallnate/once": "^3.0.1"` overrides in `package.json` with CommonJS+ESM compatible `"uuid": "^11.1.0"`, resolving the `ERR_REQUIRE_ESM` crash inside `google-gax` (`@google-cloud/firestore`) on Vercel when `/api/test-push` and `/api/cron/maintenance` are called.
  - [x] Updated `public/firebase-messaging-sw.js` with `self.skipWaiting()` and `self.clients.claim()` so updated Service Workers immediately activate and control open mobile tabs.
  - [x] Updated `lib/fcm.ts` to omit `vapidKey` when `NEXT_PUBLIC_FIREBASE_VAPID_KEY` is unset, call `getOrRegisterServiceWorker()` in `setupForegroundMessageHandler()`, and added `displaySystemNotification()` with deduplicating `tag`.
  - [x] Improved error reporting and invalid-token cleanup in `/api/test-push` and `components/maintenance-log.tsx`.

- [x] **Task 3 (Priority 2 — Firebase Automation): Automate `pending_verification` → `global_roasters` & `global_beans` Pipeline** *(Completed & Tested)*
  - [x] Created `lib/catalog-sync.ts` and `/api/catalog/sync` using `adminDb` to automatically promote all existing and new non-test `pending_verification` items into `global_roasters` and `global_beans` and delete processed pending docs.
  - [x] Cleaned and normalized existing `global_beans` records (trimming trailing newlines and normalizing string `roastLevel` to numbers).
  - [x] Triggered automatic promotion immediately when users add a new bean/roaster (`submitForVerification`) and during the daily maintenance cron job.

- [x] **Task 4 (Priority 2 — Critical Security & Firestore Rules): Secure API Endpoints & Fix `firestore.rules`** *(Completed & Tested)*
  - [x] Stripped invalid markdown fences from `firestore.rules` and added complete security rules for `users/{userId}` subcollections, `global_roasters`, `global_beans`, `pending_verification`, `feedback`, and `collectionGroup('beans')`.
  - [x] Fixed `request.url.includes("localhost")` auth bypass in `/api/cron/maintenance` (restricted to `NODE_ENV === 'development'` hostname or valid `CRON_SECRET`).
  - [x] Required Firebase Auth ID token verification (`adminAuth.verifyIdToken`) in `/api/test-push`.

- [x] **Task 5 (Priority 3 — Functional Accuracy): Fix Extraction Stopwatch Drift & Align Overdue Math** *(Completed & Tested)*
  - [x] Refactor `SmartDialIn` stopwatch to compute elapsed time via `Date.now()` delta and clean up interval on unmount.
  - [x] Align overdue day comparison (`>=` vs `>`) across UI and Cron.
  - [x] Fix truncated footer text in `components/dashboard.tsx`.

- [x] **Task 6 (Priority 3 — Data & Storage Integrity): Clean Up Orphaned Images & Dangling Active Bean** *(Completed & Tested)*
  - [x] Clear `settings.general.activeBeanId` when deleting the active bean in `lib/firestore.ts`.
  - [x] Delete Firebase Storage images inside `deleteUserData()` in `lib/user-service.ts`.
  - [x] Revoke blob preview URLs (`URL.revokeObjectURL`) in `components/add-bean-dialog.tsx`.

- [x] **Task 7 (Priority 4 — Code Quality & CI): Fix Test Suite TypeScript Errors & Deduplicate Firestore Listeners** *(Completed & Tested)*
  - [x] Resolve all TypeScript errors in `components/__tests__/*` and include tests in `tsconfig.json`.
  - [x] Consolidate duplicate Firestore `onSnapshot` listeners across `Dashboard`, `BeanLibrary`, and `MaintenanceLog`.
  - [x] Update `.github/workflows/ci.yml` to run `vitest run` and `npm run build`.

- [ ] **Task 8 (Priority 4 — Feature Enhancements): Smart Dial-In Active Bean Sync, Freshness Window & Quick-Add**
  - [ ] Pre-fill `SmartDialIn` from the active bean and allow one-tap grind setting update.
  - [ ] Add optional `roastDate` and freshness badge on the active bean card.
  - [ ] Add one-tap "Add to Library" on `BeanSuggestions` and `CommunitySpotlight` cards.
  - [ ] Support upgrading Guest accounts to Google accounts via `linkWithPopup`.
