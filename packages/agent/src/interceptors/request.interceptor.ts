import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { DevToolsAgentConfig, EventType, RequestEventMeta } from '@nest-devtools/shared';
import { DevtoolsService } from '../devtools.service';
import { DEVTOOLS_CONFIG } from '../devtools.module';
import { truncatePayload } from '../utils/sanitizer';

/**
 * Interceptor global que captura todas as requisições HTTP
 */
@Injectable()
export class DevtoolsRequestInterceptor implements NestInterceptor {
  constructor(
    private readonly devtoolsService: DevtoolsService,
    @Inject(DEVTOOLS_CONFIG)
    private readonly config: DevToolsAgentConfig,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Só processa se for contexto HTTP
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const startTime = Date.now();

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
    if (this.config.captureHeaders !== false) {
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
    if (this.config.captureBody !== false && request.body) {
      const maxBodySize = this.config.maxBodySize || 10240; // 10KB default
      meta.body = truncatePayload(request.body, maxBodySize);
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

    const completeMeta: RequestEventMeta = {
      ...meta,
      timestamp: meta.timestamp!,
      method: meta.method!,
      url: meta.url!,
      statusCode: error ? error.status || 500 : response.statusCode,
      duration,
    };

    // Captura response se configurado
    if (this.config.captureResponse && responseData) {
      const maxBodySize = this.config.maxBodySize || 10240;
      completeMeta.response = truncatePayload(responseData, maxBodySize);
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

