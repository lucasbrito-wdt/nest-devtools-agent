# Monitoramento e Performance do Supabase

## 📋 Visão Geral

Configure monitoramento completo do Supabase para rastrear performance, custos, uso de recursos e identificar gargalos.

## 🎯 Métricas Principais

1. **Database Performance**: Queries, conexões, cache hit rate
2. **API Usage**: Requisições, latência, erros
3. **Storage**: Uso de espaço, uploads, downloads
4. **Auth**: Logins, usuários ativos, sessões
5. **Realtime**: Conexões WebSocket, mensagens
6. **Custos**: Estimativa mensal, alertas de limite

## 1. Dashboard do Supabase

### 1.1 Database Reports

**Database** → **Reports**

```
📊 Métricas disponíveis:
- Query Performance
- Slow Queries (> 1s)
- Most Frequent Queries
- Table Sizes
- Index Usage
- Connection Pool Status
```

### 1.2 API Usage

**Settings** → **API** → **Usage**

```
📊 Métricas:
- Total Requests
- Requests per Second
- Response Time (P50, P95, P99)
- Error Rate
- Bandwidth Usage
```

### 1.3 Storage Usage

**Storage** → **Usage**

```
📊 Métricas:
- Total Storage Used
- Files Count
- Bandwidth (Upload/Download)
- Storage by Bucket
```

## 2. Logs e Debugging

### 2.1 Query Logs

```sql
-- Habilitar log de queries lentas
ALTER SYSTEM SET log_min_duration_statement = 1000; -- 1 segundo
SELECT pg_reload_conf();

-- Ver queries lentas
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;
```

### 2.2 Connection Monitoring

```sql
-- Ver conexões ativas
SELECT
  pid,
  usename,
  application_name,
  client_addr,
  state,
  query_start,
  state_change,
  query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;

-- Matar conexão travada
SELECT pg_terminate_backend(pid);
```

### 2.3 Table Statistics

```sql
-- Tamanho das tabelas
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Estatísticas de uso
SELECT
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch,
  n_tup_ins,
  n_tup_upd,
  n_tup_del
FROM pg_stat_user_tables
ORDER BY seq_scan DESC;
```

## 3. Integração com Backend

### 3.1 Metrics Service

```typescript:packages/backend/src/modules/metrics/metrics.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Cron, CronExpression } from '@nestjs/schedule';

interface DatabaseMetrics {
  connections: number;
  queryCount: number;
  slowQueries: number;
  cacheHitRate: number;
  tableSize: Record<string, number>;
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  /**
   * Coletar métricas a cada 5 minutos
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async collectMetrics() {
    this.logger.log('Collecting database metrics...');

    try {
      const metrics = await this.getDatabaseMetrics();
      await this.storeMetrics(metrics);
      await this.checkAlerts(metrics);
    } catch (error) {
      this.logger.error('Error collecting metrics:', error);
    }
  }

  /**
   * Obter métricas do banco
   */
  async getDatabaseMetrics(): Promise<DatabaseMetrics> {
    // Conexões ativas
    const { data: connections } = await this.supabase.rpc('get_active_connections');

    // Queries lentas (últimas 24h)
    const { data: slowQueries } = await this.supabase.rpc('get_slow_queries', {
      threshold_ms: 1000,
    });

    // Tamanho das tabelas
    const { data: tableSizes } = await this.supabase.rpc('get_table_sizes');

    // Cache hit rate
    const { data: cacheStats } = await this.supabase.rpc('get_cache_hit_rate');

    return {
      connections: connections?.length || 0,
      queryCount: 0, // Implementar
      slowQueries: slowQueries?.length || 0,
      cacheHitRate: cacheStats?.hit_rate || 0,
      tableSize: tableSizes || {},
    };
  }

  /**
   * Armazenar métricas
   */
  private async storeMetrics(metrics: DatabaseMetrics) {
    await this.supabase.from('metrics').insert({
      timestamp: new Date().toISOString(),
      type: 'database',
      data: metrics,
    });
  }

  /**
   * Verificar alertas
   */
  private async checkAlerts(metrics: DatabaseMetrics) {
    // Alerta: Muitas conexões
    if (metrics.connections > 80) {
      this.logger.warn(`High connection count: ${metrics.connections}`);
      // Enviar notificação
    }

    // Alerta: Muitas queries lentas
    if (metrics.slowQueries > 10) {
      this.logger.warn(`High slow query count: ${metrics.slowQueries}`);
    }

    // Alerta: Cache hit rate baixo
    if (metrics.cacheHitRate < 0.9) {
      this.logger.warn(`Low cache hit rate: ${metrics.cacheHitRate}`);
    }
  }

  /**
   * Obter métricas de API
   */
  async getApiMetrics(startDate: Date, endDate: Date) {
    // Implementar integração com Supabase Management API
    // https://supabase.com/docs/reference/api/introduction
  }

  /**
   * Obter estimativa de custos
   */
  async getCostEstimate() {
    const metrics = await this.getDatabaseMetrics();

    // Calcular baseado em:
    // - Database size
    // - Bandwidth
    // - API requests
    // - Storage

    return {
      database: this.calculateDatabaseCost(metrics),
      bandwidth: 0, // Implementar
      storage: 0, // Implementar
      total: 0,
    };
  }

  private calculateDatabaseCost(metrics: DatabaseMetrics): number {
    // Free tier: 500MB
    // Pro: $25/mês base + $0.125/GB adicional
    const totalSizeGB = Object.values(metrics.tableSize).reduce((a, b) => a + b, 0) / 1024 / 1024 / 1024;

    if (totalSizeGB <= 0.5) return 0; // Free tier

    const additionalGB = totalSizeGB - 8; // Pro inclui 8GB
    return additionalGB > 0 ? 25 + (additionalGB * 0.125) : 25;
  }
}
```

### 3.2 Database Functions

```sql
-- Função: Conexões ativas
CREATE OR REPLACE FUNCTION get_active_connections()
RETURNS TABLE (
  pid int,
  username text,
  database text,
  state text,
  query text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pg_stat_activity.pid,
    pg_stat_activity.usename::text,
    pg_stat_activity.datname::text,
    pg_stat_activity.state::text,
    pg_stat_activity.query::text
  FROM pg_stat_activity
  WHERE state != 'idle'
  AND datname = current_database();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: Queries lentas
CREATE OR REPLACE FUNCTION get_slow_queries(threshold_ms int DEFAULT 1000)
RETURNS TABLE (
  query text,
  calls bigint,
  total_time double precision,
  mean_time double precision,
  max_time double precision
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pg_stat_statements.query::text,
    pg_stat_statements.calls,
    pg_stat_statements.total_exec_time,
    pg_stat_statements.mean_exec_time,
    pg_stat_statements.max_exec_time
  FROM pg_stat_statements
  WHERE mean_exec_time > threshold_ms
  ORDER BY mean_exec_time DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: Tamanho das tabelas
CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS TABLE (
  table_name text,
  total_size bigint,
  table_size bigint,
  indexes_size bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tablename::text,
    pg_total_relation_size(schemaname||'.'||tablename),
    pg_relation_size(schemaname||'.'||tablename),
    pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: Cache hit rate
CREATE OR REPLACE FUNCTION get_cache_hit_rate()
RETURNS TABLE (
  hit_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN (blks_hit + blks_read) = 0 THEN 0
      ELSE ROUND(blks_hit::numeric / (blks_hit + blks_read), 4)
    END
  FROM pg_stat_database
  WHERE datname = current_database();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 4. Alertas e Notificações

### 4.1 Email Alerts

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AlertService {
  constructor(private configService: ConfigService) {}

  async sendAlert(type: string, message: string, severity: 'info' | 'warning' | 'critical') {
    // Integrar com serviço de email (SendGrid, AWS SES, etc.)
    console.log(`[${severity.toUpperCase()}] ${type}: ${message}`);

    // Exemplo: Enviar para Slack
    // await this.slackService.send({
    //   channel: '#alerts',
    //   text: `🚨 ${type}: ${message}`,
    // });
  }
}
```

### 4.2 Thresholds

```typescript
const ALERT_THRESHOLDS = {
  connections: {
    warning: 80,
    critical: 150,
  },
  slowQueries: {
    warning: 10,
    critical: 50,
  },
  cacheHitRate: {
    warning: 0.85,
    critical: 0.7,
  },
  diskUsage: {
    warning: 0.8, // 80%
    critical: 0.9, // 90%
  },
};
```

## 5. Dashboard Customizado

### 5.1 Metrics Endpoint

```typescript:packages/backend/src/modules/metrics/metrics.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MetricsService } from './metrics.service';

@Controller('metrics')
@UseGuards(AuthGuard('jwt'))
export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  @Get('database')
  async getDatabaseMetrics() {
    return this.metricsService.getDatabaseMetrics();
  }

  @Get('api')
  async getApiMetrics(
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return this.metricsService.getApiMetrics(
      new Date(start),
      new Date(end),
    );
  }

  @Get('costs')
  async getCostEstimate() {
    return this.metricsService.getCostEstimate();
  }
}
```

### 5.2 Frontend Dashboard

```typescript:packages/frontend/src/pages/Monitoring.tsx
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      const data = await api.get('/metrics/database');
      setMetrics(data);
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // Atualizar a cada minuto

    return () => clearInterval(interval);
  }, []);

  if (!metrics) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-3 gap-4">
      <MetricCard
        title="Connections"
        value={metrics.connections}
        max={200}
        unit="conn"
      />
      <MetricCard
        title="Slow Queries"
        value={metrics.slowQueries}
        threshold={10}
        unit="queries"
      />
      <MetricCard
        title="Cache Hit Rate"
        value={metrics.cacheHitRate * 100}
        threshold={90}
        unit="%"
      />
    </div>
  );
}
```

## 6. Otimizações

### 6.1 Indexes

```sql
-- Analisar queries sem índices
SELECT
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  seq_tup_read / seq_scan AS avg_seq_tup_read
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC
LIMIT 20;

-- Criar índices necessários
CREATE INDEX CONCURRENTLY idx_events_project_type
ON events(project_id, type);

CREATE INDEX CONCURRENTLY idx_events_created_at_desc
ON events(created_at DESC);
```

### 6.2 Vacuum e Analyze

```sql
-- Vacuum automático (já habilitado no Supabase)
-- Manual quando necessário:
VACUUM ANALYZE events;

-- Ver estatísticas de vacuum
SELECT
  schemaname,
  tablename,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables;
```

### 6.3 Connection Pooling

```typescript
// Já configurado no typeorm.config.ts
export const typeOrmConfig = {
  // ...
  extra: {
    max: 20, // Máximo de conexões
    min: 5, // Mínimo de conexões
    idle: 10000, // Tempo de idle (ms)
  },
};
```

## 7. Backup e Recovery

### 7.1 Backups Automáticos

```
Settings → Database → Backups

Free tier: Daily backups (7 dias de retenção)
Pro tier: Point-in-time recovery (7-30 dias)
```

### 7.2 Manual Backup

```bash
# Via pg_dump
pg_dump -h db.[project-ref].supabase.co \
  -U postgres \
  -d postgres \
  -F c \
  -f backup_$(date +%Y%m%d).dump

# Restore
pg_restore -h db.[project-ref].supabase.co \
  -U postgres \
  -d postgres \
  -c backup_20250126.dump
```

## 8. Custos e Limites

### 8.1 Free Tier Limits

```
Database: 500 MB
Storage: 1 GB
Bandwidth: 2 GB
API Requests: Unlimited
Realtime: 200 concurrent connections
Auth: 50,000 MAU (Monthly Active Users)
```

### 8.2 Monitorar Uso

```typescript
async checkUsageLimits() {
  const metrics = await this.getDatabaseMetrics();
  const totalSize = Object.values(metrics.tableSize).reduce((a, b) => a + b, 0);

  const usage = {
    database: {
      used: totalSize,
      limit: 500 * 1024 * 1024, // 500MB
      percentage: (totalSize / (500 * 1024 * 1024)) * 100,
    },
  };

  if (usage.database.percentage > 80) {
    await this.alertService.sendAlert(
      'Database Usage',
      `Database is ${usage.database.percentage.toFixed(2)}% full`,
      'warning',
    );
  }

  return usage;
}
```

## 9. Próximos Passos

- ✅ Monitoramento configurado
- ⏳ Integrar com Grafana/Prometheus
- ⏳ Configurar alertas no PagerDuty
- ⏳ Implementar auto-scaling
- ⏳ Criar relatórios mensais

## 📚 Recursos

- [Supabase Monitoring](https://supabase.com/docs/guides/platform/metrics)
- [PostgreSQL Performance](https://www.postgresql.org/docs/current/monitoring-stats.html)
- [Database Optimization](https://supabase.com/docs/guides/database/database-optimization)
