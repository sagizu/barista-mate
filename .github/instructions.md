# Barista Mate Project Instructions

## 1. Project Overview

Barista Mate is a Next.js PWA for managing espresso shots, beans, and custom drink orders for friends and family. It uses Firebase for authentication and data storage, ensuring real-time synchronization across devices.

-   **Framework**: Next.js (App Router)
-   **Styling**: Tailwind CSS with shadcn/ui components
-   **Authentication**: Firebase Auth (Google Sign-In)
-   **Database**: Firestore
-   **Testing**: Vitest

## 2. Key Commands

| Command         | Description                              |
| --------------- | ---------------------------------------- |
| `npm run dev`   | Starts the development server.           |
| `npm run build` | Creates an optimized production build.   |
| `npm test`      | Runs the test suite using Vitest.        |
| `npm run lint`  | Lints the code using Next.js's ESLint. |

## 3. Architecture & Data Flow

-   **App Structure**:
    -   `app/`: Main application logic and pages.
    -   `components/`: React components for specific features (e.g., `bean-library.tsx`).
    -   `components/ui/`: UI components from shadcn/ui.
    -   `lib/`: Core logic, utility functions, and type definitions.
-   **Authentication**: Managed via Firebase Auth. The `react-firebase-hooks` library is used to easily access user state.
-   **Data Storage**: Firestore is the single source of truth for all user data.
    -   **Structure**: Data is stored per-user under the path `users/{userId}/`.
    -   **Examples**:
        -   `users/{userId}/beans/{beanId}`
        -   `users/{userId}/maintenance/log`
        -   `users/{userId}/settings/general`
    -   **Access**: All database operations should go through the helper functions in `lib/firestore.ts`.
-   **State Management**: Primarily managed by React component state (`useState`, `useEffect`). Real-time data synchronization is achieved using `onSnapshot` listeners from Firestore.

## 4. Developer Workflows & Conventions

-   **Adding Features**: When adding a feature that requires persistent state, use the patterns in `lib/firestore.ts` to create new data models and access functions.
-   **Cloud Sync**: All critical user data must be synced. Use `onSnapshot` listeners to get real-time updates and display data. Use the exported helper functions (`updateGeneralSettings`, `addBean`, etc.) to write data.
-   **TypeScript**: The project uses strict TypeScript. All types for the data model should be defined in `lib/types.ts`.
-   **Testing**:
    -   Tests are located alongside the code they test (e.g., in a `__tests__` directory or as `.test.tsx` files).
    -   When adding new features or fixing bugs, add or update tests to cover the changes.
    -   When mocking, be aware that `firebase/firestore` is mocked in the test environment. You may need to update the mocks (`app/page.test.tsx` is a good example) to accommodate new Firestore function calls.

## 5. Key Files & Directories

-   `app/page.tsx`: The main page component, containing the layout and settings dialog logic.
-   `components/`: Contains all major feature components.
-   `lib/firestore.ts`: The **only** place where Firestore read/write logic should be defined.
-   `lib/types.ts`: Contains all TypeScript type definitions for the application's data model.
-   `firebase-config.ts`: Firebase project configuration.
-   `vitest.config.ts`: Configuration for the Vitest test runner.
