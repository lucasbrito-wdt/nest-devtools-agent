import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryHttpClientDto } from './dto/query-http-client.dto';

@Injectable()
export class HttpClientService {
  private readonly logger = new Logger(HttpClientService.name);

  constructor(private readonly prisma: PrismaService) {
    this.logger.log('🌐 HttpClientService inicializado');
  }

  /**
   * Lista requisições HTTP de saída com filtros e paginação
   */
  async findAll(query: QueryHttpClientDto) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    this.logger.debug(`🔍 Consultando HTTP clients - Página ${page}, Limit ${limit}`);

    // Build where clause
    const where: any = {};

    if (query.projectId) {
      where.projectId = query.projectId;
    }

    if (query.method) {
      where.method = query.method;
    }

    if (query.url) {
      where.url = { contains: query.url, mode: 'insensitive' };
    }

    if (query.responseStatus) {
      where.responseStatus = query.responseStatus;
    }

    if (query.fromDate && query.toDate) {
      where.createdAt = {
        gte: new Date(query.fromDate),
        lte: new Date(query.toDate),
      };
    }

    // Execute queries
    const [data, total] = await Promise.all([
      this.prisma.httpClient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.httpClient.count({ where }),
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
   * Busca requisição HTTP por ID
   */
  async findOne(id: string) {
    const httpClient = await this.prisma.httpClient.findUnique({
      where: { id },
    });

    if (!httpClient) {
      throw new NotFoundException(`HTTP Client request with ID ${id} not found`);
    }

    return httpClient;
  }

  /**
   * Cria uma nova requisição HTTP
   */
  async create(data: {
    method: string;
    url: string;
    baseURL?: string;
    headers?: any;
    requestBody?: any;
    responseStatus?: number;
    responseHeaders?: any;
    responseBody?: any;
    duration: number;
    error?: string;
    timeout?: number;
    retries?: number;
    projectId?: string;
  }) {
    return this.prisma.httpClient.create({
      data,
    });
  }

  /**
   * Retorna estatísticas de requisições HTTP
   */
  async getStats(projectId?: string) {
    const where = projectId ? { projectId } : {};

    const [totalRequests, successfulRequests, failedRequests, avgDuration] = await Promise.all([
      this.prisma.httpClient.count({ where }),
      this.prisma.httpClient.count({
        where: { ...where, responseStatus: { gte: 200, lt: 400 } },
      }),
      this.prisma.httpClient.count({
        where: { ...where, responseStatus: { gte: 400 } },
      }),
      this.getAverageDuration(projectId),
    ]);

    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      avgDuration,
      successRate,
    };
  }

  /**
   * Calcula duração média das requisições
   */
  private async getAverageDuration(projectId?: string): Promise<number> {
    const requests = await this.prisma.httpClient.findMany({
      where: { projectId },
      select: { duration: true },
    });

    if (requests.length === 0) return 0;

    const sum = requests.reduce((acc, r) => acc + r.duration, 0);
    return sum / requests.length;
  }

  /**
   * Retorna requisições mais lentas
   */
  async getSlowestRequests(limit: number = 10, projectId?: string) {
    const where = projectId ? { projectId } : {};

    return this.prisma.httpClient.findMany({
      where,
      orderBy: { duration: 'desc' },
      take: limit,
      select: {
        id: true,
        method: true,
        url: true,
        duration: true,
        responseStatus: true,
        createdAt: true,
      },
    });
  }

  /**
   * Retorna distribuição de status codes
   */
  async getStatusDistribution(projectId?: string) {
    const where = projectId ? { projectId } : {};

    const requests = await this.prisma.httpClient.findMany({
      where,
      select: { responseStatus: true },
    });

    const distribution: Record<string, number> = {};
    requests.forEach((r) => {
      const status = r.responseStatus?.toString() || 'unknown';
      distribution[status] = (distribution[status] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Retorna endpoints mais chamados
   */
  async getMostCalledEndpoints(limit: number = 10, projectId?: string) {
    const where = projectId ? { projectId } : {};

    const requests = await this.prisma.httpClient.findMany({
      where,
      select: { url: true },
    });

    // Count occurrences
    const urlCounts: Record<string, number> = {};
    requests.forEach((r) => {
      urlCounts[r.url] = (urlCounts[r.url] || 0) + 1;
    });

    // Sort and limit
    return Object.entries(urlCounts)
      .map(([url, count]) => ({ url, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Remove requisições antigas
   */
  async cleanupOld(projectId: string, retentionDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.prisma.httpClient.deleteMany({
      where: {
        projectId,
        createdAt: { lt: cutoffDate },
      },
    });

    return result.count;
  }
}
