-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('ADMIN', 'DEVELOPER', 'VIEWER');

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "api_key" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "retention_days" INTEGER NOT NULL DEFAULT 30,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'VIEWER',
    "project_id" UUID,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "oauth_provider" TEXT,
    "oauth_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "project_id" UUID,
    "type" VARCHAR(50) NOT NULL,
    "payload" JSONB NOT NULL,
    "route" VARCHAR(500),
    "status" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_api_key_key" ON "projects"("api_key");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "events_project_id_idx" ON "events"("project_id");

-- CreateIndex
CREATE INDEX "events_type_idx" ON "events"("type");

-- CreateIndex
CREATE INDEX "events_route_idx" ON "events"("route");

-- CreateIndex
CREATE INDEX "events_status_idx" ON "events"("status");

-- CreateIndex
CREATE INDEX "events_created_at_idx" ON "events"("created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

