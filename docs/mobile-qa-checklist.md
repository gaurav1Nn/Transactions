# ACE Digital Transaction Management System — Mobile QA & Accessibility Checklist

This checklist documents the comprehensive visual, interaction, accessibility, and resilience verification for the mobile application (`apps/mobile`).

---

## 1. Route Protection & Navigation Verification

- [x] **Cold Start & Session Restoration:**
  - Startup renders neutral `StartupScreen` while `tokenStorage.getToken()` resolves.
  - No brief flash of protected routes or dashboard before authentication status is known.
  - Authenticated session redirects to `/(app)`.
  - Unauthenticated session redirects to `/(auth)/login`.

- [x] **Android Back Button Behavior:**
  - `(app)/_layout.tsx` uses `backBehavior="history"`.
  - Pressing hardware back from Transaction Details returns to the originating screen (Home or History).
  - Pressing hardware back or close (X) from Create with unsaved inputs prompts `ConfirmDialog` ("Discard this transaction?").

- [x] **Tab Bar Presentation (`AppTabBar`):**
  - Displays 4 tabs: **Home**, **History**, **Create**, **Profile**.
  - Pinned indicator bar above active tab.
  - Create tab displays prominent 36dp primary circular action.
  - Tab bar hides automatically on Transaction Details (`tabBarStyle: { display: "none" }`).
  - Tab bar hides automatically when the on-screen keyboard is open on Android.

---

## 2. Resilience & Error Handling Verification

- [x] **Network Offline & Caching:**
  - TanStack Query retains cached data across screens (`staleTime: 30s`, `gcTime: 5m`).
  - `SyncStatusPill` displays "Offline: showing saved data" when requests fail without a server response while cached data exists.
  - Pull-to-refresh on Home, History, and Profile allows manual re-synchronization.

- [x] **Timeout & Rate Limiting:**
  - Request timeouts (15s) map to "Request timed out. Please check your connection and try again."
  - HTTP `429 Too Many Requests` displays "Too many attempts. Please wait a few minutes and try again."
  - HTTP `401 Unauthorized` triggers global `setUnauthorizedHandler`, purging SecureStore credentials and routing to Login with session expired feedback.

- [x] **Client & Server Validation:**
  - Client-side Zod validation runs on form submit and blur.
  - Server-side `422 Unprocessable Entity` details map to field error messages.
  - Server-side `409 Conflict` (duplicate email) displays dedicated error on the email field with a "Sign in instead" action.

---

## 3. Accessibility & Usability (WCAG 2.1 AA)

- [x] **Touch Target Sizing:**
  - All interactive elements meet the minimum **48 × 48dp** touch target (`hit.minSize`).
  - Small icons and actions use `hitSlop: { top: 12, bottom: 12, left: 12, right: 12 }`.

- [x] **Color Contrast & Readability:**
  - Primary button (`#2F66CF` on `#FFFFFF`) achieves **5.3:1** contrast ratio.
  - Ink text (`#111827` on `#FFFFFF`) achieves **16.1:1** contrast ratio.
  - Status text colors (`success`, `pending`, `failed`) achieve $\ge$ **4.5:1** on their respective tint backgrounds.
  - Verified by automated unit test: `tests/theme.test.ts`.

- [x] **Screen Reader & TalkBack Support:**
  - Every icon has an accompanying text label or explicit `accessibilityLabel`.
  - Amount displays include natural speech descriptions (e.g., "125 dollars and 50 cents").
  - Form fields associate label, input value, helper text, and error states using `accessibilityLabel`, `accessibilityHint`, and `aria-invalid`.
  - Modals and alerts use `accessibilityRole="alert"` and `accessibilityViewIsModal`.
  - Loading states declare `accessibilityRole="progressbar"` with `accessibilityState={{ busy: true }}`.

- [x] **Reduced Motion Preferences:**
  - Integrated `useReducedMotion()` hook querying `AccessibilityInfo.isReduceMotionEnabled()`.
  - When reduced motion is enabled, `Skeleton` pulse animations pause and render static placeholder fills.

- [x] **Dynamic Type & Font Scaling:**
  - All text sizes are $\ge$ **12sp**.
  - No text containers use fixed heights; containers wrap fluidly up to **1.3× font scale** without clipping.

---

## 4. Mockup Reconciliation Audit (Section 3.2 Compliance)

Confirmed zero unbacked or misleading data:
- [x] No fake account balances (e.g. "Available Balance $148,920.50").
- [x] No credit/debit signs (+/-) or strikethroughs on amounts (amounts are neutral values).
- [x] No unbacked transaction directions (no "Net Inflow / Net Outflow").
- [x] No unbacked beneficiaries, fee deductions, or QR codes.
- [x] No unbacked volume summaries ("$1,482,930.00") or sparklines on Home (Home shows real count metrics and status distribution).
- [x] No unbacked security or compliance theater ("FIPS 140-3", "256-bit ECDSA audit chain").
- [x] Session storage card states truthfully that tokens are kept in device secure storage.
- [x] User avatars display verified initials (`JD`), with name and email sourced from `/api/users/me`.
