# Copilot Instructions for Barista Mate

## Project Overview
Barista Mate is a Next.js PWA for managing espresso shots, beans, and custom drink orders. It uses Firebase Auth for authentication and Firestore for cloud data storage. The UI is built with shadcn/ui and styled using Tailwind CSS.

## Architecture & Data Flow
- **App Structure**: Main app logic is in the `app/` directory. Shared UI components are in `components/ui/`. Feature components (bean library, dial-in, orders, etc.) are in `components/`.
- **Authentication**: Managed via Firebase Auth. See `components/Auth.tsx` and `lib/firestore.ts` for integration patterns.
- **Data Storage**: All user data (beans, orders, logs) is stored in Firestore. Refer to `lib/firestore.ts` and `lib/roasteries-storage.ts` for CRUD operations.
- **State Management**: Most state is managed locally in React components. Cloud sync is handled via Firestore hooks and listeners.

## Developer Workflows
- **Build**: Use `npm run build` for production builds.
- **Dev Server**: Start with `npm run dev`.
- **Testing**: Run tests with `npm test` (Jest for unit/integration, see `components/__tests__/`).
- **Linting**: Use `npm run lint`.
- **Styling**: Tailwind config in `tailwind.config.ts`. UI components follow shadcn/ui conventions.

## Project-Specific Patterns
- **Bean Activation**: Activating a bean logs the "bag opened" date. See `bean-library.tsx` and `lib/roasteries-storage.ts` for logic.
- **Order Management**: Profiles and recipes for friends/family are managed in `people-orders.tsx` and `people-recipe-dialog.tsx`.
- **Dial-In Calculator**: Guided shot dialing and TDS calculations are in `smart-dial-in.tsx` and `lib/dial-in.ts`.
- **Cloud Sync**: All critical actions (bean updates, order changes) trigger Firestore updates. Always use provided Firestore utility functions.

## Integration Points
- **Firebase**: Config in `firebase-config.ts`. Auth and Firestore usage in `lib/firestore.ts`.
- **shadcn/ui**: Custom UI components in `components/ui/`. Follow shadcn/ui patterns for new UI elements.
- **Tailwind**: Use utility classes for styling. Extend config in `tailwind.config.ts` as needed.

## Conventions
- **TypeScript**: Strict typing enforced. Types are defined in `lib/types.ts`.
- **Component Structure**: Prefer functional components. Place feature logic in `components/`, shared UI in `components/ui/`.
- **Testing**: Place tests in `components/__tests__/`. Use descriptive test names and cover key workflows (bean activation, order creation, dial-in).

## Examples
- To add a new bean, update `bean-library.tsx` and use Firestore utilities from `lib/roasteries-storage.ts`.
- To add a new drink recipe for a person, update `people-recipe-dialog.tsx` and sync changes via Firestore.

## Key Files & Directories
- `app/` — Main app logic and pages
- `components/` — Feature and UI components
- `lib/` — Utility modules, Firestore integration, types
- `firebase-config.ts` — Firebase setup
- `tailwind.config.ts` — Tailwind config
- `components/__tests__/` — Tests

---

If any section is unclear or missing, please provide feedback for further refinement.