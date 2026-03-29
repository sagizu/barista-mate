
# ☕ Barista Mate | Your Personal Espresso Companion

A professional Progressive Web App (PWA) designed to manage and perfect your home espresso experience. This tool helps you dial in shots and track your beans.

---

## ✨ Key Features

### 1. User Authentication
- **Secure Sign-Up & Sign-In**: A unified and secure authentication screen allows users to create an account or log in.
- **Anonymous/Guest Mode**: Try the app without creating an account. Data is synced to a temporary cloud account. **Note:** Logging out as a guest will permanently delete your data.
- **Cloud-Synced Data**: All your data, including beans, orders, and settings, is securely tied to your user account and synced with the cloud.

### 2. Account Settings
- **User Profile**: Update your display name, which is reflected across the app.
- **Account Management**: A dedicated settings dialog allows registered users to manage their account, including updating their profile and deleting their account.
- **Data Deletion**: Registered users can permanently delete their account and all associated data from Firestore.

### 3. Smart Dial-In Calculator
- **Visual Drink Selection**: Choose your drink (Ristretto, Espresso, Lungo) with clear visual icons and ratios.
- **Dynamic Target Time**: The app calculates the ideal extraction time based on your selected drink and roast level.
- **Smart Stopwatch**: A simple one-click stopwatch to time your extraction. The calculation is automatically triggered when you stop the timer.
- **Traffic Light Feedback**: Get instant, color-coded feedback (Perfect, Good, Bad) on your shot's accuracy.
- **Grind Adjustment Guidance**: The app suggests whether to grind finer or coarser based on the shot time vs. the target.
- **Last Shot Display**: The calculator now displays the details of the last shot, providing a quick reference for your previous extraction.

### 4. Bean & Roast Management
- **Cross-Device Sync**: All beans are stored in Firestore, so your bean library syncs seamlessly across multiple devices when logged into the same account.
- **Active Bean Selection**: Easily set a currently active bean from your library through the main settings panel.
- **Quick Date Entry**: A "Today" button in the settings allows for one-click entry of the current date for the opened bag.
- **Comprehensive Bean Library**: Maintain a detailed library of your coffee beans, including roaster name, bean name, grind setting, roast level (visual 1-5 rating), price paid, bag weight, and flavor notes.
- **Community Spotlight**: Discover what the community is brewing with a dynamic, randomized showcase of high-quality beans shared by other users in your Bean Library.
- **Smart Filtering & Sorting**: Organize your library by roastery, and instantly filter your collection by flavor profile, exact roast level range, and price per kilo.
- **Dial-In Integration**: Save dial-in settings (grind size, dose, and roast level) directly from the Smart Dial-In Calculator to your bean library as a default for future shots.

### 5. Maintenance Log & Push Notifications
- **Task Tracking**: Log important maintenance tasks like descaling, water filter changes, and backflushing to keep your machine in top condition.
- **Default Frequencies**: The app comes with sensible default time intervals (in days) for each maintenance task.
- **Customizable Frequencies**: In the main settings, you can override the defaults and set your own preferred frequencies for each task.
- **Smart Push Notifications (FCM)**: Opt-in to OS-level background push notifications. A Vercel Cron job automatically calculates your overdue tasks based on your personal frequencies and pushes native alerts directly to your phone.
- **Overdue Visuals**: When a task is overdue, it will be highlighted with an orange border and a "Time to do it!" badge inside the app.
- **Cloud-Synced**: Your maintenance log and custom frequencies are saved to your account and synced across devices.

### 6. Personal Coffee Passport (מדד קפאין)
- **Visual Identity Card**: A beautifully designed "Caffeine Index" that aggregates your total beans logged and unique roasters discovered.
- **Native Sharing**: Share your personalized coffee statistics directly to social media or messaging apps using the native Web Share API.

### 6. Global Verification System
- **Smart Autocomplete**: The platform supports a unified community dictionary of verified roasters and beans utilizing a high-speed search index alongside your local JSON lists.
- **Auto-Populate Metadata**: Selecting a verified global bean instantly fetches and cascades the known roast level and detailed flavor tags directly into your active form while remaining fully customizable.
- **Verification Queue**: Submitting personalized or unrecognized bean attributes automatically triggers a silent metadata insertion to the `pending_verification` queue for internal admin review, driving the continuous expansion of the global index.

## 🛠️ Tech Stack
- **Framework**: Next.js
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Authentication**: Firebase Auth
- **Database**: Firestore & Firebase Admin SDK
- **Push Notifications**: Firebase Cloud Messaging (FCM) & Service Workers
- **Background Tasks**: Vercel Cron Jobs
- **Testing**: Vitest + React Testing Library
- **Deployment**: Vercel

## 🧪 Testing
- **Unit Tests**: Quick validation of individual components (e.g., AddBeanDialog).
- **Integration Tests**: Full workflow testing for critical features like the Bean Library (add, edit, delete beans with Firestore mocking).
- **Smart Dial-In Tests**: Comprehensive tests covering dial-in calculation accuracy, feedback logic, and UI state management.
- **Maintenance Log Tests**: Tests for rendering tasks, handling overdue status, and user-configurable frequencies.
- **Run Tests**: `npm test`
- **All tests pass** with 48 passing tests covering core functionality.

##  Roadmap
1.  **Full User Authentication**: **✓ Done!** Google sign-in and anonymous login are now implemented.
2.  **Account Management**: **✓ Done!** Users can now update their display name and delete their account.
3.  **Firestore Integration for Beans**: **✓ Done!** Beans now sync across devices.
4.  **Custom Dial-In Range**: **✓ Done!** Users can now set their own target extraction time.
5.  **Maintenance Log**: **✓ Done!** Track and get reminders for machine maintenance.
6.  **Bean Library V2**: Add sharing capabilities and user ratings for beans.
7.  **Community Features**: **✓ Done (Initial implementation)** Added Community Spotlight to see top beans from other users.
8.  **PWA & Native**: Enhance PWA capabilities and wrap the app for native mobile stores.
