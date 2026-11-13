# Barista Mate — Marketing & User Growth Plan

> **Goal**: Turn **Barista Mate** from a utility with low active usage into a discoverable, shareable, high-retention web app for the Israeli home-barista community.

---

## Audit Findings (Current Growth Bottlenecks)

1. **Broken Social Link Previews (WhatsApp / Telegram / Facebook)**
   - In `app/layout.tsx`, `metadata.openGraph.images` and `twitter.images` point to `/icon.svg`, and the title/description are in English.
   - WhatsApp, Telegram, and Facebook ignore `.svg` OpenGraph images, so sharing `https://barista-mate.vercel.app/` produces **no preview card** and shows English copy to an Israeli audience.
2. **Low-Contrast & High-Friction Landing Page**
   - In `app/page.tsx`, the main `<h1>` (`Barista Mate`) and feature headings use `color: var(--dark-accent)` (`#3E2C22`) over a dark `#2a1d18` → `#0f0a08` background, making the hero text hard to read.
   - Visitors are forced to sign in (or read a warning that guest data will be deleted on sign-out) before ever seeing the dial-in calculator, bean library, or community beans.
3. **No SEO / Organic Discovery Surface**
   - Missing `robots.txt` and `sitemap.xml`, and no public indexable pages for Israeli specialty coffee roasters or dial-in guides.
4. **Weak Viral Sharing Loops**
   - Sharing from `CoffeePassport` ("מדד קפאין") or `BeanLibrary` sends plain text with the homepage URL. There is no visual "Coffee Card" image or deep link to import a friend's dialed-in bean recipe.
5. **No Funnel Analytics or PWA Install Nudge**
   - No conversion tracking (Landing → Sign-in → First Bean → First Shot → Push Enabled) and no in-app "הוסף למסך הבית" (Install App) prompt for mobile visitors.

---

## Prioritized Marketing & Growth Roadmap

- [x] **Phase 1 (Quick Wins — High Impact): Fix First Impressions & WhatsApp/Social Previews** *(Completed & Tested)*
  - [x] **Hebrew SEO & Rich OpenGraph (`app/layout.tsx` + `app/opengraph-image.tsx`)**:
    - Localize `title` and `description` to Hebrew with target search terms (`אספרסו ביתי`, `כיול טחינה`, `ניהול פולי קפה`, `תחזוקת מכונת אספרסו`).
    - Generate a `1200x630` PNG OpenGraph image (`opengraph-image.tsx` or static `public/og-image.png`) so WhatsApp, Telegram, Facebook, and X render a rich dark-espresso preview card.
    - Add `app/robots.ts` and `app/sitemap.ts`.
  - [x] **Landing Page Visual & Conversion Overhaul (`app/page.tsx`)**:
    - Fix the `#3E2C22` heading contrast to `#E6D2B5` / `#C67C4E` so the hero pops immediately.
    - Add live social proof from Firestore (`global_roasters` / `global_beans` counts, e.g., *"X בתי קלייה ו-Y פולים כבר במאגר"*).
    - Soften the guest-mode copy (highlight the new one-tap **"שדרג לחשבון Google ושמור נתונים"** option instead of scaring new users away).
    - Add a concise visual preview/mockup of the 3 core tools (Smart Dial-In, Bean Library, Maintenance Alerts).

- [x] **Phase 2 (Viral Loops): Make Sharing Visual & Actionable** *(Completed & Tested)*
  - [x] **Visual Share Card (`CoffeePassport` & Bean Recipe)**:
    - Add a **"שתף כתמונה"** (Canvas-to-PNG / Web Share `files`) option for the Caffeine Passport and individual bean recipes (showing roaster, bean, roast level, grind setting, and flavor tags with subtle `Barista Mate` branding) tailored for Instagram Stories and WhatsApp coffee groups.
  - [x] **Deep-Link Recipe Sharing (`?shareBean=...` or `/explore`)**:
    - Allow users to share a direct link to a bean's dial-in profile so friends opening the link see the recipe card and can tap **"הוסף לספרייה שלי"** in one click.

- [x] **Phase 3 (Frictionless Onboarding & Retention): Try Before Sign-Up & PWA Install** *(Completed & Tested)*
  - [x] **Interactive "Try Dial-In First" Mode**:
    - Let unauthenticated visitors use the **Smart Dial-In** calculator directly from the landing page (no login wall), prompting them to sign in with Google only when they click **"שמור הגדרה לספרייה"**.
  - [x] **First-Time Onboarding Checklist**:
    - Show a lightweight 3-step progress bar for new users inside the dashboard: (1) הוסף פול ראשון, (2) בצע כיול ראשון, (3) הפעל התראות תחזוקה.
  - [x] **PWA Install Prompt Banner**:
    - Detect `beforeinstallprompt` on Android Chrome (and Safari on iOS) and show a dismissible Hebrew banner: **"התקן את Barista Mate כאפליקציה לגישה מהירה מהמסך הראשי"**.

- [x] **Phase 4 (Organic Acquisition & Measurement): Community SEO & Analytics** *(Code Completed & Tested)*
  - [x] **Public Roaster & Bean Explorer (`/explore`)**:
    - Server-rendered public catalog backed by `global_roasters` and `global_beans` so Google searches for Israeli specialty roasters and beans can discover Barista Mate organically.
  - [x] **Privacy-Friendly Funnel Analytics**:
    - Added Firebase Analytics event tracking (`lib/analytics.ts`) for `landing_view`, `signin_google`, `signin_guest`, and `explore_view`.
  - [ ] **Community Launch Playbook (Non-Code)**:
    - Post the new visual preview + direct link in Israeli home-espresso Facebook groups, Telegram/WhatsApp coffee communities, and Reddit/forums after Phase 1 & 2 ship.
