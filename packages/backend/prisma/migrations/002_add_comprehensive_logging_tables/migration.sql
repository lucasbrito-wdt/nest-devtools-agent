-- Add session and user tracking to events table
ALTER TABLE "events" ADD COLUMN "session_id" VARCHAR(255);
ALTER TABLE "events" ADD COLUMN "user_id" VARCHAR(255);

CREATE INDEX "events_session_id_idx" ON "events"("session_id");
CREATE INDEX "events_user_id_idx" ON "events"("user_id");

-- Create schedules table
CREATE TABLE "schedules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID,
    "job_id" VARCHAR(255) NOT NULL,
    "job_name" VARCHAR(255) NOT NULL,
    "cron_expression" VARCHAR(255),
    "status" VARCHAR(50) NOT NULL,
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "duration" INTEGER,
    "error" TEXT,
    "result" JSONB,
    "next_run_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "schedules_project_id_idx" ON "schedules"("project_id");
CREATE INDEX "schedules_job_id_idx" ON "schedules"("job_id");
CREATE INDEX "schedules_job_name_idx" ON "schedules"("job_name");
CREATE INDEX "schedules_status_idx" ON "schedules"("status");
CREATE INDEX "schedules_created_at_idx" ON "schedules"("created_at");

ALTER TABLE "schedules" ADD CONSTRAINT "schedules_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create http_clients table
CREATE TABLE "http_clients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID,
    "method" VARCHAR(10) NOT NULL,
    "url" TEXT NOT NULL,
    "base_url" TEXT,
    "headers" JSONB,
    "request_body" JSONB,
    "response_status" INTEGER,
    "response_headers" JSONB,
    "response_body" JSONB,
    "duration" INTEGER NOT NULL,
    "error" TEXT,
    "timeout" INTEGER,
    "retries" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "http_clients_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "http_clients_project_id_idx" ON "http_clients"("project_id");
CREATE INDEX "http_clients_method_idx" ON "http_clients"("method");
CREATE INDEX "http_clients_response_status_idx" ON "http_clients"("response_status");
CREATE INDEX "http_clients_created_at_idx" ON "http_clients"("created_at");

ALTER TABLE "http_clients" ADD CONSTRAINT "http_clients_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create redis_operations table
CREATE TABLE "redis_operations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID,
    "command" VARCHAR(50) NOT NULL,
    "args" JSONB,
    "key" VARCHAR(500),
    "value" JSONB,
    "duration" INTEGER NOT NULL,
    "error" TEXT,
    "database" INTEGER,
    "result" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "redis_operations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "redis_operations_project_id_idx" ON "redis_operations"("project_id");
CREATE INDEX "redis_operations_command_idx" ON "redis_operations"("command");
CREATE INDEX "redis_operations_key_idx" ON "redis_operations"("key");
CREATE INDEX "redis_operations_created_at_idx" ON "redis_operations"("created_at");

ALTER TABLE "redis_operations" ADD CONSTRAINT "redis_operations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create sessions table
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID,
    "session_id" VARCHAR(255) NOT NULL,
    "user_id" VARCHAR(255),
    "action" VARCHAR(50) NOT NULL,
    "session_data" JSONB,
    "expires_at" TIMESTAMPTZ(6),
    "ip" VARCHAR(50),
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sessions_project_id_idx" ON "sessions"("project_id");
CREATE INDEX "sessions_session_id_idx" ON "sessions"("session_id");
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");
CREATE INDEX "sessions_action_idx" ON "sessions"("action");
CREATE INDEX "sessions_created_at_idx" ON "sessions"("created_at");

ALTER TABLE "sessions" ADD CONSTRAINT "sessions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

