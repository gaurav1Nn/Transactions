# ------------------------------------------------------------------------------
# Build Stage
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma engine compatibility
RUN apk add --no-cache openssl libc6-compat

# Copy workspace package manifests
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/

# Install full dependencies for building
RUN npm ci

# Copy Prisma schema and application source
COPY apps/api/prisma ./apps/api/prisma
COPY apps/api/tsconfig.json ./apps/api/
COPY apps/api/src ./apps/api/src

# Generate Prisma Client and compile TypeScript
RUN npm run prisma:generate --workspace @ace/api
RUN npm run build --workspace @ace/api

# ------------------------------------------------------------------------------
# Production Runner Stage
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

# Install OpenSSL required by Prisma runtime
RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=3000

# Copy workspace manifests and install production-only dependencies
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
RUN npm ci --omit=dev

# Copy generated Prisma client and compiled output from builder
COPY --from=builder /app/node_modules/@prisma /app/node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=builder /app/apps/api/prisma /app/apps/api/prisma
COPY --from=builder /app/apps/api/dist /app/apps/api/dist

# Set permissions for non-root node user
RUN chown -R node:node /app

USER node

WORKDIR /app/apps/api

EXPOSE 3000 8080

CMD ["node", "dist/server.js"]
