import { Injectable, Inject, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { DevToolsAgentConfig, DevToolsEvent, EventMeta } from '@nest-devtools/shared';
import { DEVTOOLS_CONFIG } from './devtools.module';
import { sanitizePayload } from './utils/sanitizer';

/**
 * Serviço central para envio de eventos ao backend DevTools
 */
@Injectable()
export class DevtoolsService {
  private readonly logger = new Logger(DevtoolsService.name);
  private readonly httpClient: AxiosInstance;
  private readonly buffer: DevToolsEvent[] = [];

  constructor(
    @Inject(DEVTOOLS_CONFIG)
    private readonly config: DevToolsAgentConfig,
  ) {
    // Configura cliente HTTP com timeout e retry
    this.httpClient = axios.create({
      baseURL: config.backendUrl,
      timeout: config.timeout || 5000,
      headers: {
        'x-api-key': config.apiKey,
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para retry em caso de erro
    this.httpClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const maxRetries = this.config.maxRetries || 3;
        const retryCount = error.config.__retryCount || 0;

        if (retryCount < maxRetries) {
          error.config.__retryCount = retryCount + 1;
          await this.delay(Math.pow(2, retryCount) * 1000); // Exponential backoff
          return this.httpClient.request(error.config);
        }

        return Promise.reject(error);
      },
    );
  }

  /**
   * Envia um evento para o backend DevTools
   */
  async sendEvent<T extends EventMeta>(event: DevToolsEvent<T>): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      // Sanitiza payload antes de enviar
      const sanitized = this.sanitizeEvent(event);

      // Tenta enviar
      await this.httpClient.post('/ingest', sanitized);
    } catch (error) {
      // Fail-silent: não queremos que o DevTools quebre a aplicação
      this.logger.debug(`Failed to send event: ${error instanceof Error ? error.message : 'Unknown error'}`);

      // Se buffer está habilitado, adiciona ao buffer
      if (this.config.enableBuffer) {
        this.addToBuffer(event);
      }
    }
  }

  /**
   * Sanitiza evento antes de enviar
   */
  private sanitizeEvent<T extends EventMeta>(event: DevToolsEvent<T>): DevToolsEvent<T> {
    const sensitiveFields = this.config.sensitiveFields || [
      'password',
      'token',
      'secret',
      'authorization',
      'cookie',
      'api_key',
      'apiKey',
      'access_token',
      'refresh_token',
    ];

    return {
      ...event,
      meta: sanitizePayload(event.meta, sensitiveFields) as T,
    };
  }

  /**
   * Adiciona evento ao buffer local
   */
  private addToBuffer(event: DevToolsEvent): void {
    const maxBufferSize = this.config.maxBufferSize || 100;

    if (this.buffer.length >= maxBufferSize) {
      this.buffer.shift(); // Remove o mais antigo
    }

    this.buffer.push(event);
  }

  /**
   * Tenta reenviar eventos do buffer
   */
  async flushBuffer(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    const events = [...this.buffer];
    this.buffer.length = 0; // Limpa buffer

    for (const event of events) {
      try {
        await this.httpClient.post('/ingest', event);
      } catch (error) {
        // Recoloca no buffer se falhar
        this.addToBuffer(event);
      }
    }
  }

  /**
   * Delay helper para retry
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Retorna estatísticas do buffer
   */
  getBufferStats() {
    return {
      size: this.buffer.length,
      maxSize: this.config.maxBufferSize || 100,
    };
  }
}

