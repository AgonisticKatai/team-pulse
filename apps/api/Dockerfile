# ============================================
# Stage 1: Dependencies
# Install all dependencies (dev + prod)
# ============================================
FROM node:25-alpine AS deps

# Install corepack and bash (needed for build scripts)
RUN apk add --no-cache python3 make g++ bash && \
    npm install -g corepack --force && \
    corepack enable && \
    corepack prepare pnpm@10.23.0 --activate

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Copy all package.json files (monorepo structure)
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# ============================================
# Stage 2: Builder
# Build TypeScript to JavaScript
# ============================================
FROM node:25-alpine AS builder

# Install corepack and bash for build scripts
RUN apk add --no-cache bash && \
    npm install -g corepack --force && \
    corepack enable && \
    corepack prepare pnpm@10.23.0 --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy workspace configuration
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.json turbo.json ./

# Copy source code
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# Build the application
# 10. Build the API using turbo directly
RUN pnpm turbo run build --filter=@team-pulse/api

# ============================================
# Stage 3: Production Dependencies
# Install only production dependencies
# ============================================
FROM node:25-alpine AS prod-deps

RUN npm install -g corepack --force && \
    corepack enable && \
    corepack prepare pnpm@10.23.0 --activate

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Copy package.json files
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install ONLY production dependencies (ignore scripts like husky)
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# ============================================
# Stage 4: Runner
# Minimal production image with only runtime files
# ============================================
FROM node:25-alpine AS runner

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy production dependencies
COPY --from=prod-deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=prod-deps --chown=nodejs:nodejs /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=prod-deps --chown=nodejs:nodejs /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared/dist ./packages/shared/dist

# Copy Drizzle migrations
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/drizzle ./apps/api/drizzle

# Copy package.json for metadata
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/package.json ./apps/api/

# Set working directory to api
WORKDIR /app/apps/api

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly (PID 1 problem)
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]
