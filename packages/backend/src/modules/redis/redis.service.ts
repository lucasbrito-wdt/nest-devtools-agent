import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryRedisDto } from './dto/query-redis.dto';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly prisma: PrismaService) {
    this.logger.log('🔴 RedisService inicializado');
  }

  /**
   * Lista operações Redis com filtros e paginação
   */
  async findAll(query: QueryRedisDto) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    this.logger.debug(`🔍 Consultando Redis operations - Página ${page}, Limit ${limit}`);

    // Build where clause
    const where: any = {};

    if (query.projectId) {
      where.projectId = query.projectId;
    }

    if (query.command) {
      where.command = { contains: query.command, mode: 'insensitive' };
    }

    if (query.key) {
      where.key = { contains: query.key, mode: 'insensitive' };
    }

    if (query.fromDate && query.toDate) {
      where.createdAt = {
        gte: new Date(query.fromDate),
        lte: new Date(query.toDate),
      };
    }

    // Execute queries
    const [data, total] = await Promise.all([
      this.prisma.redisOperation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.redisOperation.count({ where }),
    ]);

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
   * Busca operação Redis por ID
   */
  async findOne(id: string) {
    const operation = await this.prisma.redisOperation.findUnique({
      where: { id },
    });

    if (!operation) {
      throw new NotFoundException(`Redis operation with ID ${id} not found`);
    }

    return operation;
  }

  /**
   * Cria uma nova operação Redis
   */
  async create(data: {
    command: string;
    args?: any;
    key?: string;
    value?: any;
    duration: number;
    error?: string;
    database?: number;
    result?: any;
    projectId?: string;
  }) {
    return this.prisma.redisOperation.create({
      data,
    });
  }

  /**
   * Retorna estatísticas de operações Redis
   */
  async getStats(projectId?: string) {
    const where = projectId ? { projectId } : {};

    const [totalOperations, successfulOperations, failedOperations, avgDuration] =
      await Promise.all([
        this.prisma.redisOperation.count({ where }),
        this.prisma.redisOperation.count({ where: { ...where, error: null } }),
        this.prisma.redisOperation.count({ where: { ...where, error: { not: null } } }),
        this.getAverageDuration(projectId),
      ]);

    const successRate = totalOperations > 0 ? (successfulOperations / totalOperations) * 100 : 0;

    return {
      totalOperations,
      successfulOperations,
      failedOperations,
      avgDuration,
      successRate,
    };
  }

  /**
   * Calcula duração média das operações
   */
  private async getAverageDuration(projectId?: string): Promise<number> {
    const operations = await this.prisma.redisOperation.findMany({
      where: { projectId },
      select: { duration: true },
    });

    if (operations.length === 0) return 0;

    const sum = operations.reduce((acc, op) => acc + op.duration, 0);
    return sum / operations.length;
  }

  /**
   * Retorna operações mais lentas
   */
  async getSlowestOperations(limit: number = 10, projectId?: string) {
    const where = projectId ? { projectId } : {};

    return this.prisma.redisOperation.findMany({
      where,
      orderBy: { duration: 'desc' },
      take: limit,
      select: {
        id: true,
        command: true,
        key: true,
        duration: true,
        createdAt: true,
      },
    });
  }

  /**
   * Retorna distribuição de comandos
   */
  async getCommandDistribution(projectId?: string) {
    const where = projectId ? { projectId } : {};

    const operations = await this.prisma.redisOperation.findMany({
      where,
      select: { command: true },
    });

    const distribution: Record<string, number> = {};
    operations.forEach((op) => {
      distribution[op.command] = (distribution[op.command] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Retorna chaves mais acessadas
   */
  async getMostAccessedKeys(limit: number = 10, projectId?: string) {
    const where: any = {
      key: { not: null },
    };

    if (projectId) {
      where.projectId = projectId;
    }

    const operations = await this.prisma.redisOperation.findMany({
      where,
      select: { key: true },
    });

    // Count occurrences
    const keyCounts: Record<string, number> = {};
    operations.forEach((op) => {
      if (op.key) {
        keyCounts[op.key] = (keyCounts[op.key] || 0) + 1;
      }
    });

    // Sort and limit
    return Object.entries(keyCounts)
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Remove operações antigas
   */
  async cleanupOld(projectId: string, retentionDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.prisma.redisOperation.deleteMany({
      where: {
        projectId,
        createdAt: { lt: cutoffDate },
      },
    });

    return result.count;
  }
}
