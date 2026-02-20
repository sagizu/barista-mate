# ☕ Barista Mate | Your Personal Espresso Companion

A professional Progressive Web App (PWA) designed to manage and perfect your home espresso experience. This tool helps you dial in shots, track your beans, and manage custom drink orders for family and friends.

**🚀 Live Access**
App URL: https://barista-mate.vercel.app/

---

## ✨ Key Features

### 1. User Authentication
- **Secure Sign-Up & Sign-In**: A unified and secure authentication screen allows users to create an account or log in.
- **Cloud-Synced Data**: All your data, including beans, orders, and settings, is securely tied to your user account and synced with the cloud.

### 2. Smart Dial-In Calculator
- **Precision Tracking**: Input key variables like Dose (In), Yield (Out), and total Extraction Time.
- **Adaptive Logic**: The calculator understands different Roast Levels (Light, Medium, Dark) and suggests grind adjustments (`Finer` or `Coarser`) based on ideal extraction windows.
- **Save Grind Settings**: Save a new bean or update the grind setting for an existing one directly from the calculator to your library.

### 3. Bean & Roast Management
- **Active Bean Selection**: Easily set a currently active bean from your library through the main settings panel.
- **Freshness Tracking**: The app automatically logs the "bag opened" date when a bean is first activated. This date can also be edited manually.
- **Header Display**: The active bean and its opened date are conveniently displayed in the header for quick reference, so you always know what you'''re working with.
- **Comprehensive Bean Library**: Maintain a detailed library of your coffee beans, including roaster, name, price, bag weight, flavor notes, and links.

### 4. People & Orders Management
- **Personalized Drink Cards**: Manage a list of people (family, friends) with their favorite, specific drink recipes.
- **Detailed Recipes**: Track milk types (Oat, Lactose-Free, etc.), precise ice cube counts, and other custom notes for each person.
- **Structured View**: Each order is displayed as a clean, easy-to-read card for quick and accurate preparation.

### 5. Machine Maintenance
- **Maintenance Log**: Easily track and log key machine maintenance tasks, including group head cleaning, backflushing, water filter changes, and descaling.

### General
- **Dark Roast UI**: Premium dark-themed interface designed for pleasant use in low-light environments (like your kitchen in the early morning).
- **Cloud & Local Storage**: User data is stored in the cloud via Firebase, with local caching for speed and offline availability.

---

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **Deployment**: Vercel (with CI/CD via GitHub)
- **Styling**: Tailwind CSS + Shadcn UI
