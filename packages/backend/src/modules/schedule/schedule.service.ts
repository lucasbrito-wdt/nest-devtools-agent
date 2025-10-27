import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryScheduleDto } from './dto/query-schedule.dto';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(private readonly prisma: PrismaService) {
    this.logger.log('📅 ScheduleService inicializado');
  }

  /**
   * Lista jobs agendados com filtros e paginação
   */
  async findAll(query: QueryScheduleDto) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    this.logger.debug(`🔍 Consultando schedules - Página ${page}, Limit ${limit}`);

    // Build where clause
    const where: any = {};

    if (query.projectId) {
      where.projectId = query.projectId;
    }

    if (query.jobId) {
      where.jobId = { contains: query.jobId, mode: 'insensitive' };
    }

    if (query.jobName) {
      where.jobName = { contains: query.jobName, mode: 'insensitive' };
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.fromDate && query.toDate) {
      where.createdAt = {
        gte: new Date(query.fromDate),
        lte: new Date(query.toDate),
      };
    }

    // Execute queries
    const [data, total] = await Promise.all([
      this.prisma.schedule.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.schedule.count({ where }),
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
   * Busca schedule por ID
   */
  async findOne(id: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    return schedule;
  }

  /**
   * Cria um novo schedule
   */
  async create(data: {
    jobId: string;
    jobName: string;
    cronExpression?: string;
    status: string;
    startedAt?: Date;
    completedAt?: Date;
    duration?: number;
    error?: string;
    result?: any;
    nextRunAt?: Date;
    projectId?: string;
  }) {
    return this.prisma.schedule.create({
      data,
    });
  }

  /**
   * Retorna estatísticas de jobs
   */
  async getStats(projectId?: string) {
    const where = projectId ? { projectId } : {};

    const [totalJobs, completedJobs, failedJobs, runningJobs, avgDuration] = await Promise.all([
      this.prisma.schedule.count({ where }),
      this.prisma.schedule.count({ where: { ...where, status: 'completed' } }),
      this.prisma.schedule.count({ where: { ...where, status: 'failed' } }),
      this.prisma.schedule.count({ where: { ...where, status: 'running' } }),
      this.getAverageDuration(projectId),
    ]);

    const successRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

    return {
      totalJobs,
      completedJobs,
      failedJobs,
      runningJobs,
      avgDuration,
      successRate,
    };
  }

  /**
   * Calcula duração média dos jobs
   */
  private async getAverageDuration(projectId?: string): Promise<number> {
    const schedules = await this.prisma.schedule.findMany({
      where: {
        projectId,
        duration: { not: null },
      },
      select: { duration: true },
    });

    if (schedules.length === 0) return 0;

    const sum = schedules.reduce((acc, s) => acc + (s.duration || 0), 0);
    return sum / schedules.length;
  }

  /**
   * Retorna jobs mais lentos
   */
  async getSlowestJobs(limit: number = 10, projectId?: string) {
    const where: any = {
      duration: { not: null },
    };

    if (projectId) {
      where.projectId = projectId;
    }

    return this.prisma.schedule.findMany({
      where,
      orderBy: { duration: 'desc' },
      take: limit,
      select: {
        id: true,
        jobId: true,
        jobName: true,
        duration: true,
        status: true,
        createdAt: true,
      },
    });
  }

  /**
   * Retorna jobs que falharam mais
   */
  async getMostFailedJobs(limit: number = 10, projectId?: string) {
    const where: any = {
      status: 'failed',
    };

    if (projectId) {
      where.projectId = projectId;
    }

    const failedJobs = await this.prisma.schedule.findMany({
      where,
      select: {
        jobName: true,
      },
    });

    // Count occurrences
    const jobCounts: Record<string, number> = {};
    failedJobs.forEach((job) => {
      jobCounts[job.jobName] = (jobCounts[job.jobName] || 0) + 1;
    });

    // Sort and limit
    return Object.entries(jobCounts)
      .map(([jobName, count]) => ({ jobName, failureCount: count }))
      .sort((a, b) => b.failureCount - a.failureCount)
      .slice(0, limit);
  }

  /**
   * Remove schedules antigos
   */
  async cleanupOld(projectId: string, retentionDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.prisma.schedule.deleteMany({
      where: {
        projectId,
        createdAt: { lt: cutoffDate },
      },
    });

    return result.count;
  }
}
