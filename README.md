
# ☕ Barista Mate | Your Personal Espresso Companion

A professional Progressive Web App (PWA) designed to manage and perfect your home espresso experience. This tool helps you dial in shots and track your beans.

---

## ✨ Key Features

### 1. User Authentication
- **Secure Sign-Up & Sign-In**: A unified and secure authentication screen allows users to create an account or log in.
- **Cloud-Synced Data**: All your data, including beans, orders, and settings, is securely tied to your user account and synced with the cloud.

### 2. Smart Dial-In Calculator
- **Visual Drink Selection**: Choose your drink (Ristretto, Espresso, Lungo) with clear visual icons and ratios.
- **Dynamic Target Time**: The app calculates the ideal extraction time based on your selected drink and roast level.
- **Smart Stopwatch**: A simple one-click stopwatch to time your extraction. The calculation is automatically triggered when you stop the timer.
- **Traffic Light Feedback**: Get instant, color-coded feedback (Perfect, Good, Bad) on your shot's accuracy.
- **Grind Adjustment Guidance**: The app suggests whether to grind finer or coarser based on the shot time vs. the target.
- **Bean Integration**: Dial-in results are automatically linked to your beans. Save successful dial-in settings directly to your bean library for future reference.

### 3. Bean & Roast Management
- **Cross-Device Sync**: All beans are stored in Firestore, so your bean library syncs seamlessly across multiple devices when logged into the same account.
- **Active Bean Selection**: Easily set a currently active bean from your library through the main settings panel.
- **Freshness Tracking**: The app automatically logs the "bag opened" date when a bean is first activated. This date can also be edited manually.
- **Quick Date Entry**: A "Today" button in the settings allows for one-click entry of the current date for the opened bag.
- **Header Display**: The active bean and its opened date are conveniently displayed in the header for quick reference, so you always know what you're working with.
- **Comprehensive Bean Library**: Maintain a detailed library of your coffee beans, including roaster name, bean name, grind setting, roast level (visual 1-5 rating), price paid, bag weight, and flavor notes.
- **Dial-In Integration**: Save dial-in settings (grind size, dose, and roast level) directly from the Smart Dial-In Calculator to your bean library as a default for future shots.

## 🛠️ Tech Stack
- **Framework**: Next.js
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **Testing**: Vitest + React Testing Library
- **Deployment**: Vercel

## 🧪 Testing
- **Unit Tests**: Quick validation of individual components (e.g., AddBeanDialog).
- **Integration Tests**: Full workflow testing for critical features like the Bean Library (add, edit, delete beans with Firestore mocking).
- **Smart Dial-In Tests**: Comprehensive tests covering dial-in calculation accuracy, feedback logic, and UI state management.
- **Run Tests**: `npm test`
- **All tests pass** with 27 passing tests covering core functionality.

##  Roadmap
1.  **Full User Authentication**: **✓ Done!** Google sign-in is now implemented.
2.  **Firestore Integration for Beans**: **✓ Done!** Beans now sync across devices.
3.  **Custom Dial-In Range**: **✓ Done!** Users can now set their own target extraction time.
4.  **Bean Library V2**: Add sharing capabilities and user ratings for beans.
5.  **Community Features**: Create a social feed to see what beans friends are using.
6.  **PWA & Native**: Enhance PWA capabilities and wrap the app for native mobile stores.
