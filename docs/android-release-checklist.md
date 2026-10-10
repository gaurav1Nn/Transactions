# ACE Digital Transaction Management System — Android APK Release & Verification Guide

This guide details the EAS Build configuration and release verification for producing an installable Android APK.

---

## 1. EAS Build Configuration

The build profiles are configured in `apps/mobile/eas.json`:

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

- **Build Type:** `apk` (produces a standalone `.apk` directly installable on physical Android devices and emulators, without requiring Google Play Store).
- **Package ID:** `com.ace.transactions`
- **Application Name:** ACE Transactions

---

## 2. Generating the Android APK

### Option A: Cloud Build via EAS (Recommended)

1. Authenticate with your Expo account:
   ```bash
   npx eas login
   ```
2. Run the preview APK build:
   ```bash
   cd apps/mobile
   npx eas build --platform android --profile preview
   ```
3. EAS will build the project in the cloud and output a direct download URL for the `.apk` file upon completion.

### Option B: Local Build via Android Studio / Prebuild

1. Prebuild the native Android project:
   ```bash
   cd apps/mobile
   npx expo prebuild --platform android
   ```
2. Build the debug/release APK using Gradle:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
3. Output artifact: `android/app/build/outputs/apk/release/app-release.apk`.

---

## 3. Installation & Device Verification

Install the APK onto an attached Android device or running emulator:

```bash
adb install path/to/ace-transactions.apk
```

---

## 4. End-to-End Workflow Verification Checklist

Perform the complete verification workflow on the installed APK:

- [ ] **1. Cold Start & Session Check:**
  - Launch app: splash screen displays `#172041` background.
  - Startup screen initializes without flashing protected content.
  - Directs to `/(auth)/login`.

- [ ] **2. Registration:**
  - Navigate to Register tab.
  - Live password requirements checklist updates as characters are entered.
  - Submit valid details: user is created, token stored in `SecureStore`, navigates to Home.

- [ ] **3. Dashboard Experience:**
  - Greeting displays user's first name and time-adapted salutation.
  - Hero card displays total count and status distribution.
  - Status tiles display live counts for Pending, Success, and Failed.

- [ ] **4. Create Transaction:**
  - Tap "+ New transaction".
  - Enter amount with quick-add chips, select currency (USD/EUR/GBP).
  - Enter description (counter shows `n/255`).
  - Submit: button enters loading state, double taps are blocked.
  - Toast displays "Transaction created successfully", navigates to Details.

- [ ] **5. Details & Mock Simulation:**
  - Verify hero amount, large status badge, and `StatusStepper`.
  - Tap "Simulate success" or "Simulate failure".
  - `ConfirmDialog` prompts confirmation.
  - Outcome transitions immediately; stepper moves to terminal state.
  - Terminal state immutable: simulation controls disappear, final notice displays.

- [ ] **6. Transaction History:**
  - History tab displays items grouped under date headers ("Today", "Yesterday").
  - Filter chips (All, Pending, Success, Failed) filter list with live counts.
  - Pull-to-refresh syncs data and updates `SyncStatusPill`.

- [ ] **7. Profile & Session Restoration:**
  - View identity card, avatar initials, and formatted "Member since" date.
  - Restart app: session restores automatically from `SecureStore`.
  - Tap "Log out": prompts confirmation, deletes session, redirects to Login.
