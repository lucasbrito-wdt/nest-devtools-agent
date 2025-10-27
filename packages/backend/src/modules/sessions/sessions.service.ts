import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QuerySessionsDto } from './dto/query-sessions.dto';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(private readonly prisma: PrismaService) {
    this.logger.log('🔐 SessionsService inicializado');
  }

  /**
   * Lista sessões com filtros e paginação
   */
  async findAll(query: QuerySessionsDto) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    this.logger.debug(`🔍 Consultando sessions - Página ${page}, Limit ${limit}`);

    // Build where clause
    const where: any = {};

    if (query.projectId) {
      where.projectId = query.projectId;
    }

    if (query.sessionId) {
      where.sessionId = { contains: query.sessionId, mode: 'insensitive' };
    }

    if (query.userId) {
      where.userId = { contains: query.userId, mode: 'insensitive' };
    }

    if (query.action) {
      where.action = query.action;
    }

    if (query.fromDate && query.toDate) {
      where.createdAt = {
        gte: new Date(query.fromDate),
        lte: new Date(query.toDate),
      };
    }

    // Execute queries
    const [data, total] = await Promise.all([
      this.prisma.session.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.session.count({ where }),
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
   * Busca sessão por ID
   */
  async findOne(id: string) {
    const session = await this.prisma.session.findUnique({
      where: { id },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    return session;
  }

  /**
   * Busca todas as ações de uma sessão específica
   */
  async findBySessionId(sessionId: string) {
    return this.prisma.session.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Busca sessões de um usuário específico
   */
  async findByUserId(userId: string, limit: number = 50) {
    return this.prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Cria uma nova sessão
   */
  async create(data: {
    sessionId: string;
    userId?: string;
    action: string;
    sessionData?: any;
    expiresAt?: Date;
    ip?: string;
    userAgent?: string;
    projectId?: string;
  }) {
    return this.prisma.session.create({
      data,
    });
  }

  /**
   * Retorna estatísticas de sessões
   */
  async getStats(projectId?: string) {
    const where = projectId ? { projectId } : {};

    const [totalSessions, activeSessions, uniqueUsers, avgSessionDuration] = await Promise.all([
      this.prisma.session.count({ where }),
      this.getActiveSessions(projectId),
      this.getUniqueUsers(projectId),
      this.getAverageSessionDuration(projectId),
    ]);

    return {
      totalSessions,
      activeSessions,
      uniqueUsers,
      avgSessionDuration,
    };
  }

  /**
   * Conta sessões ativas (não destruídas)
   */
  private async getActiveSessions(projectId?: string): Promise<number> {
    const where: any = {
      action: { not: 'destroyed' },
    };

    if (projectId) {
      where.projectId = projectId;
    }

    // Get unique session IDs
    const sessions = await this.prisma.session.findMany({
      where,
      select: { sessionId: true },
      distinct: ['sessionId'],
    });

    return sessions.length;
  }

  /**
   * Conta usuários únicos
   */
  private async getUniqueUsers(projectId?: string): Promise<number> {
    const where: any = {
      userId: { not: null },
    };

    if (projectId) {
      where.projectId = projectId;
    }

    const users = await this.prisma.session.findMany({
      where,
      select: { userId: true },
      distinct: ['userId'],
    });

    return users.length;
  }

  /**
   * Calcula duração média de sessão
   */
  private async getAverageSessionDuration(projectId?: string): Promise<number> {
    const where = projectId ? { projectId } : {};

    // Get all sessions with created and destroyed actions
    const sessions = await this.prisma.session.findMany({
      where,
      select: {
        sessionId: true,
        action: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by sessionId
    const sessionMap = new Map<string, { created?: Date; destroyed?: Date }>();

    sessions.forEach((s) => {
      if (!sessionMap.has(s.sessionId)) {
        sessionMap.set(s.sessionId, {});
      }

      const session = sessionMap.get(s.sessionId)!;

      if (s.action === 'created') {
        session.created = s.createdAt;
      } else if (s.action === 'destroyed') {
        session.destroyed = s.createdAt;
      }
    });

    // Calculate durations
    const durations: number[] = [];
    sessionMap.forEach((session) => {
      if (session.created && session.destroyed) {
        const duration = session.destroyed.getTime() - session.created.getTime();
        durations.push(duration);
      }
    });

    if (durations.length === 0) return 0;

    const sum = durations.reduce((acc, d) => acc + d, 0);
    return sum / durations.length;
  }

  /**
   * Retorna sessões mais longas
   */
  async getLongestSessions(limit: number = 10, projectId?: string) {
    const where = projectId ? { projectId } : {};

    // Get all sessions
    const sessions = await this.prisma.session.findMany({
      where,
      select: {
        sessionId: true,
        userId: true,
        action: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group and calculate durations
    const sessionMap = new Map<
      string,
      { sessionId: string; userId?: string; created?: Date; destroyed?: Date }
    >();

    sessions.forEach((s) => {
      if (!sessionMap.has(s.sessionId)) {
        sessionMap.set(s.sessionId, {
          sessionId: s.sessionId,
          userId: s.userId || undefined,
        });
      }

      const session = sessionMap.get(s.sessionId)!;

      if (s.action === 'created') {
        session.created = s.createdAt;
      } else if (s.action === 'destroyed') {
        session.destroyed = s.createdAt;
      }
    });

    // Calculate and sort
    const sessionsWithDuration = Array.from(sessionMap.values())
      .filter((s) => s.created && s.destroyed)
      .map((s) => ({
        sessionId: s.sessionId,
        userId: s.userId,
        duration: s.destroyed!.getTime() - s.created!.getTime(),
        createdAt: s.created,
        destroyedAt: s.destroyed,
      }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);

    return sessionsWithDuration;
  }

  /**
   * Retorna usuários mais ativos
   */
  async getMostActiveUsers(limit: number = 10, projectId?: string) {
    const where: any = {
      userId: { not: null },
    };

    if (projectId) {
      where.projectId = projectId;
    }

    const sessions = await this.prisma.session.findMany({
      where,
      select: { userId: true },
    });

    // Count occurrences
    const userCounts: Record<string, number> = {};
    sessions.forEach((s) => {
      if (s.userId) {
        userCounts[s.userId] = (userCounts[s.userId] || 0) + 1;
      }
    });

    // Sort and limit
    return Object.entries(userCounts)
      .map(([userId, count]) => ({ userId, sessionCount: count }))
      .sort((a, b) => b.sessionCount - a.sessionCount)
      .slice(0, limit);
  }

  /**
   * Remove sessões antigas
   */
  async cleanupOld(projectId: string, retentionDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.prisma.session.deleteMany({
      where: {
        projectId,
        createdAt: { lt: cutoffDate },
      },
    });

    return result.count;
  }
}
