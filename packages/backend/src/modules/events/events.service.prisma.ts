import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryEventsDto } from './dto/query-events.dto';
import { PaginatedEventsResponse, DevToolsStats, EventType } from '@nest-devtools/shared';
import { Prisma } from '@prisma/client';

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
    const where: Prisma.EventWhereInput = {};

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

    if (query.projectId) {
      where.projectId = query.projectId;
    }

    // Execute queries
    const [data, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: query.order === 'ASC' ? 'asc' : 'desc' },
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

    const [totalEvents, totalRequests, totalErrors, avgResponseTime] = await Promise.all([
      this.prisma.event.count({ where }),
      this.prisma.event.count({
        where: { ...where, type: EventType.HTTP_REQUEST },
      }),
      this.prisma.event.count({
        where: {
          ...where,
          OR: [{ type: EventType.ERROR }, { type: EventType.HTTP_REQUEST, status: { gte: 400 } }],
        },
      }),
      this.getAverageResponseTime(projectId),
    ]);

    return {
      totalEvents,
      totalRequests,
      totalErrors,
      avgResponseTime,
      errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
    };
  }

  /**
   * Calcula tempo médio de resposta
   */
  private async getAverageResponseTime(projectId?: string): Promise<number> {
    const events = await this.prisma.event.findMany({
      where: {
        projectId,
        type: EventType.HTTP_REQUEST,
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
