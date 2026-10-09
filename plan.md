# ACE Digital Transaction Management System

## Master Product and Multi-Agent Roadmap

**Status:** Planning approved for documentation only. Application implementation must begin only after the human explicitly approves the plans.  
**Implementation order:** Backend first → backend deployment and verification → frontend → APK and submission.  
**Assignment duration:** 4 days.  
**Required architecture:** React Native/Expo → Express REST API → PostgreSQL, with Express deployed on Google Cloud Run.

---

## 1. Purpose of this file

This is the coordinator-level roadmap. It gives subagents the overall product context, execution order, ownership rules, phase gates, and final success criteria.

Detailed work lives in two separate plans:

1. [`backend plan.md`](<backend plan.md>) — execute first.
2. [`frontend plan.md`](<frontend plan.md>) — execute only after the backend exit gate passes and the human approves the handoff.

Subagents must not rely on this master roadmap alone. Before editing, each subagent must read the relevant detailed plan and the exact assigned task.

---

## 2. Product objective

Build a production-oriented Android application that allows a user to register, sign in, create mock transactions, simulate their result, and view persistent transaction history and details.

The backend must be a reusable REST service, independently usable by another mobile or web client. All transaction data must persist in PostgreSQL, and the deployed mobile application must call the Cloud Run API rather than a local or hardcoded data source.

### Required user journey

```text
Register or log in
        ↓
View dashboard and profile
        ↓
Create a pending transaction
        ↓
Simulate success or failure
        ↓
View history and transaction details
        ↓
Restart app and confirm server-side persistence
```

---

## 3. Required technology stack

| Area | Required technology |
|---|---|
| Mobile | React Native, Expo, TypeScript |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL |
| Production database | Google Cloud SQL for PostgreSQL |
| API deployment | Google Cloud Run |
| API testing | Postman |
| Authentication | JWT with securely hashed passwords |
| Android delivery | Installable APK |

Supporting implementation libraries are documented in the detailed plans. They support this architecture and must not replace it. Convex is intentionally excluded because it would conflict with the mandatory Express/PostgreSQL backend architecture.

---

## 4. Product scope

### Included

- Registration, existing-user identification, login, JWT authentication, and profile retrieval.
- Secure password hashing and owner-based authorization.
- Transaction creation with unique transaction ID and duplicate prevention.
- Mock payment simulation with Pending, Success, and Failed states.
- Owner-only transaction history and details.
- Required React Native screens with loading, empty, error, and success states.
- PostgreSQL schema and migrations.
- Automated authentication and critical transaction tests.
- Cloud Run, Cloud SQL, and secure production configuration.
- Postman collection, README, Android APK, and five-minute demo.

### Excluded

- Real payments or real payment credentials.
- Convex or another replacement backend/database.
- Admin portal, password reset, social login, email verification, or multi-factor authentication.
- Push notifications and unrelated features.
- iOS release deliverable.

---

## 5. High-level architecture

```text
┌───────────────────────────┐
│ React Native + Expo       │
│ Android application       │
└─────────────┬─────────────┘
              │ HTTPS JSON REST + JWT
              ▼
┌───────────────────────────┐
│ Express + TypeScript      │
│ Google Cloud Run          │
│ routes/controllers        │
│ services/repositories     │
└─────────────┬─────────────┘
              │ Prisma / PostgreSQL protocol
              ▼
┌───────────────────────────┐
│ Cloud SQL PostgreSQL      │
│ Users + Transactions      │
└───────────────────────────┘
```

### Separation rule

- The mobile app communicates only through the documented REST API.
- The backend contains business rules and does not import mobile code.
- PostgreSQL is never accessed directly by the mobile app.
- API request/response contracts form the boundary between backend and frontend.

---

## 6. Capability order

| Phase | Capability | Depends on | Detailed plan |
|---|---|---|---|
| 1 | Backend foundation and database | — | `backend plan.md` |
| 2 | Authentication and profile API | Phase 1 | `backend plan.md` |
| 3 | Transaction API | Phase 2 | `backend plan.md` |
| 4 | Cloud deployment and backend verification | Phase 3 | `backend plan.md` |
| 5 | Mobile foundation and UI system | Approved backend contract | `frontend plan.md` |
| 6 | Mobile authentication and profile | Phase 5 | `frontend plan.md` |
| 7 | Mobile transaction experience | Phase 6 | `frontend plan.md` |
| 8 | Android APK and final delivery | All prior phases | Both plans and final checklist |

The backend is the first product milestone. Frontend implementation is deliberately blocked until the API contract is stable and the backend works through Postman.

---

## 7. Multi-agent coordination model

### Coordinator

The primary/coordinator agent owns:

- Requirement interpretation and plan changes.
- Human approval gates.
- Shared root configuration and API contracts.
- Task sequencing and subagent assignment.
- Preventing file overlap between workers.
- Reviewing verification evidence.
- Final integration and release gates.

### Implementation subagent

An implementation subagent owns one focused task and its tests. It must not edit outside the assigned files without asking the coordinator.

### Specification reviewer

After a task is implemented, a fresh reviewer checks only whether the implementation exactly satisfies the relevant plan task, API contract, and acceptance criteria. It identifies missing, incorrect, or unrequested behavior.

### Quality reviewer

After specification compliance passes, a fresh reviewer checks security, maintainability, error handling, test quality, and unintended regressions.

### Coordinator acceptance

The coordinator independently reads the changes and runs the stated verification commands. A worker's claim is not completion evidence by itself.

### Standard task lifecycle

```text
Assign one task and explicit file ownership
                  ↓
Worker writes failing test and proves failure
                  ↓
Worker implements minimum passing behavior
                  ↓
Worker runs focused verification
                  ↓
Specification review
                  ↓
Quality review
                  ↓
Coordinator runs fresh verification
                  ↓
Accept task and unlock dependent task
```

---

## 8. Rules for every subagent

1. Read this roadmap, the relevant detailed plan, and the assigned task before editing.
2. Treat other agents as active collaborators; never revert or overwrite their work.
3. Modify only explicitly owned files.
4. If a required change crosses ownership, report it to the coordinator instead of making it silently.
5. Use test-driven development for business rules and critical state behavior.
6. Run the exact focused verification command before reporting completion.
7. Report changed files, test output, decisions, assumptions, and remaining risks.
8. Never add secrets, credentials, real tokens, or production `.env` files.
9. Never change the mandatory architecture.
10. Never alter dependencies, schema, API contracts, or global configuration without approval.
11. Do not implement features outside the assignment.
12. Prefer readable, explainable code that the candidate can defend in an interview.

---

## 8A. Project isolation and safety rules

Nothing in any plan may modify, depend on, or break any other project on the machine or in the cloud account. These rules apply to every subagent and every command.

### Local filesystem

- All work stays inside the `TTTT` directory. Never read, edit, move, or delete files in sibling folders or parent directories.
- `TTTT` is its own git repository and npm workspace root. Never create a `package.json`, `node_modules`, or lockfile in a parent directory, and never run `git` commands from outside `TTTT`.
- Install dependencies only as workspace dependencies. No `npm install -g`, no global CLI or Homebrew changes, and no edits to shell profiles or global configuration.

### Database

- Destructive Prisma commands (`migrate reset`, `db push --force-reset`, `DROP`, `TRUNCATE`) may run only against a dedicated local database whose name clearly belongs to this project (for example `ace_transactions_dev` and `ace_transactions_test`).
- Before any destructive command, print the target `DATABASE_URL` host and database name with the password redacted, and confirm it matches this project. Never run destructive commands against Cloud SQL or any database not created for this project.
- Test setup must refuse to run unless the database name ends with `_test`.
- Use a dedicated local Postgres database, container, and port for this project. Never reuse another project's database, container, volume, or port.

### Environment and secrets

- Use only project-scoped `.env` files inside `apps/api` and `apps/mobile`, with committed `.env.example` files. Never read or write environment variables from another project.
- Do not change global git config, SSH keys, or the credentials of any other project.

### Google Cloud and Expo

- Before any `gcloud` command, confirm the active account, project ID, and region with the human (Gate C). Pass `--project` and `--region` explicitly on every command instead of changing the global `gcloud config`.
- If the chosen GCP project hosts other workloads, prefix every new resource with `ace-` (Cloud Run service, Cloud SQL instance, secrets, service account, Artifact Registry repository). Never modify, redeploy, or delete a resource that was not created by this plan.
- Cloud SQL, Cloud Run, and Secret Manager resources must be new and dedicated. Never share a Cloud SQL instance, database, or user with another project.
- Use a dedicated Expo/EAS project slug and Android package ID. Never overwrite another app's EAS project, credentials, or keystore.

### Ports and processes

- Run the local API and Expo on explicit, non-default ports documented in the README. Check that a port is free before binding and never kill a process this project did not start.

### Verification

- Phase 1 exit check: `git status` inside `TTTT` shows only project files, and no files outside `TTTT` have changed.
- Final check: list the cloud resources created and confirm every one carries the `ace-` prefix and is documented in the deployment guide.

---

## 9. Backend-first execution roadmap

The exact tasks and interfaces are in [`backend plan.md`](<backend plan.md>).

### Backend Wave 1 — Foundation

- Create npm workspace and Express TypeScript service.
- Add health endpoint and strict environment validation.
- Define Prisma PostgreSQL schema and migrations.
- Add request IDs, validation middleware, and structured error handling.

### Backend Wave 2 — Identity

- Add password hashing and JWT helpers.
- Implement registration with unique normalized email.
- Implement login with generic invalid-credential errors.
- Add authentication middleware and `/api/users/me`.

### Backend Wave 3 — Transactions

- Create pending transactions with unique public IDs.
- Enforce idempotency and database uniqueness.
- Add owner-only history and detail retrieval.
- Add atomic mock success/failure simulation.
- Test cross-user access and concurrency-sensitive rules.

### Backend Wave 4 — Production readiness

- Add secure headers, limits, logging, and secret redaction.
- Complete Postman collection and API documentation.
- Build Docker container.
- Deploy to Cloud Run with Cloud SQL and Secret Manager.

### Backend Wave 5 — Release gate

- Run lint, typecheck, tests, build, migrations, and Postman.
- Stop the local API and verify production independently.
- Freeze DTOs, error behavior, statuses, pagination, and production base URL.
- Ask the human to approve frontend implementation.

---

## 10. Backend-to-frontend handoff contract

The frontend team receives one verified handoff package:

- Production API base URL.
- Postman collection that passes against production.
- Authentication request and response formats.
- User profile DTO.
- Transaction create, history, details, and simulation contracts.
- Error envelope and important error codes.
- Pagination behavior.
- JWT expiry and `401` behavior.
- Transaction status values and transition rules.
- Idempotency header behavior.

If the frontend discovers a backend contract issue, the coordinator updates the backend spec/plan first, gets approval, adds a backend regression test, and only then changes the contract. Frontend code must not work around undocumented backend behavior.

---

## 11. Frontend execution roadmap

The exact screen, component, hook, and test tasks are in [`frontend plan.md`](<frontend plan.md>). These waves begin only after the backend gate and human approval.

### Frontend Wave 1 — Application foundation

- Scaffold Expo Router and strict TypeScript.
- Establish theme, reusable feedback states, and form controls.
- Add typed API client and public base URL configuration.
- Add SecureStore session restoration and protected navigation.

### Frontend Wave 2 — Authentication and profile

- Build login and registration forms against the deployed API.
- Display server validation and existing-user errors.
- Add profile retrieval and secure logout.

### Frontend Wave 3 — Transaction product

- Build dashboard and recent transaction summary.
- Build safe idempotent transaction creation.
- Build history with loading, empty, error, refresh, and pagination behavior.
- Build details and confirmed mock simulation actions.

### Frontend Wave 4 — Android release

- Verify navigation, accessibility, offline/error states, and expired sessions.
- Run mobile lint, typecheck, tests, and device walkthrough.
- Build and install APK.
- Verify the complete workflow with local backend stopped.

---

## 12. Suggested four-day schedule

### Day 1 — Backend foundation and authentication

- Backend Tasks 1–7.
- Finish schema, migrations, error handling, registration, login, JWT middleware, and profile.
- Verify authentication through automated tests and Postman.
- Check GCP account, project, billing, region, and permissions early.

**Day 1 exit:** Clean migrations work and all authentication/profile tests pass.

### Day 2 — Transactions and backend deployment

- Backend Tasks 8–14.
- Finish transaction creation, idempotency, history, details, simulation, and hardening.
- Deploy Cloud Run and Cloud SQL.
- Run Postman with local API stopped.
- Freeze frontend contract.

**Day 2 exit:** Backend exit gate passes and the human approves frontend work.

### Day 3 — Complete mobile application

- Frontend Tasks 1–13.
- Build foundations, auth/profile, dashboard, creation, history, details, and simulation.
- Integrate every screen with the deployed API.

**Day 3 exit:** Complete Android workflow works against Cloud Run.

### Day 4 — Quality and delivery

- Frontend Tasks 14–15.
- Complete resilience/accessibility checks.
- Build and install APK.
- Finish README, architecture, deployment guide, and demo script.
- Run full repository and production verification.
- Record and review the five-minute video.

**Day 4 exit:** Repository, APK, deployed API URL, migrations, Postman collection, README, and video are ready.

---

## 13. Shared quality gates

A task is not complete merely because files were written. It must have fresh evidence for every relevant gate:

- Focused tests pass.
- TypeScript typecheck passes.
- Lint passes.
- Production build passes when applicable.
- Required manual behavior is demonstrated on the target environment.
- No secrets are present in changed files.
- No unrelated files were modified.
- Specification review passes.
- Quality review passes.
- Coordinator independently verifies the result.

---

## 14. Risk controls

| Risk | Control |
|---|---|
| Backend/frontend contract drift | Freeze and document backend contract before frontend work |
| Agents edit the same file | Explicit ownership and coordinator-owned shared files |
| Duplicate transaction creation | Idempotency key plus PostgreSQL unique constraint and concurrency tests |
| Cross-user data exposure | Owner-scoped queries and two-user integration tests |
| Incorrect decimal money handling | Decimal strings over REST and PostgreSQL `NUMERIC(12,2)` |
| Cloud setup delays | Validate GCP access on Day 1; deploy backend before UI completion |
| Secrets leak | Example environment only, Secret Manager, log redaction, final scan |
| UI hides backend problems | Integrate only against documented production API; no hardcoded release data |
| Four-day scope growth | Enforce explicit exclusions and approval for every scope change |
| APK fails at the end | Configure and test Android/EAS setup before final release gate |

---

## 15. Final deliverables

- Complete GitHub repository.
- Working Android APK.
- Live Cloud Run backend URL.
- Cloud SQL PostgreSQL persistence.
- Database schema and migrations.
- Postman collection and safe example environments.
- README with architecture and setup.
- Automated backend tests and appropriate mobile tests.
- Five-minute demonstration video.

---

## 16. Overall definition of done

- [ ] Registration, duplicate-user handling, login, JWT protection, and profile retrieval work.
- [ ] Passwords are hashed and never leaked.
- [ ] Transactions are created with unique IDs and PostgreSQL persistence.
- [ ] Duplicate creation is prevented under retry and concurrent requests.
- [ ] Pending transactions can become Success or Failed exactly once.
- [ ] Users can access only their own transaction history and details.
- [ ] All required mobile screens work against the deployed API.
- [ ] Loading, empty, error, retry, success, and disabled states are present.
- [ ] Backend lint, typecheck, tests, build, and migrations pass.
- [ ] Mobile lint, typecheck, tests, and Android walkthrough pass.
- [ ] Postman passes against Cloud Run with local API stopped.
- [ ] APK installs and completes the full workflow.
- [ ] Repository contains no secrets or cloud credentials.
- [ ] README and demo explain the product and architecture clearly.
- [ ] Every final artifact link has been opened and verified.

---

## 17. Human approval gates

### Gate A — Start backend

Review this roadmap and [`backend plan.md`](<backend plan.md>). Explicit approval is required before any backend code or configuration is created.

### Gate B — Start frontend

After the backend release gate passes, review its evidence and [`frontend plan.md`](<frontend plan.md>). Explicit approval is required before frontend implementation begins.

### Gate C — Deploy/build externally

GCP provisioning, public Cloud Run deployment, and APK cloud builds may create external resources or costs. Confirm the project, region, billing context, and build method before those actions.

### Gate D — Submit

Review repository visibility, production URL, APK, Postman collection, README, and demo video before final submission.

