# Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After the backend is complete and approved, build a polished Android React Native application that implements every required screen and consumes the deployed Express API without hardcoded transaction data.

**Architecture:** Expo Router controls authentication and protected navigation. A centralized Axios client and TanStack Query manage remote server state, React Hook Form plus Zod manage validated forms, and Expo SecureStore protects the JWT. UI components remain presentation-focused while feature hooks own API interaction.

**Tech Stack:** React Native, Expo, TypeScript, Expo Router, TanStack Query, Axios, React Hook Form, Zod, Expo SecureStore, React Native StyleSheet, and Expo Application Services for the Android APK.

**Spec:** [`plan.md`](plan.md) is the master roadmap. The frontend consumes the frozen API described in [`backend plan.md`](<backend plan.md>).

## Global constraints

- Do not start this plan until the backend exit gate is approved.
- React Native, Expo, and TypeScript are mandatory.
- Android is the required delivery platform.
- The application must call the deployed Express API, not Convex and not hardcoded data.
- `EXPO_PUBLIC_API_URL` may contain only the public API URL; no secrets may be compiled into the app.
- JWTs must be stored in Expo SecureStore, not AsyncStorage or source code.
- Every network-backed screen must include loading, error, retry, and empty states where applicable.
- The application must contain login, registration, dashboard, create transaction, transaction history, transaction details, and user profile experiences.
- Server responses are the source of truth; avoid duplicating transaction data in unrelated global state.
- User-facing statuses are Pending, Success, and Failed while API values remain `PENDING`, `SUCCESS`, and `FAILED`.
- Forms must validate on the client for usability, but the UI must still display server validation errors.
- Accessibility labels, touch target sizes, readable contrast, keyboard handling, and disabled/loading controls are required.
- Do not add a UI library, animation library, state library, or other dependency without approval.

## Review focus

1. Slow or failed network requests must never permit duplicate transaction submissions.
2. App startup must not briefly reveal protected screens before SecureStore session restoration finishes.
3. An expired or rejected JWT must clear local authentication state and return the user to login safely.
4. Empty history, server failure, validation failure, and successful data must each have distinct usable UI states.
5. Amount display and submission must preserve decimal precision and currency formatting without using floating-point arithmetic for request construction.

---

## 1. Frontend entry gate

Before Task 1 begins, the coordinator supplies:

- Approved production `EXPO_PUBLIC_API_URL`.
- Passing production Postman run.
- Frozen request/response DTOs and error envelope.
- Authentication token behavior and expiry expectation.
- Exact transaction ID and status semantics.
- Confirmed pagination query and response metadata.
- Approved mock simulation request contract.

If any contract is unclear, stop and ask rather than inventing a frontend-only variation.

---

## 2. Required product screens and routes

```text
app/
├── _layout.tsx
├── index.tsx
├── (auth)/
│   ├── _layout.tsx
│   ├── login.tsx
│   └── register.tsx
└── (app)/
    ├── _layout.tsx
    ├── index.tsx                  # Home dashboard
    ├── transactions/
    │   ├── create.tsx
    │   ├── index.tsx             # History
    │   └── [id].tsx              # Details and simulation
    └── profile.tsx
```

### Navigation behavior

- Startup waits for SecureStore restoration.
- Unauthenticated users are routed to login/register.
- Authenticated users are routed to the dashboard.
- A global protected layout prevents manual navigation to private routes without a session.
- Logging out or receiving an unrecoverable `401` clears query cache and returns to login.

---

## 3. UI experience contract

### Visual direction

- Professional financial-product appearance without imitating a real bank.
- Clear typography hierarchy and generous spacing.
- Neutral background, accessible primary action color, and semantic status colors.
- Pending: amber/orange treatment.
- Success: green treatment.
- Failed: red treatment.
- Consistent cards, inputs, buttons, status badges, and feedback components.
- Do not rely on color alone; always show a text label and, where useful, an icon.

### Reusable UI states

Each screen chooses from these explicit states:

```ts
type RemoteScreenState<T> =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "empty" }
  | { kind: "ready"; data: T };
```

This is a planning model, not a requirement to store remote state separately from TanStack Query. Components derive the displayed state from query results.

### Required reusable components

- `AppButton`
- `AppTextField`
- `PasswordField`
- `ScreenContainer`
- `LoadingState`
- `ErrorState`
- `EmptyState`
- `StatusBadge`
- `TransactionListItem`
- `MoneyText`
- `ConfirmDialog` or accessible confirmation pattern

---

## 4. Frontend data contracts

The app consumes, but does not redefine differently, these backend contracts:

```ts
export interface UserDto {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export type TransactionStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface TransactionDto {
  id: string;
  transactionId: string;
  amount: string;
  currency: string;
  description: string;
  status: TransactionStatus;
  failureReason: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
    requestId: string;
  };
}
```

Amount remains a decimal string across the mobile/API boundary.

---

## 5. Planned frontend file map

```text
apps/mobile/
├── app/
│   ├── (auth)/
│   ├── (app)/
│   ├── _layout.tsx
│   └── index.tsx
├── src/
│   ├── api/
│   │   ├── client.ts
│   │   ├── auth.api.ts
│   │   ├── users.api.ts
│   │   └── transactions.api.ts
│   ├── components/
│   │   ├── feedback/
│   │   ├── forms/
│   │   ├── layout/
│   │   └── transactions/
│   ├── features/
│   │   ├── auth/
│   │   ├── profile/
│   │   └── transactions/
│   ├── hooks/
│   ├── providers/
│   │   ├── AuthProvider.tsx
│   │   └── QueryProvider.tsx
│   ├── storage/
│   │   └── token-storage.ts
│   ├── theme/
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   └── typography.ts
│   ├── types/
│   │   └── api.ts
│   └── utils/
│       ├── api-error.ts
│       ├── format-date.ts
│       └── format-money.ts
├── tests/
├── app.config.ts
├── eas.json
├── package.json
└── tsconfig.json
```

Feature hooks may live under the relevant feature folder. Screen files should compose hooks and components rather than contain networking details.

---

## 6. Subagent operating model

### Coordinator responsibilities

- Own frozen API contracts and cross-feature navigation decisions.
- Own shared theme tokens, root providers, and route structure after Task 2.
- Assign non-overlapping feature directories.
- Review each screen against loading, error, empty, success, and accessibility requirements.
- Run final Android integration and APK gates.

### Worker responsibilities

Every worker must:

1. Read this plan and the backend contract before editing.
2. Work only in assigned files/directories.
3. Write validation, hook, or component tests before implementation where practical.
4. Test all states, not only the successful screenshot state.
5. Use the central API client and query keys.
6. Never add mock production data to make a screen look complete.
7. Report emulator/device verification separately from unit-test evidence.
8. Avoid reverting changes from other workers.

### Review cycle

1. Implementer completes the focused task.
2. Specification reviewer checks assignment and API-contract compliance.
3. UI/quality reviewer checks usability, accessibility, state coverage, and code clarity.
4. Coordinator tests the integrated route on Android before accepting it.

### Safe parallelism

- Navigation, providers, theme tokens, API client, and auth state are foundation work and should be sequential.
- After authentication is stable, dashboard/profile and transaction component primitives may be developed in parallel with explicit file ownership.
- Create, history, and details screens share query keys and transaction hooks; coordinate them through one transaction-feature owner or implement sequentially.
- APK/release configuration can be drafted in parallel after the first successful Android launch, but the final build waits for complete integration.

---

## 7. Dependency-ordered frontend tasks

### Task 1: Scaffold the Expo TypeScript application

**Files:**

- Create: `apps/mobile/package.json`
- Create: `apps/mobile/tsconfig.json`
- Create: `apps/mobile/app.config.ts`
- Create: `apps/mobile/app/_layout.tsx`
- Create: `apps/mobile/app/index.tsx`

**Interfaces:**

- Consumes: root npm workspace and approved Expo configuration.
- Produces: Android-launchable Expo app with strict TypeScript.

- [ ] **Step 1: Define a startup smoke check**
  - App launches without red screen on Android.
  - Root route renders a temporary neutral startup state.

- [ ] **Step 2: Scaffold Expo Router and TypeScript configuration**

- [ ] **Step 3: Run typecheck**
  - Run: `npm run typecheck --workspace @ace/mobile`
  - Expected: exit `0`.

- [ ] **Step 4: Launch Android**
  - Run: `npm run android --workspace @ace/mobile`
  - Expected: app opens on emulator/device.

- [ ] **Step 5: Commit**
  - Commit message: `feat(mobile): scaffold Expo application`

### Task 2: Establish theme, feedback, and layout primitives

**Files:**

- Create: `apps/mobile/src/theme/colors.ts`
- Create: `apps/mobile/src/theme/spacing.ts`
- Create: `apps/mobile/src/theme/typography.ts`
- Create: `apps/mobile/src/components/layout/ScreenContainer.tsx`
- Create: `apps/mobile/src/components/feedback/RemoteStates.tsx`

**Interfaces:**

- Consumes: React Native primitives.
- Produces: stable design tokens, `ScreenContainer`, `LoadingState`, `ErrorState`, and `EmptyState`.

- [ ] **Step 1: Write component expectations**
  - Error state exposes message and retry action.
  - Empty state exposes title, explanation, and optional primary action.
  - Loading state has an accessibility label.

- [ ] **Step 2: Add tokens and components without feature-specific copy**

- [ ] **Step 3: Verify component rendering and accessibility queries**
  - Run: focused mobile component tests.
  - Expected: all states render with accessible text/actions.

- [ ] **Step 4: Commit**
  - Commit message: `feat(mobile): add accessible UI foundations`

### Task 3: Implement API types, configuration, and client

**Files:**

- Create: `apps/mobile/src/types/api.ts`
- Create: `apps/mobile/src/api/client.ts`
- Create: `apps/mobile/src/utils/api-error.ts`
- Modify: `apps/mobile/app.config.ts`
- Create: `apps/mobile/tests/api-client.test.ts`

**Interfaces:**

- Consumes: frozen backend DTO/error contract and `EXPO_PUBLIC_API_URL`.
- Produces: `apiClient`, `setAccessTokenProvider`, and `getApiErrorMessage(error: unknown): string`.

- [ ] **Step 1: Write failing client tests**
  - Uses configured base URL.
  - Adds Bearer token when present.
  - Omits authorization header when logged out.
  - Translates structured API error and network failure into safe messages.

- [ ] **Step 2: Confirm failure**

- [ ] **Step 3: Implement exact DTOs and centralized client**
  - Do not use `any` for API responses.
  - Add a sensible request timeout.

- [ ] **Step 4: Verify**
  - Run: focused API client tests and mobile typecheck.

- [ ] **Step 5: Commit**
  - Commit message: `feat(mobile): add typed REST API client`

### Task 4: Implement secure session restoration and route guards

**Files:**

- Create: `apps/mobile/src/storage/token-storage.ts`
- Create: `apps/mobile/src/providers/AuthProvider.tsx`
- Create: `apps/mobile/src/providers/QueryProvider.tsx`
- Modify: `apps/mobile/app/_layout.tsx`
- Modify: `apps/mobile/app/index.tsx`

**Interfaces:**

- Consumes: API client token provider and Expo SecureStore.
- Produces: `useAuth()` with `status`, `user`, `signIn`, `signOut`, and `restoreSession`; navigation decision after restoration completes.

- [ ] **Step 1: Write failing auth-provider tests**
  - Initial state is restoring, not unauthenticated.
  - Valid stored token/profile becomes authenticated.
  - Missing/invalid token becomes unauthenticated.
  - Logout deletes token and clears query cache.

- [ ] **Step 2: Confirm failure**

- [ ] **Step 3: Implement SecureStore adapter and provider**
  - Keep storage calls behind `token-storage.ts` for testability.

- [ ] **Step 4: Implement root route decision without protected-screen flash**

- [ ] **Step 5: Verify**
  - Run: auth-provider tests, typecheck, and manual cold-start checks.

- [ ] **Step 6: Commit**
  - Commit message: `feat(mobile): restore secure authenticated sessions`

### Task 5: Implement shared form controls

**Files:**

- Create: `apps/mobile/src/components/forms/AppTextField.tsx`
- Create: `apps/mobile/src/components/forms/PasswordField.tsx`
- Create: `apps/mobile/src/components/forms/AppButton.tsx`
- Create: `apps/mobile/tests/form-components.test.tsx`

**Interfaces:**

- Consumes: theme tokens.
- Produces: accessible controlled fields and a button with normal, pressed, disabled, and loading states.

- [ ] **Step 1: Write failing component tests**
  - Field connects label, value, error, and accessibility metadata.
  - Password visibility toggle is labelled.
  - Loading button cannot be pressed repeatedly.

- [ ] **Step 2: Implement minimal reusable components**

- [ ] **Step 3: Verify tests and keyboard behavior on Android**

- [ ] **Step 4: Commit**
  - Commit message: `feat(mobile): add reusable form controls`

### Task 6: Implement login

**Files:**

- Create: `apps/mobile/src/api/auth.api.ts`
- Create: `apps/mobile/src/features/auth/login.schema.ts`
- Create: `apps/mobile/src/features/auth/useLogin.ts`
- Create: `apps/mobile/app/(auth)/login.tsx`
- Create: `apps/mobile/tests/login.test.tsx`

**Interfaces:**

- Consumes: `apiClient`, `AuthProvider.signIn`, form controls, `/api/auth/login`.
- Produces: validated login screen and authenticated navigation.

- [ ] **Step 1: Write failing schema and screen tests**
  - Invalid email and blank password are blocked locally.
  - Submit shows loading and disables repeat presses.
  - `401` shows generic credential message.
  - Successful response stores token/user and enters app routes.

- [ ] **Step 2: Confirm failure**

- [ ] **Step 3: Implement API call, mutation, and form**

- [ ] **Step 4: Verify against deployed API with a test user**
  - Check success, wrong password, offline state, and keyboard handling.

- [ ] **Step 5: Commit**
  - Commit message: `feat(mobile): implement login experience`

### Task 7: Implement registration

**Files:**

- Create: `apps/mobile/src/features/auth/register.schema.ts`
- Create: `apps/mobile/src/features/auth/useRegister.ts`
- Create: `apps/mobile/app/(auth)/register.tsx`
- Modify: `apps/mobile/src/api/auth.api.ts`
- Create: `apps/mobile/tests/register.test.tsx`

**Interfaces:**

- Consumes: registration endpoint and auth provider.
- Produces: name/email/password/confirm-password registration flow.

- [ ] **Step 1: Write failing validation and interaction tests**
  - Password confirmation must match.
  - Invalid input stays local.
  - Existing email maps `409` to useful form feedback.
  - Success authenticates and navigates.

- [ ] **Step 2: Confirm failure**

- [ ] **Step 3: Implement API mutation and screen**
  - Do not send `confirmPassword` to the API.

- [ ] **Step 4: Verify against deployed API**

- [ ] **Step 5: Commit**
  - Commit message: `feat(mobile): implement user registration`

### Task 8: Implement profile and logout

**Files:**

- Create: `apps/mobile/src/api/users.api.ts`
- Create: `apps/mobile/src/features/profile/useProfile.ts`
- Create: `apps/mobile/app/(app)/profile.tsx`
- Modify: `apps/mobile/src/providers/AuthProvider.tsx`
- Create: `apps/mobile/tests/profile.test.tsx`

**Interfaces:**

- Consumes: `/api/users/me`, shared remote states, auth provider.
- Produces: authenticated profile display and complete logout behavior.

- [ ] **Step 1: Write failing tests**
  - Loading, profile, and retryable error states render.
  - Logout clears token, profile, and transaction cache.
  - `401` triggers safe session removal.

- [ ] **Step 2: Implement profile query and screen**

- [ ] **Step 3: Verify logout and cold restart on Android**

- [ ] **Step 4: Commit**
  - Commit message: `feat(mobile): add profile and secure logout`

### Task 9: Implement transaction data layer and display primitives

**Files:**

- Create: `apps/mobile/src/api/transactions.api.ts`
- Create: `apps/mobile/src/features/transactions/query-keys.ts`
- Create: `apps/mobile/src/features/transactions/transaction-hooks.ts`
- Create: `apps/mobile/src/components/transactions/StatusBadge.tsx`
- Create: `apps/mobile/src/components/transactions/TransactionListItem.tsx`

**Interfaces:**

- Consumes: all transaction endpoints and DTOs.
- Produces: typed query/mutation functions, centralized query keys, status badge, and list item.

- [ ] **Step 1: Write failing API/hook tests**
  - Correct endpoint and query parameters are used.
  - Amount stays a string.
  - Status label and semantics match the API enum.

- [ ] **Step 2: Implement API functions and query-key factory**

- [ ] **Step 3: Implement status/list primitives with accessibility labels**

- [ ] **Step 4: Verify focused tests and typecheck**

- [ ] **Step 5: Commit**
  - Commit message: `feat(mobile): add transaction data foundation`

### Task 10: Implement the home dashboard

**Files:**

- Create: `apps/mobile/app/(app)/index.tsx`
- Create: `apps/mobile/src/features/transactions/TransactionSummary.tsx`
- Create: `apps/mobile/src/features/transactions/RecentTransactions.tsx`
- Create: `apps/mobile/tests/dashboard.test.tsx`

**Interfaces:**

- Consumes: user profile, transaction history query, list item, shared states.
- Produces: greeting, total/status summary, recent list, and create/history navigation actions.

- [ ] **Step 1: Write failing dashboard-state tests**
  - Loading, error/retry, zero-transaction, and populated states.
  - Counts derive from returned transaction data.

- [ ] **Step 2: Implement dashboard composition**
  - Do not store separately calculated server state globally.

- [ ] **Step 3: Verify with zero, pending, success, and failed records**

- [ ] **Step 4: Commit**
  - Commit message: `feat(mobile): build transaction dashboard`

### Task 11: Implement create transaction with safe retries

**Files:**

- Create: `apps/mobile/src/features/transactions/create-transaction.schema.ts`
- Create: `apps/mobile/src/features/transactions/useCreateTransaction.ts`
- Create: `apps/mobile/app/(app)/transactions/create.tsx`
- Create: `apps/mobile/src/utils/idempotency-key.ts`
- Create: `apps/mobile/tests/create-transaction.test.tsx`

**Interfaces:**

- Consumes: create transaction API, query keys, navigation.
- Produces: validated create flow with one idempotency key per submission intent.

- [ ] **Step 1: Write failing form tests**
  - Zero/negative/over-precision amount is blocked.
  - Currency becomes uppercase and description is trimmed.
  - Double tap triggers one mutation.
  - Network retry reuses the same key.
  - Reset/new intent creates a new key.

- [ ] **Step 2: Confirm failure**

- [ ] **Step 3: Implement schema, key lifecycle, and mutation**
  - Submit amount as a decimal string.
  - On success invalidate list/summary queries and navigate to details.

- [ ] **Step 4: Verify against production**
  - Exercise double tap and forced retry; confirm only one server record.

- [ ] **Step 5: Commit**
  - Commit message: `feat(mobile): create idempotent transactions`

### Task 12: Implement transaction history

**Files:**

- Create: `apps/mobile/app/(app)/transactions/index.tsx`
- Create: `apps/mobile/src/features/transactions/TransactionHistoryList.tsx`
- Create: `apps/mobile/tests/transaction-history.test.tsx`

**Interfaces:**

- Consumes: paginated transaction query, shared states, list item.
- Produces: newest-first history with refresh and load-more behavior.

- [ ] **Step 1: Write failing state tests**
  - Loading, empty with create action, error with retry, and populated states.
  - Pull-to-refresh and next-page actions call the expected query behavior.
  - Selecting a row navigates using public transaction ID.

- [ ] **Step 2: Implement list and screen**

- [ ] **Step 3: Verify on Android with enough records for pagination**

- [ ] **Step 4: Commit**
  - Commit message: `feat(mobile): add transaction history`

### Task 13: Implement transaction details and mock simulation

**Files:**

- Create: `apps/mobile/app/(app)/transactions/[id].tsx`
- Create: `apps/mobile/src/features/transactions/TransactionDetails.tsx`
- Create: `apps/mobile/src/components/transactions/ConfirmDialog.tsx`
- Modify: `apps/mobile/src/features/transactions/transaction-hooks.ts`
- Create: `apps/mobile/tests/transaction-details.test.tsx`

**Interfaces:**

- Consumes: detail query, simulation mutation, query-key factory.
- Produces: detail presentation and confirmed pending-to-terminal actions.

- [ ] **Step 1: Write failing detail-state tests**
  - Loading, retryable error, missing transaction, pending, success, and failed states.
  - Only pending state presents simulation controls.
  - Confirmation is required before sending outcome.
  - Mutation loading disables both simulation buttons.
  - Completion refreshes detail, history, and dashboard data.

- [ ] **Step 2: Implement details and accessible confirmation**

- [ ] **Step 3: Verify both success and failure flows against production**

- [ ] **Step 4: Commit**
  - Commit message: `feat(mobile): add transaction details and simulation`

### Task 14: Complete navigation, resilience, and accessibility pass

**Files:**

- Modify: `apps/mobile/app/(auth)/_layout.tsx`
- Modify: `apps/mobile/app/(app)/_layout.tsx`
- Modify only approved shared UI/theme files.
- Create: `docs/mobile-qa-checklist.md`

**Interfaces:**

- Consumes: all screens.
- Produces: consistent navigation, session handling, accessibility, and Android behavior.

- [ ] **Step 1: Test route protection and Android back behavior**

- [ ] **Step 2: Test offline, timeout, server validation, and expired-session behavior**

- [ ] **Step 3: Check keyboard avoidance, scroll behavior, labels, touch targets, contrast, and screen-reader order**

- [ ] **Step 4: Fix only verified cross-screen problems with regression checks**

- [ ] **Step 5: Run full mobile checks**
  - `npm run lint --workspace @ace/mobile`
  - `npm run typecheck --workspace @ace/mobile`
  - `npm test --workspace @ace/mobile`

- [ ] **Step 6: Commit**
  - Commit message: `fix(mobile): harden navigation and accessibility`

### Task 15: Build and verify the Android APK

**Files:**

- Create: `apps/mobile/eas.json`
- Modify: `apps/mobile/app.config.ts`
- Create: `docs/android-release-checklist.md`

**Interfaces:**

- Consumes: completed mobile app and production API URL.
- Produces: installable Android APK and release evidence.

- [ ] **Step 1: Configure an EAS preview profile that produces an APK**

- [ ] **Step 2: Verify production API URL is present and contains no secret**

- [ ] **Step 3: Build**
  - Run: `npx eas-cli build --platform android --profile preview`
  - Expected: successful installable APK artifact.

- [ ] **Step 4: Install on a clean device/emulator**

- [ ] **Step 5: Run the complete product workflow**
  - Register.
  - Logout/login.
  - Create transaction.
  - Verify history/details.
  - Simulate success and failure.
  - View profile.
  - Restart app and verify session restoration.
  - Stop local backend and confirm app still works.

- [ ] **Step 6: Record build link/version and results**

- [ ] **Step 7: Commit**
  - Commit message: `release(mobile): configure Android APK build`

---

## 8. Frontend execution waves

| Wave | Tasks | Parallelism |
|---|---|---|
| 1 | Tasks 1–5 | Mostly sequential shared foundations |
| 2 | Tasks 6–8 | Login → registration; profile can begin after auth provider stabilizes |
| 3 | Tasks 9–10 | Transaction data foundation, then dashboard |
| 4 | Tasks 11–13 | Transaction screens coordinated through one feature owner |
| 5 | Tasks 14–15 | Integrated QA followed by APK build |

---

## 9. Frontend definition of done

- [ ] All six required application areas are implemented.
- [ ] Every screen uses the deployed Express API where data is required.
- [ ] No hardcoded production transaction data remains.
- [ ] JWT is stored only through SecureStore.
- [ ] Startup session restoration does not flash protected content.
- [ ] Login, registration, logout, and expired-token flows work.
- [ ] Create transaction prevents duplicate submission and supports safe retry.
- [ ] History, details, and mock simulation work against Cloud Run.
- [ ] Loading, empty, error, retry, success, and disabled states are verified.
- [ ] Accessibility and Android keyboard/navigation checks pass.
- [ ] Mobile lint, typecheck, and tests pass with zero failures.
- [ ] APK installs and completes the workflow with the local backend stopped.
- [ ] Human approves the installed Android product before submission.

