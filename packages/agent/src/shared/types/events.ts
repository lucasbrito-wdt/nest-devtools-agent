/**
 * Tipos de eventos rastreados pelo DevTools
 */
export enum EventType {
  REQUEST = 'request',
  EXCEPTION = 'exception',
  LOG = 'log',
  QUERY = 'query',
  JOB = 'job',
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
  query?: Record<string, any>;
  params?: Record<string, string>;
  body?: any;
  response?: any;
  duration: number;
  userAgent?: string;
  ip?: string;
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
 * Union type de todas as metadata possíveis
 */
export type EventMeta =
  | RequestEventMeta
  | ExceptionEventMeta
  | LogEventMeta
  | QueryEventMeta
  | JobEventMeta;

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

