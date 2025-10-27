/**
 * Configuração do DevTools Agent
 */
export interface DevToolsAgentConfig {
  /**
   * Habilita/desabilita o DevTools (NUNCA habilite em produção sem autenticação!)
   */
  enabled: boolean;

  /**
   * URL do backend DevTools
   */
  backendUrl: string;

  /**
   * API Key para autenticação com o backend
   */
  apiKey: string;

  /**
   * Tamanho máximo do body a ser capturado (em bytes)
   * @default 10240 (10KB)
   */
  maxBodySize?: number;

  /**
   * Timeout para envio de eventos (em ms)
   * @default 5000
   */
  timeout?: number;

  /**
   * Número máximo de tentativas de envio
   * @default 3
   */
  maxRetries?: number;

  /**
   * Buffer de eventos quando o backend está offline
   * @default false
   */
  enableBuffer?: boolean;

  /**
   * Tamanho máximo do buffer
   * @default 100
   */
  maxBufferSize?: number;

  /**
   * Campos sensíveis para redação (não serão enviados)
   * @default ['password', 'token', 'secret', 'authorization', 'cookie']
   */
  sensitiveFields?: string[];

  /**
   * Capturar headers da requisição
   * @default true
   */
  captureHeaders?: boolean;

  /**
   * Capturar body da requisição
   * @default true
   */
  captureBody?: boolean;

  /**
   * Capturar response
   * @default false
   */
  captureResponse?: boolean;

  /**
   * Capturar response headers
   * @default false
   */
  captureResponseHeaders?: boolean;

  /**
   * Capturar dados de sessão
   * @default false
   */
  captureSession?: boolean;

  /**
   * Capturar eventos de schedule/cron
   * @default false
   */
  captureSchedule?: boolean;

  /**
   * Capturar requisições HTTP de saída (HTTP Client)
   * @default false
   */
  captureHttpClient?: boolean;

  /**
   * Capturar operações Redis
   * @default false
   */
  captureRedis?: boolean;

  /**
   * Configuração de conexão Redis (necessária se captureRedis = true)
   */
  redisConfig?: {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
  };

  /**
   * Ambiente (dev, staging, production)
   */
  environment?: string;
}

/**
 * Configuração do DevTools Backend
 */
export interface DevToolsBackendConfig {
  /**
   * Porta do servidor
   * @default 4000
   */
  port: number;

  /**
   * API Key esperada dos agents
   */
  apiKey: string;

  /**
   * URLs permitidas para CORS
   */
  corsOrigins: string[];

  /**
   * Database URL (Postgres)
   */
  databaseUrl: string;

  /**
   * Redis URL (opcional, para cache)
   */
  redisUrl?: string;

  /**
   * Política de retenção (em dias)
   * @default 7
   */
  retentionDays: number;

  /**
   * Rate limit (requests por minuto por IP)
   * @default 100
   */
  rateLimit: number;

  /**
   * Habilitar WebSocket para realtime
   * @default true
   */
  enableWebSocket: boolean;
}
