import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { EventType, RequestEventMeta } from '../shared/types';
import { DevtoolsService } from '../devtools.service';
import { truncatePayload } from '../utils/sanitizer';

/**
 * Interceptor global que captura todas as requisições HTTP
 */
@Injectable()
export class DevtoolsRequestInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DevtoolsRequestInterceptor.name);

  constructor(private readonly devtoolsService: DevtoolsService) {
    this.logger.log('🎯 DevtoolsRequestInterceptor registrado');
    this.logger.debug(
      `  └─ Config acessível via service: ${this.devtoolsService.getConfig() ? 'SIM' : 'NÃO'}`,
    );
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Só processa se for contexto HTTP
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const startTime = Date.now();

    this.logger.debug(`🔍 Interceptando requisição: ${request.method} ${request.url}`);

    // Captura metadata inicial
    const meta: Partial<RequestEventMeta> = {
      timestamp: startTime,
      method: request.method,
      url: request.url,
      route: request.route?.path,
      hostname: request.hostname,
      ip: this.getClientIp(request),
      userAgent: request.get('user-agent'),
    };

    // Captura headers se configurado
    if (this.devtoolsService.shouldCaptureHeaders()) {
      meta.headers = request.headers as Record<string, string | string[]>;
    }

    // Captura query params
    if (request.query && Object.keys(request.query).length > 0) {
      meta.query = request.query;
    }

    // Captura route params
    if (request.params && Object.keys(request.params).length > 0) {
      meta.params = request.params;
    }

    // Captura body se configurado
    if (this.devtoolsService.shouldCaptureBody() && request.body) {
      const maxBodySize = this.devtoolsService.getMaxBodySize();
      meta.body = truncatePayload(request.body, maxBodySize);
    }

    // Captura dados de sessão se configurado
    if (this.devtoolsService.shouldCaptureSession() && (request as any).session) {
      const session = (request as any).session;
      meta.sessionId = session.id || session.sessionID;
      meta.userId = session.userId || session.user?.id;

      // Captura dados da sessão (sanitizados)
      if (session) {
        const { cookie, ...sessionData } = session;
        meta.sessionData = truncatePayload(sessionData, this.devtoolsService.getMaxBodySize());
      }
    }

    return next.handle().pipe(
      tap((responseData) => {
        this.sendRequestEvent(meta, response, responseData, startTime);
      }),
      catchError((error) => {
        this.sendRequestEvent(meta, response, null, startTime, error);
        throw error; // Re-throw para não interferir no fluxo normal
      }),
    );
  }

  /**
   * Envia evento de requisição para o DevTools
   */
  private sendRequestEvent(
    meta: Partial<RequestEventMeta>,
    response: Response,
    responseData: any,
    startTime: number,
    error?: any,
  ): void {
    const duration = Date.now() - startTime;
    const statusCode = error ? error.status || 500 : response.statusCode;

    const completeMeta: RequestEventMeta = {
      ...meta,
      timestamp: meta.timestamp!,
      method: meta.method!,
      url: meta.url!,
      statusCode,
      duration,
    };

    // Log da captura
    const statusEmoji = statusCode >= 500 ? '🔴' : statusCode >= 400 ? '🟡' : '🟢';
    this.logger.log(
      `${statusEmoji} Capturado: ${meta.method} ${meta.url} - ${statusCode} (${duration}ms)`,
    );

    // Captura response se configurado
    if (this.devtoolsService.shouldCaptureResponse() && responseData) {
      const maxBodySize = this.devtoolsService.getMaxBodySize();
      completeMeta.response = truncatePayload(responseData, maxBodySize);
      this.logger.verbose(
        `  └─ Response capturado (${JSON.stringify(completeMeta.response).length} bytes)`,
      );
    }

    // Captura response headers se configurado
    if (this.devtoolsService.shouldCaptureResponseHeaders()) {
      const responseHeaders: Record<string, string | string[]> = {};
      response.getHeaderNames().forEach((headerName) => {
        const headerValue = response.getHeader(headerName);
        if (headerValue !== undefined) {
          responseHeaders[headerName] = headerValue as string | string[];
        }
      });
      completeMeta.responseHeaders = responseHeaders;
      this.logger.verbose(`  └─ Response headers capturados`);
    }

    // Envia evento de forma assíncrona (fire-and-forget)
    this.devtoolsService.sendEvent({
      type: EventType.REQUEST,
      meta: completeMeta,
    });
  }

  /**
   * Extrai IP do cliente (considerando proxies)
   */
  private getClientIp(request: Request): string | undefined {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (request.headers['x-real-ip'] as string) ||
      request.socket.remoteAddress
    );
  }
}
