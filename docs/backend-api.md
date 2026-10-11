# ACE Digital Transaction Management System — Backend API Reference

## 1. Overview

The ACE Digital Transactions backend is a secure, RESTful Express TypeScript service backed by PostgreSQL via Prisma ORM.

### Base URLs

- **Local:** `http://localhost:3000`
- **Production (Google Cloud Run):** `https://ace-transactions-api-xxxx.run.app` (configured via deployment)

---

## 2. Authentication & Security

- **Authentication:** JSON Web Tokens (JWT) using HMAC-SHA256.
- **Authorization header:** `Authorization: Bearer <accessToken>`
- **Token expiration:** 24 hours (configurable via `JWT_EXPIRES_IN`).
- **Logout:** Revokes the presented access token on the server. A fresh login issues a distinct token.
- **Password security:** bcrypt with salt rounds >= 10. Passwords are never returned in responses or logged.
- **Ownership enforcement:** All transaction reads and writes are strictly scoped to the authenticated user ID extracted from the verified JWT.
- **Security headers:** Helmet enabled (strict transport security, X-Frame-Options, X-Content-Type-Options: nosniff).
- **CORS:** Controlled via `CORS_ORIGINS` environment variable.
- **Rate limiting:** 100 requests per 15 minutes on authentication endpoints.

---

## 3. Standard Response & Error Format

### Success envelope

Successful responses return data under the `data` key:

```json
{
  "data": { ... }
}
```

### Error envelope

Errors adhere to a standardized format including a unique `requestId`:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable explanation",
    "details": [
      {
        "field": "amount",
        "message": "Amount must be a numeric string with exactly two decimal places"
      }
    ],
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Standard HTTP Status Codes

| Code | Meaning | Common trigger |
|---|---|---|
| `200 OK` | Request succeeded | Login, profile retrieval, transaction list/detail, simulation, idempotent replay |
| `201 Created` | Resource created | Registration, first transaction creation |
| `400 Bad Request` | Malformed syntax | Malformed JSON body |
| `401 Unauthorized` | Authentication failure | Missing, expired, or invalid JWT; invalid email/password |
| `404 Not Found` | Resource missing | Unknown route, non-existent transaction, or transaction owned by another user |
| `409 Conflict` | State conflict | Email already registered (`EMAIL_EXISTS`), changed idempotency payload (`IDEMPOTENCY_CONFLICT`), re-simulation of terminal transaction (`CONFLICT`) |
| `413 Payload Too Large` | Body exceeds limit | Payload larger than configured size limit |
| `422 Unprocessable Entity` | Validation failure | Zod schema validation errors (e.g., negative amount, invalid outcome) |
| `429 Too Many Requests` | Rate limit exceeded | Exceeded authentication attempt limits |
| `500 Internal Server Error` | Unexpected server error | Uncaught internal failure (safe message, no leak of stack or database) |

---

## 4. Endpoints

### 4.1. Health Check

Operational health probe. Publicly accessible.

- **Method:** `GET`
- **Path:** `/health`
- **Authentication:** None

#### Response (`200 OK`)

```json
{
  "data": {
    "status": "ok"
  }
}
```

---

### 4.1.1. Readiness Check

Checks that the API can reach PostgreSQL. Publicly accessible. Use this for a deployment readiness probe; `/health` only confirms that the HTTP process is running.

- **Method:** `GET`
- **Path:** `/ready`
- **Authentication:** None

Returns `{ "data": { "status": "ready" } }` with `200`, or a structured `503 SERVICE_UNAVAILABLE` response when PostgreSQL cannot be reached.

---

### 4.2. User Registration

Registers a new user account.

- **Method:** `POST`
- **Path:** `/api/auth/register`
- **Authentication:** None

#### Request Body

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123!"
}
```

| Field | Type | Rules |
|---|---|---|
| `name` | string | Trimmed, 1–100 characters |
| `email` | string | Valid email format, normalized to lowercase |
| `password` | string | 8–128 characters, at most 72 UTF-8 bytes, and requires at least one uppercase letter, one lowercase letter, one number, and one special character |

#### Response (`201 Created`)

```json
{
  "data": {
    "user": {
      "id": "e5c26920-d3bb-4034-8c83-8a3068e1a182",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "createdAt": "2026-10-10T11:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
}
```

---

### 4.3. User Login

Authenticates existing user with email and password.

- **Method:** `POST`
- **Path:** `/api/auth/login`
- **Authentication:** None

#### Request Body

```json
{
  "email": "jane@example.com",
  "password": "Password123!"
}
```

#### Response (`200 OK`)

```json
{
  "data": {
    "user": {
      "id": "e5c26920-d3bb-4034-8c83-8a3068e1a182",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "createdAt": "2026-10-10T11:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
}
```

---

### 4.4. Logout

Revokes the bearer token used for this request. Subsequent requests with that token return `401 UNAUTHORIZED`.

- **Method:** `POST`
- **Path:** `/api/auth/logout`
- **Authentication:** Bearer JWT required
- **Response:** `204 No Content`

---

### 4.5. Get Current User Profile

Retrieves the authenticated user's profile.

- **Method:** `GET`
- **Path:** `/api/users/me`
- **Authentication:** Bearer JWT required

#### Response (`200 OK`)

```json
{
  "data": {
    "id": "e5c26920-d3bb-4034-8c83-8a3068e1a182",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "createdAt": "2026-10-10T11:00:00.000Z"
  }
}
```

---

### 4.6. Create Transaction

Creates a new transaction in `PENDING` state. Duplicate submissions are protected by an `Idempotency-Key` header.

- **Method:** `POST`
- **Path:** `/api/transactions`
- **Authentication:** Bearer JWT required
- **Required Header:** `Idempotency-Key: <unique-client-key>` (up to 128 characters)

#### Request Body

```json
{
  "amount": "125.50",
  "currency": "USD",
  "description": "Office supplies"
}
```

| Field | Type | Rules |
|---|---|---|
| `amount` | string | Exact numeric string with 2 decimal places (e.g. `"10.00"`), > 0 and <= 9,999,999,999.99 |
| `currency` | string | Exactly 3 uppercase letters ISO code (e.g. `"USD"`, `"EUR"`) |
| `description` | string | 1–255 characters |

#### Response (`201 Created` for first request, `200 OK` for exact idempotent replay)

```json
{
  "data": {
    "id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
    "transactionId": "TXN-MV1ZR5Z3-3697E392",
    "amount": "125.50",
    "currency": "USD",
    "description": "Office supplies",
    "status": "PENDING",
    "failureReason": null,
    "processedAt": null,
    "createdAt": "2026-10-10T11:05:00.000Z",
    "updatedAt": "2026-10-10T11:05:00.000Z"
  }
}
```

#### Idempotency Behavior

- Replaying with the **same** `Idempotency-Key` and **identical payload** returns `200 OK` with the original record.
- Replaying with the **same** `Idempotency-Key` but a **different payload** returns `409 Conflict` (`IDEMPOTENCY_CONFLICT`).

---

### 4.7. List Transaction History

Retrieves the authenticated user's transactions in descending chronological order (newest first).

- **Method:** `GET`
- **Path:** `/api/transactions`
- **Authentication:** Bearer JWT required

#### Query Parameters

| Parameter | Type | Default | Constraints |
|---|---|---|---|
| `page` | integer | `1` | 1–100,000; legacy offset pagination |
| `limit` | integer | `20` | 1–100 |
| `cursor` | string | optional | Opaque cursor returned as `pagination.nextCursor`; use it for stable infinite scrolling |
| `status` | string | optional | `"PENDING"`, `"SUCCESS"`, or `"FAILED"` |

#### Response (`200 OK`)

```json
{
  "data": {
    "items": [
      {
        "id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
        "transactionId": "TXN-MV1ZR5Z3-3697E392",
        "amount": "125.50",
        "currency": "USD",
        "description": "Office supplies",
        "status": "PENDING",
        "failureReason": null,
        "processedAt": null,
        "createdAt": "2026-10-10T11:05:00.000Z",
        "updatedAt": "2026-10-10T11:05:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1,
      "nextCursor": "eyJjcmVhdGVkQXQiOiIyMDI2LTEwLTEwVDExOjA1OjAwLjAwMFoiLCJpZCI6IjFhMmIzYzRkLTVlNmYtN2E4Yi05YzBkLTFlMmYzYTRiNWM2ZCJ9"
    }
  }
}
```

---

### 4.8. Get Transaction Details

Retrieves details of a single transaction owned by the user.

- **Method:** `GET`
- **Path:** `/api/transactions/:id`
- **Authentication:** Bearer JWT required

The `:id` path parameter may be either the public `transactionId` (e.g. `TXN-MV1ZR5Z3-3697E392`) or the internal UUID.

#### Response (`200 OK`)

```json
{
  "data": {
    "id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
    "transactionId": "TXN-MV1ZR5Z3-3697E392",
    "amount": "125.50",
    "currency": "USD",
    "description": "Office supplies",
    "status": "PENDING",
    "failureReason": null,
    "processedAt": null,
    "createdAt": "2026-10-10T11:05:00.000Z",
    "updatedAt": "2026-10-10T11:05:00.000Z"
  }
}
```

*Note: Non-existent IDs and IDs belonging to other users both return identical `404 Not Found` responses to prevent information leakage.*

---

### 4.9. Simulate Payment Result

Simulates the mock payment transition of a `PENDING` transaction to either `SUCCESS` or `FAILED`.

- **Method:** `POST`
- **Path:** `/api/transactions/:id/simulate`
- **Authentication:** Bearer JWT required

#### Request Body

```json
{
  "outcome": "SUCCESS"
}
```

| Field | Type | Allowed Values |
|---|---|---|
| `outcome` | string | `"SUCCESS"` or `"FAILED"` |

#### Response (`200 OK`)

```json
{
  "data": {
    "id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
    "transactionId": "TXN-MV1ZR5Z3-3697E392",
    "amount": "125.50",
    "currency": "USD",
    "description": "Office supplies",
    "status": "SUCCESS",
    "failureReason": null,
    "processedAt": "2026-10-10T11:06:15.123Z",
    "createdAt": "2026-10-10T11:05:00.000Z",
    "updatedAt": "2026-10-10T11:06:15.123Z"
  }
}
```

When simulated with `outcome: "FAILED"`:
- `status`: `"FAILED"`
- `failureReason`: `"Payment simulation failed"`
- `processedAt`: ISO 8601 timestamp string

#### Re-simulation Conflict (`409 Conflict`)

Attempting to simulate a transaction that has already reached a terminal state (`SUCCESS` or `FAILED`) returns `409 Conflict` (`CONFLICT`). Terminal states are immutable.

---

## 5. Postman & Newman Test Suite

The automated test collection is located in `postman/ACE-Transactions.postman_collection.json`.

### Running with Newman Locally

1. Start the API locally:
   ```bash
   npm run build --workspace @ace/api
   npm start --workspace @ace/api
   ```
2. In another terminal, run Newman:
   ```bash
   npx newman run postman/ACE-Transactions.postman_collection.json -e postman/local.postman_environment.example.json
   ```
