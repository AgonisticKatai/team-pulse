# 🚀 Deployment Guide

This guide explains how to build and deploy the Team Pulse application using Docker.

## 📦 Production Build with Docker

### Multi-Stage Architecture

The Dockerfile implements an optimized multi-stage build with 4 stages:

1. **deps**: Installs all dependencies (dev + prod)
2. **builder**: Compiles TypeScript to JavaScript
3. **prod-deps**: Installs only production dependencies
4. **runner**: Minimal runtime image

**Benefits**:
- ✅ Small final image (~189MB)
- ✅ No development dependencies
- ✅ No TypeScript source code
- ✅ Layer-cached builds
- ✅ Non-root user for security
- ✅ Health checks included

### Build the Image

```bash
# Using Make
make docker-build

# Or using pnpm
pnpm docker:build

# Or directly
docker build -t team-pulse-api:latest -f apps/api/Dockerfile .
```

### Check Image Size

```bash
make docker-size
# Output: team-pulse-api   latest    6036e130b57e   189MB
```

## 🏃 Production Execution

### Required Environment Variables

Create a `.env` file in `apps/api/` with:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/team_pulse

# JWT
JWT_SECRET=your-secret-key-at-least-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-at-least-32-chars

# Server
NODE_ENV=production
PORT=3000
```

### Run the Container

```bash
# Using Make (recommended)
make docker-run

# Or manually
docker run -d \
  --name team-pulse-api \
  -p 3000:3000 \
  --env-file apps/api/.env \
  team-pulse-api:latest
```

### Manage the Container

```bash
# View logs
docker logs -f team-pulse-api

# Stop
make docker-stop

# Restart
docker restart team-pulse-api

# Clean up (image + container)
make docker-clean
```

## 🏥 Health Checks

The image includes an automatic health check that verifies the `/health` endpoint every 30 seconds:

```bash
# Check health status
docker inspect --format='{{json .State.Health}}' team-pulse-api | jq
```

## 🔒 Security

### Implemented Security Features

- **Non-root user**: Container runs as `nodejs` (UID 1001)
- **No secrets in image**: External environment variables
- **Alpine image**: Minimal base with reduced attack surface
- **No dev dependencies**: Production modules only
- **dumb-init**: Proper signal handling (SIGTERM, SIGINT)

### Best Practices

1. **Don't hardcode secrets** in the Dockerfile
2. **Use .dockerignore** to exclude sensitive files
3. **Scan for vulnerabilities** regularly:
   ```bash
   docker scan team-pulse-api:latest
   ```

## 📊 Monitoring Integration

The container exposes Prometheus metrics at `/metrics`:

```bash
# Check metrics
curl http://localhost:3000/metrics
```

To integrate with existing Prometheus/Grafana:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'team-pulse-api'
    static_configs:
      - targets: ['host.docker.internal:3000']
```

## 🌍 Production Deployment

### Option 1: Docker Compose (Production)

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  api:
    image: team-pulse-api:latest
    ports:
      - "3000:3000"
    env_file:
      - apps/api/.env.production
    depends_on:
      - postgres
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health')"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: team_pulse
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres-data:
```

```bash
docker compose -f docker-compose.prod.yml up -d
```

### Option 2: Cloud Services

#### AWS ECS/Fargate

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com

# Tag and push
docker tag team-pulse-api:latest <account>.dkr.ecr.us-east-1.amazonaws.com/team-pulse-api:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/team-pulse-api:latest
```

#### Google Cloud Run

```bash
# Tag and push to GCR
docker tag team-pulse-api:latest gcr.io/<project-id>/team-pulse-api:latest
docker push gcr.io/<project-id>/team-pulse-api:latest

# Deploy
gcloud run deploy team-pulse-api \
  --image gcr.io/<project-id>/team-pulse-api:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### Azure Container Instances

```bash
# Login to ACR
az acr login --name <registry-name>

# Tag and push
docker tag team-pulse-api:latest <registry-name>.azurecr.io/team-pulse-api:latest
docker push <registry-name>.azurecr.io/team-pulse-api:latest
```

## 🐛 Troubleshooting

### Container doesn't start

```bash
# View full logs
docker logs team-pulse-api

# Enter container
docker exec -it team-pulse-api sh

# Check environment variables
docker exec team-pulse-api env
```

### Database connection issues

If using `localhost` in `DATABASE_URL`, change it to:
- Docker Compose: Use service name (`postgres`)
- Docker manual: Use `host.docker.internal` (macOS/Windows)

### Health check fails

```bash
# Verify server responds
docker exec team-pulse-api wget -O- http://localhost:3000/health

# Check health check status
docker inspect team-pulse-api | grep -A 10 Health
```

## 📈 Additional Optimizations

### Reduce build time

```bash
# Use BuildKit for parallel builds
DOCKER_BUILDKIT=1 docker build -t team-pulse-api:latest -f apps/api/Dockerfile .

# Layer cache with registry
docker build --cache-from team-pulse-api:latest -t team-pulse-api:latest -f apps/api/Dockerfile .
```

### Versioning

```bash
# Build with specific version
docker build -t team-pulse-api:1.0.0 -t team-pulse-api:latest -f apps/api/Dockerfile .

# Push both tags
docker push team-pulse-api:1.0.0
docker push team-pulse-api:latest
```

## 🔗 References

- [Docker Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [Alpine Linux](https://alpinelinux.org/)
- [dumb-init](https://github.com/Yelp/dumb-init)
