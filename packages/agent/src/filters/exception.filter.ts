import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Inject,
  Optional,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { DevToolsAgentConfig, EventType, ExceptionEventMeta } from '../shared/types';
import { DevtoolsService } from '../devtools.service';
import { DEVTOOLS_CONFIG } from '../devtools.module';

/**
 * Filter global que captura todas as exceções não tratadas
 */
@Catch()
export class DevtoolsExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DevtoolsExceptionFilter.name);

  constructor(
    private readonly devtoolsService: DevtoolsService,
    @Optional()
    @Inject(DEVTOOLS_CONFIG)
    private readonly config?: DevToolsAgentConfig,
  ) {
    this.logger.log('🚨 DevtoolsExceptionFilter registrado');
  }

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();

    // Extrai informações da exceção
    const statusCode = this.getStatusCode(exception);
    const message = this.getMessage(exception);
    const stack = exception.stack;

    // Log da exceção capturada
    const errorEmoji = statusCode >= 500 ? '💥' : '⚠️';
    this.logger.error(`${errorEmoji} Exceção capturada: ${exception.name || 'Error'}`);
    this.logger.error(`  ├─ Status: ${statusCode}`);
    this.logger.error(`  ├─ Mensagem: ${message}`);
    this.logger.error(`  ├─ Rota: ${request.method} ${request.url}`);
    this.logger.error(`  └─ Stack: ${stack?.split('\n')[1]?.trim()}`);

    // Monta metadata da exceção
    const meta: ExceptionEventMeta = {
      timestamp: Date.now(),
      name: exception.name || 'Error',
      message,
      stack,
      statusCode,
      method: request.method,
      url: request.url,
      route: request.route?.path,
      hostname: request.hostname,
      ip: this.getClientIp(request),
      context: this.extractContext(exception, request),
    };

    // Envia evento de forma assíncrona
    this.devtoolsService.sendEvent({
      type: EventType.EXCEPTION,
      meta,
    });

    // Não interferimos no comportamento padrão - deixa o NestJS lidar com a exceção
  }

  /**
   * Extrai status code da exceção
   */
  private getStatusCode(exception: any): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return 500;
  }

  /**
   * Extrai mensagem da exceção
   */
  private getMessage(exception: any): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        return response;
      }
      if (typeof response === 'object' && response !== null) {
        return (response as any).message || exception.message;
      }
    }
    return exception.message || 'Unknown error';
  }

  /**
   * Extrai contexto adicional da exceção e request
   */
  private extractContext(exception: any, request: Request): Record<string, any> {
    const context: Record<string, any> = {
      timestamp: new Date().toISOString(),
      userAgent: request.get('user-agent'),
    };

    // Captura query params se existir
    if (request.query && Object.keys(request.query).length > 0) {
      context.query = request.query;
    }

    // Captura params se existir
    if (request.params && Object.keys(request.params).length > 0) {
      context.params = request.params;
    }

    // Captura informações extras da exceção (se houver)
    if (exception.response && typeof exception.response === 'object') {
      context.exceptionResponse = exception.response;
    }

    return context;
  }

  /**
   * Extrai IP do cliente
   */
  private getClientIp(request: Request): string | undefined {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (request.headers['x-real-ip'] as string) ||
      request.socket.remoteAddress
    );
  }
}
