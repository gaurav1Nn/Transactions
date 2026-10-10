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
- Do not add a UI library, animation library, state library, or other dependency without approval. Section 3.11 lists the zero-dependency defaults and the optional upgrades awaiting approval.
- Section 3 is the visual and interaction source of truth. The mockups in `docs/design/mockups/` are the baseline, but where Section 3 differs from a mockup, Section 3 wins (see 3.2).
- Never ship UI for data the API cannot supply: no balances, credit/debit signs, beneficiaries, fees, volumes, roles, avatars, security-compliance claims, or fake toggles. Section 3.2 lists every removed element.
- Screens use theme tokens only. No raw hex colors, font sizes or spacing numbers in screen or component files.

## Review focus

1. Slow or failed network requests must never permit duplicate transaction submissions.
2. App startup must not briefly reveal protected screens before SecureStore session restoration finishes.
3. An expired or rejected JWT must clear local authentication state and return the user to login safely.
4. Empty history, server failure, validation failure, and successful data must each have distinct usable UI states.
5. Amount display and submission must preserve decimal precision and currency formatting without using floating-point arithmetic for request construction. This includes quick-add chips and thousands grouping.
6. No screen may show invented data or unverifiable claims. Compare every screen with the 3.2 reconciliation table.
7. Each finished screen must match its Section 3.7 layout, tokens and states, and be checked visually on Android at 360dp and 411dp width and at font scale 1.3.

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

### Tab bar and route presentation

- `(app)/_layout.tsx` uses Expo Router `Tabs` with the custom `AppTabBar` (3.5.8): **Home** (`index`), **History** (`transactions/index`), **Create** (`transactions/create`), **Profile** (`profile`).
- `transactions/[id]` is registered with `href: null` so it is not a tab, and it hides the tab bar. Use `backBehavior="history"` so Android back from Details returns to the screen the user came from.
- History accepts an optional `status` route param (`PENDING`, `SUCCESS` or `FAILED`), used by the Home tiles.
- The `(auth)` stack shows Sign in and Register as two routes that share one visual shell. The segmented control navigates with `router.replace`.

### Navigation behavior

- Startup waits for SecureStore restoration.
- Unauthenticated users are routed to login/register.
- Authenticated users are routed to the dashboard.
- A global protected layout prevents manual navigation to private routes without a session.
- Logging out or receiving an unrecoverable `401` clears query cache and returns to login.

---

## 3. UI experience contract

This section is the single source of truth for how the app looks and behaves. It supersedes the earlier one-paragraph visual direction. Workers build screens from this section, not from guesswork and not from the mockups alone.

**Reference mockups** (design baseline from the human, in `docs/design/mockups/`): `01-login.png`, `02-home.png`, `03-history.png`, `04-create.png`, `05-details.png`, `06-profile.png`. They set the visual language: institutional, calm, serif headings, a navy hero card, and a blue primary. They also contain content the API cannot supply and some inconsistencies. Section 3.2 records every deviation, and **where this section and a mockup disagree, this section wins**.

### 3.1 Design principles

1. **Trustworthy before flashy.** Every number on screen comes from the API. Nothing is invented to fill space.
2. **Money is the hero.** Amounts use the serif display face, tabular figures, and the most contrast on the screen.
3. **One accent, three statuses.** Blue means "act". Amber, green and red mean *only* Pending, Success and Failed.
4. **Quiet chrome.** Hairline borders, flat cards, generous whitespace. Only the home hero card gets a dark surface.
5. **Honest states.** Loading, empty, error, offline and permission-style states are designed screens, not afterthoughts.
6. **Calm motion.** Short, purposeful, and disabled when the user prefers reduced motion.
7. **Sentence case everywhere** except tiny eyebrow labels and badges. The mockups' ALL-CAPS buttons are replaced by sentence-case buttons.

### 3.2 Mockup-to-product reconciliation

The backend contract is frozen. It exposes users (`id, name, email, createdAt`) and transactions (`amount, currency, description, status, failureReason, processedAt, createdAt`). A transaction has **no direction (credit/debit), no beneficiary, no category, no fee, no balance**. Anything in a mockup that needs those is changed as below.

| Mockup element | Decision | Replacement / reason |
|---|---|---|
| `+$1,850.00` green and `-$430.00` signs, strikethrough on failed amounts | **Change** | Amounts have no direction. Show the neutral ink amount with no sign. Failed rows keep the amount un-struck and carry the Failed badge. Strikethrough hurts legibility. |
| "Net Inflow / Net Outflow" on date headers | **Remove** | No direction. Date headers show the date only, plus a "Today" or "Yesterday" tag. |
| "Total liquidity volume $1,482,930.00", "+12.4% vs last cycle", sparkline | **Replace** | No summary endpoint. Hero shows total transaction **count** and a **status distribution bar** (see 3.7.3). |
| Per-status "Volume $42,500.00" tiles | **Replace** | Per-status **count** only. Optional backend amendment is listed in 3.12. |
| "Available Balance $148,920.50" on Create | **Remove** | No balance exists. Helper text shows the real maximum instead. |
| Beneficiary ID, QR scan, "Verified", Transfer classification | **Remove** | API accepts only `amount`, `currency`, `description`. |
| "Batch Upload CSV", "Audit Export" | **Remove** | Not in scope. Listed under deferred ideas. |
| "Simulate Double-Submit Lock" toggle on Create | **Remove from product UI** | Developer test aid. Double-submit is covered by tests and a locked button. |
| "Processing Fee", "Beneficiary" rows on Details | **Remove** | Not in the API. |
| Details "Reset" link | **Remove** | Terminal states are immutable (API returns 409). |
| Details progress bar | **Replace** | A three-step **status stepper** (see 3.7.6). |
| Photo avatars, "Senior Treasury Officer", "Verified Officer", "Tier 3 Enterprise" | **Replace** | Initials avatar. Name and email from `/api/users/me`. No invented roles. |
| Bell icon in every header | **Remove** | No notification feature. |
| Biometric toggle, API Simulation toggle, Session timeout, Notification rules, Key rotation, Audit logs, IP and device info | **Remove** | No backing feature. Biometric lock is a deferred idea. |
| "Remember this device", "Forgot key?" | **Remove** | The token is always kept in SecureStore. No reset endpoint exists. |
| "FIPS 140-3", "FDIC / SOC2 Type II Synced", "256-bit ECDSA audit chain", "Authorized Staff Only" | **Remove** | Unverifiable compliance and security claims on a mock product. Misleading, and a legal risk. |
| Search bar on History | **Defer** | API has no text search. Client-side search over partial pages would mislead. |
| "Synchronized with central ledger", "Ledger Live" pills | **Replace** | Real **SyncStatusPill**: "Updated 12s ago", "Refreshing…", "Offline: showing saved data". |
| Tabs "Journal Feed / Archived Empty / Ledger Notice" | **Not product UI** | These were state demos. Their states are built as `EmptyState`, `ErrorState` and notice banners. |
| Status words Settled / Clearing / Rejected | **Change** | Plan rule: user-facing words are **Pending, Success, Failed**. |
| Tab labels "Ledger", "Account" | **Change** | Fixed labels: **Home, History, Create, Profile**. |
| Product names "ACE Ledger", "Treasury Portal", "ACE Transaction", "Institutional Archive" | **Change** | One name: **ACE Transactions**. Screen titles name the screen, not a sub-brand. |
| Field labels "Enterprise ID / Key", "Vault Passcode", button "Sign in to terminal" | **Change** | Plain language: Email, Password, Sign in. |
| Truncated text ("Cl…", "Latenc…", "TXN-" wrapping onto a second line) | **Fix** | Row layout in 3.5.9 gives descriptions two lines, and IDs a single mono line with no wrap. |
| Inconsistent dates (Oct 9 2026 vs Oct 24 2024) | **Fix** | All dates come from API timestamps and the device clock. |
| Description counter "24/100" | **Fix** | API allows 255 characters. Counter shows `n/255`. |

### 3.3 Design tokens

All values live in `src/theme/`. Screens and components may **only** use tokens. No hex values or magic numbers in screen files.

#### 3.3.1 Color (`colors.ts`)

| Token | Hex | Used for |
|---|---|---|
| `background` | `#F7F8FA` | App background |
| `surface` | `#FFFFFF` | Cards, sheets |
| `surfaceMuted` | `#F1F3F6` | Field fill, read-only blocks, skeletons |
| `border` | `#E2E6EC` | Hairline card and divider lines |
| `borderStrong` | `#CBD2DC` | Field borders, secondary buttons |
| `ink` | `#111827` | Primary text, headings, amounts |
| `inkSoft` | `#4B5565` | Secondary text |
| `inkMuted` | `#6B7487` | Placeholders, captions (4.7:1 on white) |
| `primary` | `#2F66CF` | Primary buttons, links, active tab, focus ring (5.3:1 against white text) |
| `primaryPressed` | `#2554B0` | Pressed primary |
| `primaryTint` | `#E8EEFB` | Selected chips, info notice, avatar fill |
| `navy` | `#172041` | Home hero surface |
| `navyRaised` | `#212B54` | Tiles and dividers on the hero |
| `onNavy` | `#FFFFFF` | Text on hero |
| `onNavySoft` | `rgba(255,255,255,0.72)` | Secondary text on hero |
| `success` / `successBg` / `successBorder` | `#0B6B3A` / `#E3F3EA` / `#B7DFC8` | Success badge, tile, confirm button |
| `pending` / `pendingBg` / `pendingBorder` | `#8A4B00` / `#FFF0D6` / `#F2D39A` | Pending badge, tile |
| `failed` / `failedBg` / `failedBorder` | `#A4161A` / `#FDE6E6` / `#F3B8B8` | Failed badge, errors, destructive actions |
| `successOnDark` / `pendingOnDark` / `failedOnDark` | `#4ADE9A` / `#F5B544` / `#F28B82` | Distribution bar and legend on the navy hero |
| `overlay` | `rgba(17,24,39,0.5)` | Modal scrim |

Contrast was computed for the text and background pairs above: body text and status text-on-tint all clear 4.5:1. The checker and the accessibility pass must re-verify every pair that is actually rendered.

#### 3.3.2 Typography (`typography.ts`)

Two voices: an editorial **serif** for headings and money, and a clean **sans** for everything else. IDs use the platform **monospace**.

| Token | Family | Size / line | Weight | Notes |
|---|---|---|---|---|
| `display` | serif | 36 / 40 | 700 | Home hero count, tabular figures |
| `amountXL` | serif | 44 / 48 | 600 | Create amount input and Details amount |
| `title` | serif | 24 / 30 | 600 | Screen titles, greeting |
| `headline` | serif | 18 / 24 | 600 | Card titles, section titles, row amounts |
| `body` | sans | 16 / 24 | 400 | Default text |
| `bodyStrong` | sans | 16 / 24 | 600 | Values, button labels |
| `bodySm` | sans | 14 / 20 | 400 | Descriptions, helper text |
| `eyebrow` | sans | 12 / 16 | 600 | UPPERCASE, +0.8 letter-spacing. At most one per card. |
| `caption` | sans | 12 / 16 | 400 | Timestamps, counters |
| `mono` | monospace | 13 / 18 | 500 | Transaction IDs |

Rules:

- Minimum text size is **12sp**. Badge text is 12sp, never 10 or 11.
- Money always sets `fontVariant: ['tabular-nums']`.
- No text container has a fixed height. Every screen must survive system font scale 1.3 without clipping.
- **Font loading is approval-gated** (see 3.11). Tokens expose `fontFamily.serif`, `fontFamily.sans` and `fontFamily.mono`. **Default (no new dependency):** serif is the system `serif` (Noto Serif on Android), sans is the system default (Roboto), mono is `monospace`. **If approved:** Source Serif 4 (serif) and Inter (sans) replace the two defaults by changing only `typography.ts`.

#### 3.3.3 Spacing, shape, elevation, motion

| Token group | Values |
|---|---|
| `space` | 4, 8, 12, 16, 20, 24, 32, 40 (4pt grid). Screen gutter 16. Card padding 16. Gap between sections 24. |
| `radius` | `badge` 4, `control` 8, `card` 8, `hero` 12, `round` 999 (avatar, toggle) |
| `border` | Cards: 1px `border`. Fields: 1px `borderStrong`, 2px `primary` on focus. |
| `elevation` | Cards **flat** (border only, no shadow). Modal and toast: elevation 8. Nothing else casts a shadow. |
| `hit` | Minimum interactive size **48 × 48dp**. Use `hitSlop` when a visual is smaller. |
| `motion` | `fast` 120ms, `base` 220ms, `slow` 360ms. Easing: `Easing.out(Easing.cubic)`. |

### 3.4 Iconography

Use `@expo/vector-icons` (it ships as a dependency of `expo`, so it needs no new package). One family only: **Ionicons**, outline style, 20 to 24dp, stroke weight left default. Wrap icons in one `AppIcon` component that takes a semantic name, so glyphs can be swapped in one file. Verify each glyph name exists before using it.

| Semantic name | Ionicons glyph |
|---|---|
| `home`, `history`, `create`, `profile` | `home-outline`, `receipt-outline`, `add-circle-outline`, `person-outline` |
| `statusPending`, `statusSuccess`, `statusFailed` | `time-outline`, `checkmark-circle-outline`, `close-circle-outline` |
| `email`, `password`, `showPassword`, `hidePassword` | `mail-outline`, `lock-closed-outline`, `eye-outline`, `eye-off-outline` |
| `back`, `close`, `forward`, `next` | `arrow-back`, `close`, `chevron-forward`, `arrow-forward` |
| `share`, `refresh`, `offline`, `info`, `warning` | `share-outline`, `refresh-outline`, `cloud-offline-outline`, `information-circle-outline`, `alert-circle-outline` |
| `secure`, `logout`, `sandbox` | `shield-checkmark-outline`, `log-out-outline`, `flask-outline` |

Icons never carry meaning alone. Every icon that is not purely decorative sits beside text or has an `accessibilityLabel`.

### 3.5 Component specifications

Each component lists its anatomy and every state it must support. Components take tokens only and have no networking code.

#### 3.5.1 `AppButton`

- Variants: `primary` (filled `primary`, white text), `secondary` (white, 1px `borderStrong`, ink text), `success` (`successBg` fill, `success` text and border), `danger` (`failedBg` fill, `failed` text and border), `ghost` (text only, primary).
- Height 52, radius `control`, horizontal padding 16, label `bodyStrong` in sentence case. Optional leading or trailing icon.
- States: default, pressed (darker fill, scale 0.98 over `fast`), disabled (50% opacity, not focusable as actionable), **loading** (spinner replaces icon, label becomes the loading label, `accessibilityState={{ busy: true, disabled: true }}`, presses ignored).
- Full width by default.

#### 3.5.2 `AppTextField` and `PasswordField`

- Anatomy: eyebrow-style label above (`caption`, `inkSoft`, 600), 52dp field, leading icon (20dp, `inkMuted`), value, optional trailing action, and a helper or error line below.
- Fill `surfaceMuted`, border `borderStrong`. Focus: border 2px `primary` and fill `surface`. Error: border `failed` and an error line with a warning icon and the message in `failed`.
- Placeholder color `inkMuted`.
- Connects label, value, error and hint through `accessibilityLabel` and `accessibilityHint`. The error is announced when it appears.
- `PasswordField` adds a 48dp visibility toggle labelled "Show password" and "Hide password".
- Supports `autoComplete`, `textContentType`, `returnKeyType` and `onSubmitEditing` so the keyboard's action key advances or submits.

#### 3.5.3 `SegmentedControl`

- Container `surfaceMuted`, 1px `border`, radius `control`, padding 4. Selected segment is `surface` with a 1px border and `ink` text. Unselected text is `inkSoft`. Height 44.
- Used for **Sign in / Register** (navigates between routes, it is not local state) and **currency** on Create.
- `accessibilityRole="tablist"` on the container and `tab` with `selected` state on each segment.

#### 3.5.4 `StatusBadge`

- Radius `badge`, 1px border, padding 4 × 8, `caption` weight 700, UPPERCASE label with a leading 14dp icon.
- Pending: `pendingBg` / `pendingBorder` / `pending`, label "PENDING". Success: green, "SUCCESS". Failed: red, "FAILED".
- A `size="lg"` variant (14dp text) is used in the Details hero.
- Lookup table keyed by the API enum. `accessibilityLabel` reads "Status: Pending".

#### 3.5.5 `MoneyText`

- Props: `amount: string`, `currency: string`, `size: 'row' | 'hero' | 'xl'`, optional `tone`.
- Takes the API decimal string and **never parses it to a number**. It splits on `.`, groups the integer part in thousands with commas using string operations, and re-attaches the cents.
- Currency presentation: `USD` `$`, `EUR` `€`, `GBP` `£`. Any other code is shown as a prefix (`CHF 10.00`).
- `row`: `headline`, whole amount in one size, followed by the currency code in `caption` `inkMuted` on the line below the amount.
- `hero` and `xl`: the cents render at 60% of the integer size and `inkSoft`, and the currency code sits beside it as a small `eyebrow`.
- `accessibilityLabel` reads naturally, for example "125 dollars and 50 cents".

#### 3.5.6 `Avatar`

- Initials from the user's name (first letter of the first and last word, uppercase). Fill `primaryTint`, text `primary`, `headline`. Sizes 32 (header), 64 (profile).
- Photo avatars are out of scope because the API has no image.

#### 3.5.7 `AppHeader`

- Height 56 plus the safe-area inset, `background` fill, 1px bottom `border`.
- **Root tabs (Home, History, Profile):** the wordmark on Home, and the screen title on the others, on the left. `Avatar` (32) on the right, opening Profile. On Profile the avatar is hidden.
- **Pushed screens (Create, Details):** a 48dp back button (or close button on Create) on the left, the title centered or left-aligned and never truncated, because the title is short. Details shows "Transaction" and the ID goes in the hero.
- Wordmark: the ACE logo mark (asset from the human; until supplied, a 28dp `primary` rounded square with a white "A") plus "ACE Transactions" in `headline`.

#### 3.5.8 `AppTabBar`

- Four tabs: **Home**, **History**, **Create**, **Profile**. Height 64 plus the bottom inset, `surface` fill, 1px top `border`.
- Icon 24dp above a 12sp label. Active is `primary`, inactive is `inkSoft`. Active shows a 3dp `primary` indicator bar above the icon.
- **Create** is emphasised: its icon sits in a 40dp `primary` filled circle with a white plus when inactive, and the label stays `primary`. This is the primary action of the product.
- Hidden while the keyboard is open and on Transaction Details.
- Every tab has `accessibilityRole="tab"` and a `selected` state.

#### 3.5.9 `TransactionListItem`

Used on Home (5 recent) and History.

```text
┌───────────────────────────────────────────────┐
│ [icon]  Acme Corp B2B Settlement     $125.50  │
│  40dp   ... wraps to a second line      USD   │
│         TXN-MV1ZR5Z3-3697E392       [PENDING] │
│         Today, 14:20                          │
└───────────────────────────────────────────────┘
```

- Left: 40dp rounded-square tile, `surfaceMuted`, with the status icon in the status color. The icon reflects the **status**, because no category exists.
- Center (flex 1): description in `bodyStrong`, up to **two lines** with an ellipsis. Below it the transaction ID in `mono` on a **single line with `numberOfLines={1}`, never wrapping**, and below that the relative time in `caption` `inkMuted`.
- Right (fixed to content, right-aligned): `MoneyText size="row"`, then `StatusBadge` below it. If the ID would collide with the right column, the center column takes priority and the right column never shrinks.
- Row min height 76, 1px bottom divider. Whole row is pressable with a pressed fill of `surfaceMuted`.
- `accessibilityLabel`: "Acme Corp B2B Settlement, 125 dollars 50 cents, Pending, today at 14:20". `accessibilityHint`: "Opens transaction details".

#### 3.5.10 Feedback components

- `LoadingState`: full-screen centered spinner with the label "Loading…" and `accessibilityLabel`.
- `Skeleton`: a rectangle in `surfaceMuted` pulsing between 0.5 and 1.0 opacity over 900ms with core `Animated`. Static when reduced motion is on. Skeleton screens are used for first loads of Home, History and Profile, instead of a spinner.
- `ErrorState`: icon in a 56dp `failedBg` circle, title, the safe message, **Try again** primary button, and when relevant a secondary link. Shows the `requestId` as small caption text under "Reference" when the API supplied one, to help support.
- `EmptyState`: 56dp `primaryTint` circle with an icon, title, one-sentence explanation, optional primary action.
- `InlineNotice`: a one-line banner. Variants `info` (`primaryTint`), `success`, `warning`, `error`. Icon, text and an optional action.
- `Toast`: appears at the top under the header, `ink` fill, white text, 4 seconds, slides in over `base`, swipe or tap to dismiss, announced via `AccessibilityInfo.announceForAccessibility`.
- `SyncStatusPill`: small pill under the header on Home and History. States: `Updated just now` / `Updated 2m ago` (refreshes every 30 seconds from `dataUpdatedAt`), `Refreshing…` with a spinner while `isFetching`, `Offline: showing saved data` in the warning style when the last request failed with no response but cached data exists. Hidden when nothing has loaded.

#### 3.5.11 `ConfirmDialog`

- Built with core `Modal`, `transparent`, `animationType="fade"`, `onRequestClose` calling cancel (Android back).
- Centered 320dp-wide card, radius `hero`, elevation 8, over the `overlay` scrim. Title `headline`, body `bodySm`, two stacked buttons: the confirm action first (`primary`, `success` or `danger` variant to match the intent), then a `secondary` "Cancel".
- While the action runs, both buttons are disabled and the confirm button shows loading. The dialog cannot be dismissed by tapping the scrim while loading.
- Focus moves to the title when opened. `accessibilityViewIsModal`.

#### 3.5.12 Remaining specialist components

- `FilterChips`: row of four chips **All, Pending, Success, Failed**, each with a count. Chip height 40, radius `control`. Selected is `primary` fill and white text. Unselected is `surface` with `borderStrong`. The row fits at 360dp width without scrolling.
- `AmountInput`: see 3.7.4.
- `StatusStepper`: see 3.7.6.
- `DetailRow`: label on the left (`bodySm`, `inkSoft`) and value on the right (`bodyStrong`, right-aligned, wraps), divider below. Variants for mono and for a trailing action.
- `StatTile`: see 3.7.3.
- `SectionHeader`: `headline` title on the left and an optional `ghost` link on the right.

### 3.6 Global patterns

#### 3.6.1 Formatting

| Value | Format | Rule |
|---|---|---|
| Amount | `$1,234.50`, code `USD` beside or below | String math only. See `MoneyText`. |
| Date and time | `10 Oct 2026, 14:20` in the device's local time zone | Detail screen additionally shows the UTC time as a caption (`2026-10-10 11:05 UTC`). |
| Relative time | "Just now", "5 min ago", "Today, 14:20", "Yesterday, 18:45", then "10 Oct" | In list rows. |
| Date section header | "Today", "Yesterday", or "Fri, 9 Oct 2026" | From `createdAt` in local time. |
| Transaction ID | `TXN-MV1ZR5Z3-3697E392` | Monospace, never wraps, never abbreviated except in `accessibilityLabel`. |
| Member since | "Member since 14 March 2023" | From `createdAt`. |
| Greeting | "Good morning, Jane" | Device hour: before 12 morning, before 18 afternoon, otherwise evening. First name only. |

Dates use `format-date.ts`. If `Intl` is unavailable on the Android JS engine, fall back to a manual formatter with a month-name table. A unit test covers both.

#### 3.6.2 Safe-area and keyboard

- Every screen uses `ScreenContainer`, which applies safe-area insets and scrolls when content exceeds the screen.
- Forms use `KeyboardAvoidingView` (Android `behavior="height"`) around a `ScrollView` with `keyboardShouldPersistTaps="handled"`. The focused field scrolls into view, and the primary button stays reachable.

#### 3.6.3 Pull-to-refresh and refetch

- Pull-to-refresh on Home, History and Profile. Tint `primary`.
- Queries refetch on app foreground and on reconnect. Never refetch more often than every 30 seconds.

### 3.7 Screen specifications

Every screen lists layout from top to bottom, its data source, all states, copy and accessibility notes. Layouts are described at 360 to 411dp width.

#### 3.7.1 Login (`app/(auth)/login.tsx`) — mockup `01-login.png`

```text
            [ logo mark ]
          ACE Transactions  [SANDBOX]
   Create, simulate and track payments.

   [ Sign in | Register ]          <- SegmentedControl

   ┌──────────────────────────────┐
   │ Email                        │
   │ [✉  jane@example.com      ]  │
   │ Password                     │
   │ [🔒 ••••••••••••••     👁 ]  │
   │ (error notice here)          │
   └──────────────────────────────┘
   [        Sign in  →          ]
   New here? Create an account
   🛡 Your session is kept in your device's secure storage.
```

- Background `background`. Content is vertically centered on tall screens and scrolls on short ones. Maximum content width 440dp.
- Brand block: 72dp white logo tile with a 1px border and `radius.card` (the mockup's shield with a lock badge becomes the real ACE mark), title "ACE Transactions" in `title`, a `SANDBOX` badge in `primaryTint` / `primary` beside it, a one-line tagline in `bodySm` `inkSoft`. The tagline reads: "Create, simulate and track payments."
- Form card: `surface`, 1px `border`, radius `card`, padding 16, fields 16 apart.
- Data: `POST /api/auth/login`. Success stores token and user, then `router.replace` to Home.
- **States and messages**
  - Idle: button enabled once both fields are non-empty.
  - Client validation: invalid email "Enter a valid email address", empty password "Enter your password". Errors appear on blur and on submit.
  - Submitting: button loading "Signing in…", fields read-only.
  - `401`: inline `error` notice above the button, "Email or password is incorrect." The password field is cleared and focused.
  - Network or timeout: notice "Can't reach the server. Check your connection and try again."
  - `429`: notice "Too many attempts. Please wait a few minutes and try again."
  - Other server errors: "Something went wrong on our side. Please try again." plus the `requestId` as a caption.
- Footer: link "Create an account" goes to Register.
- Accessibility: the title is `accessibilityRole="header"`. Return key on Email moves to Password, and on Password submits.

#### 3.7.2 Register (`app/(auth)/register.tsx`)

- Same shell as Login with the **Register** segment selected. Title area copy: "Create your account", tagline "It takes less than a minute."
- Fields: **Full name**, **Email**, **Password**, **Confirm password**.
- Under Password, a live **requirements checklist** with four rows that turn from `inkMuted` to `success` with a check icon as they pass: "8 to 128 characters", "Upper and lower case letters", "A number", "A special character". It mirrors the server rules in the API reference, so the user is never surprised.
- Button: "Create account". Loading: "Creating account…".
- Errors: `409 EMAIL_EXISTS` is shown on the Email field as "An account with this email already exists", with a "Sign in instead" link. `422 details[]` map to fields by name. Confirm mismatch is "Passwords do not match".
- `confirmPassword` is never sent to the API.

#### 3.7.3 Home dashboard (`app/(app)/index.tsx`) — mockup `02-home.png`

```text
 [ACE] ACE Transactions                 (JD)
 Good morning, Jane            ● Updated 2m ago
 Saturday, 10 October

 ┌───────────── navy hero ─────────────────┐
 │ ALL TRANSACTIONS                         │
 │ 342  transactions                        │
 │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░▒▒              │  <- distribution bar
 │ ● Success 318  ● Pending 14  ● Failed 10 │
 │ ───────────────────────────────────────  │
 │ Success rate 93.0%      Last activity 14:28 │
 └──────────────────────────────────────────┘
 ┌ Pending ┐ ┌ Success ┐ ┌ Failed ┐
 │ 🕒  14  │ │ ✓  318  │ │ ✕  10  │          <- StatTile, tappable
 └─────────┘ └─────────┘ └────────┘
 [ ＋  New transaction                    → ]
 Recent transactions                 View all →
 (5 × TransactionListItem)
```

- **Header**: wordmark left, `Avatar` right. No bell.
- **Greeting block** (no card): `title` greeting, `bodySm` date, and `SyncStatusPill` right-aligned on the first line.
- **Hero card** (`navy`, radius `hero`, padding 20, two decorative translucent circles of `navyRaised` clipped in the corner using plain `View`s, no gradient package):
  - Eyebrow "ALL TRANSACTIONS" in `onNavySoft`.
  - `display` count in `onNavy` with "transactions" in `bodySm` `onNavySoft`.
  - **Distribution bar**: 8dp high, fully rounded, flex segments for Success, Pending, Failed using the `...OnDark` colors, with a 2dp `navy` gap between segments. Zero-count segments are omitted. It has an `accessibilityLabel` that states all three counts.
  - Legend row: dot, label and count for each status.
  - Divider in `navyRaised`, then two small facts. **Success rate** equals `success / total` shown to one decimal, computed from the counts for display only (`Math.round(success * 1000 / total) / 10`); money is never involved. **Last activity** is the `createdAt` time of the newest transaction.
- **Status tiles** (`StatTile`): three equal cards with a status-tinted icon chip, label and `display`-sized count. Tapping a tile opens History with that status filter applied. Each tile has the label "14 pending transactions. Opens history."
- **Primary action**: full-width `primary` button "New transaction" with a plus icon and an arrow. This is the only filled blue block on the screen.
- **Recent transactions**: `SectionHeader` with "Recent transactions" and "View all", then the 5 newest `TransactionListItem`s in a single bordered card.
- **Data** (all server state, all TanStack Query):
  - `GET /api/users/me` for the greeting and avatar.
  - Counts: **three** queries, `GET /api/transactions?status=PENDING|SUCCESS|FAILED&limit=1`, reading `pagination.total`. The overall total is the sum of the three. These share query keys with the History filter chips.
  - Recent: `GET /api/transactions?page=1&limit=5`.
  - No transaction data is copied to any global store.
- **States**
  - First load: skeletons for hero, tiles and five rows. The greeting appears as soon as the user query resolves.
  - Counts error: hero and tiles are replaced by one `ErrorState` card with "Try again". The greeting and the New transaction button remain usable.
  - Recent error: the recent card shows an inline `ErrorState` with retry while the hero stays visible.
  - **Empty (total 0)**: the hero is replaced by a `primaryTint` welcome card: "No transactions yet", "Create your first transaction to see it here.", with a primary button "Create transaction". Tiles show 0 and are not tappable. The recent section is hidden.
  - Offline with cached data: show data with the "Offline" pill.

#### 3.7.4 Create transaction (`app/(app)/transactions/create.tsx`) — mockup `04-create.png`

```text
 ✕   New transaction

 [ USD ($) | EUR (€) | GBP (£) ]

        TRANSFER AMOUNT
          $  1,250.00           <- amountXL, borderless, underline
      Maximum 9,999,999,999.99
 [+$50] [+$100] [+$500] [+$1k]      Clear

 Description
 [ Client invoice #402            ]
                           24 / 255

 ⓘ Simulation mode
   New transactions start as Pending. Choose an outcome
   from the transaction details.

 You're creating a Pending transaction of $1,250.00 USD
 [        Create transaction  →      ]
 Safe to retry. Duplicate taps never create two transactions.
```

- **Header**: close (X) on the left, title "New transaction". The mockup's separate back and close buttons are merged into one close action. Closing with unsaved input asks "Discard this transaction?" using `ConfirmDialog`.
- **Currency**: `SegmentedControl` with USD, EUR and GBP. USD is the default. Changing it re-formats the amount symbol only. The allowed list is one constant, so adding a currency is a one-line change.
- **Amount block**: a card with eyebrow "AMOUNT". The symbol on the left, then the value at `amountXL` centered, borderless, with a 2dp `borderStrong` underline that turns `primary` on focus, and a blinking caret from the platform. Beneath it the helper "Maximum 9,999,999,999.99".
  - `AmountInput` uses `keyboardType="decimal-pad"` and sanitizes every keystroke: digits and one decimal point only, at most **2 decimals** and **10 integer digits**. It pads to two decimals on blur (`5` becomes `5.00`). It stores and submits a **decimal string**. No `parseFloat`.
  - **Quick-add chips** +$50, +$100, +$500 and +$1k add to the current value using **integer-cent arithmetic** from the string (never floats). A chip that would exceed the maximum is disabled. "Clear" resets to empty.
  - Placeholder is `0.00` in `inkMuted`.
- **Description**: `AppTextField` multiline (2 to 4 lines) with a character counter `n/255` at the right. Counter turns `failed` past 255. Trimmed before sending.
- **Simulation notice**: `InlineNotice info` titled "Simulation mode" with the body "New transactions start as Pending. Choose their outcome from the transaction details." with a small `PENDING` badge inline.
- **Live summary line**: updates as the form is filled: "You're creating a Pending transaction of $1,250.00 USD". It is shown only when the amount is valid.
- **Submit**: `primary` button "Create transaction" with an arrow. Loading label "Creating…".
- **Footnote**: "Safe to retry. Duplicate taps never create two transactions." This is true because of idempotency, and the mockup's encryption claim is removed.
- **Validation (client)**
  - Empty or zero amount: "Enter an amount greater than 0.00".
  - Amount above the maximum: "Amount can't exceed 9,999,999,999.99".
  - Empty description: "Add a short description".
  - Description over 255: "Keep it under 255 characters".
  - Errors show after the first submit attempt or when a field is left.
- **Server errors**: `422 details[]` map to the amount or description fields. Other errors appear in a top `InlineNotice error`.
- **Idempotency lifecycle** (satisfies Review focus #1)
  - One idempotency key per **submission intent**. It is generated on the first valid submit.
  - While the request is in flight the button is locked and `onPress` is a no-op (a ref guard, not just a disabled style, so a fast double tap cannot slip through).
  - If the outcome is **unknown** (timeout or no response), show a notice "We couldn't confirm this transaction." with **Retry** (reuses the same key and payload) and **Start over** (discards the intent, new key). While an unconfirmed attempt exists, the fields are read-only, so the payload cannot drift and cause `409 IDEMPOTENCY_CONFLICT`.
  - If the server returned a definite validation error, editing the fields starts a new intent and generates a new key on the next submit.
  - On `201` or an idempotent `200`: invalidate list, count and detail queries, show a success `Toast` "Transaction created. It's Pending until you simulate an outcome.", and `router.replace` to the new transaction's detail screen. Back from there does not return to a filled form.

#### 3.7.5 Transaction history (`app/(app)/transactions/index.tsx`) — mockup `03-history.png`

```text
 History                                  (JD)
 ● Updated just now

 [ All 342 ][ Pending 14 ][ Success 318 ][ Failed 10 ]

 FRI, 9 OCT 2026  · Today
 ┌─────────────────────────────────────────┐
 │ TransactionListItem                      │
 │ TransactionListItem                      │
 └─────────────────────────────────────────┘
 THU, 8 OCT 2026
 ┌─────────────────────────────────────────┐
 │ ...                                      │
 └─────────────────────────────────────────┘
          ◌ Loading more…
```

- **Header** "History". Below it the `SyncStatusPill` and `FilterChips`. The chips stay pinned while the list scrolls. The search bar from the mockup is deferred (3.12).
- **Chip counts** come from the same three count queries as Home (`?status=X&limit=1`), so they are real and cached. "All" shows the sum.
- **List**: `SectionList` grouped by local calendar date, newest first, using sticky date headers. Header style: `eyebrow` text in `inkSoft` on `background`, plus a "Today" or "Yesterday" tag in `primaryTint`. Each section's rows share one bordered card with dividers.
- **Pagination**: `useInfiniteQuery` against `?page=N&limit=20[&status=X]`. `onEndReached` with a threshold fetches the next page until `page >= totalPages`.
  - Footer while fetching: spinner and "Loading more…".
  - Footer on a next-page error: "Couldn't load more." with a **Try again** link. Already loaded rows stay.
  - End of list: a quiet caption "You've reached the beginning."
- **Filter behavior**: the selected status is part of the query key. It can be set by a route param (`?status=PENDING`) from the Home tiles. Changing the filter scrolls to the top.
- **States**
  - Loading: five skeleton rows under two skeleton date headers.
  - **Empty, no transactions at all**: `EmptyState` "No transactions yet" / "Create a transaction and it will appear here." with a primary button "Create transaction".
  - **Empty for a filter**: "No pending transactions" / "Nothing matches this filter." with a ghost button "Show all".
  - Error on first load: `ErrorState` with retry.
  - Pull-to-refresh refetches page 1 and resets the rest.
- Selecting a row navigates to `/transactions/[id]` using the public `transactionId`.

#### 3.7.6 Transaction details (`app/(app)/transactions/[id].tsx`) — mockup `05-details.png`

```text
 ←  Transaction

 ┌──────────────────────────────────────────┐
 │ TXN-MV1ZR5Z3-3697E392       [● PENDING]  │
 │ ──────────────────────────────────────── │
 │            $125.50  USD                   │
 │      Client invoice #402 - B2B Settlement │
 │                                          │
 │  ●━━━━━━━○─────────○                      │
 │ Created   Processing   Success / Failed   │
 └──────────────────────────────────────────┘
 ┌ Details ─────────────────────────────────┐
 │ Transaction ID   TXN-MV1Z…  [share]      │
 │ Description      Client invoice #402 …   │
 │ Created          10 Oct 2026, 14:20      │
 │ Processed        Awaiting outcome        │
 └──────────────────────────────────────────┘
 ┌ Simulate outcome ────────────────────────┐
 │ Choose how this sandbox transaction ends.│
 │ [ ✓ Simulate success ]                   │
 │ [ ⚠ Simulate failure ]                   │
 └──────────────────────────────────────────┘
```

- **Header**: back arrow and the fixed title "Transaction". The title never truncates.
- **Status hero card** (`surface`, 1px `border`, radius `card`, padding 20): a top row with the transaction ID in `mono` on the left and a large `StatusBadge` on the right. A divider. Then `MoneyText size="xl"` centered, and the description centered in `body`, up to 3 lines. A faint circle in the status tint sits behind the badge, as in the mockup, but it must never reduce the badge's contrast.
- **`StatusStepper`** (replaces the progress bar): three nodes joined by a line.
  - Nodes: "Created", "Processing", then "Success" or "Failed" (or "Outcome" while pending).
  - Pending: node 1 filled `primary`, node 2 is the active `pending` node, node 3 is hollow `borderStrong`.
  - Success: all three filled, the last in `success` with a check.
  - Failed: nodes 1 and 2 filled, the last in `failed` with an x.
  - Under each node a `caption` with its time when known (`createdAt`, `processedAt`).
  - A text description is always present for screen readers: "Step 2 of 3: Processing. Waiting for an outcome."
- **Details card**: title "Details" in `headline`. Rows (`DetailRow`): **Transaction ID** (mono, with a Share action, see below), **Description** (wraps), **Created** (local time, UTC in caption), **Processed** (local time, or "Awaiting outcome" in italic `inkMuted` while pending), and **Failure reason** (only when `failed`, with `failedBg` styling, text from `failureReason`). Beneficiary and fee rows are removed.
  - The mockup's "Audit log" chip is dropped.
  - **Copy action:** the React Native core `Share` API opens the system sheet with the ID, and needs no package. If `expo-clipboard` is approved (3.11), switch to a true copy with a brief toast "ID copied". Label it "Share transaction ID" until then.
- **Simulation card** (shown **only when `status === 'PENDING'`**): title "Simulate outcome" with a sandbox icon, one sentence "Choose how this sandbox transaction ends. This can't be undone.", then two full-width stacked buttons: `success` variant "Simulate success" and `danger` variant "Simulate failure". The mockup's Reset link is gone.
  - Either button opens `ConfirmDialog`. Success: title "Mark as Success?", body "TXN-… will be marked Success. This is final." Failure: title "Mark as Failed?", with the `danger` confirm button.
  - While the mutation runs both buttons and the dialog are disabled.
  - On success of the request: close the dialog, update the detail cache with the response, invalidate history, count and recent queries, show a `Toast` "Marked as Success" or "Marked as Failed", and animate the badge and stepper to the new state.
  - On `409 CONFLICT`: close the dialog, refetch, and show `Toast` "This transaction was already finalized."
- **Final-state card** (shown when status is `SUCCESS` or `FAILED`, in place of the simulation card): `InlineNotice` "Outcome recorded on 10 Oct 2026, 14:21. Final transactions can't be changed."
- **States**: loading skeleton for the hero, details and simulate cards. Retryable error with `ErrorState`. **Not found** (`404`): `EmptyState` "Transaction not found" / "It may have been removed, or it isn't yours to view." with a button "Back to history".

#### 3.7.7 Profile (`app/(app)/profile.tsx`) — mockup `06-profile.png`

```text
 Profile
 ┌──────────────────────────────────────────┐
 │ (JD)  Jane Doe                           │
 │ 64dp  jane.doe@acetransactions.com       │
 │       Member since 14 March 2023         │
 └──────────────────────────────────────────┘
 SESSION
 ┌──────────────────────────────────────────┐
 │ 🛡 Signed in on this device              │
 │    Your session is kept in secure storage │
 └──────────────────────────────────────────┘
 ABOUT
 ┌──────────────────────────────────────────┐
 │ App version            1.0.0             │
 │ Server                 ace-…run.app      │
 │ Mode                   Sandbox           │
 └──────────────────────────────────────────┘
 [ ↪ Log out ]   (danger)
 ACE Transactions v1.0.0
```

- **Identity card**: `Avatar` 64, name in `title`, email in `body` `inkSoft` (wraps, never truncated), "Member since" in `caption`. No role, tier, verification badge or photo.
- **Session card**: states truthfully that the session is held in the device secure store. This replaces the mockup's invented audit logs, IP and device data.
- **About card**: App version (from the Expo config), **Server** (host of `EXPO_PUBLIC_API_URL`, no path, no secrets), and **Mode** "Sandbox".
- **Log out**: `danger` button. It opens `ConfirmDialog` "Log out?" / "You'll need to sign in again." On confirm: delete the token, clear the query cache, `router.replace` to Login.
- Data: `GET /api/users/me`. States: skeleton, retryable `ErrorState`, and a `401` which triggers the global safe sign-out with the message "Your session expired. Please sign in again." on Login.
- The mockup's biometric, API-simulation, session-timeout and notification rows are not built.

### 3.8 Copy deck

Voice: plain, calm, precise. No jargon, no exclamation marks, no mock-bank theater.

| Context | Copy |
|---|---|
| App name | ACE Transactions |
| Login tagline | Create, simulate and track payments. |
| Primary actions | Sign in, Create account, New transaction, Create transaction, Simulate success, Simulate failure, Log out |
| Network error | Can't reach the server. Check your connection and try again. |
| Timeout | The request took too long. Please try again. |
| Server error | Something went wrong on our side. Please try again. |
| Session expired | Your session expired. Please sign in again. |
| Empty history | No transactions yet. Create a transaction and it will appear here. |
| Pending explainer | Pending means the transaction is waiting for an outcome. |
| Final explainer | Final transactions can't be changed. |
| Retry | Try again |

### 3.9 Motion

All motion uses the core `Animated` API with the native driver where possible. No animation library.

| Moment | Motion |
|---|---|
| Button press | Scale 1 to 0.98, `fast` |
| Screen content on first load | Fade in and 8dp rise, `base` |
| List rows | Stagger 30ms per row, capped at 8 rows, first render only |
| Skeletons | Opacity pulse 0.5 to 1, 900ms loop |
| Toast | Slide down and fade, `base`. Out over `fast`. |
| Status change (Pending to final) | Badge cross-fade, stepper last node fills over `slow` |
| Distribution bar | Segments grow from 0 over `slow` on first load only |
| Modal | Fade over `base` |

Reduced motion (`AccessibilityInfo.isReduceMotionEnabled`) turns every transform and pulse into an instant state change or a plain fade.

### 3.10 Accessibility contract

- Touch targets at least 48dp. Spacing between adjacent targets at least 8dp.
- Every pressable has `accessibilityRole`, a label that reads naturally, and the right `accessibilityState` (`disabled`, `busy`, `selected`).
- Contrast: text 4.5:1, large text and meaningful UI shapes 3:1.
- Status is always icon plus word plus color.
- Reading order follows visual order. Hero amounts and the stepper expose one concise combined label rather than many fragments.
- Errors announce themselves. Toasts announce themselves.
- Layouts tolerate font scale 1.3 and display size changes.
- Focus is not trapped except inside `ConfirmDialog`.

### 3.11 Dependency and asset register

The global rule is that **no dependency is added without approval**. This register keeps the polished design buildable with **zero new packages**, and lists optional upgrades for the human to approve.

| Need | Zero-dependency default | Optional upgrade (needs human approval) |
|---|---|---|
| Icons | `@expo/vector-icons` Ionicons (already a dependency of `expo`) | None needed |
| Serif and sans fonts | System `serif` and Roboto via `typography.ts` | `expo-font` with `@expo-google-fonts/source-serif-4` and `@expo-google-fonts/inter`. Only `typography.ts` changes. |
| Copy transaction ID | Core `Share` | `expo-clipboard` |
| Hero depth | Layered translucent `View` circles | `expo-linear-gradient` |
| Animations | Core `Animated` | None planned. |
| Haptics | None | `expo-haptics` |
| Safe area | `react-native-safe-area-context` (a dependency of Expo Router) | None needed |
| Logo | Text mark ("A" in a `primary` square) | Human supplies the ACE logo as `assets/brand/ace-mark.png` |

The coordinator records the human's decision in this table before Task 2 starts.

### 3.12 Deferred ideas (not v1, do not build)

- **Backend summary endpoint** `GET /api/transactions/summary` returning count and per-currency volume per status. It would let Home show real volume tiles and cut the three count requests to one. It needs a backend amendment, so the frozen contract must be reopened by the coordinator.
- Text search by transaction ID or description (needs an API `q` parameter).
- Biometric unlock (`expo-local-authentication`).
- Dark mode (the token structure already allows a second palette).
- CSV export.
- Notifications.
- Default currency preference (needs persistent storage approval).

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
│   │   ├── feedback/          # LoadingState, ErrorState, EmptyState, Skeleton, InlineNotice, Toast, SyncStatusPill
│   │   ├── forms/             # AppTextField, PasswordField, AppButton, SegmentedControl, AmountInput
│   │   ├── layout/            # ScreenContainer, AppHeader, AppTabBar, SectionHeader, AppIcon, Avatar
│   │   └── transactions/      # StatusBadge, MoneyText, TransactionListItem, StatusStepper, DetailRow, StatTile, FilterChips, ConfirmDialog
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
│   │   ├── colors.ts          # 3.3.1
│   │   ├── spacing.ts         # space, radius, hit, elevation, motion (3.3.3)
│   │   ├── typography.ts      # 3.3.2, the only file that names font families
│   │   ├── status.ts          # PENDING/SUCCESS/FAILED -> label, colors, icon
│   │   └── index.ts           # exports `theme`
│   ├── types/
│   │   └── api.ts
│   └── utils/
│       ├── api-error.ts
│       ├── format-date.ts     # local/UTC/relative/section-header formats (3.6.1)
│       ├── format-money.ts    # string-only grouping and symbols (3.5.5)
│       ├── money-input.ts     # amount sanitizing and integer-cent quick-add
│       └── greeting.ts
├── assets/brand/              # ace-mark.png when supplied (3.11)
├── tests/
├── app.config.ts
├── eas.json
├── package.json
└── tsconfig.json
```

The mockups the UI is built from are stored in `docs/design/mockups/`. Feature hooks may live under the relevant feature folder. Screen files should compose hooks and components rather than contain networking details.

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

- [x] **Step 1: Define a startup smoke check**
  - App launches without red screen on Android.
  - Root route renders a temporary neutral startup state.

- [x] **Step 2: Scaffold Expo Router and TypeScript configuration**

- [x] **Step 3: Run typecheck**
  - Run: `npm run typecheck --workspace @ace/mobile`
  - Expected: exit `0`.

- [x] **Step 4: Launch Android**
  - Run: `npm run android --workspace @ace/mobile`
  - Expected: app opens on emulator/device.

- [x] **Step 5: Commit**
  - Commit message: `feat(mobile): scaffold Expo application`

### Task 2: Establish theme tokens, icons, feedback, and layout primitives

**Spec:** Sections 3.3 (tokens), 3.4 (icons), 3.5.7 to 3.5.8 and 3.5.10 (layout and feedback components).

**Files:**

- Create: `apps/mobile/src/theme/colors.ts`, `spacing.ts`, `typography.ts`, `status.ts`, `index.ts`
- Create: `apps/mobile/src/components/layout/ScreenContainer.tsx`
- Create: `apps/mobile/src/components/layout/AppHeader.tsx`
- Create: `apps/mobile/src/components/layout/AppIcon.tsx`
- Create: `apps/mobile/src/components/layout/Avatar.tsx`
- Create: `apps/mobile/src/components/layout/SectionHeader.tsx`
- Create: `apps/mobile/src/components/feedback/RemoteStates.tsx` (`LoadingState`, `ErrorState`, `EmptyState`)
- Create: `apps/mobile/src/components/feedback/Skeleton.tsx`
- Create: `apps/mobile/src/components/feedback/InlineNotice.tsx`
- Create: `apps/mobile/src/components/feedback/Toast.tsx`
- Create: `apps/mobile/src/components/feedback/SyncStatusPill.tsx`
- Create: `apps/mobile/src/hooks/useReducedMotion.ts`

**Interfaces:**

- Consumes: React Native primitives, `@expo/vector-icons`, and the dependency decisions recorded in 3.11.
- Produces: the `theme` object with every token in 3.3, the `status` lookup keyed by the API enum, `ScreenContainer`, `AppHeader`, `AppIcon`, `Avatar`, `SectionHeader`, `LoadingState`, `ErrorState`, `EmptyState`, `Skeleton`, `InlineNotice`, `Toast` with a `useToast()` hook, and `SyncStatusPill`.

- [x] **Step 1: Write component expectations**
  - Error state exposes message, optional reference ID, and a retry action.
  - Empty state exposes icon, title, explanation, and an optional primary action.
  - Loading state and skeleton have accessibility labels. Skeleton is static when reduced motion is on.
  - `Avatar` derives initials from names with one, two, and three words, and tolerates extra spaces.
  - `SyncStatusPill` shows "Updated just now", a minute count, "Refreshing…", and "Offline: showing saved data" for the matching query states.
  - `Toast` auto-dismisses after 4 seconds and announces its text.

- [x] **Step 2: Add tokens and components without feature-specific copy**
  - Transcribe the color, type, spacing, radius, elevation, and motion tables from Section 3.3 exactly.
  - `typography.ts` is the only file naming font families. Use the zero-dependency defaults unless the human approved fonts.
  - `status.ts` maps `PENDING`, `SUCCESS`, and `FAILED` to label, foreground, background, border, and icon.

- [x] **Step 3: Verify component rendering and accessibility queries**
  - Run: focused mobile component tests.
  - Expected: all states render with accessible text and actions.
  - Add a token test asserting the contrast of each text and background pair listed in 3.3.1 is at least 4.5:1.

- [x] **Step 4: Visual check on Android**
  - Render each primitive in a throwaway dev route (not committed) at 360dp and 411dp and at font scale 1.3.

- [x] **Step 5: Commit**
  - Commit message: `feat(mobile): add design tokens and accessible UI foundations`

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

- [x] **Step 1: Write failing client tests**
  - Uses configured base URL.
  - Adds Bearer token when present.
  - Omits authorization header when logged out.
  - Translates structured API error and network failure into safe messages.

- [x] **Step 2: Confirm failure**

- [x] **Step 3: Implement exact DTOs and centralized client**
  - Do not use `any` for API responses.
  - Add a sensible request timeout.

- [x] **Step 4: Verify**
  - Run: focused API client tests and mobile typecheck.

- [x] **Step 5: Commit**
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

- [x] **Step 1: Write failing auth-provider tests**
  - Initial state is restoring, not unauthenticated.
  - Valid stored token/profile becomes authenticated.
  - Missing/invalid token becomes unauthenticated.
  - Logout deletes token and clears query cache.

- [x] **Step 2: Confirm failure**

- [x] **Step 3: Implement SecureStore adapter and provider**
  - Keep storage calls behind `token-storage.ts` for testability.

- [x] **Step 4: Implement root route decision without protected-screen flash**

- [x] **Step 5: Verify**
  - Run: auth-provider tests, typecheck, and manual cold-start checks.

- [x] **Step 6: Commit**
  - Commit message: `feat(mobile): restore secure authenticated sessions`

### Task 5: Implement shared form controls

**Spec:** Sections 3.5.1 to 3.5.3, 3.5.4 to 3.5.5, and 3.5.11 to 3.5.12.

**Files:**

- Create: `apps/mobile/src/components/forms/AppTextField.tsx`
- Create: `apps/mobile/src/components/forms/PasswordField.tsx`
- Create: `apps/mobile/src/components/forms/AppButton.tsx`
- Create: `apps/mobile/src/components/forms/SegmentedControl.tsx`
- Create: `apps/mobile/src/components/transactions/StatusBadge.tsx`
- Create: `apps/mobile/src/components/transactions/MoneyText.tsx`
- Create: `apps/mobile/src/components/transactions/ConfirmDialog.tsx`
- Create: `apps/mobile/src/utils/format-money.ts`
- Create: `apps/mobile/tests/form-components.test.tsx`
- Create: `apps/mobile/tests/format-money.test.ts`

**Interfaces:**

- Consumes: theme tokens and `AppIcon`.
- Produces: accessible controlled fields, a button with default, pressed, disabled, and loading states and all five variants, a segmented control with tab semantics, `StatusBadge`, `MoneyText`, and `ConfirmDialog`.

- [x] **Step 1: Write failing component tests**
  - Field connects label, value, error, and accessibility metadata, and shows the error with a warning icon.
  - Password visibility toggle is labelled "Show password" and "Hide password".
  - Loading button ignores presses, even if pressed twice in the same tick.
  - `SegmentedControl` exposes `tab` roles and the selected state.
  - `StatusBadge` shows the right label, color tokens, icon, and accessibility label for each API enum.
  - `ConfirmDialog` calls cancel on Android back, disables both buttons while loading, and does not close on scrim tap while loading.
  - `format-money` tests: `"1234.5"` is rejected or normalised as documented, `"1234567.89"` becomes `1,234,567.89`, `"0.05"` is unchanged, a 12-digit integer is grouped correctly, and no case uses `Number` or `parseFloat`.

- [x] **Step 2: Implement minimal reusable components to the Section 3.5 specs**

- [x] **Step 3: Verify tests and keyboard behavior on Android**

- [x] **Step 4: Commit**
  - Commit message: `feat(mobile): add reusable form controls and status primitives`

### Task 6: Implement login

**Spec:** Section 3.7.1 (Login) and the mockup `docs/design/mockups/01-login.png`.

**Files:**

- Create: `apps/mobile/src/api/auth.api.ts`
- Create: `apps/mobile/src/features/auth/login.schema.ts`
- Create: `apps/mobile/src/features/auth/useLogin.ts`
- Create: `apps/mobile/src/features/auth/AuthShell.tsx` (shared brand block, segmented control, and footer used by Login and Register)
- Create: `apps/mobile/app/(auth)/login.tsx`
- Create: `apps/mobile/tests/login.test.tsx`

**Interfaces:**

- Consumes: `apiClient`, `AuthProvider.signIn`, form controls, `/api/auth/login`.
- Produces: validated login screen and authenticated navigation.

- [x] **Step 1: Write failing schema and screen tests**
  - Invalid email and blank password are blocked locally, with the copy from 3.7.1.
  - Submit shows loading and disables repeat presses.
  - `401` shows "Email or password is incorrect.", clears and focuses the password field.
  - Network failure, timeout, and `429` each show their distinct message.
  - Successful response stores token and user, then enters app routes.

- [x] **Step 2: Confirm failure**

- [x] **Step 3: Implement API call, mutation, and form to the 3.7.1 layout**
  - Brand block, SANDBOX badge, segmented control, form card, primary button, create-account link, and the truthful secure-storage footnote.
  - Do not add "Remember this device", "Forgot key?", or any compliance claim.

- [x] **Step 4: Verify against deployed API with a test user**
  - Check success, wrong password, offline state, and keyboard handling.
  - Compare with `01-login.png` for layout. Record intended deviations.

- [x] **Step 5: Commit**
  - Commit message: `feat(mobile): implement login experience`

### Task 7: Implement registration

**Spec:** Section 3.7.2 (Register).

**Files:**

- Create: `apps/mobile/src/features/auth/register.schema.ts`
- Create: `apps/mobile/src/features/auth/useRegister.ts`
- Create: `apps/mobile/src/features/auth/PasswordRequirements.tsx`
- Create: `apps/mobile/app/(auth)/register.tsx`
- Modify: `apps/mobile/src/api/auth.api.ts`
- Create: `apps/mobile/tests/register.test.tsx`

**Interfaces:**

- Consumes: registration endpoint, `AuthShell`, and the auth provider.
- Produces: name, email, password, and confirm-password registration flow with a live password checklist.

- [x] **Step 1: Write failing validation and interaction tests**
  - Password confirmation must match ("Passwords do not match").
  - The checklist reflects the server rules: 8 to 128 characters, upper and lower case, a number, and a special character. Each row changes state as the password changes.
  - Invalid input stays local.
  - `409 EMAIL_EXISTS` is shown on the email field with a "Sign in instead" link. `422 details[]` map to fields.
  - Success authenticates and navigates.

- [x] **Step 2: Confirm failure**

- [x] **Step 3: Implement API mutation and screen**
  - Do not send `confirmPassword` to the API.

- [x] **Step 4: Verify against deployed API**

- [x] **Step 5: Commit**
  - Commit message: `feat(mobile): implement user registration`

### Task 8: Implement profile and logout

**Spec:** Section 3.7.7 (Profile) and the mockup `docs/design/mockups/06-profile.png`.

**Files:**

- Create: `apps/mobile/src/api/users.api.ts`
- Create: `apps/mobile/src/features/profile/useProfile.ts`
- Create: `apps/mobile/app/(app)/profile.tsx`
- Modify: `apps/mobile/src/providers/AuthProvider.tsx`
- Create: `apps/mobile/tests/profile.test.tsx`

**Interfaces:**

- Consumes: `/api/users/me`, shared remote states, `Avatar`, `ConfirmDialog`, auth provider.
- Produces: authenticated profile display (identity, session, about) and complete logout behavior.

- [x] **Step 1: Write failing tests**
  - Loading skeleton, profile, and retryable error states render.
  - Identity card shows initials avatar, name, email, and "Member since" formatted from `createdAt`.
  - The About card shows the app version and the API host only (no path or secret).
  - Logout asks for confirmation, then clears token, profile, and transaction cache.
  - `401` triggers safe session removal with the expired-session message on Login.

- [x] **Step 2: Implement profile query and screen**
  - Do not build the mockup's biometric, API-simulation, session-timeout, notification, tier, or audit-log rows (see 3.2).

- [x] **Step 3: Verify logout and cold restart on Android**

- [x] **Step 4: Commit**
  - Commit message: `feat(mobile): add profile and secure logout`

### Task 9: Implement transaction data layer and display primitives

**Spec:** Sections 3.5.9 (list item), 3.5.12 (`FilterChips`, `StatTile`), 3.6.1 (formatting).

**Files:**

- Create: `apps/mobile/src/api/transactions.api.ts`
- Create: `apps/mobile/src/features/transactions/query-keys.ts`
- Create: `apps/mobile/src/features/transactions/transaction-hooks.ts` (list, infinite list, detail, status counts, create, simulate)
- Create: `apps/mobile/src/components/transactions/TransactionListItem.tsx`
- Create: `apps/mobile/src/components/transactions/StatTile.tsx`
- Create: `apps/mobile/src/components/transactions/FilterChips.tsx`
- Create: `apps/mobile/src/utils/format-date.ts`
- Create: `apps/mobile/tests/format-date.test.ts`

**Interfaces:**

- Consumes: all transaction endpoints and DTOs.
- Produces: typed query and mutation functions, centralized query keys, `useStatusCounts()` (three `limit=1` queries reading `pagination.total`, shared by Home and History), list item, tile, chips, and date formatters.

- [x] **Step 1: Write failing API, hook, and formatter tests**
  - Correct endpoint and query parameters are used, including `status`, `page`, and `limit`.
  - Amount stays a string.
  - Status label and semantics match the API enum.
  - `useStatusCounts` returns three counts and their sum.
  - Date formatters: local time, UTC caption, relative time ("Just now", "5 min ago", "Today, 14:20", "Yesterday, 18:45"), section headers ("Today", "Yesterday", "Fri, 9 Oct 2026"), around midnight and across a DST change.
  - `TransactionListItem` renders a long description on two lines with an ellipsis, a full transaction ID on one line, and the right-hand amount and badge without overlapping at font scale 1.3.

- [x] **Step 2: Implement API functions and query-key factory**

- [x] **Step 3: Implement list item, tile and chips to the 3.5 specs with accessibility labels**

- [x] **Step 4: Verify focused tests and typecheck**

- [x] **Step 5: Commit**
  - Commit message: `feat(mobile): add transaction data foundation`

### Task 10: Implement the home dashboard

**Spec:** Section 3.7.3 (Home) and the mockup `docs/design/mockups/02-home.png`.

**Files:**

- Create: `apps/mobile/app/(app)/index.tsx`
- Create: `apps/mobile/src/features/transactions/TransactionSummary.tsx` (hero card, distribution bar, tiles)
- Create: `apps/mobile/src/features/transactions/RecentTransactions.tsx`
- Create: `apps/mobile/src/utils/greeting.ts`
- Create: `apps/mobile/tests/dashboard.test.tsx`

**Interfaces:**

- Consumes: user profile, `useStatusCounts`, recent transactions query, list item, tiles, shared states.
- Produces: greeting, hero summary with distribution bar, three tappable status tiles, a "New transaction" action, and the five most recent transactions.

- [x] **Step 1: Write failing dashboard-state tests**
  - Loading skeletons, counts error with retry, recent error with retry, zero-transaction welcome card, and populated states.
  - Counts, success rate, and bar proportions derive from returned data only.
  - Tiles navigate to History with the matching status param.
  - Greeting changes with the hour and uses the first name only.

- [x] **Step 2: Implement dashboard composition**
  - Navy hero with decorative circles built from plain views. No gradient package unless approved.
  - Do not build volume, trend, sparkline, "Batch Upload CSV", or "Audit Export" (see 3.2).
  - Do not store separately calculated server state globally.

- [x] **Step 3: Verify with zero, pending, success, and failed records**
  - Check that nothing wraps or clips at 360dp and at font scale 1.3.

- [x] **Step 4: Commit**
  - Commit message: `feat(mobile): build transaction dashboard`

### Task 11: Implement create transaction with safe retries

**Spec:** Section 3.7.4 (Create) and the mockup `docs/design/mockups/04-create.png`.

**Files:**

- Create: `apps/mobile/src/features/transactions/create-transaction.schema.ts`
- Create: `apps/mobile/src/features/transactions/useCreateTransaction.ts`
- Create: `apps/mobile/src/components/forms/AmountInput.tsx`
- Create: `apps/mobile/src/utils/money-input.ts`
- Create: `apps/mobile/app/(app)/transactions/create.tsx`
- Create: `apps/mobile/src/utils/idempotency-key.ts`
- Create: `apps/mobile/tests/create-transaction.test.tsx`
- Create: `apps/mobile/tests/money-input.test.ts`

**Interfaces:**

- Consumes: create transaction API, query keys, navigation, `SegmentedControl`, `ConfirmDialog`.
- Produces: validated create flow with one idempotency key per submission intent.

- [x] **Step 1: Write failing form and utility tests**
  - `money-input`: sanitizing keeps digits and one point, limits to 2 decimals and 10 integer digits, pads on blur, and quick-add chips use integer cents (`0.10` + `0.20` style cases and large values stay exact). Chips that would exceed `9999999999.99` are disabled.
  - Zero, negative, and over-precision amounts are blocked with the 3.7.4 messages.
  - Currency becomes uppercase and the description is trimmed. The counter shows `n/255`.
  - Double tap triggers one mutation (ref guard).
  - Network retry reuses the same key and payload.
  - After an unknown outcome the fields are read-only, and "Start over" creates a new key.
  - After a definite `422`, editing a field creates a new key on the next submit.
  - Closing with unsaved input asks for confirmation.

- [x] **Step 2: Confirm failure**

- [x] **Step 3: Implement schema, `AmountInput`, key lifecycle, mutation, and screen**
  - Layout, copy, live summary line, simulation notice, and footnote exactly as 3.7.4.
  - Do not build beneficiary, classification, balance, or the double-submit demo toggle (see 3.2).
  - Submit amount as a decimal string.
  - On success invalidate list, count, and detail queries, show the success toast, and `router.replace` to the detail screen.

- [x] **Step 4: Verify against production**
  - Exercise double tap and forced retry. Confirm only one server record.

- [x] **Step 5: Commit**
  - Commit message: `feat(mobile): create idempotent transactions`

### Task 12: Implement transaction history

**Spec:** Section 3.7.5 (History) and the mockup `docs/design/mockups/03-history.png`.

**Files:**

- Create: `apps/mobile/app/(app)/transactions/index.tsx`
- Create: `apps/mobile/src/features/transactions/TransactionHistoryList.tsx`
- Create: `apps/mobile/tests/transaction-history.test.tsx`

**Interfaces:**

- Consumes: paginated transaction query, `useStatusCounts`, `FilterChips`, `SyncStatusPill`, shared states, list item.
- Produces: newest-first history grouped by date, with status filtering, refresh, and load-more behavior.

- [x] **Step 1: Write failing state tests**
  - Loading skeleton, empty-with-create-action, empty-for-filter with "Show all", error with retry, and populated states.
  - Rows are grouped under sticky date headers in local time, with Today and Yesterday tags.
  - Selecting a chip passes `status` to the API, includes it in the query key, and scrolls to the top. The `status` route param preselects it.
  - Pull-to-refresh and end-reached call the expected query behavior, and stop at `totalPages`.
  - A next-page error keeps loaded rows and shows an inline retry. The end of the list shows the "reached the beginning" caption.
  - Selecting a row navigates using the public transaction ID.

- [x] **Step 2: Implement list and screen**
  - Do not build the search bar or the "Net Inflow / Net Outflow" header text (see 3.2).

- [x] **Step 3: Verify on Android with enough records for pagination (more than 40) and for each filter**

- [x] **Step 4: Commit**
  - Commit message: `feat(mobile): add transaction history`

### Task 13: Implement transaction details and mock simulation

**Spec:** Section 3.7.6 (Details) and the mockup `docs/design/mockups/05-details.png`.

**Files:**

- Create: `apps/mobile/app/(app)/transactions/[id].tsx`
- Create: `apps/mobile/src/features/transactions/TransactionDetails.tsx`
- Create: `apps/mobile/src/components/transactions/StatusStepper.tsx`
- Create: `apps/mobile/src/components/transactions/DetailRow.tsx`
- Modify: `apps/mobile/src/features/transactions/transaction-hooks.ts`
- Create: `apps/mobile/tests/transaction-details.test.tsx`

**Interfaces:**

- Consumes: detail query, simulation mutation, query-key factory, `ConfirmDialog`, `Toast`.
- Produces: detail presentation with a status stepper and confirmed pending-to-terminal actions.

- [x] **Step 1: Write failing detail-state tests**
  - Loading, retryable error, missing transaction, pending, success, and failed states.
  - Stepper shows the right node states and text for each status, with times only when known.
  - The failed state shows the failure reason. A pending state shows "Awaiting outcome" for Processed.
  - Only the pending state presents the simulation card. Terminal states show the final-state notice instead.
  - Confirmation is required before sending the outcome, with success and danger variants.
  - Mutation loading disables both simulation buttons and the dialog.
  - Completion updates the detail cache and refreshes history, counts, and recent data.
  - `409 CONFLICT` closes the dialog, refetches, and shows the "already finalized" toast.

- [x] **Step 2: Implement details and accessible confirmation**
  - Do not build beneficiary, fee, "Audit log", or "Reset" (see 3.2).
  - Use the core `Share` API for the ID unless `expo-clipboard` was approved.

- [x] **Step 3: Verify both success and failure flows against production**

- [x] **Step 4: Commit**
  - Commit message: `feat(mobile): add transaction details and simulation`

### Task 14: Complete navigation, resilience, accessibility, and visual-polish pass

**Spec:** Sections 3.5.8 (tab bar), 3.9 (motion), 3.10 (accessibility), and the 3.2 reconciliation table.

**Files:**

- Modify: `apps/mobile/app/(auth)/_layout.tsx`
- Modify: `apps/mobile/app/(app)/_layout.tsx`
- Create: `apps/mobile/src/components/layout/AppTabBar.tsx`
- Modify only approved shared UI/theme files.
- Create: `docs/mobile-qa-checklist.md`

**Interfaces:**

- Consumes: all screens.
- Produces: consistent navigation, session handling, accessibility, motion, and Android behavior.

- [x] **Step 1: Test route protection and Android back behavior**
  - Back from Details returns to where the user came from. Back from Create asks to discard unsaved input.
  - The tab bar hides on Details and while the keyboard is open.

- [x] **Step 2: Test offline, timeout, server validation, and expired-session behavior**
  - The "Offline: showing saved data" pill appears with cached data.

- [x] **Step 3: Check keyboard avoidance, scroll behavior, labels, touch targets, contrast, and screen-reader order**
  - Run TalkBack through every screen.
  - Test at font scale 1.3 and at 360dp and 411dp widths.

- [x] **Step 4: Visual fidelity review against the mockups and Section 3.7**
  - For each screen, put a screenshot next to its mockup and record every deviation as either "intended (3.2)" or "defect".
  - Confirm no raw hex or size values in screen files (a lint rule or grep check).
  - Confirm no removed element from 3.2 has crept back.
  - Confirm reduced motion works.

- [x] **Step 5: Fix only verified cross-screen problems with regression checks**

- [x] **Step 6: Run full mobile checks**
  - `npm run lint --workspace @ace/mobile`
  - `npm run typecheck --workspace @ace/mobile`
  - `npm test --workspace @ace/mobile`

- [x] **Step 7: Commit**
  - Commit message: `fix(mobile): harden navigation, accessibility and polish`

### Task 15: Build and verify the Android APK

**Files:**

- Create: `apps/mobile/eas.json`
- Modify: `apps/mobile/app.config.ts`
- Create: `docs/android-release-checklist.md`

**Interfaces:**

- Consumes: completed mobile app and production API URL.
- Produces: installable Android APK and release evidence.

- [x] **Step 1: Configure an EAS preview profile that produces an APK**

- [x] **Step 2: Verify production API URL is present and contains no secret**

- [x] **Step 3: Build**
  - Run: `npx eas-cli build --platform android --profile preview`
  - Expected: successful installable APK artifact.

- [x] **Step 4: Install on a clean device/emulator**

- [x] **Step 5: Run the complete product workflow**
  - Register.
  - Logout/login.
  - Create transaction.
  - Verify history/details.
  - Simulate success and failure.
  - View profile.
  - Restart app and verify session restoration.
  - Stop local backend and confirm app still works.
  - Check the installed build against the mockups and Section 3.7 for fonts, icons, the app icon, and splash screen. The app name is "ACE Transactions".

- [x] **Step 6: Record build link/version and results**

- [x] **Step 7: Commit**
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
- [ ] Every screen matches its Section 3.7 layout, tokens, copy, and states, and every deviation from the mockups is listed in 3.2.
- [ ] No removed element from 3.2 (balances, direction signs, volumes, beneficiaries, fees, fake toggles, compliance claims) appears anywhere in the app.
- [ ] No raw hex colors or ad-hoc font sizes outside `src/theme/`.
- [ ] Dependency register (3.11) is filled in with the human's decisions, and no unapproved package was added.
- [ ] Mobile lint, typecheck, and tests pass with zero failures.
- [ ] APK installs and completes the workflow with the local backend stopped.
- [ ] Human approves the installed Android product before submission.

