import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventType, SessionEventMeta } from '../shared/types';
import { DevtoolsService } from '../devtools.service';
import { truncatePayload } from '../utils/sanitizer';

/**
 * Subscriber para capturar eventos de sessão
 * Monitora ciclo de vida de sessões (criação, atualização, destruição)
 */
@Injectable()
export class SessionSubscriber implements OnModuleInit {
  private readonly logger = new Logger(SessionSubscriber.name);

  constructor(private readonly devtoolsService: DevtoolsService) {}

  onModuleInit() {
    if (this.devtoolsService.shouldCaptureSession()) {
      this.logger.log('🔐 SessionSubscriber habilitado');
    } else {
      this.logger.debug('🔐 SessionSubscriber desabilitado');
    }
  }

  /**
   * Registra criação de sessão
   */
  trackSessionCreated(
    sessionId: string,
    sessionData?: any,
    options?: {
      userId?: string;
      expiresAt?: number;
      ip?: string;
      userAgent?: string;
    },
  ): void {
    if (!this.devtoolsService.shouldCaptureSession()) return;

    const maxBodySize = this.devtoolsService.getMaxBodySize();

    const meta: SessionEventMeta = {
      timestamp: Date.now(),
      sessionId,
      userId: options?.userId,
      action: 'created',
      sessionData: sessionData ? truncatePayload(sessionData, maxBodySize) : undefined,
      expiresAt: options?.expiresAt,
      ip: options?.ip,
      userAgent: options?.userAgent,
      hostname: require('os').hostname(),
      pid: process.pid,
      environment: this.devtoolsService.getEnvironment(),
    };

    this.logger.debug(
      `🔐 Sessão criada: ${sessionId}${options?.userId ? ` (user: ${options.userId})` : ''}`,
    );

    this.devtoolsService.sendEvent({
      type: EventType.SESSION,
      meta,
    });
  }

  /**
   * Registra atualização de sessão
   */
  trackSessionUpdated(
    sessionId: string,
    sessionData?: any,
    options?: {
      userId?: string;
      expiresAt?: number;
      ip?: string;
      userAgent?: string;
    },
  ): void {
    if (!this.devtoolsService.shouldCaptureSession()) return;

    const maxBodySize = this.devtoolsService.getMaxBodySize();

    const meta: SessionEventMeta = {
      timestamp: Date.now(),
      sessionId,
      userId: options?.userId,
      action: 'updated',
      sessionData: sessionData ? truncatePayload(sessionData, maxBodySize) : undefined,
      expiresAt: options?.expiresAt,
      ip: options?.ip,
      userAgent: options?.userAgent,
      hostname: require('os').hostname(),
      pid: process.pid,
      environment: this.devtoolsService.getEnvironment(),
    };

    this.logger.debug(`🔐 Sessão atualizada: ${sessionId}`);

    this.devtoolsService.sendEvent({
      type: EventType.SESSION,
      meta,
    });
  }

  /**
   * Registra destruição de sessão
   */
  trackSessionDestroyed(
    sessionId: string,
    options?: {
      userId?: string;
      ip?: string;
      userAgent?: string;
    },
  ): void {
    if (!this.devtoolsService.shouldCaptureSession()) return;

    const meta: SessionEventMeta = {
      timestamp: Date.now(),
      sessionId,
      userId: options?.userId,
      action: 'destroyed',
      ip: options?.ip,
      userAgent: options?.userAgent,
      hostname: require('os').hostname(),
      pid: process.pid,
      environment: this.devtoolsService.getEnvironment(),
    };

    this.logger.debug(`🔐 Sessão destruída: ${sessionId}`);

    this.devtoolsService.sendEvent({
      type: EventType.SESSION,
      meta,
    });
  }

  /**
   * Registra acesso a sessão
   */
  trackSessionAccessed(
    sessionId: string,
    options?: {
      userId?: string;
      ip?: string;
      userAgent?: string;
    },
  ): void {
    if (!this.devtoolsService.shouldCaptureSession()) return;

    const meta: SessionEventMeta = {
      timestamp: Date.now(),
      sessionId,
      userId: options?.userId,
      action: 'accessed',
      ip: options?.ip,
      userAgent: options?.userAgent,
      hostname: require('os').hostname(),
      pid: process.pid,
      environment: this.devtoolsService.getEnvironment(),
    };

    this.logger.verbose(`🔐 Sessão acessada: ${sessionId}`);

    this.devtoolsService.sendEvent({
      type: EventType.SESSION,
      meta,
    });
  }

  /**
   * Intercepta express-session store
   */
  interceptSessionStore(store: any): void {
    if (!this.devtoolsService.shouldCaptureSession()) return;

    // Wrap set method (criação/atualização)
    const originalSet = store.set?.bind(store);
    if (originalSet) {
      store.set = (sessionId: string, session: any, callback: any) => {
        const isNew = !session.cookie?.originalMaxAge;

        if (isNew) {
          this.trackSessionCreated(sessionId, session, {
            userId: session.userId || session.user?.id,
            expiresAt: session.cookie?.expires
              ? new Date(session.cookie.expires).getTime()
              : undefined,
          });
        } else {
          this.trackSessionUpdated(sessionId, session, {
            userId: session.userId || session.user?.id,
            expiresAt: session.cookie?.expires
              ? new Date(session.cookie.expires).getTime()
              : undefined,
          });
        }

        return originalSet(sessionId, session, callback);
      };
    }

    // Wrap destroy method
    const originalDestroy = store.destroy?.bind(store);
    if (originalDestroy) {
      store.destroy = (sessionId: string, callback: any) => {
        this.trackSessionDestroyed(sessionId);
        return originalDestroy(sessionId, callback);
      };
    }

    // Wrap get method (acesso)
    const originalGet = store.get?.bind(store);
    if (originalGet) {
      store.get = (sessionId: string, callback: any) => {
        this.trackSessionAccessed(sessionId);
        return originalGet(sessionId, callback);
      };
    }

    this.logger.log('🔐 Session store interceptado com sucesso');
  }

  /**
   * Middleware para rastrear sessões automaticamente
   */
  createSessionMiddleware() {
    const self = this;

    return function sessionTrackerMiddleware(req: any, res: any, next: any) {
      if (!self.devtoolsService.shouldCaptureSession() || !req.session) {
        return next();
      }

      const sessionId = req.session.id || req.sessionID;
      const userId = req.session.userId || req.session.user?.id;

      // Registra acesso à sessão
      self.trackSessionAccessed(sessionId, {
        userId,
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent'),
      });

      // Intercepta save para detectar updates
      const originalSave = req.session.save?.bind(req.session);
      if (originalSave) {
        req.session.save = function (callback: any) {
          self.trackSessionUpdated(sessionId, req.session, {
            userId,
            ip: req.ip || req.connection?.remoteAddress,
            userAgent: req.get('user-agent'),
          });
          return originalSave(callback);
        };
      }

      // Intercepta destroy
      const originalDestroy = req.session.destroy?.bind(req.session);
      if (originalDestroy) {
        req.session.destroy = function (callback: any) {
          self.trackSessionDestroyed(sessionId, {
            userId,
            ip: req.ip || req.connection?.remoteAddress,
            userAgent: req.get('user-agent'),
          });
          return originalDestroy(callback);
        };
      }

      next();
    };
  }
}
