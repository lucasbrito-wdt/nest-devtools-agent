import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Event } from './entities/event.entity';
import { QueryEventsDto } from './dto/query-events.dto';
import { PaginatedEventsResponse, DevToolsStats, EventType } from '@nest-devtools/shared';

/**
 * Serviço de consulta e gerenciamento de eventos
 */
@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  /**
   * Lista eventos com filtros e paginação
   */
  async findAll(query: QueryEventsDto): Promise<PaginatedEventsResponse> {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    // Monta query builder
    const qb = this.eventRepository.createQueryBuilder('event');

    // Filtros
    if (query.type) {
      const types = Array.isArray(query.type) ? query.type : [query.type];
      qb.andWhere('event.type IN (:...types)', { types });
    }

    if (query.route) {
      qb.andWhere('event.route ILIKE :route', { route: `%${query.route}%` });
    }

    if (query.status) {
      qb.andWhere('event.status = :status', { status: query.status });
    }

    if (query.method) {
      qb.andWhere("event.payload->>'method' = :method", { method: query.method });
    }

    if (query.fromDate && query.toDate) {
      qb.andWhere('event.createdAt BETWEEN :fromDate AND :toDate', {
        fromDate: new Date(query.fromDate),
        toDate: new Date(query.toDate),
      });
    }

    if (query.search) {
      qb.andWhere(
        "(event.route ILIKE :search OR event.payload::text ILIKE :search)",
        { search: `%${query.search}%` },
      );
    }

    // Ordenação
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'DESC';
    qb.orderBy(`event.${sortBy}`, sortOrder);

    // Paginação
    qb.skip(skip).take(limit);

    // Executa
    const [data, total] = await qb.getManyAndCount();

    return {
      data,
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
  async findOne(id: string): Promise<Event> {
    const event = await this.eventRepository.findOne({ where: { id } });

    if (!event) {
      throw new NotFoundException(`Event ${id} not found`);
    }

    return event;
  }

  /**
   * Retorna estatísticas gerais
   */
  async getStats(): Promise<DevToolsStats> {
    const totalEvents = await this.eventRepository.count();

    const totalRequests = await this.eventRepository.count({
      where: { type: EventType.REQUEST },
    });

    const totalExceptions = await this.eventRepository.count({
      where: { type: EventType.EXCEPTION },
    });

    const totalLogs = await this.eventRepository.count({
      where: { type: EventType.LOG },
    });

    // Última 24h
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const last24HoursRequests = await this.eventRepository.count({
      where: {
        type: EventType.REQUEST,
        createdAt: Between(yesterday, new Date()),
      },
    });

    const last24HoursExceptions = await this.eventRepository.count({
      where: {
        type: EventType.EXCEPTION,
        createdAt: Between(yesterday, new Date()),
      },
    });

    // Calcula average response time
    const avgResult = await this.eventRepository
      .createQueryBuilder('event')
      .select("AVG((event.payload->>'duration')::int)", 'avg')
      .where('event.type = :type', { type: EventType.REQUEST })
      .andWhere("event.payload->>'duration' IS NOT NULL")
      .getRawOne();

    const averageResponseTime = avgResult?.avg ? parseFloat(avgResult.avg) : 0;

    // Success rate (status < 400)
    const successfulRequests = await this.eventRepository.count({
      where: {
        type: EventType.REQUEST,
        status: Between(200, 399),
      },
    });

    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;

    return {
      totalEvents,
      totalRequests,
      totalExceptions,
      totalLogs,
      averageResponseTime,
      successRate,
      last24Hours: {
        requests: last24HoursRequests,
        exceptions: last24HoursExceptions,
      },
    };
  }

  /**
   * Remove eventos antigos (cleanup job)
   */
  async cleanup(retentionDays: number): Promise<number> {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    const result = await this.eventRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected || 0;
  }

  /**
   * Exporta eventos para CSV
   */
  async exportToCsv(query: QueryEventsDto): Promise<string> {
    const { data } = await this.findAll({ ...query, limit: 10000 }); // Max 10k

    const headers = ['ID', 'Type', 'Route', 'Status', 'Duration', 'Created At'];
    const rows = data.map((event) => [
      event.id,
      event.type,
      event.route || '',
      event.status || '',
      event.payload.duration || '',
      event.createdAt.toISOString(),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return csv;
  }

  /**
   * Exporta eventos para JSON
   */
  async exportToJson(query: QueryEventsDto): Promise<any> {
    const { data } = await this.findAll({ ...query, limit: 10000 });
    return data;
  }

  /**
   * Retorna métricas de performance ao longo do tempo
   */
  async getPerformanceMetrics(hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const result = await this.eventRepository
      .createQueryBuilder('event')
      .select("DATE_TRUNC('hour', event.createdAt)", 'hour')
      .addSelect('COUNT(*)', 'count')
      .addSelect("AVG((event.payload->>'duration')::int)", 'avgDuration')
      .addSelect("MAX((event.payload->>'duration')::int)", 'maxDuration')
      .addSelect("MIN((event.payload->>'duration')::int)", 'minDuration')
      .where('event.type = :type', { type: EventType.REQUEST })
      .andWhere('event.createdAt > :since', { since })
      .groupBy("DATE_TRUNC('hour', event.createdAt)")
      .orderBy("DATE_TRUNC('hour', event.createdAt)", 'ASC')
      .getRawMany();

    return result.map((row) => ({
      timestamp: row.hour,
      count: parseInt(row.count),
      avgDuration: parseFloat(row.avgduration) || 0,
      maxDuration: parseInt(row.maxduration) || 0,
      minDuration: parseInt(row.minduration) || 0,
    }));
  }

  /**
   * Retorna distribuição de status codes
   */
  async getStatusDistribution() {
    const result = await this.eventRepository
      .createQueryBuilder('event')
      .select('event.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('event.type = :type', { type: EventType.REQUEST })
      .andWhere('event.status IS NOT NULL')
      .groupBy('event.status')
      .orderBy('count', 'DESC')
      .getRawMany();

    return result.map((row) => ({
      status: row.status,
      count: parseInt(row.count),
    }));
  }

  /**
   * Retorna rotas mais lentas
   */
  async getSlowestRoutes(limit: number = 10) {
    const result = await this.eventRepository
      .createQueryBuilder('event')
      .select('event.route', 'route')
      .addSelect('COUNT(*)', 'count')
      .addSelect("AVG((event.payload->>'duration')::int)", 'avgDuration')
      .addSelect("MAX((event.payload->>'duration')::int)", 'maxDuration')
      .where('event.type = :type', { type: EventType.REQUEST })
      .andWhere('event.route IS NOT NULL')
      .andWhere("event.payload->>'duration' IS NOT NULL")
      .groupBy('event.route')
      .orderBy('avgDuration', 'DESC')
      .limit(limit)
      .getRawMany();

    return result.map((row) => ({
      route: row.route,
      count: parseInt(row.count),
      avgDuration: parseFloat(row.avgduration),
      maxDuration: parseInt(row.maxduration),
    }));
  }
}
