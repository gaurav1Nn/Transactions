# ACE Transactions

A mobile transaction-management system: users register, sign in, create **mock** transactions, simulate the payment result, and review a persistent transaction history. No real payments or money movement are involved.

```text
React Native (Expo) app  ──HTTPS──▶  Express REST API  ──▶  PostgreSQL
      Android APK                    Google Cloud Run      Cloud SQL
```

The backend is a standalone REST service. Any mobile or web client can use it through the documented API ([docs/backend-api.md](docs/backend-api.md)); it has no dependency on the mobile app.

## Features

- **Auth:** register, login, logout (server-side token revocation), profile (`/api/users/me`). Passwords are hashed with bcrypt; sessions use JWT.
- **Transactions:** create (starts `PENDING`), simulate `SUCCESS` or `FAILED` through a mock gateway, list with cursor pagination and status filter, view details. Each transaction gets a unique transaction ID.
- **Duplicate prevention:** `Idempotency-Key` header, unique per user. Replaying the same request returns the original transaction; reusing a key with a different payload returns `409`.
- **Ownership:** a user can only read or modify their own transactions. Other users' IDs return `404`.
- **Security and errors:** Helmet, CORS allow-list, auth rate limiting, Zod request validation, a structured error envelope with a `requestId`, and correct HTTP status codes.
- **Mobile app:** login, register, home dashboard, create transaction, history, details, profile, with loading, empty and error states.

## Tech stack

| Layer | Technology |
|---|---|
| Mobile | React Native, Expo (Expo Router), TypeScript, TanStack Query, React Hook Form |
| Backend | Node.js, Express, TypeScript, Zod, Prisma |
| Database | PostgreSQL (Cloud SQL in production) |
| Deployment | Docker, Google Cloud Run, Secret Manager |
| Testing | Vitest, Supertest, Postman |

## Repository layout

```text
apps/
  api/                 Express API
    prisma/            schema.prisma and migrations
    src/
      modules/         auth, users, transactions (routes / controller / service / repository / schemas)
      middleware/      authentication, validation, error handling
      shared/          JWT, password hashing, token revocation, errors
      config/          environment validation
    tests/             integration tests
  mobile/              Expo app
    app/               screens (Expo Router): (auth) and (app) groups
    src/               api client, features, components, providers, theme
    tests/             unit and component tests
docs/                  API reference, deployment guide, release and QA checklists
postman/               Postman collection and example environments
```

## Database schema

Three tables, defined in [apps/api/prisma/schema.prisma](apps/api/prisma/schema.prisma) with migrations in `apps/api/prisma/migrations`:

- `users`: id, name, unique email, password hash, timestamps.
- `transactions`: id, unique `transactionId`, `userId` (FK), `idempotencyKey`, `amount` (`DECIMAL(12,2)`), currency, description, `status` (`PENDING | SUCCESS | FAILED`), failure reason, processed timestamp. Unique on `(userId, idempotencyKey)` and indexed on `(userId, createdAt)`.
- `revoked_tokens`: SHA-256 hash of logged-out JWTs, with expiry, so they are rejected until they expire.

## API overview

All routes are under `/api` and return `{ "data": ... }` on success or `{ "error": { code, message, details, requestId } }` on failure.

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Register user | No |
| POST | `/api/auth/login` | Authenticate user | No |
| POST | `/api/auth/logout` | Revoke current token | Yes |
| GET | `/api/users/me` | Retrieve profile | Yes |
| POST | `/api/transactions` | Create transaction (`Idempotency-Key` header required) | Yes |
| GET | `/api/transactions` | Transaction history (`limit`, `cursor`, `status`) | Yes |
| GET | `/api/transactions/:id` | Transaction details | Yes |
| POST | `/api/transactions/:id/simulate` | Simulate result (`{ "outcome": "SUCCESS" \| "FAILED" }`) | Yes |
| GET | `/health`, `/ready` | Liveness and database readiness | No |

Full request and response details: [docs/backend-api.md](docs/backend-api.md). A Postman collection is in [postman/](postman/).

## Local setup

**Prerequisites:** Node.js 22, npm, PostgreSQL, and for Android an emulator or device (Android Studio) plus Expo tooling.

```bash
# 1. Install all workspaces
npm install

# 2. Configure the API
cp .env.example apps/api/.env
#    then edit apps/api/.env: set DATABASE_URL and a JWT_SECRET of at least 32 characters

# 3. Create the database schema
cd apps/api
npm run prisma:generate
npm run prisma:migrate:dev

# 4. Run the API (http://localhost:3000)
npm run dev
```

### Environment variables (API)

| Variable | Default | Notes |
|---|---|---|
| `DATABASE_URL` | none (required) | PostgreSQL connection string |
| `JWT_SECRET` | none (required) | At least 32 characters |
| `JWT_EXPIRES_IN` | `24h` | |
| `PORT` | `3000` | Cloud Run injects `8080` |
| `BCRYPT_ROUNDS` | `10` | |
| `CORS_ORIGINS` | `*` | Comma-separated list; restrict in production |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | `900000` / `100` | Auth endpoint rate limit |
| `TRUST_PROXY_HOPS` | `0` | Set to `1` behind Cloud Run |
| `LOG_LEVEL` | `info` | |

Never commit real values. Only [.env.example](.env.example) is tracked.

### Run the mobile app

```bash
cd apps/mobile
EXPO_PUBLIC_API_URL=https://<your-api-url> npm start     # or: npm run android
```

If `EXPO_PUBLIC_API_URL` is unset in development, the app falls back to the local API (`10.0.2.2:3000` on the Android emulator). EAS builds require an HTTPS `EXPO_PUBLIC_API_URL`.

## Tests

```bash
npm test               # all workspaces
npm run typecheck      # TypeScript across the repo
npm run test:e2e -w @ace/mobile   # frontend to backend wiring test
```

API integration tests cover authentication (registration, login, logout and revocation, validation, duplicate email), transactions (idempotency, ownership isolation, simulation state rules, history filtering), error format and security headers. They run against a PostgreSQL database, so set `TEST_DATABASE_URL` to a disposable test database.

## Deployment (Google Cloud Run)

The API ships as a Docker image ([apps/api/Dockerfile](apps/api/Dockerfile)) to Cloud Run, connected to Cloud SQL for PostgreSQL, with `DATABASE_URL` and `JWT_SECRET` stored in Secret Manager. Step-by-step commands are in [docs/backend-deployment.md](docs/backend-deployment.md). In short:

```bash
docker build -f apps/api/Dockerfile -t ace-transactions-api .
# push to Artifact Registry, run `prisma migrate deploy` against Cloud SQL,
# then `gcloud run deploy ace-transactions-api ... --set-secrets=...`
```

**Production API URL:** https://ace-api-326519691217.asia-south1.run.app

Health check: [`/health`](https://ace-api-326519691217.asia-south1.run.app/health) returns `{"data":{"status":"ok"}}`.

## Building the Android APK

```bash
cd apps/mobile
npx eas login
# set EXPO_PUBLIC_API_URL (HTTPS, the Cloud Run URL) in the EAS "preview" environment
npx eas build --platform android --profile preview
```

Details and verification steps: [docs/android-release-checklist.md](docs/android-release-checklist.md) and [docs/mobile-qa-checklist.md](docs/mobile-qa-checklist.md).

## Documentation

- [docs/backend-api.md](docs/backend-api.md): API reference
- [docs/backend-deployment.md](docs/backend-deployment.md): Docker and Cloud Run / Cloud SQL deployment
- [docs/android-release-checklist.md](docs/android-release-checklist.md): APK build
- [docs/mobile-qa-checklist.md](docs/mobile-qa-checklist.md): manual QA
- [docs/backend-release-checklist.md](docs/backend-release-checklist.md): backend release gates
