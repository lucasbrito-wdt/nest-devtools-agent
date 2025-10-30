# Docker Build Fix Summary

## Issues Fixed

### 1. TypeScript Module Not Found Error

**Problem:** When building Docker containers, the build failed with:

```
error: Module not found '/app/packages/shared/node_modules/.bin/../typescript/bin/tsc'
```

**Root Cause:** In a Bun monorepo setup, running `bun install` at the workspace root doesn't always properly install devDependencies for individual packages. TypeScript was listed as a devDependency in `packages/shared/package.json` but wasn't being installed in the package's local `node_modules`.

**Solution:** Added explicit `bun install` commands in each package directory before building:

- **Dockerfile** (root, for backend in docker-compose)
- **packages/backend/Dockerfile**
- **packages/frontend/Dockerfile**

### 2. NestJS CLI Not Found Error

**Problem:** Backend containers failed to start with:

```
/bin/sh: nest: not found
error: script "dev" exited with code 127
```

**Root Cause:** The `nest` CLI command wasn't being resolved properly when running `bun dev`, which executed `nest start --watch`.

**Solution:**

1. Updated `packages/backend/package.json` dev script to use `bunx`:

   ```json
   "dev": "bunx --bun nest start --watch"
   ```

2. Added `bun install` in the backend package directory to ensure `@nestjs/cli` is properly installed

3. Updated `docker-compose.yml` to use `bun run dev` instead of `bun dev` for both backend and frontend

## Files Modified

### 1. `Dockerfile` (root)

```dockerfile
# Build do pacote shared primeiro (dependência do backend)
# Instalar dependências localmente no shared para garantir que typescript esteja disponível
WORKDIR /app/packages/shared
RUN bun install
RUN bun run build
```

### 2. `packages/backend/Dockerfile`

```dockerfile
# Construir shared primeiro (dependência do backend)
# Instalar dependências localmente no shared para garantir que typescript esteja disponível
WORKDIR /app/packages/shared
RUN bun install
RUN bun run build

# Gerar Prisma Client e build do backend
WORKDIR /app/packages/backend
RUN bun install
RUN bunx prisma generate
RUN bun run build
```

### 3. `packages/frontend/Dockerfile`

```dockerfile
# Construir shared primeiro
# Instalar dependências localmente no shared para garantir que typescript esteja disponível
WORKDIR /app/packages/shared
RUN bun install
RUN bun run build
```

### 4. `packages/backend/package.json`

```json
{
  "scripts": {
    "dev": "bunx --bun nest start --watch"
  }
}
```

### 5. `docker-compose.yml`

```yaml
backend:
  command: bun run dev

frontend:
  command: bun run dev -- --host 0.0.0.0
```

## Verification

After applying these fixes, all containers build and run successfully:

```bash
$ docker-compose ps
NAME                IMAGE                          COMMAND                  SERVICE    STATUS
devtools-backend    nest-devtools-agent-backend    "/usr/local/bin/dock…"   backend    Up
devtools-frontend   nest-devtools-agent-frontend   "/usr/local/bin/dock…"   frontend   Up
devtools-postgres   postgres:16-alpine             "docker-entrypoint.s…"   postgres   Up (healthy)
devtools-redis      redis:7-alpine                 "docker-entrypoint.s…"   redis      Up (healthy)
```

### Backend Logs

```
🔭 DevTools Backend running on http://localhost:4001
```

### Frontend Logs

```
VITE v5.4.21  ready in 295 ms
➜  Local:   http://localhost:3000/
```

## How to Use

To rebuild and start all containers:

```bash
# Stop and remove existing containers
docker-compose down

# Rebuild and start all services
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

## Key Learnings

1. **Bun Monorepo Behavior:** In Bun monorepos, workspace-level `bun install` doesn't guarantee that individual packages will have their devDependencies installed locally.

2. **CLI Resolution:** When using Bun to run scripts that invoke CLI tools, use `bunx` to ensure proper resolution of the CLI binaries.

3. **Docker Compose Commands:** Always use `bun run <script>` instead of `bun <script>` in docker-compose to ensure proper script execution through package.json.

## Date

October 27, 2025
