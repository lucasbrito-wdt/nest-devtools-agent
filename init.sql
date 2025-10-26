-- Inicialização do banco de dados DevTools

-- Cria extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cria tabela de eventos
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    route VARCHAR(500),
    status INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cria índices para performance
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_route ON events(route);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);

-- Índice GIN para busca no payload JSONB
CREATE INDEX IF NOT EXISTS idx_events_payload_gin ON events USING GIN(payload);

-- Comentários
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

