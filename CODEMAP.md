# CODEMAP: Barista Mate Architecture & Codebase Map

> **Purpose**: Instant architectural and contextual reference for AI coding agents and developers. Consult this document at the start of every session to minimize token usage, prevent hallucinations, and navigate the repository efficiently.

---

## 1. Architecture & Tech Stack Overview

| Layer / Concern | Technology & Library | Details & Patterns |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16.2.4 (App Router)** | Client-side application (`'use client'`) hosted primarily under `app/page.tsx` + Edge/Node Route Handlers (`app/api/cron/*`). |
| **Language** | **TypeScript 5.6.3** | Strict typing across interfaces (`lib/types.ts`), paths aliased via `@/*`. |
| **UI & Styling** | **Tailwind CSS 3.4.14 + shadcn/ui** | RTL layout (`dir="rtl"` in `app/layout.tsx`), Heebo font (`next/font/google`). Dark coffee aesthetic palette (`#0f0a08` background, `#C67C4E` primary coffee amber, `#1F1712` cards, `#3E2C22` borders). Radix UI primitives (`@radix-ui/*`). |
| **State Management** | **React Hooks + Firebase Realtime** | Global auth context via `AuthProvider` (`lib/auth-context.tsx`). Real-time reactive state bound to Firestore via `onSnapshot` listeners. In-memory cache (`lib/community-cache.ts`) for community feed. |
| **Authentication** | **Firebase Auth 12.9.0** | Google OAuth (`signInWithPopup`) and Guest mode (`signInAnonymously`). Guest teardown cleans up Firestore documents and deletes Auth record on signout. |
| **Primary Database** | **Cloud Firestore** | Document/subcollection per user model: `users/{userId}/*`. Verified national bean directories in `global_beans` & `global_roasters`. Ingestion queue in `pending_verification`. |
| **Media Storage** | **Firebase Storage** | Client-compressed images (`browser-image-compression` to WebP, <=100KB, max 600x600px) saved under `users/{userId}/beans/{uuid}.webp`. |
| **Push Notifications** | **Firebase Cloud Messaging (FCM)** | PWA Web Push (`Notification` API, VAPID key) using service worker (`public/firebase-messaging-sw.js`) and foreground listener (`lib/fcm.ts`). |
| **Scheduled Tasks** | **Vercel Cron + Firebase Admin** | `/api/cron/maintenance` runs daily at 09:00 UTC (`vercel.json`), authenticated with `CRON_SECRET`, checking overdue maintenance and sending FCM push alerts via `firebase-admin`. |
| **Testing** | **Vitest 4.1.5 + React Testing Library** | JSDOM environment, mocked Firebase and Firestore (`jest.setup.js`). |

---

## 2. Directory Tree & Module Responsibilities

```text
barista-mate/
├── app/                        # Next.js App Router root
│   ├── api/                    # Backend API Route Handlers
│   │   ├── cron/maintenance/  # Vercel cron handler for daily maintenance alerts
│   │   └── test-push/          # Internal endpoint for debugging push notifications
│   ├── privacy/                # Static privacy policy page
│   ├── globals.css             # Global Tailwind directives & CSS variables
│   ├── layout.tsx              # Root HTML layout (RTL, Heebo font, Auth/Error providers)
│   └── page.tsx                # Dynamic landing page / authenticated Dashboard toggle
├── components/                 # React UI Components
│   ├── ui/                     # shadcn/ui primitives (Button, Card, Dialog, Popover, Slider, etc.)
│   ├── add-bean-dialog.tsx     # Modal form for adding/editing beans with image upload & verification
│   ├── auth-splash-screen.tsx  # Initial full-screen loading spinner
│   ├── auth-wrapper.tsx        # Guards authenticated routes and renders splash during auth init
│   ├── bean-combobox.tsx       # Searchable popover with autocomplete against global/verified beans
│   ├── bean-library.tsx        # Bean management tab: Spotlight layout, filters, grouping, CRUD
│   ├── bean-suggestions.tsx    # Recommendation engine matching user tastes against global beans
│   ├── coffee-passport.tsx     # "Caffeine Index" stats card with Web Share API integration
│   ├── community-spotlight.tsx # Randomized community bean discovery feed with in-memory caching
│   ├── dashboard.tsx           # Main application shell with header, tabs, and real-time listeners
│   ├── empty-state.tsx         # Reusable fallback placeholder for empty views
│   ├── error-boundary.tsx      # React error boundary catching client runtime crashes
│   ├── feature-announcement.tsx# Modal highlighting recent feature updates to users
│   ├── feedback-form.tsx       # User feedback modal writing directly to Firestore
│   ├── hybrid-date-input.tsx   # Dual date picker supporting native input and quick presets
│   ├── maintenance-log.tsx     # Maintenance tab: task checklist, overdue badges, push toggle
│   ├── network-status-indicator.tsx # Banner warning users during network disconnection
│   ├── roast-rating-input.tsx  # 1-5 bean roast level interactive selector
│   ├── roaster-combobox.tsx    # Combobox combining static, private user, and global roasters
│   ├── smart-dial-in.tsx       # Extraction calculator tab with live stopwatch and feedback
│   └── user-settings-dialog.tsx# Profile name editor, Coffee Passport, and account deletion
├── lib/                        # Core Utilities, Domain Logic & Firebase Services
│   ├── auth-context.tsx        # React Context providing { user, loading } via onAuthStateChanged
│   ├── auth.ts                 # Firebase Auth entry points (Google popup & Anonymous guest)
│   ├── community-cache.ts      # Singleton cache for community beans (4-hour duration)
│   ├── dial-in.ts              # Mathematical engine for espresso extraction calculations
│   ├── fcm.ts                  # Client FCM token registration and foreground message handling
│   ├── firebase-admin.ts       # Server-side Firebase Admin initialization (Firestore & Messaging)
│   ├── firestore.ts            # Client Firestore operations (beans, roasters, settings, feedback)
│   ├── storage.ts              # Client image compression & upload to Firebase Storage
│   ├── types.ts                # TypeScript domain models (SavedBean, DialInRecord, MaintenanceDates)
│   ├── user-service.ts         # User doc creation & cascading user data deletion
│   └── utils.ts                # Tailwind clsx + twMerge helper (cn)
├── public/                     # Public assets
│   ├── firebase-messaging-sw.js# Service worker for background FCM push notifications
│   ├── manifest.json           # PWA web app manifest
│   └── icons & svgs            # App icons, espresso SVGs
├── roasteries.json             # Seed list of popular Israeli specialty coffee roasters
├── rules.md                    # Antigravity AI rules and project conventions
├── firestore.rules             # Cloud Firestore security rules
├── next.config.js              # Next.js configuration (e.g., allowedDevOrigins)
├── tailwind.config.ts          # Tailwind CSS theme configuration (custom coffee palette)
├── tsconfig.json               # TypeScript path mappings (@/* -> ./*)
├── vercel.json                 # Vercel deployment config (Cron job schedule)
└── vitest.config.ts            # Vitest unit & integration test configuration
```

---

## 3. Core Workflows & Key Files

### 3.1 Data Models & Schemas (`lib/types.ts`)
- **`SavedBean`**: Represents a coffee bag in a user's collection:
  - `id`: Firestore auto-generated document ID.
  - `roasterName`, `beanName`: Identifiers.
  - `grindSetting`: String notation (e.g., `"1.2"` or `"15"`).
  - `roastLevel`: `1 | 2 | 3 | 4 | 5`.
  - `flavorTags`: Array of strings (from predefined Hebrew tags: `"שוקולדי"`, `"פירותי"`, etc.).
  - `pricePaid`, `bagWeightGrams`, `pricePerKilo`: Unit economics calculations.
  - `imageUrl`: Public HTTPS URL pointing to Firebase Storage.
  - `rating`: Float `0.5 - 5.0` (supports half stars).
  - `openedDate`: ISO date string (`YYYY-MM-DD`).
- **`DialInRecord`**: Shot telemetry record (`drinkType`, `roastLevel`, `time`, `targetTime`, `feedback`, `advice`).
- **`MaintenanceDates`**: Machine maintenance dates (`lastGroupHeadCleaning`, `lastBackflush`, `lastDescaling`, `waterFilterLastChanged`).
- **`GeneralSettings`**: Machine metadata and spotlight reference (`machineName`, `activeBeanId`, `activeBeanOpenedDate`).

### 3.2 Authentication & Session Flow
1. **Bootstrap**: `app/layout.tsx` wraps the tree with `AuthProvider` (`lib/auth-context.tsx`).
2. **State Detection**: `onAuthStateChanged` in `AuthProvider` fires.
   - If user exists: Calls `createUserDocument(user)` (`lib/user-service.ts`) to merge `users/{uid}` with `email`, `displayName`, and `createdAt`.
   - If unauthenticated: `app/page.tsx` renders `LandingPage` offering Google Sign-In or Guest Mode.
3. **Guest Session Handling**:
   - `signInAsGuest()` initiates anonymous credentials.
   - Upon sign-out, guest teardown (`components/dashboard.tsx` -> `handleSignOut`) prompts confirmation, executes `deleteUserData(uid)` (deleting subcollections `beans`, `maintenance`, `roasters`, `lastShot`), and calls `user.delete()`.

### 3.3 Key Business Logic

#### Smart Dial-In Calculator (`lib/dial-in.ts`)
- **Target Time Equation**:
  $$\text{Target Time} = \text{baseTime}(\text{drinkType}) + (3 - \text{roastLevel}) \times 2$$
  - Base times: `ristretto` = 22s, `espresso` = 28s, `lungo` = 34s.
  - Roast adjustment: Light roasts (+4s target for full extraction), Dark roasts (-4s to prevent over-extraction).
- **Feedback Tiers**:
  - Deviation $\le 8\%$: `"perfect"` (balanced extraction).
  - Deviation $\le 15\%$: `"good"` (minor grind tweak recommended).
  - Deviation $> 15\%$: `"bad"` (significant grind tweak required).
  - Directional Advice: If actual time < target $\rightarrow$ "טחן דק יותר ⬆️" (grind finer); if actual time > target $\rightarrow$ "טחן גס יותר ⬇️" (grind coarser).

#### Spotlight Bean Architecture (`components/bean-library.tsx`)
- Decouples `activeBean` visually from the main library grid.
- Stored as `settings.activeBeanId` inside Firestore document `users/{uid}`.
- Pinned at the top of the library inside a dedicated spotlight card with an inline `HybridDateInput` updating `activeBeanOpenedDate`.
- The remaining collection is categorized and grouped by `roasterName`.

#### Community Recommendation Engine (`components/bean-suggestions.tsx`)
- Computes user flavor preferences and average roast level from the user's current bean library.
- Queries `global_beans` using `where("flavorTags", "array-contains-any", topFlavors)`.
- Calculates client-side relevancy scores (+2 per matching flavor tag, +1 for exact roast match, +0.5 for adjacent roast) and presents top 3 unowned candidates.

#### Image Compression & Storage Pipeline (`lib/storage.ts`)
- `uploadBeanImage(file)` compresses raw images on the client via `browser-image-compression`:
  - `maxSizeMB: 0.1` (100KB), `maxWidthOrHeight: 600px`, format converted to `.webp`.
  - Saves file under path: `users/${user.uid}/beans/${uuidv4()}.webp`.
- `deleteBeanImage(imageUrl)` extracts object path from the public URL and deletes it, validating path ownership (`users/${user.uid}/`).

### 3.4 External API & Database Service Layer

| Module | Function | Target Firestore Collection / Path |
| :--- | :--- | :--- |
| `lib/firestore.ts` | `addBean` / `updateBean` / `deleteBean` | `users/{uid}/beans/{beanId}` |
| `lib/firestore.ts` | `updateGeneralSettings` | `users/{uid}` (`settings.general`) |
| `lib/firestore.ts` | `updateMaintenanceDates` | `users/{uid}/maintenance/log` |
| `lib/firestore.ts` | `saveLastShot` | `users/{uid}/lastShot/current` |
| `lib/firestore.ts` | `addPrivateRoaster` / `deletePrivateRoaster` | `users/{uid}/roasters/private` |
| `lib/firestore.ts` | `getGlobalRoasters` / `getGlobalBeans` | `global_roasters` / `global_beans` |
| `lib/firestore.ts` | `submitForVerification` | `pending_verification` (queued entries) |
| `lib/firestore.ts` | `submitFeedback` | `feedback` (write-only collection) |
| `app/api/cron/maintenance` | Daily cron runner | Reads `users` & `users/{uid}/maintenance/log`, sends FCM notifications |

---

## 4. Environment & Configuration Files

| Configuration File | Scope & Critical Settings |
| :--- | :--- |
| `rules.md` | **Mandatory AI agent instructions**: Hebrew UI requirement, shadcn/ui exclusive usage, Firestore data persistence rules, Spotlight layout constraints, Vitest testing patterns. |
| `next.config.js` | Configures `allowedDevOrigins` for local LAN testing over mobile devices (`192.168.31.35`). |
| `tailwind.config.ts` | Theme definitions: custom colors (`terracotta`, `coffee`, `amber`), Hebrew font mapping (`var(--font-hebrew)`), RTL class support. |
| `firestore.rules` | Security rules: `users/{userId}/{document=**}` restricted to authenticated user matching `userId`. Write-only access for `feedback/{feedbackId}`. |
| `vercel.json` | Schedules `/api/cron/maintenance` daily at 09:00 UTC via Vercel Cron. |
| `vitest.config.ts` | Vitest configuration: JSDOM environment, setup file `jest.setup.js`, `@/*` alias resolution. |
| `jest.setup.js` | Test initialization: In-memory Firestore mocks (`onSnapshot`, `addBean`, `getPrivateRoasters`), ResizeObserver and scrollIntoView stubs. |
| `roasteries.json` | Static fallback array of verified Israeli specialty coffee roasters used in comboboxes. |

### Environment Variables (.env.local / Vercel)
- `NEXT_PUBLIC_FIREBASE_API_KEY`: Client Firebase Web API key.
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Auth domain.
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Firebase project ID (`barista-mate`).
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Storage bucket URL.
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Cloud Messaging sender ID.
- `NEXT_PUBLIC_FIREBASE_APP_ID`: Firebase Web App ID.
- `NEXT_PUBLIC_FIREBASE_VAPID_KEY`: Web Push VAPID key for browser FCM token generation.
- `FIREBASE_SERVICE_ACCOUNT`: JSON service account string for server-side Admin SDK (`cron/maintenance`).
- `CRON_SECRET`: Bearer token securing the `/api/cron/maintenance` route handler against unauthorized invocation.

---

## 5. Session Onboarding Protocol for AI Agents

Before making any code modifications in a new session, every AI agent must execute this 3-step checklist:

```text
[ ] STEP 1: CONTEXT & RULE VALIDATION
    - Review `rules.md` for project-specific constraints:
      * UI labels, error toasts, and UI-facing text MUST be in Hebrew.
      * Only `shadcn/ui` components and inline Tailwind CSS classes are permitted.
      * No persistent user data in LocalStorage (all persistent state belongs in Firestore).
      * Preserve Spotlight layout (active bean visually decoupled at top).
    - Check `lib/types.ts` before modifying data structures.

[ ] STEP 2: ARCHITECTURAL BOUNDARY CHECK
    - Consult CODEMAP.md:
      * Check whether changes affect client Firestore (`lib/firestore.ts`) or server Admin (`lib/firebase-admin.ts`).
      * When modifying comboboxes or bean forms, preserve automatic submission to `pending_verification`.
      * When altering user records, respect subcollection cleanup in `lib/user-service.ts`.

[ ] STEP 3: VERIFICATION & TEST INTEGRITY
    - Before finishing or pushing changes, verify test suite stability:
      * Run `npm test` or `npx vitest run` to ensure all 47+ Vitest unit and integration tests pass.
      * Mock Firestore operations using `vi.mock` in test files; never attempt live network connections during tests.
      * Run `npm run build` after major structural updates to confirm Next.js compiler alignment and routing integrity.
```
