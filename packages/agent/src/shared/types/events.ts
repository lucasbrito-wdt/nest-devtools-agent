/**
 * Tipos de eventos rastreados pelo DevTools
 */
export enum EventType {
  REQUEST = 'request',
  EXCEPTION = 'exception',
  LOG = 'log',
  QUERY = 'query',
  JOB = 'job',
  SCHEDULE = 'schedule',
  HTTP_CLIENT = 'http_client',
  REDIS = 'redis',
  SESSION = 'session',
}

/**
 * Metadata base para todos os eventos
 */
export interface BaseEventMeta {
  timestamp: number;
  hostname?: string;
  pid?: number;
  environment?: string;
  requestId?: string;
}

/**
 * Metadata de requisição HTTP
 */
export interface RequestEventMeta extends BaseEventMeta {
  method: string;
  url: string;
  route?: string;
  statusCode?: number;
  headers?: Record<string, string | string[]>;
  responseHeaders?: Record<string, string | string[]>;
  query?: Record<string, any>;
  params?: Record<string, string>;
  body?: any;
  response?: any;
  duration: number;
  userAgent?: string;
  ip?: string;
  sessionId?: string;
  userId?: string;
  sessionData?: any;
}

/**
 * Metadata de exceção
 */
export interface ExceptionEventMeta extends BaseEventMeta {
  name: string;
  message: string;
  stack?: string;
  statusCode?: number;
  method?: string;
  url?: string;
  route?: string;
  hostname?: string;
  ip?: string;
  userId?: string;
  context?: Record<string, any>;
}

/**
 * Metadata de log
 */
export interface LogEventMeta extends BaseEventMeta {
  level: 'log' | 'error' | 'warn' | 'debug' | 'verbose';
  message: string;
  context?: string;
  trace?: string;
  metadata?: Record<string, any>;
}

/**
 * Metadata de query SQL
 */
export interface QueryEventMeta extends BaseEventMeta {
  query: string;
  parameters?: any[];
  duration: number;
  connection?: string;
  database?: string;
}

/**
 * Metadata de job/queue
 */
export interface JobEventMeta extends BaseEventMeta {
  jobId: string;
  jobName: string;
  queueName: string;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  data?: any;
  error?: string;
  duration?: number;
  attempts?: number;
}

/**
 * Metadata de schedule/cron
 */
export interface ScheduleEventMeta extends BaseEventMeta {
  jobId: string;
  jobName: string;
  cronExpression?: string;
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt?: number;
  completedAt?: number;
  duration?: number;
  error?: string;
  result?: any;
  nextRunAt?: number;
}

/**
 * Metadata de HTTP Client (outgoing requests)
 */
export interface HttpClientEventMeta extends BaseEventMeta {
  method: string;
  url: string;
  baseURL?: string;
  clientType?: 'axios' | 'fetch' | 'httpService' | 'unknown';
  headers?: Record<string, string | string[]>;
  requestBody?: any;
  responseStatus?: number;
  responseHeaders?: Record<string, string | string[]>;
  responseBody?: any;
  duration: number;
  error?: string;
  timeout?: number;
  retries?: number;
}

/**
 * Metadata de operação Redis
 */
export interface RedisEventMeta extends BaseEventMeta {
  command: string;
  args?: any[];
  key?: string;
  value?: any;
  duration: number;
  error?: string;
  database?: number;
  result?: any;
}

/**
 * Metadata de sessão
 */
export interface SessionEventMeta extends BaseEventMeta {
  sessionId: string;
  userId?: string;
  action: 'created' | 'updated' | 'destroyed' | 'accessed';
  sessionData?: any;
  expiresAt?: number;
  ip?: string;
  userAgent?: string;
}

/**
 * Union type de todas as metadata possíveis
 */
export type EventMeta =
  | RequestEventMeta
  | ExceptionEventMeta
  | LogEventMeta
  | QueryEventMeta
  | JobEventMeta
  | ScheduleEventMeta
  | HttpClientEventMeta
  | RedisEventMeta
  | SessionEventMeta;

/**
 * Estrutura de um evento completo
 */
export interface DevToolsEvent<T extends EventMeta = EventMeta> {
  type: EventType;
  meta: T;
}

/**
 * Evento persistido no banco (com ID e timestamps)
 */
export interface PersistedEvent {
  id: string;
  type: EventType;
  payload: EventMeta;
  route?: string;
  status?: number;
  createdAt: Date;
}
