import { EventType, PersistedEvent } from './events';

/**
 * Request para ingestão de evento
 */
export interface IngestEventRequest {
  type: EventType;
  meta: Record<string, any>;
}

/**
 * Response de ingestão
 */
export interface IngestEventResponse {
  success: boolean;
  eventId?: string;
  error?: string;
}

/**
 * Filtros para consulta de eventos
 */
export interface EventsQueryFilters {
  type?: EventType | EventType[];
  route?: string;
  status?: number;
  method?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
}

/**
 * Parâmetros de paginação
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Response paginado de eventos
 */
export interface PaginatedEventsResponse {
  data: PersistedEvent[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Estatísticas gerais
 */
export interface DevToolsStats {
  totalEvents: number;
  totalRequests: number;
  totalExceptions: number;
  totalLogs: number;
  averageResponseTime: number;
  successRate: number;
  last24Hours: {
    requests: number;
    exceptions: number;
  };
}

/**
 * Mensagem de WebSocket
 */
export interface WebSocketMessage {
  event: 'new-event' | 'stats-update' | 'ping';
  data?: PersistedEvent | DevToolsStats;
}

