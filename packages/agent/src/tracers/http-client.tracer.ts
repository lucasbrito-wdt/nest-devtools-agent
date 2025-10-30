import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventType, HttpClientEventMeta } from '../shared/types';
import { DevtoolsService } from '../devtools.service';
import { truncatePayload } from '../utils/sanitizer';
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosDefaults,
} from 'axios';

/**
 * Referências originais para restore
 */
type OriginalFunction = (...args: any[]) => any;
const originalAxiosCreate = axios.create;
const originalFetch = global.fetch;

/**
 * Tracer para capturar requisições HTTP de saída (HTTP Client)
 * 
 * Suporta:
 * - Axios (instância global e instâncias criadas dinamicamente)
 * - HttpService do NestJS (via detecção automática do axios interno)
 * - Fetch nativo (Node.js 18+)
 */
@Injectable()
export class HttpClientTracer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HttpClientTracer.name);
  private readonly interceptedAxiosInstances = new WeakSet<AxiosInstance>();
  private isFetchIntercepted = false;

  constructor(private readonly devtoolsService: DevtoolsService) {}

  onModuleInit() {
    if (this.devtoolsService.shouldCaptureHttpClient()) {
      this.logger.log('🌐 HttpClientTracer habilitado');
      this.setupAxiosInterceptors();
      this.setupFetchInterceptor();
      this.setupAxiosInstanceInterceptor();
    } else {
      this.logger.debug('🌐 HttpClientTracer desabilitado');
    }
  }

  onModuleDestroy() {
    // Restore original functions se necessário
    if (this.isFetchIntercepted && originalFetch) {
      global.fetch = originalFetch;
      this.logger.debug('🔄 Fetch original restaurado');
    }
  }

  /**
   * Configura interceptors globais do Axios
   * Intercepta a instância padrão do axios e todas as novas instâncias
   */
  private setupAxiosInterceptors(): void {
    // Intercepta axios padrão (axios.get, axios.post, etc.)
    axios.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        (config as any).__startTime = Date.now();
        (config as any).__clientType = 'axios';
        return config;
      },
      (error) => Promise.reject(error),
    );

    axios.interceptors.response.use(
      (response: AxiosResponse) => {
        this.trackAxiosRequest(response.config, response);
        return response;
      },
      (error) => {
        if (error.config) {
          this.trackAxiosRequest(error.config, error.response, error);
        }
        return Promise.reject(error);
      },
    );

    this.logger.debug('✅ Interceptors do Axios global configurados');
  }

  /**
   * Intercepta axios.create() para capturar todas as novas instâncias
   */
  private setupAxiosInstanceInterceptor(): void {
    // Monkey patch axios.create para interceptar novas instâncias automaticamente
    const self = this;
    
    (axios.create as any) = function (
      config?: AxiosRequestConfig,
    ): AxiosInstance {
      const instance = originalAxiosCreate.call(axios, config);
      
      // Verifica se já foi interceptada
      if (!self.interceptedAxiosInstances.has(instance)) {
        self.interceptAxiosInstance(instance);
        self.interceptedAxiosInstances.add(instance);
      }
      
      return instance;
    };

    this.logger.debug('✅ Interceptor de axios.create() configurado');
  }

  /**
   * Intercepta e registra uma instância específica do Axios
   * Útil para instâncias já criadas ou HttpService do NestJS
   */
  interceptAxiosInstance(axiosInstance: AxiosInstance): void {
    if (!this.devtoolsService.shouldCaptureHttpClient()) return;
    
    if (this.interceptedAxiosInstances.has(axiosInstance)) {
      this.logger.debug('⚠️  Instância Axios já foi interceptada');
      return;
    }

    // Request interceptor
    axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        (config as any).__startTime = Date.now();
        // Detecta se é HttpService do NestJS (geralmente tem _maxRedirects)
        const clientType = (config as any)._maxRedirects !== undefined ? 'httpService' : 'axios';
        (config as any).__clientType = clientType;
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor
    axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        this.trackAxiosRequest(response.config, response);
        return response;
      },
      (error) => {
        if (error.config) {
          this.trackAxiosRequest(error.config, error.response, error);
        }
        return Promise.reject(error);
      },
    );

    this.interceptedAxiosInstances.add(axiosInstance);
    this.logger.debug('✅ Nova instância Axios interceptada');
  }

  /**
   * Configura interceptor para fetch nativo (Node.js 18+)
   */
  private setupFetchInterceptor(): void {
    // Verifica se fetch está disponível
    if (typeof global.fetch === 'undefined') {
      this.logger.debug('⚠️  Fetch nativo não está disponível (Node.js < 18 ou não habilitado)');
      return;
    }

    if (this.isFetchIntercepted) {
      this.logger.debug('⚠️  Fetch já foi interceptado');
      return;
    }

    const self = this;
    const originalFetch = global.fetch;

    global.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      if (!self.devtoolsService.shouldCaptureHttpClient()) {
        return originalFetch(input, init);
      }

      const startTime = Date.now();
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const method = (init?.method || 'GET').toUpperCase();
      const headers = self.convertHeadersToRecord(init?.headers);

      // Captura body da requisição
      let requestBody: any = undefined;
      if (init?.body && self.devtoolsService.shouldCaptureBody()) {
        try {
          if (typeof init.body === 'string') {
            requestBody = JSON.parse(init.body);
          } else if (init.body instanceof FormData || init.body instanceof Blob) {
            requestBody = '[FormData ou Blob]';
          } else {
            requestBody = init.body;
          }
        } catch {
          requestBody = init.body;
        }
      }

      return originalFetch(input, init)
        .then((response) => {
          self.trackFetchRequest(
            {
              method,
              url,
              headers,
              requestBody,
              startTime,
            },
            response,
          );
          return response;
        })
        .catch((error) => {
          self.trackFetchRequest(
            {
              method,
              url,
              headers,
              requestBody,
              startTime,
            },
            undefined,
            error,
          );
          throw error;
        });
    };

    this.isFetchIntercepted = true;
    this.logger.debug('✅ Interceptor de fetch nativo configurado');
  }

  /**
   * Converte Headers para Record
   */
  private convertHeadersToRecord(headers?: HeadersInit): Record<string, string | string[]> {
    if (!headers) return {};

    if (headers instanceof Headers) {
      const record: Record<string, string> = {};
      headers.forEach((value, key) => {
        record[key] = value;
      });
      return record;
    }

    if (Array.isArray(headers)) {
      const record: Record<string, string[]> = {};
      headers.forEach(([key, value]) => {
        if (record[key]) {
          record[key].push(value);
        } else {
          record[key] = [value];
        }
      });
      return record;
    }

    return headers as Record<string, string | string[]>;
  }

  /**
   * Registra uma requisição Axios
   */
  private trackAxiosRequest(
    requestConfig: AxiosRequestConfig | InternalAxiosRequestConfig,
    response?: AxiosResponse,
    error?: any,
  ): void {
    if (!this.devtoolsService.shouldCaptureHttpClient()) return;

    const startTime = (requestConfig as any).__startTime || Date.now();
    const duration = Date.now() - startTime;
    const maxBodySize = this.devtoolsService.getMaxBodySize();
    const clientType = (requestConfig as any).__clientType || 'axios';

    const meta: HttpClientEventMeta = {
      timestamp: startTime,
      method: (requestConfig.method || 'GET').toUpperCase(),
      url: this.buildFullUrl(requestConfig),
      baseURL: requestConfig.baseURL,
      clientType: clientType as 'axios' | 'httpService',
      duration,
      hostname: require('os').hostname(),
      pid: process.pid,
      environment: this.devtoolsService.getEnvironment(),
    };

    // Captura headers da requisição
    if (this.devtoolsService.shouldCaptureHeaders() && requestConfig.headers) {
      meta.headers = requestConfig.headers as Record<string, string | string[]>;
    }

    // Captura body da requisição
    if (this.devtoolsService.shouldCaptureBody() && requestConfig.data) {
      meta.requestBody = truncatePayload(requestConfig.data, maxBodySize);
    }

    // Captura timeout e retries
    if (requestConfig.timeout) {
      meta.timeout = requestConfig.timeout;
    }

    if ((requestConfig as any).__retryCount) {
      meta.retries = (requestConfig as any).__retryCount;
    }

    // Captura dados da resposta
    if (response) {
      meta.responseStatus = response.status;

      if (this.devtoolsService.shouldCaptureResponseHeaders() && response.headers) {
        meta.responseHeaders = response.headers as Record<string, string | string[]>;
      }

      if (this.devtoolsService.shouldCaptureResponse() && response.data) {
        meta.responseBody = truncatePayload(response.data, maxBodySize);
      }
    }

    // Captura erro se houver
    if (error) {
      meta.error = error.message || 'Unknown error';
      meta.responseStatus = error.response?.status || 0;
    }

    const statusEmoji = this.getStatusEmoji(meta.responseStatus);
    this.logger.debug(
      `${statusEmoji} HTTP Client [${clientType}]: ${meta.method} ${meta.url} - ${meta.responseStatus || 'ERR'} (${duration}ms)`,
    );

    this.devtoolsService.sendEvent({
      type: EventType.HTTP_CLIENT,
      meta,
    });
  }

  /**
   * Registra uma requisição fetch nativa
   */
  private trackFetchRequest(
    requestInfo: {
      method: string;
      url: string;
      headers?: Record<string, string | string[]>;
      requestBody?: any;
      startTime: number;
    },
    response?: Response,
    error?: any,
  ): void {
    if (!this.devtoolsService.shouldCaptureHttpClient()) return;

    const duration = Date.now() - requestInfo.startTime;
    const maxBodySize = this.devtoolsService.getMaxBodySize();

    const meta: HttpClientEventMeta = {
      timestamp: requestInfo.startTime,
      method: requestInfo.method,
      url: requestInfo.url,
      clientType: 'fetch',
      duration,
      hostname: require('os').hostname(),
      pid: process.pid,
      environment: this.devtoolsService.getEnvironment(),
    };

    // Headers
    if (this.devtoolsService.shouldCaptureHeaders() && requestInfo.headers) {
      meta.headers = requestInfo.headers;
    }

    // Body da requisição
    if (this.devtoolsService.shouldCaptureBody() && requestInfo.requestBody) {
      meta.requestBody = truncatePayload(requestInfo.requestBody, maxBodySize);
    }

    // Resposta
    if (response) {
      meta.responseStatus = response.status;

      if (this.devtoolsService.shouldCaptureResponseHeaders()) {
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });
        meta.responseHeaders = responseHeaders;
      }

      const statusEmoji = this.getStatusEmoji(meta.responseStatus);
      this.logger.debug(
        `${statusEmoji} HTTP Client [fetch]: ${meta.method} ${meta.url} - ${meta.responseStatus} (${duration}ms)`,
      );

      // Body da resposta será capturado de forma assíncrona se necessário
      if (this.devtoolsService.shouldCaptureResponse() && response.body) {
        // Clona a resposta para não consumir o stream original
        response
          .clone()
          .text()
          .then((text) => {
            try {
              const json = JSON.parse(text);
              const updatedMeta: HttpClientEventMeta = {
                ...meta,
                responseBody: truncatePayload(json, maxBodySize),
              };
              // Envia evento atualizado com body
              this.devtoolsService.sendEvent({
                type: EventType.HTTP_CLIENT,
                meta: updatedMeta,
              });
            } catch {
              const updatedMeta: HttpClientEventMeta = {
                ...meta,
                responseBody: truncatePayload(text, maxBodySize),
              };
              this.devtoolsService.sendEvent({
                type: EventType.HTTP_CLIENT,
                meta: updatedMeta,
              });
            }
          })
          .catch(() => {
            // Se falhar ao ler o body, envia evento sem body
            this.devtoolsService.sendEvent({
              type: EventType.HTTP_CLIENT,
              meta,
            });
          });
      } else {
        // Envia evento imediatamente se não precisa capturar body
        this.devtoolsService.sendEvent({
          type: EventType.HTTP_CLIENT,
          meta,
        });
      }
    } else {
      // Erro ou sem resposta - envia evento imediatamente
      if (error) {
        meta.error = error.message || 'Unknown error';
      }

      const statusEmoji = this.getStatusEmoji(meta.responseStatus);
      this.logger.debug(
        `${statusEmoji} HTTP Client [fetch]: ${meta.method} ${meta.url} - ${meta.responseStatus || 'ERR'} (${duration}ms)`,
      );

      this.devtoolsService.sendEvent({
        type: EventType.HTTP_CLIENT,
        meta,
      });
    }
  }

  /**
   * Constrói URL completa a partir da config
   */
  private buildFullUrl(config: AxiosRequestConfig | InternalAxiosRequestConfig): string {
    const baseURL = config.baseURL || '';
    const url = config.url || '';

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    return baseURL + url;
  }

  /**
   * Retorna emoji baseado no status code
   */
  private getStatusEmoji(status?: number): string {
    if (!status) return '⚠️';
    if (status >= 500) return '🔴';
    if (status >= 400) return '🟡';
    if (status >= 300) return '🔵';
    if (status >= 200) return '🟢';
    return '⚪';
  }

  /**
   * Método manual para rastrear requisições HTTP customizadas
   */
  async trackCustomRequest<T = any>(
    method: string,
    url: string,
    requestFn: () => Promise<T>,
    options?: {
      headers?: Record<string, string | string[]>;
      body?: any;
      clientType?: 'axios' | 'fetch' | 'httpService' | 'unknown';
    },
  ): Promise<T> {
    if (!this.devtoolsService.shouldCaptureHttpClient()) {
      return requestFn();
    }

    const startTime = Date.now();
    let response: T;
    let error: any;
    let statusCode: number | undefined;

    try {
      response = await requestFn();
      statusCode = (response as any)?.status || (response as any)?.statusCode || 200;
      return response;
    } catch (err) {
      error = err;
      statusCode = (err as any)?.status || (err as any)?.statusCode || 500;
      throw err;
    } finally {
      const duration = Date.now() - startTime;
      const maxBodySize = this.devtoolsService.getMaxBodySize();

      const meta: HttpClientEventMeta = {
        timestamp: startTime,
        method: method.toUpperCase(),
        url,
        clientType: options?.clientType || 'unknown',
        duration,
        responseStatus: statusCode,
        hostname: require('os').hostname(),
        pid: process.pid,
        environment: this.devtoolsService.getEnvironment(),
      };

      if (options?.headers) {
        meta.headers = options.headers;
      }

      if (options?.body) {
        meta.requestBody = truncatePayload(options.body, maxBodySize);
      }

      if (error) {
        meta.error = error.message || 'Unknown error';
      }

      this.devtoolsService.sendEvent({
        type: EventType.HTTP_CLIENT,
        meta,
      });
    }
  }
}