import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryEventsDto } from './dto/query-events.dto';
import { PaginatedEventsResponse, DevToolsStats, EventType } from '@nest-devtools/shared';

/**
 * Serviço de consulta e gerenciamento de eventos (Prisma)
 */
@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista eventos com filtros e paginação
   */
  async findAll(query: QueryEventsDto): Promise<PaginatedEventsResponse> {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Filtros
    if (query.type) {
      const types = Array.isArray(query.type) ? query.type : [query.type];
      where.type = { in: types };
    }

    if (query.route) {
      where.route = { contains: query.route, mode: 'insensitive' };
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.method && typeof query.method === 'string') {
      where.payload = {
        path: ['method'],
        equals: query.method,
      };
    }

    if (query.fromDate && query.toDate) {
      where.createdAt = {
        gte: new Date(query.fromDate),
        lte: new Date(query.toDate),
      };
    }

    // Execute queries
    const [data, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      data: data as any, // Type assertion para compatibilidade
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Busca evento por ID
   */
  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  /**
   * Cria um novo evento
   */
  async create(data: {
    type: string;
    payload: any;
    route?: string;
    status?: number;
    projectId?: string;
  }) {
    return this.prisma.event.create({
      data: {
        type: data.type,
        payload: data.payload,
        route: data.route,
        status: data.status,
        projectId: data.projectId,
      },
    });
  }

  /**
   * Remove eventos antigos baseado na retenção do projeto
   */
  async cleanupOldEvents(projectId: string, retentionDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.prisma.event.deleteMany({
      where: {
        projectId,
        createdAt: { lt: cutoffDate },
      },
    });

    return result.count;
  }

  /**
   * Gera estatísticas agregadas
   */
  async getStats(projectId?: string): Promise<DevToolsStats> {
    const where = projectId ? { projectId } : {};

    const [totalEvents, totalRequests, avgResponseTime] = await Promise.all([
      this.prisma.event.count({ where }),
      this.prisma.event.count({
        where: { ...where, type: EventType.REQUEST },
      }),
      this.getAverageResponseTime(projectId),
    ]);

    return {
      totalEvents,
      totalRequests,
      averageResponseTime: avgResponseTime,
      errorRate: 0,
    };
  }

  /**
   * Calcula tempo médio de resposta
   */
  private async getAverageResponseTime(projectId?: string): Promise<number> {
    const events = await this.prisma.event.findMany({
      where: {
        projectId,
        type: EventType.REQUEST,
      },
      select: { payload: true },
    });

    if (events.length === 0) return 0;

    const durations = events
      .map((e: any) => e.payload?.duration)
      .filter((d: number) => typeof d === 'number');

    if (durations.length === 0) return 0;

    const sum = durations.reduce((a: number, b: number) => a + b, 0);
    return sum / durations.length;
  }

  /**
   * Exporta eventos para JSON
   */
  async exportToJson(query: QueryEventsDto): Promise<any[]> {
    const { data } = await this.findAll({ ...query, limit: 10000 });
    return data;
  }

  /**
   * Retorna métricas de performance
   */
  async getPerformanceMetrics(hours: number = 24) {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    const events = await this.prisma.event.findMany({
      where: {
        type: EventType.REQUEST,
        createdAt: { gte: since },
      },
      select: { payload: true, createdAt: true },
    });

    return {
      totalRequests: events.length,
      avgDuration: this.calculateAvgDuration(events),
      p95Duration: this.calculatePercentile(events, 95),
      p99Duration: this.calculatePercentile(events, 99),
    };
  }

  /**
   * Retorna distribuição de status codes
   */
  async getStatusDistribution() {
    const events = await this.prisma.event.findMany({
      where: { type: EventType.REQUEST },
      select: { status: true },
    });

    const distribution: Record<string, number> = {};
    events.forEach((e: any) => {
      const status = e.status?.toString() || 'unknown';
      distribution[status] = (distribution[status] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Retorna rotas mais lentas
   */
  async getSlowestRoutes(limit: number = 10) {
    const events = await this.prisma.event.findMany({
      where: { type: EventType.REQUEST },
      select: { route: true, payload: true },
    });

    const routeStats: Record<string, { count: number; totalDuration: number }> = {};

    events.forEach((e: any) => {
      const route = e.route || 'unknown';
      const duration = e.payload?.duration || 0;

      if (!routeStats[route]) {
        routeStats[route] = { count: 0, totalDuration: 0 };
      }

      routeStats[route].count++;
      routeStats[route].totalDuration += duration;
    });

    return Object.entries(routeStats)
      .map(([route, stats]) => ({
        route,
        avgDuration: stats.totalDuration / stats.count,
        count: stats.count,
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, limit);
  }

  private calculateAvgDuration(events: any[]): number {
    if (events.length === 0) return 0;
    const durations = events.map((e) => e.payload?.duration || 0);
    return durations.reduce((a, b) => a + b, 0) / durations.length;
  }

  private calculatePercentile(events: any[], percentile: number): number {
    if (events.length === 0) return 0;
    const durations = events.map((e) => e.payload?.duration || 0).sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * durations.length) - 1;
    return durations[index] || 0;
  }

  /**
   * Exporta eventos para CSV
   */
  async exportToCsv(query: QueryEventsDto): Promise<string> {
    const { data } = await this.findAll({ ...query, limit: 10000 });

    const headers = ['ID', 'Type', 'Route', 'Status', 'Duration', 'Created At'];
    const rows = data.map((event: any) => {
      const payload = event.payload as any;
      return [
        event.id,
        event.type,
        event.route || '',
        event.status || '',
        payload?.duration || '',
        new Date(event.createdAt).toISOString(),
      ];
    });

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }

  /**
   * Busca eventos similares
   */
  async findSimilar(eventId: string, limit: number = 10) {
    const baseEvent = await this.findOne(eventId);

    return this.prisma.event.findMany({
      where: {
        type: baseEvent.type,
        route: baseEvent.route,
        id: { not: eventId },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}
