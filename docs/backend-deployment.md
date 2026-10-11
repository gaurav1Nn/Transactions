# ACE Digital Transaction Management System — Backend Deployment Guide

This guide details the containerization and production deployment of the Express REST API service to Google Cloud Run and Google Cloud SQL for PostgreSQL.

---

## 1. Production Architecture

```text
┌─────────────────────────────────┐
│ React Native (Android APK)      │
└────────────────┬────────────────┘
                 │ HTTPS (TLS 1.3)
                 ▼
┌─────────────────────────────────┐
│ Google Cloud Run                │
│ Service: ace-transactions-api   │
│ Port: 8080 (injected $PORT)     │
└────────────────┬────────────────┘
                 │ Cloud SQL Unix Socket / Proxy
                 ▼
┌─────────────────────────────────┐
│ Google Cloud SQL (PostgreSQL)   │
│ Instance: ace-transactions-db   │
│ Database: ace_transactions_prod │
└─────────────────────────────────┘
```

### Resource Naming & Isolation Rules

Per project safety policies:
- All resources are dedicated to this project and prefixed with `ace-`.
- Cloud SQL instance: `ace-transactions-db` (never shared with any other project).
- Production database name: `ace_transactions_prod`.
- Cloud Run service: `ace-transactions-api`.
- Artifact Registry: `ace-api-repo`.
- Service account: `ace-api-sa`.
- Secret Manager: `ace-api-env`.

---

## 2. Container Smoke-Test Checklist

Before deploying the container to Cloud Run, verify locally:

- [ ] **Multi-stage build:** Dockerfile uses multi-stage build (`builder` -> `runner`), excluding source code secrets, test files, and development dependencies.
- [ ] **Non-root user:** Container runs as the unprivileged `node` user (`USER node`).
- [ ] **Port binding:** Listens on `0.0.0.0` and respects the injected `PORT` environment variable (Cloud Run injects `PORT=8080`).
- [ ] **Health endpoint:** `/health` responds with `200 OK` and `{ "data": { "status": "ok" } }`.
- [ ] **Graceful termination:** Process stops cleanly when receiving `SIGTERM`.
- [ ] **No tracked secrets:** Image contains no embedded `.env` or credentials.

---

## 3. Local Docker Build & Verification

Build the image from workspace root:

```bash
docker build -f apps/api/Dockerfile -t ace-transactions-api .
```

Run locally:

```bash
docker run -p 3000:3000 \
  -e PORT=3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://user:pass@host:5432/ace_transactions_dev" \
  -e JWT_SECRET="production-secret-min-32-chars-long-here" \
  ace-transactions-api
```

Test health:

```bash
curl http://localhost:3000/health
```

---

## 4. Google Cloud Platform Provisioning

Confirm active account, project ID, and region with the coordinator (Gate C). Pass `--project` and `--region` explicitly on all commands.

```bash
export GCP_PROJECT="<YOUR_GCP_PROJECT_ID>"
export GCP_REGION="us-central1"
```

### 4.1. Enable Required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  --project="${GCP_PROJECT}"
```

### 4.2. Create Artifact Registry Repository

```bash
gcloud artifacts repositories create ace-api-repo \
  --repository-format=docker \
  --location="${GCP_REGION}" \
  --description="Docker repository for ACE Transactions API" \
  --project="${GCP_PROJECT}"
```

### 4.3. Provision Cloud SQL PostgreSQL Instance

```bash
gcloud sql instances create ace-transactions-db \
  --database-version=POSTGRES_16 \
  --tier=db-custom-1-3840 \
  --region="${GCP_REGION}" \
  --storage-type=SSD \
  --storage-size=10GB \
  --backup \
  --project="${GCP_PROJECT}"
```

Create production database and user:

```bash
gcloud sql databases create ace_transactions_prod \
  --instance=ace-transactions-db \
  --project="${GCP_PROJECT}"

# Generate a strong password
DB_PASSWORD=$(openssl rand -base64 24)

gcloud sql users create ace_user \
  --instance=ace-transactions-db \
  --password="${DB_PASSWORD}" \
  --project="${GCP_PROJECT}"
```

### 4.4. Configure Secret Manager

Store sensitive secrets in Google Secret Manager:

```bash
# Store JWT Secret
openssl rand -base64 32 | tr -d '\n' | gcloud secrets create ace-jwt-secret \
  --data-file=- \
  --replication-policy="automatic" \
  --project="${GCP_PROJECT}"

# Store Database URL
# Format for Cloud Run Unix socket connection:
# postgresql://ace_user:<DB_PASSWORD>@localhost/ace_transactions_prod?host=/cloudsql/<PROJECT_ID>:<REGION>:ace-transactions-db
INSTANCE_CONNECTION_NAME="${GCP_PROJECT}:${GCP_REGION}:ace-transactions-db"
DATABASE_URL="postgresql://ace_user:${DB_PASSWORD}@localhost/ace_transactions_prod?host=/cloudsql/${INSTANCE_CONNECTION_NAME}"

echo -n "${DATABASE_URL}" | gcloud secrets create ace-database-url \
  --data-file=- \
  --replication-policy="automatic" \
  --project="${GCP_PROJECT}"
```

### 4.5. Create Least-Privilege Service Account

```bash
gcloud iam service-accounts create ace-api-sa \
  --display-name="ACE Transactions API Runtime Service Account" \
  --project="${GCP_PROJECT}"

SA_EMAIL="ace-api-sa@${GCP_PROJECT}.iam.gserviceaccount.com"

# Grant Cloud SQL Client
gcloud projects add-iam-policy-binding "${GCP_PROJECT}" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/cloudsql.client"

# Grant Secret Manager Secret Accessor
gcloud secrets add-iam-policy-binding ace-database-url \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor" \
  --project="${GCP_PROJECT}"

gcloud secrets add-iam-policy-binding ace-jwt-secret \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor" \
  --project="${GCP_PROJECT}"
```

---

## 5. Build & Push Image to Artifact Registry

```bash
IMAGE_TAG="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT}/ace-api-repo/api:latest"

# Authenticate docker with Artifact Registry
gcloud auth configure-docker "${GCP_REGION}-docker.pkg.dev" --project="${GCP_PROJECT}"

# Build and push
docker build -f apps/api/Dockerfile -t "${IMAGE_TAG}" .
docker push "${IMAGE_TAG}"
```

---

## 6. Run Database Migrations in Production

Migrations must use `prisma migrate deploy` (never development generation `migrate dev`).

Run as a one-off Cloud Run Job:

```bash
gcloud run jobs create ace-migration-job \
  --image="${IMAGE_TAG}" \
  --region="${GCP_REGION}" \
  --service-account="${SA_EMAIL}" \
  --add-cloudsql-instances="${INSTANCE_CONNECTION_NAME}" \
  --set-secrets="DATABASE_URL=ace-database-url:latest" \
  --command="npx" \
  --args="prisma,migrate,deploy" \
  --project="${GCP_PROJECT}"

# Execute migration job
gcloud run jobs execute ace-migration-job \
  --region="${GCP_REGION}" \
  --wait \
  --project="${GCP_PROJECT}"
```

---

## 7. Deploy Cloud Run Service

```bash
gcloud run deploy ace-transactions-api \
  --image="${IMAGE_TAG}" \
  --region="${GCP_REGION}" \
  --service-account="${SA_EMAIL}" \
  --add-cloudsql-instances="${INSTANCE_CONNECTION_NAME}" \
  --set-secrets="DATABASE_URL=ace-database-url:latest,JWT_SECRET=ace-jwt-secret:latest" \
  --set-env-vars="NODE_ENV=production,LOG_LEVEL=info,CORS_ORIGINS=*,TRUST_PROXY_HOPS=1" \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=5 \
  --memory=512Mi \
  --cpu=1 \
  --timeout=60s \
  --project="${GCP_PROJECT}"
```

Retrieve service URL:

```bash
export PROD_URL=$(gcloud run services describe ace-transactions-api \
  --region="${GCP_REGION}" \
  --project="${GCP_PROJECT}" \
  --format="value(status.url)")
echo "Production URL: ${PROD_URL}"
```

---

## 8. Independent Production Verification

1. Stop local development backend.
2. Verify production health:
   ```bash
   curl "${PROD_URL}/health"
   # Response: {"data":{"status":"ok"}}
   ```
3. Update `postman/production.postman_environment.example.json` with `baseUrl: "${PROD_URL}"`.
4. Run Newman against production:
   ```bash
   npx newman run postman/ACE-Transactions.postman_collection.json \
     -e postman/production.postman_environment.example.json
   ```
5. Confirm Cloud Run logs contain request IDs and no secret values.
