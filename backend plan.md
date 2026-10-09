# Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build, test, document, and deploy the reusable Express REST API required by the ACE Digital assignment before beginning frontend implementation.

**Architecture:** The backend is an independent TypeScript service organized as routes → validation/authentication middleware → controllers → services → Prisma/PostgreSQL. Business rules live in services, database constraints enforce concurrency-sensitive guarantees, and the finished container runs on Google Cloud Run with Cloud SQL PostgreSQL.

**Tech Stack:** Node.js, Express.js, TypeScript, PostgreSQL, Prisma, Zod, bcrypt, JSON Web Tokens, Vitest, Supertest, Docker, Google Cloud Run, Cloud SQL, Secret Manager, and Postman.

**Spec:** [`plan.md`](plan.md) is the master roadmap. This file is the executable backend plan. [`frontend plan.md`](<frontend plan.md>) must not be executed until the backend exit gate in this plan passes.

## Global constraints

- TypeScript is mandatory and strict mode must remain enabled.
- Required endpoints must use the exact `/api/...` paths from the assignment.
- PostgreSQL is the durable source of truth; do not introduce Convex or another database.
- Passwords must be hashed and must never be returned or logged.
- Protected routes must derive the user ID from a verified JWT, never from request input.
- All transaction reads and writes must enforce authenticated ownership.
- Transaction statuses are exactly `PENDING`, `SUCCESS`, and `FAILED` in storage, displayed as Pending, Success, and Failed to users.
- A transaction may move only from `PENDING` to `SUCCESS` or `FAILED`; terminal states are immutable.
- Duplicate creation must be prevented with an idempotency key and a PostgreSQL unique constraint.
- Money must be persisted as PostgreSQL `NUMERIC(12,2)` through Prisma Decimal, not as a JavaScript floating-point value.
- Structured error responses and appropriate HTTP status codes are required.
- Automated tests must cover authentication and critical transaction behavior.
- Secrets and cloud credentials must never enter the repository.
- The backend must work independently of the mobile project and be testable through Postman.
- Do not add a dependency, alter the API contract, or change the database schema without coordinator and human approval.

## Review focus

These are the highest-risk conditions every implementer and reviewer must actively test:

1. Two simultaneous requests using the same idempotency key must produce exactly one transaction row.
2. A valid JWT for user A must never reveal, simulate, or modify a transaction belonging to user B.
3. Reusing an idempotency key with a different amount, currency, or description must return `409 Conflict`.
4. Decimal amounts such as `0.10` and `9999999999.99` must survive request, persistence, and response without rounding.
5. Re-simulating a terminal transaction must return `409 Conflict` without changing its original result or timestamp.

---

## 1. Backend completion boundary

The backend phase is complete only when:

- Every required endpoint exists and uses PostgreSQL.
- The full backend test suite, lint, typecheck, and production build pass.
- Clean migrations can create the database schema.
- The Postman collection completes the full workflow.
- The API is deployed on Cloud Run and connected to Cloud SQL.
- All Postman checks pass while the local API is stopped.
- A production API URL is ready for the React Native application.
- Backend setup, testing, API behavior, and deployment are documented.

No frontend feature work should begin before the local API contract is stable. Full frontend integration should not begin until the deployed-backend exit gate passes.

---

## 2. Backend API contract

### Required endpoints

| Method | Endpoint | Authentication | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register user |
| `POST` | `/api/auth/login` | Public | Authenticate user |
| `GET` | `/api/users/me` | JWT | Retrieve own profile |
| `POST` | `/api/transactions` | JWT + idempotency key | Create transaction |
| `GET` | `/api/transactions` | JWT | Retrieve own history |
| `GET` | `/api/transactions/:id` | JWT | Retrieve owned transaction |
| `POST` | `/api/transactions/:id/simulate` | JWT | Simulate payment result |
| `GET` | `/health` | Public | Operational health check |

### Stable request contracts

```ts
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateTransactionRequest {
  amount: string;
  currency: string;
  description: string;
}

export interface SimulateTransactionRequest {
  outcome: "SUCCESS" | "FAILED";
}
```

### Stable response contracts

```ts
export interface UserDto {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  data: {
    user: UserDto;
    accessToken: string;
  };
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

### HTTP behavior

| Condition | Status |
|---|---|
| New registration or new transaction | `201 Created` |
| Successful login, fetch, simulation, or exact idempotent replay | `200 OK` |
| Invalid request syntax | `400 Bad Request` |
| Missing/invalid/expired JWT or invalid credentials | `401 Unauthorized` |
| Missing or non-owned transaction | `404 Not Found` |
| Existing email, changed idempotency payload, or terminal-state simulation | `409 Conflict` |
| Valid JSON with invalid field values | `422 Unprocessable Entity` |
| Rate limit exceeded | `429 Too Many Requests` |
| Unexpected internal failure | `500 Internal Server Error` |

---

## 3. Database contract

### User model

| Field | Database representation | Constraint |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | Text/Varchar | Required |
| `email` | Text/Varchar | Lowercase and unique |
| `passwordHash` | Text | Required; never exposed |
| `createdAt` | Timestamp with timezone | Required |
| `updatedAt` | Timestamp with timezone | Required |

### Transaction model

| Field | Database representation | Constraint |
|---|---|---|
| `id` | UUID | Primary key |
| `transactionId` | Text/Varchar | Public and globally unique |
| `userId` | UUID | Foreign key to User |
| `idempotencyKey` | Text/Varchar | Unique together with `userId` |
| `amount` | `NUMERIC(12,2)` | Greater than zero in service validation |
| `currency` | `CHAR(3)`/Varchar | Uppercase ISO-style code |
| `description` | Varchar | Required and length-limited |
| `status` | PostgreSQL/Prisma enum | `PENDING`, `SUCCESS`, `FAILED` |
| `failureReason` | Nullable text | Only meaningful for failed result |
| `processedAt` | Nullable timestamp | Set once when terminal |
| `createdAt` | Timestamp with timezone | History ordering |
| `updatedAt` | Timestamp with timezone | Required |

Required database guarantees:

- Unique `User.email`.
- Unique `Transaction.transactionId`.
- Unique `(Transaction.userId, Transaction.idempotencyKey)`.
- Index `(Transaction.userId, Transaction.createdAt)`.
- Foreign-key protection between transactions and users.

---

## 4. Planned backend file map

```text
apps/api/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── src/
│   ├── config/
│   │   ├── env.ts
│   │   └── logger.ts
│   ├── middleware/
│   │   ├── authenticate.ts
│   │   ├── error-handler.ts
│   │   ├── request-id.ts
│   │   └── validate.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.repository.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.schemas.ts
│   │   │   └── auth.service.ts
│   │   ├── users/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.repository.ts
│   │   │   ├── users.routes.ts
│   │   │   └── users.service.ts
│   │   └── transactions/
│   │       ├── transactions.controller.ts
│   │       ├── transactions.repository.ts
│   │       ├── transactions.routes.ts
│   │       ├── transactions.schemas.ts
│   │       └── transactions.service.ts
│   ├── shared/
│   │   ├── app-error.ts
│   │   ├── async-handler.ts
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   ├── prisma.ts
│   │   └── transaction-id.ts
│   ├── types/
│   │   └── express.d.ts
│   ├── app.ts
│   └── server.ts
├── tests/
│   ├── helpers/
│   ├── auth.integration.test.ts
│   ├── transactions.integration.test.ts
│   └── security.integration.test.ts
├── Dockerfile
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

Files are grouped by feature so each agent can understand one domain without loading the entire backend. `app.ts` creates the Express app; `server.ts` is the only file that opens a port.

---

## 5. Subagent operating model

### Coordinator responsibilities

The coordinator owns:

- This plan, requirement interpretation, and approvals.
- Root workspace files and shared API contracts.
- Task assignment and dependency enforcement.
- Database/API contract changes.
- Integration verification and the backend exit gate.
- Resolving overlaps; agents must not resolve shared-file conflicts independently.

### Worker responsibilities

Each implementation worker receives exactly one task at a time and must:

1. Read `plan.md`, this plan, and only the source relevant to its task.
2. Confirm the assigned file ownership before editing.
3. Write the specified failing test first.
4. Run it and capture the expected failure.
5. Add the minimum implementation required to pass.
6. Run focused tests, then typecheck/lint for the owned area.
7. Report changed files, commands, results, assumptions, and remaining risks.
8. Never revert or rewrite another worker's changes.

### Review cycle per task

Every task uses this order:

1. **Implementer:** completes the TDD steps and reports evidence.
2. **Specification reviewer:** checks behavior against the task and API/database contracts.
3. **Quality reviewer:** checks security, clarity, tests, error handling, and unintended changes.
4. **Coordinator:** accepts the task or returns a focused correction request.

Do not ask one reviewer to perform both reviews at the same time. Specification compliance is checked before style or refactoring suggestions.

### Safe parallelism

- Tasks 1–3 are mostly sequential because they establish shared foundations.
- After Task 4, registration work and test-helper work may run in parallel only if file ownership does not overlap.
- Transaction route/service tasks remain sequential until interfaces are stable.
- Docker/Postman/documentation work may run parallel with final hardening after the endpoint contract is frozen.
- Prisma schema, `app.ts`, root scripts, and environment definitions are coordinator-controlled shared files.

---

## 6. Dependency-ordered backend tasks

### Task 1: Scaffold the TypeScript API and health slice

**Files:**

- Create: `package.json`
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/server.ts`
- Create: `apps/api/tests/health.integration.test.ts`

**Interfaces:**

- Consumes: None.
- Produces: `createApp(): Express` from `app.ts`; a server entry point that listens on validated `PORT`; `GET /health` returning `{ data: { status: "ok" } }`.

- [ ] **Step 1: Write the failing health integration test**
  - Test name: `GET /health returns API readiness without authentication`.
  - Assert status `200`, JSON content type, and `{ data: { status: "ok" } }`.

- [ ] **Step 2: Run the focused test and confirm failure**
  - Run: `npm test --workspace @ace/api -- health.integration.test.ts`
  - Expected: FAIL because `createApp` or the route does not exist.

- [ ] **Step 3: Add the minimum Express application and server entry point**
  - `createApp(): Express` registers JSON parsing and `/health`.
  - `server.ts` listens on `0.0.0.0` and `process.env.PORT`.

- [ ] **Step 4: Run focused verification**
  - Run: `npm test --workspace @ace/api -- health.integration.test.ts`
  - Expected: PASS.

- [ ] **Step 5: Run structural checks**
  - Run: `npm run typecheck --workspace @ace/api && npm run build --workspace @ace/api`
  - Expected: Both commands exit `0`.

- [ ] **Step 6: Commit the accepted task**
  - Commit message: `feat(api): scaffold Express health service`

### Task 2: Add validated configuration and test infrastructure

**Files:**

- Create: `apps/api/src/config/env.ts`
- Create: `apps/api/vitest.config.ts`
- Create: `apps/api/tests/setup.ts`
- Create: `.env.example`
- Modify: `apps/api/src/server.ts`

**Interfaces:**

- Consumes: `createApp()` from Task 1.
- Produces: `env` object with `NODE_ENV`, `PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `BCRYPT_ROUNDS`, `LOG_LEVEL`, and `CORS_ORIGINS`; isolated integration-test setup.

- [ ] **Step 1: Write tests for missing and malformed configuration**
  - Test name: `parseEnv rejects missing production secrets`.
  - Test name: `parseEnv applies safe development defaults only where allowed`.

- [ ] **Step 2: Confirm both tests fail before implementation**
  - Run: `npm test --workspace @ace/api -- env.test.ts`
  - Expected: FAIL because `parseEnv` does not exist.

- [ ] **Step 3: Implement `parseEnv(input: NodeJS.ProcessEnv): Env`**
  - Use Zod.
  - Never print secret values in validation output.
  - Fail startup immediately when required values are invalid.

- [ ] **Step 4: Configure Vitest and the dedicated test environment**
  - The test database URL must be different from any production URL.
  - Test setup must refuse to run destructive cleanup when `NODE_ENV !== "test"`.

- [ ] **Step 5: Verify**
  - Run: `npm test --workspace @ace/api -- env.test.ts && npm run typecheck --workspace @ace/api`
  - Expected: Tests pass and typecheck exits `0`.

- [ ] **Step 6: Commit**
  - Commit message: `chore(api): validate runtime configuration`

### Task 3: Define and migrate the PostgreSQL schema

**Files:**

- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/<timestamp>_initial_schema/migration.sql`
- Create: `apps/api/src/shared/prisma.ts`
- Modify: `apps/api/package.json`

**Interfaces:**

- Consumes: `DATABASE_URL` from Task 2.
- Produces: Prisma `User`, `Transaction`, and `TransactionStatus`; shared `prisma` client.

- [ ] **Step 1: Write schema assertions or an integration test describing required constraints**
  - Assert duplicate normalized email is rejected.
  - Assert duplicate `(userId, idempotencyKey)` is rejected.
  - Assert `transactionId` is unique.

- [ ] **Step 2: Confirm schema verification cannot yet pass**
  - Run: `npm run prisma:validate --workspace @ace/api`
  - Expected: FAIL because no Prisma schema exists.

- [ ] **Step 3: Create the exact models and enum from Section 3**
  - Use UUID primary keys.
  - Map amount to Decimal/`NUMERIC(12,2)`.
  - Add the required unique keys, foreign key, and history index.

- [ ] **Step 4: Generate and inspect the migration**
  - Run: `npm run prisma:migrate:dev --workspace @ace/api -- --name initial_schema`
  - Expected: Migration applies to the development database.
  - Manually confirm the SQL contains all required constraints and no destructive statement unrelated to these models.

- [ ] **Step 5: Verify from a clean test database**
  - Safety: first confirm `DATABASE_URL` points to this project's dedicated local database (name ends in `_test`, password redacted when printed). Abort if it does not. See "Project isolation and safety rules" in `plan.md`.
  - Run: `npm run prisma:migrate:reset --workspace @ace/api -- --force && npm test --workspace @ace/api -- schema.integration.test.ts`
  - Expected: Migration and constraint tests pass.

- [ ] **Step 6: Commit**
  - Commit message: `feat(api): add PostgreSQL user and transaction schema`

### Task 4: Establish request IDs, validation, and structured errors

**Files:**

- Create: `apps/api/src/shared/app-error.ts`
- Create: `apps/api/src/middleware/request-id.ts`
- Create: `apps/api/src/middleware/validate.ts`
- Create: `apps/api/src/middleware/error-handler.ts`
- Create: `apps/api/tests/errors.integration.test.ts`

**Interfaces:**

- Consumes: Express app from Task 1.
- Produces: `AppError`, `requestIdMiddleware`, `validate(schema)`, `errorHandler`, and the stable `ApiErrorResponse` envelope.

- [ ] **Step 1: Write failing error-contract tests**
  - Invalid body returns `422` with field details and request ID.
  - Unknown route returns structured `404`.
  - Unexpected error returns safe `500` without stack or database details.

- [ ] **Step 2: Confirm failure**
  - Run: `npm test --workspace @ace/api -- errors.integration.test.ts`
  - Expected: FAIL because middleware is absent.

- [ ] **Step 3: Implement one middleware at a time**
  - `requestIdMiddleware` accepts a valid inbound request ID or generates one.
  - `validate` stores parsed values for downstream handlers.
  - `errorHandler` translates known and unknown errors.

- [ ] **Step 4: Register middleware in correct Express order**
  - Request ID before routes.
  - Not-found handling after routes.
  - Error middleware last.

- [ ] **Step 5: Verify**
  - Run: `npm test --workspace @ace/api -- errors.integration.test.ts && npm run typecheck --workspace @ace/api`
  - Expected: All checks pass.

- [ ] **Step 6: Commit**
  - Commit message: `feat(api): standardize validation and errors`

### Task 5: Implement password and JWT security primitives

**Files:**

- Create: `apps/api/src/shared/password.ts`
- Create: `apps/api/src/shared/jwt.ts`
- Create: `apps/api/src/shared/password.test.ts`
- Create: `apps/api/src/shared/jwt.test.ts`

**Interfaces:**

- Consumes: `env.JWT_SECRET`, `env.JWT_EXPIRES_IN`, and `env.BCRYPT_ROUNDS`.
- Produces: `hashPassword(password: string): Promise<string>`, `verifyPassword(password: string, hash: string): Promise<boolean>`, `signAccessToken(userId: string): string`, and `verifyAccessToken(token: string): { sub: string }`.

- [ ] **Step 1: Write failing password tests**
  - Hash differs from plaintext.
  - Correct password verifies; incorrect password does not.

- [ ] **Step 2: Write failing JWT tests**
  - Valid signed token returns the original subject.
  - Altered and expired tokens are rejected.

- [ ] **Step 3: Run focused tests and confirm expected failure**
  - Run: `npm test --workspace @ace/api -- password.test.ts jwt.test.ts`

- [ ] **Step 4: Implement the four exact interfaces**
  - Keep algorithm settings in validated configuration.
  - Do not log inputs or token contents.

- [ ] **Step 5: Verify**
  - Run: `npm test --workspace @ace/api -- password.test.ts jwt.test.ts`
  - Expected: PASS.

- [ ] **Step 6: Commit**
  - Commit message: `feat(api): add password and JWT security helpers`

### Task 6: Implement user registration

**Files:**

- Create: `apps/api/src/modules/auth/auth.schemas.ts`
- Create: `apps/api/src/modules/auth/auth.repository.ts`
- Create: `apps/api/src/modules/auth/auth.service.ts`
- Create: `apps/api/src/modules/auth/auth.controller.ts`
- Create or modify: `apps/api/tests/auth.integration.test.ts`

**Interfaces:**

- Consumes: Prisma client, password/JWT helpers, error types, validation middleware.
- Produces: `register(input: RegisterInput): Promise<AuthResponse["data"]`; normalized unique users and safe auth responses.

- [ ] **Step 1: Add failing registration integration tests**
  - Valid request returns `201`, safe user fields, and JWT.
  - Stored password differs from plaintext.
  - Upper/lowercase duplicate email returns `409`.
  - Invalid email, short password, blank name, and oversized inputs return `422`.

- [ ] **Step 2: Confirm tests fail for missing route**
  - Run: `npm test --workspace @ace/api -- auth.integration.test.ts -t register`

- [ ] **Step 3: Implement schema, repository, and `register` service**
  - Normalize email with trim and lowercase before checking/inserting.
  - Handle the database unique violation safely to cover races.
  - Map only `UserDto` fields.

- [ ] **Step 4: Add controller and route wiring**
  - Route: `POST /api/auth/register`.

- [ ] **Step 5: Verify**
  - Run: `npm test --workspace @ace/api -- auth.integration.test.ts -t register`
  - Expected: All registration scenarios pass.

- [ ] **Step 6: Commit**
  - Commit message: `feat(api): implement user registration`

### Task 7: Implement login, authentication middleware, and profile

**Files:**

- Modify: `apps/api/src/modules/auth/auth.service.ts`
- Create: `apps/api/src/middleware/authenticate.ts`
- Create: `apps/api/src/modules/users/users.service.ts`
- Create: `apps/api/src/modules/users/users.routes.ts`
- Modify: `apps/api/tests/auth.integration.test.ts`

**Interfaces:**

- Consumes: auth repository, password/JWT helpers, `UserDto` mapper.
- Produces: `login(input: LoginInput): Promise<AuthResponse["data"]`; authenticated `req.user.id`; `getCurrentUser(userId: string): Promise<UserDto>`.

- [ ] **Step 1: Add failing login tests**
  - Valid credentials return `200` and a usable JWT.
  - Unknown email and wrong password both return the same generic `401` shape.

- [ ] **Step 2: Add failing authentication/profile tests**
  - Valid Bearer token returns own profile.
  - Missing, malformed, altered, and expired tokens return `401`.
  - Profile never contains `passwordHash`.

- [ ] **Step 3: Run and confirm failures**
  - Run: `npm test --workspace @ace/api -- auth.integration.test.ts`

- [ ] **Step 4: Implement login and middleware**
  - `authenticate` verifies the token and attaches only the verified subject.
  - Use timing-safe bcrypt verification through the shared helper.

- [ ] **Step 5: Implement `GET /api/users/me`**
  - Fetch by authenticated subject and map to `UserDto`.

- [ ] **Step 6: Verify**
  - Run: `npm test --workspace @ace/api -- auth.integration.test.ts`
  - Expected: All authentication/profile tests pass.

- [ ] **Step 7: Commit**
  - Commit message: `feat(api): add login authentication and profile`

### Task 8: Implement transaction creation and idempotency

**Files:**

- Create: `apps/api/src/modules/transactions/transactions.schemas.ts`
- Create: `apps/api/src/modules/transactions/transactions.repository.ts`
- Create: `apps/api/src/modules/transactions/transactions.service.ts`
- Create: `apps/api/src/modules/transactions/transactions.routes.ts`
- Create: `apps/api/tests/transactions.integration.test.ts`

**Interfaces:**

- Consumes: authenticated `userId`, Prisma transaction model, error/validation infrastructure.
- Produces: `createTransaction(userId: string, idempotencyKey: string, input: CreateTransactionInput): Promise<{ transaction: TransactionDto; created: boolean }>` and `POST /api/transactions`.

- [ ] **Step 1: Add failing creation tests**
  - Valid request returns `201`, server-generated ID, and `PENDING`.
  - Missing/invalid idempotency header returns `422`.
  - Zero, negative, over-precision, oversized, malformed currency, and blank description inputs return `422`.
  - Decimal `0.10` round-trips as `"0.10"`.

- [ ] **Step 2: Add failing idempotency tests**
  - Exact replay returns `200` and the original transaction.
  - Replay with changed payload returns `409`.
  - Parallel same-key requests create exactly one row.

- [ ] **Step 3: Run and confirm failure**
  - Run: `npm test --workspace @ace/api -- transactions.integration.test.ts -t create`

- [ ] **Step 4: Implement schemas and repository primitives**
  - Generate public transaction ID on the server.
  - Compare canonical amount, currency, and description for replay equality.
  - Catch the composite unique race and load the winning record.

- [ ] **Step 5: Implement service and route**
  - Never accept `userId`, `status`, or `transactionId` from the body.
  - Map Decimal to a fixed two-decimal response string.

- [ ] **Step 6: Verify**
  - Run: `npm test --workspace @ace/api -- transactions.integration.test.ts -t create`
  - Expected: All creation and review-focus idempotency cases pass.

- [ ] **Step 7: Commit**
  - Commit message: `feat(api): create idempotent transactions`

### Task 9: Implement owner-only history and details

**Files:**

- Modify: `apps/api/src/modules/transactions/transactions.schemas.ts`
- Modify: `apps/api/src/modules/transactions/transactions.repository.ts`
- Modify: `apps/api/src/modules/transactions/transactions.service.ts`
- Modify: `apps/api/src/modules/transactions/transactions.routes.ts`
- Modify: `apps/api/tests/transactions.integration.test.ts`

**Interfaces:**

- Consumes: transaction mapper and authenticated user ID from Task 8.
- Produces: `listTransactions(userId: string, query: TransactionListQuery): Promise<PaginatedTransactions>` and `getTransaction(userId: string, transactionId: string): Promise<TransactionDto>`.

- [ ] **Step 1: Add failing history tests**
  - Results contain only the authenticated user's records.
  - Newest transaction appears first.
  - `page`, `limit`, and optional `status` are validated.
  - Pagination metadata matches total records.

- [ ] **Step 2: Add failing details/ownership tests**
  - Owner receives the transaction.
  - Missing ID and another user's ID both return identical `404` responses.
  - No response leaks internal database `idempotencyKey` or `userId` unless deliberately included in the public DTO contract.

- [ ] **Step 3: Run and confirm failures**
  - Run: `npm test --workspace @ace/api -- transactions.integration.test.ts -t 'history|details|ownership'`

- [ ] **Step 4: Implement ownership-aware repository queries and services**
  - Include `userId` in database selection predicates where practical.
  - Default `page=1`, `limit=20`; cap the maximum limit.

- [ ] **Step 5: Wire `GET /api/transactions` and `GET /api/transactions/:id`**

- [ ] **Step 6: Verify**
  - Run: `npm test --workspace @ace/api -- transactions.integration.test.ts`
  - Expected: Creation, history, details, and ownership tests pass.

- [ ] **Step 7: Commit**
  - Commit message: `feat(api): add owner-only transaction queries`

### Task 10: Implement deterministic mock payment simulation

**Files:**

- Modify: `apps/api/src/modules/transactions/transactions.schemas.ts`
- Modify: `apps/api/src/modules/transactions/transactions.repository.ts`
- Modify: `apps/api/src/modules/transactions/transactions.service.ts`
- Modify: `apps/api/src/modules/transactions/transactions.routes.ts`
- Modify: `apps/api/tests/transactions.integration.test.ts`

**Interfaces:**

- Consumes: `getTransaction` ownership rules and transaction status enum.
- Produces: `simulateTransaction(userId: string, transactionId: string, outcome: "SUCCESS" | "FAILED"): Promise<TransactionDto>` and the required simulation endpoint.

- [ ] **Step 1: Add failing simulation tests**
  - Pending → success sets status and `processedAt`.
  - Pending → failed sets status, `processedAt`, and safe mock failure reason.
  - Invalid outcome returns `422`.
  - Another user's transaction returns `404`.
  - Re-simulation returns `409` and preserves original status/timestamp.
  - Two simultaneous simulation requests result in one terminal transition.

- [ ] **Step 2: Confirm failures**
  - Run: `npm test --workspace @ace/api -- transactions.integration.test.ts -t simulate`

- [ ] **Step 3: Implement an atomic conditional update**
  - Update only a row matching owner, public ID, and `PENDING` status.
  - If zero rows update, distinguish not-found/ownership from terminal conflict without exposing another user's record.

- [ ] **Step 4: Wire `POST /api/transactions/:id/simulate`**

- [ ] **Step 5: Verify**
  - Run: `npm test --workspace @ace/api -- transactions.integration.test.ts -t simulate`
  - Expected: All status, ownership, and concurrency checks pass.

- [ ] **Step 6: Commit**
  - Commit message: `feat(api): simulate terminal transaction results`

### Task 11: Add backend hardening and operational logging

**Files:**

- Create: `apps/api/src/config/logger.ts`
- Modify: `apps/api/src/app.ts`
- Create: `apps/api/tests/security.integration.test.ts`
- Modify: `apps/api/src/config/env.ts`
- Modify: `.env.example`

**Interfaces:**

- Consumes: request IDs, error middleware, route tree, validated configuration.
- Produces: secure headers, size limits, controlled CORS, auth rate limits, and redacted structured logs.

- [ ] **Step 1: Write failing security tests**
  - Security headers exist.
  - Oversized body is rejected.
  - repeated login abuse eventually returns `429` in an isolated rate-limit test.
  - Production `500` contains no stack, SQL, password, JWT, or database URL.

- [ ] **Step 2: Confirm failures**
  - Run: `npm test --workspace @ace/api -- security.integration.test.ts`

- [ ] **Step 3: Configure Helmet, CORS, body limits, rate limits, and Pino redaction**
  - Redact authorization headers, passwords, tokens, and database configuration.
  - Avoid rate-limit interference between unrelated tests.

- [ ] **Step 4: Verify focused and full suites**
  - Run: `npm test --workspace @ace/api -- security.integration.test.ts`
  - Run: `npm test --workspace @ace/api`
  - Expected: All tests pass.

- [ ] **Step 5: Commit**
  - Commit message: `feat(api): harden HTTP service and logging`

### Task 12: Finalize API documentation and Postman coverage

**Files:**

- Create: `postman/ACE-Transactions.postman_collection.json`
- Create: `postman/local.postman_environment.example.json`
- Create: `postman/production.postman_environment.example.json`
- Create: `docs/backend-api.md`

**Interfaces:**

- Consumes: frozen endpoints and response contracts from Tasks 6–11.
- Produces: runnable Postman workflow and human-readable API reference.

- [ ] **Step 1: Create collection folders for Health, Auth, Users, and Transactions**

- [ ] **Step 2: Add scripts that capture `accessToken` and `transactionId`**
  - Never store a real token in the committed collection/environment.

- [ ] **Step 3: Add assertions for status, response shape, and ownership/error cases**

- [ ] **Step 4: Run the collection against local API**
  - Run: `npx newman run postman/ACE-Transactions.postman_collection.json -e postman/local.postman_environment.example.json`
  - Expected: All requests and assertions pass with a configured local environment.

- [ ] **Step 5: Review docs against every required endpoint**

- [ ] **Step 6: Commit**
  - Commit message: `docs(api): add Postman collection and API guide`

### Task 13: Containerize and deploy to Google Cloud

**Files:**

- Create: `apps/api/Dockerfile`
- Create: `apps/api/.dockerignore`
- Create: `docs/backend-deployment.md`
- Modify: `apps/api/package.json`
- Modify: `.env.example`

**Interfaces:**

- Consumes: production build, Prisma migration, validated environment, health endpoint.
- Produces: production container and documented Cloud Run HTTPS URL.

- [ ] **Step 1: Write a container smoke-test checklist before the Dockerfile**
  - Container must start with `PORT`, bind `0.0.0.0`, answer `/health`, and stop cleanly.

- [ ] **Step 2: Create a multi-stage production Dockerfile**
  - Include generated Prisma client and compiled JavaScript.
  - Exclude source secrets, test artifacts, and development watcher.
  - Prefer a non-root runtime user.

- [ ] **Step 3: Build and run locally**
  - Run: `docker build -f apps/api/Dockerfile -t ace-transactions-api .`
  - Run the image with explicit safe local environment values.
  - Expected: `/health` returns `200`.

- [ ] **Step 4: Provision/configure GCP with human-approved project, region, and cost settings**
  - Artifact Registry.
  - Cloud SQL PostgreSQL database/user.
  - Secret Manager values.
  - Least-privilege Cloud Run runtime identity.

- [ ] **Step 5: Apply migrations through a controlled Cloud Run job or approved one-off migration step**
  - Never run development migration generation in production.

- [ ] **Step 6: Deploy Cloud Run with Cloud SQL connection and secrets**

- [ ] **Step 7: Verify production independently**
  - Stop the local API.
  - Request production `/health`.
  - Run Newman/Postman against the Cloud Run URL.
  - Confirm created records persist in Cloud SQL.
  - Confirm logs contain request IDs and no secrets.

- [ ] **Step 8: Commit deployment artifacts and documentation only**
  - Commit message: `deploy(api): document Cloud Run and Cloud SQL release`

### Task 14: Execute the backend release gate

**Files:**

- Create: `docs/backend-release-checklist.md`
- Modify only if verification finds an approved defect: relevant backend file and its regression test.

**Interfaces:**

- Consumes: all backend tasks.
- Produces: signed-off production API contract and URL for frontend work.

- [ ] **Step 1: Apply migrations to a clean test database**
  - Expected: no error and expected tables/constraints exist.

- [ ] **Step 2: Run all local quality commands**
  - `npm run lint --workspace @ace/api`
  - `npm run typecheck --workspace @ace/api`
  - `npm test --workspace @ace/api`
  - `npm run build --workspace @ace/api`
  - Expected: every command exits `0`; test output shows zero failures.

- [ ] **Step 3: Run the production Postman collection with local backend stopped**
  - Expected: all required endpoints and negative tests pass.

- [ ] **Step 4: Manually verify the five Review Focus conditions**
  - Link each condition to its automated test output.

- [ ] **Step 5: Perform secret and artifact review**
  - Confirm no `.env`, tokens, service-account JSON, database URLs, or passwords are tracked.

- [ ] **Step 6: Freeze the frontend contract**
  - Record production base URL, DTOs, status values, error envelope, and Postman collection version.

- [ ] **Step 7: Mark backend ready only with fresh evidence**
  - Commit message: `chore(api): record backend release verification`

---

## 7. Backend execution waves

| Wave | Tasks | Parallelism |
|---|---|---|
| 1 | Tasks 1–4 | Sequential foundation; coordinator closely reviews shared files |
| 2 | Tasks 5–7 | Security primitives first; registration/login/profile follow |
| 3 | Tasks 8–10 | Transaction vertical slices, sequential because they share domain files |
| 4 | Tasks 11–12 | Hardening and documentation may run in parallel after contract freeze |
| 5 | Tasks 13–14 | Deployment followed by coordinator-led release verification |

Do not parallelize two tasks that modify the same feature module. Faster execution is not worth hidden contract drift.

---

## 8. Backend exit gate before frontend implementation

The coordinator must record all answers as **yes**:

- [ ] Is the Cloud Run URL reachable over HTTPS?
- [ ] Does the API work with the local backend stopped?
- [ ] Are all required endpoints implemented?
- [ ] Do clean migrations create the correct Cloud SQL-compatible schema?
- [ ] Do authentication, ownership, idempotency, and status-transition tests pass?
- [ ] Does the Postman collection pass against production?
- [ ] Are response DTOs and errors frozen for frontend consumption?
- [ ] Are loading/retry-relevant HTTP behaviors documented?
- [ ] Are secrets absent from tracked files and logs?
- [ ] Has the human reviewed and approved moving to [`frontend plan.md`](<frontend plan.md>)?

Only after this gate passes should frontend implementation begin.

