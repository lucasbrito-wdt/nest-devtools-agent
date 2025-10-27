-- Inicialização do banco de dados DevTools

-- Cria extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cria enum para user_role
DO $$ BEGIN
    CREATE TYPE "user_role" AS ENUM ('ADMIN', 'DEVELOPER', 'VIEWER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Cria tabela de projetos (multi-tenancy)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    api_key TEXT UNIQUE NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    retention_days INT NOT NULL DEFAULT 30,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Cria tabela de usuários (RBAC)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    name TEXT NOT NULL,
    role "user_role" NOT NULL DEFAULT 'VIEWER',
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL ON UPDATE CASCADE,
    active BOOLEAN NOT NULL DEFAULT true,
    oauth_provider TEXT,
    oauth_id TEXT,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Cria tabela de eventos (principais dados)
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL ON UPDATE CASCADE,
    type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    route VARCHAR(500),
    status INT,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Cria índices para performance
CREATE INDEX IF NOT EXISTS idx_projects_api_key ON projects(api_key);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_events_project_id ON events(project_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_route ON events(route);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);

-- Índice GIN para busca no payload JSONB
CREATE INDEX IF NOT EXISTS idx_events_payload_gin ON events USING GIN(payload);

-- Comentários
COMMENT ON TABLE projects IS 'Tabela de projetos (multi-tenancy)';
COMMENT ON TABLE users IS 'Tabela de usuários com RBAC';
COMMENT ON TABLE events IS 'Tabela principal de eventos capturados pelo DevTools';
COMMENT ON COLUMN events.type IS 'Tipo de evento: request, exception, log, query, job';
COMMENT ON COLUMN events.payload IS 'Payload completo do evento em formato JSON';
COMMENT ON COLUMN events.route IS 'Rota HTTP (para indexação rápida)';
COMMENT ON COLUMN events.status IS 'Status code HTTP (para indexação rápida)';

-- View para estatísticas rápidas
CREATE OR REPLACE VIEW event_stats AS
SELECT 
    type,
    COUNT(*) as total,
    MIN(created_at) as first_seen,
    MAX(created_at) as last_seen
FROM events
GROUP BY type;

-- Função para cleanup de eventos antigos
CREATE OR REPLACE FUNCTION cleanup_old_events(retention_days INT)
RETURNS INT AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM events 
    WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Exemplo de uso: SELECT cleanup_old_events(7);

