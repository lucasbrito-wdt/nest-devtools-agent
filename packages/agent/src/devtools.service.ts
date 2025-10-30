import { Injectable, Inject, Logger, Optional } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { DevToolsAgentConfig, DevToolsEvent, EventMeta } from './shared/types';
import { DEVTOOLS_CONFIG } from './devtools.module';
import { sanitizePayload } from './utils/sanitizer';

/**
 * Serviço central para envio de eventos ao backend DevTools
 */
@Injectable()
export class DevtoolsService {
  private readonly logger = new Logger(DevtoolsService.name);
  private readonly config: DevToolsAgentConfig;
  private readonly httpClient: AxiosInstance;
  private readonly buffer: DevToolsEvent[] = [];

  constructor(
    @Optional()
    @Inject(DEVTOOLS_CONFIG)
    config?: DevToolsAgentConfig,
  ) {
    this.logger.log('🔍 DevtoolsService - Construtor chamado');
    this.logger.log(`  └─ Config recebido: ${config ? 'SIM' : 'NÃO'}`);

    if (!config) {
      this.logger.warn(
        'Nenhuma configuração do DevtoolsModule foi encontrada. Verifique se você chamou DevtoolsModule.forRoot() ou DevtoolsModule.forRootAsync(). O módulo será desabilitado automaticamente.',
      );
    } else {
      this.logger.verbose('Config recebido no construtor:');
      this.logger.verbose(config);
    }

    this.config = config ?? this.getDisabledConfig();

    // Log da configuração inicial
    this.logger.log(`🔧 DevtoolsService inicializado`);
    this.logger.log(`  ├─ Enabled: ${this.config.enabled}`);
    this.logger.log(`  ├─ Backend URL: ${this.config.backendUrl || 'N/A'}`);
    this.logger.log(`  ├─ Environment: ${this.config.environment || 'N/A'}`);
    this.logger.log(`  ├─ Timeout: ${this.config.timeout || 5000}ms`);
    this.logger.log(`  ├─ Max Retries: ${this.config.maxRetries || 3}`);
    this.logger.log(`  ├─ Max Body Size: ${this.config.maxBodySize || 10240} bytes`);
    this.logger.log(`  ├─ Buffer Enabled: ${this.config.enableBuffer || false}`);
    this.logger.log(`  ├─ Max Buffer Size: ${this.config.maxBufferSize || 100}`);
    this.logger.log(`  ├─ Capture Headers: ${this.config.captureHeaders !== false}`);
    this.logger.log(`  ├─ Capture Body: ${this.config.captureBody !== false}`);
    this.logger.log(`  ├─ Capture Response: ${this.config.captureResponse || false}`);
    this.logger.log(
      `  ├─ Capture Response Headers: ${this.config.captureResponseHeaders || false}`,
    );
    this.logger.log(`  ├─ Capture Session: ${this.config.captureSession || false}`);
    this.logger.log(`  ├─ Capture Schedule: ${this.config.captureSchedule || false}`);
    this.logger.log(`  ├─ Capture HTTP Client: ${this.config.captureHttpClient || false}`);
    this.logger.log(`  ├─ Capture Redis: ${this.config.captureRedis || false}`);
    this.logger.log(`  └─ Sensitive Fields: ${this.config.sensitiveFields?.length || 9} fields`);

    // Configura cliente HTTP com timeout e retry
    this.httpClient = axios.create({
      baseURL: this.config.backendUrl,
      timeout: this.config.timeout || 5000,
      headers: {
        'x-api-key': this.config.apiKey,
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

  private getDisabledConfig(): DevToolsAgentConfig {
    return {
      enabled: false,
      backendUrl: '',
      apiKey: '',
      maxBodySize: 0,
      timeout: 0,
      maxRetries: 0,
      enableBuffer: true,
      maxBufferSize: 0,
      sensitiveFields: [],
      captureHeaders: true,
      captureBody: true,
      captureResponse: true,
      captureResponseHeaders: true,
      captureSession: true,
      captureSchedule: true,
      captureHttpClient: true,
      captureRedis: true,
      environment: 'disabled',
    };
  }

  /**
   * Envia um evento para o backend DevTools
   */
  async sendEvent<T extends EventMeta>(event: DevToolsEvent<T>): Promise<void> {
    if (!this.config.enabled) {
      this.logger.verbose('⏸️  DevTools desabilitado - evento ignorado');
      return;
    }

    const eventType = event.type;
    const eventMeta = event.meta as any;
    const eventInfo =
      eventMeta?.method && eventMeta?.url ? `${eventMeta.method} ${eventMeta.url}` : eventType;

    this.logger.debug(`📤 Tentando enviar evento: ${eventInfo}`);

    try {
      // Sanitiza payload antes de enviar
      const sanitized = this.sanitizeEvent(event);

      this.logger.verbose(`  ├─ URL destino: ${this.config.backendUrl}/api/ingest`);
      this.logger.verbose(`  ├─ Tipo: ${eventType}`);
      this.logger.verbose(
        `  └─ Payload sanitizado: ${JSON.stringify(sanitized).substring(0, 100)}...`,
      );

      // Tenta enviar
      const startTime = Date.now();
      await this.httpClient.post('/api/ingest', sanitized);
      const duration = Date.now() - startTime;

      this.logger.log(`✅ Evento enviado com sucesso em ${duration}ms: ${eventInfo}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const axiosError = error as any;

      // Log detalhado do erro
      this.logger.error(`❌ Falha ao enviar evento: ${eventInfo}`);
      this.logger.error(`  ├─ Erro: ${errorMessage}`);

      if (axiosError.code) {
        this.logger.error(`  ├─ Código: ${axiosError.code}`);
      }

      if (axiosError.response) {
        this.logger.error(`  ├─ Status HTTP: ${axiosError.response.status}`);
        this.logger.error(
          `  ├─ Response: ${JSON.stringify(axiosError.response.data).substring(0, 200)}`,
        );
      } else if (axiosError.request) {
        this.logger.error(`  ├─ Sem resposta do servidor`);
        this.logger.error(`  ├─ URL tentada: ${this.config.backendUrl}/api/ingest`);
      }

      this.logger.error(`  └─ Stack: ${axiosError.stack?.split('\n')[0]}`);

      // Se buffer está habilitado, adiciona ao buffer
      if (this.config.enableBuffer) {
        this.logger.warn(`📦 Adicionando evento ao buffer local`);
        this.addToBuffer(event);
      }
    }
  }

  /**
   * Sanitiza evento antes de enviar
   */
  private sanitizeEvent<T extends EventMeta>(event: DevToolsEvent<T>): DevToolsEvent<T> {
    const sensitiveFields = this.getSensitiveFields();

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
      this.logger.warn(`⚠️  Buffer cheio (${maxBufferSize}), removendo evento mais antigo`);
      this.buffer.shift(); // Remove o mais antigo
    }

    this.buffer.push(event);
    this.logger.debug(`📦 Evento adicionado ao buffer (${this.buffer.length}/${maxBufferSize})`);
  }

  /**
   * Tenta reenviar eventos do buffer
   */
  async flushBuffer(): Promise<void> {
    if (this.buffer.length === 0) {
      this.logger.debug('📭 Buffer vazio, nada para enviar');
      return;
    }

    const events = [...this.buffer];
    this.buffer.length = 0; // Limpa buffer

    this.logger.log(`🔄 Tentando reenviar ${events.length} eventos do buffer`);

    let successCount = 0;
    let failCount = 0;

    for (const event of events) {
      try {
        await this.httpClient.post('/api/ingest', event);
        successCount++;
        this.logger.debug(`  ✅ Evento ${successCount} reenviado com sucesso`);
      } catch (error) {
        failCount++;
        this.logger.error(`  ❌ Falha ao reenviar evento ${failCount}`);
        // Recoloca no buffer se falhar
        this.addToBuffer(event);
      }
    }

    this.logger.log(`📊 Flush completo: ${successCount} sucesso, ${failCount} falhas`);
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

  /**
   * Retorna a configuração atual do DevTools
   * Útil para interceptors e filters acessarem a config
   */
  getConfig(): DevToolsAgentConfig {
    return this.config;
  }

  /**
   * Verifica se a captura de headers está habilitada
   */
  shouldCaptureHeaders(): boolean {
    return this.config.enabled && this.config.captureHeaders !== false;
  }

  /**
   * Verifica se a captura de body está habilitada
   */
  shouldCaptureBody(): boolean {
    return this.config.enabled && this.config.captureBody !== false;
  }

  /**
   * Verifica se a captura de response está habilitada
   */
  shouldCaptureResponse(): boolean {
    return this.config.enabled && (this.config.captureResponse || false);
  }

  /**
   * Verifica se a captura de response headers está habilitada
   */
  shouldCaptureResponseHeaders(): boolean {
    return this.config.enabled && (this.config.captureResponseHeaders || false);
  }

  /**
   * Verifica se a captura de sessão está habilitada
   */
  shouldCaptureSession(): boolean {
    return this.config.enabled && (this.config.captureSession || false);
  }

  /**
   * Verifica se a captura de schedule está habilitada
   */
  shouldCaptureSchedule(): boolean {
    return this.config.enabled && (this.config.captureSchedule || false);
  }

  /**
   * Verifica se a captura de HTTP Client está habilitada
   */
  shouldCaptureHttpClient(): boolean {
    return this.config.enabled && (this.config.captureHttpClient || false);
  }

  /**
   * Verifica se a captura de Redis está habilitada
   */
  shouldCaptureRedis(): boolean {
    return this.config.enabled && (this.config.captureRedis || false);
  }

  /**
   * Retorna o tamanho máximo do body a ser capturado
   */
  getMaxBodySize(): number {
    return this.config.maxBodySize || 10240; // 10KB default
  }

  /**
   * Retorna a lista de campos sensíveis
   */
  getSensitiveFields(): string[] {
    return (
      this.config.sensitiveFields || [
        'password',
        'token',
        'secret',
        'authorization',
        'cookie',
        'api_key',
        'apiKey',
        'access_token',
        'refresh_token',
      ]
    );
  }

  /**
   * Retorna o ambiente configurado
   */
  getEnvironment(): string {
    return this.config.environment || 'development';
  }

  /**
   * Retorna a configuração do Redis (se disponível)
   */
  getRedisConfig() {
    return this.config.redisConfig;
  }
}
