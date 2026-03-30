# OmniFlow Ledger 💻🔧

OmniFlow Ledger is a comprehensive, real-time inventory and lifecycle management system designed specifically for tracking laptop batches, component extractions, and hardware repairs. 

Built with modern web technologies, it provides a secure, multi-user environment to maintain an immutable ledger of all hardware movements within your organization.

## 🎯 Who is this for?

This application is perfectly suited for:
- **Laptop Repair Shops**: Track customer devices, spare parts, and repair histories.
- **IT Asset Disposition (ITAD) Companies**: Manage large batches of incoming corporate laptops, grade them, and track their refurbishment process.
- **Electronics Refurbishers & Recyclers**: Record the breakdown of spoiled laptops into harvestable components (screens, RAM, batteries, etc.).
- **Hardware Inventory Managers**: Maintain strict oversight over high-value electronic components and prevent inventory shrinkage.

## ✨ Core Features

- 📦 **Batch Management**: Log incoming shipments of laptops. Categorize them by Brand, Series, and Model.
- 📊 **Granular Grading System**: Classify laptops into specific conditions (Class A, B, B-, C1-C5, D, Spoiled, and Unclassified).
- 🛠️ **Component Lifecycle Tracking**: 
  - **Extract**: Break down spoiled or lower-grade laptops into individual harvestable components.
  - **Buy**: Record new component purchases from suppliers.
  - **Install**: Track the installation of components into specific laptop models, automatically updating both component and laptop stock levels.
- 📖 **Immutable Transaction Ledger**: Every action (Incoming, Sale, Repair, Breakdown, Install, Purchase) is recorded with a timestamp, user ID, and exact quantity changes. Includes a secure, permission-based "Undo" functionality.
- 📈 **Real-time Dashboard**: Get a bird's-eye view of your total laptop stock, component inventory, and recent activities.

## 🚀 Additional Features

- 🔐 **Secure User Management**: 
  - Seamless **Google OAuth** login.
  - **Role-Based Access Control (RBAC)**: Users start in a "Pending" state. Admins can approve, reject, or revoke access. "Ultimate Admins" have overriding control.
- 🌍 **Multi-language Support**: Fully localized interface supporting **English**, **Malay**, and **Simplified Chinese**.
- 📱 **Responsive Design**: A sleek, iOS-inspired, glassmorphism UI built with Tailwind CSS that works beautifully on desktops, tablets, and mobile devices.
- 🧪 **Robust Test Coverage**: Comprehensive unit and integration testing using Vitest and React Testing Library.

---

## 💻 Getting Started (Local Development)

### Prerequisites
1. **Node.js** (v18 or higher)
2. **Git**
3. A **Firebase Project** with the following enabled:
   - **Firestore Database**
   - **Authentication** (Google Sign-In provider enabled)

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd omniflow-ledger
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Firebase Configuration
This project uses a specific JSON file for Firebase configuration. Create a file named `firebase-applet-config.json` in the root directory of the project:

```json
{
  "apiKey": "YOUR_API_KEY",
  "authDomain": "YOUR_PROJECT_ID.firebaseapp.com",
  "projectId": "YOUR_PROJECT_ID",
  "storageBucket": "YOUR_PROJECT_ID.firebasestorage.app",
  "messagingSenderId": "YOUR_SENDER_ID",
  "appId": "YOUR_APP_ID",
  "measurementId": "YOUR_MEASUREMENT_ID",
  "firestoreDatabaseId": "(default)"
}
```
*Note: Ensure this file is added to your `.gitignore` to prevent leaking your Firebase credentials.*

### 4. Start the Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

---

## 🌐 Deployment & Hosting

OmniFlow Ledger is a standard Vite Single Page Application (SPA), making it incredibly easy to host on almost any modern platform.

### Option A: Hosting on Vercel or Netlify (Recommended)
1. Push your code to a GitHub/GitLab repository.
2. Import the project into Vercel or Netlify.
3. **Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Environment Variables**: If you prefer not to commit `firebase-applet-config.json`, you can modify `src/firebase.ts` to read from standard `VITE_` environment variables and set those in your Vercel/Netlify dashboard.
5. Deploy!

### Option B: Firebase Hosting
Since you are already using Firebase for Auth and Firestore, Firebase Hosting is a natural fit.
1. Install the Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize hosting: `firebase init hosting`
   - Select your project.
   - Public directory: `dist`
   - Configure as a single-page app: `Yes`
   - Set up automatic builds: `No` (or Yes if using GitHub Actions)
4. Build the app: `npm run build`
5. Deploy: `firebase deploy --only hosting`

### Important Note on Firebase Security Rules
Before going to production, ensure your Firestore Security Rules (`firestore.rules`) are properly deployed to protect your data. The app relies on these rules to enforce admin-only actions and secure user data.

---

## 🛠️ Tech Stack

- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Framer Motion (`motion/react`)
- **Backend/BaaS**: Firebase (Firestore, Auth)
- **Testing**: Vitest, React Testing Library
- **Routing**: Custom lightweight tab routing (SPA)

## 🧪 Running Tests

To run the comprehensive test suite:

```bash
# Run tests once
npm run test

# Run tests in watch mode
npx vitest
```

---

*Built with precision for the modern hardware lifecycle.*
