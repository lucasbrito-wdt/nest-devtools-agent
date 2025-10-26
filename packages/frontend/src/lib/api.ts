import axios from 'axios';
import {
  PaginatedEventsResponse,
  DevToolsStats,
  EventsQueryFilters,
  PaginationParams,
} from '@nest-devtools/shared';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const eventsApi = {
  /**
   * Lista eventos com filtros
   */
  list: async (
    filters?: EventsQueryFilters,
    pagination?: PaginationParams,
  ): Promise<PaginatedEventsResponse> => {
    const response = await api.get('/events', {
      params: { ...filters, ...pagination },
    });
    return response.data;
  },

  /**
   * Busca evento por ID
   */
  get: async (id: string) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  /**
   * Retorna estatísticas
   */
  stats: async (): Promise<DevToolsStats> => {
    const response = await api.get('/events/stats/summary');
    return response.data;
  },
};

