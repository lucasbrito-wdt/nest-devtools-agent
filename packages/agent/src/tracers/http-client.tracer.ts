import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventType, HttpClientEventMeta } from '../shared/types';
import { DevtoolsService } from '../devtools.service';
import { truncatePayload } from '../utils/sanitizer';
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

/**
 * Tracer para capturar requisições HTTP de saída (HTTP Client)
 * Intercepta chamadas feitas via Axios ou HttpService do NestJS
 */
@Injectable()
export class HttpClientTracer implements OnModuleInit {
  private readonly logger = new Logger(HttpClientTracer.name);

  constructor(private readonly devtoolsService: DevtoolsService) {}

  onModuleInit() {
    const config = this.devtoolsService.getConfig();
    if (config?.captureHttpClient) {
      this.logger.log('🌐 HttpClientTracer habilitado');
      this.setupAxiosInterceptor();
    } else {
      this.logger.debug('🌐 HttpClientTracer desabilitado');
    }
  }

  /**
   * Configura interceptor global do Axios
   */
  private setupAxiosInterceptor(): void {
    // Interceptor de request
    axios.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Adiciona timestamp para calcular duração
        (config as any).__startTime = Date.now();
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Interceptor de response
    axios.interceptors.response.use(
      (response: AxiosResponse) => {
        this.trackHttpRequest(response.config, response);
        return response;
      },
      (error) => {
        if (error.config) {
          this.trackHttpRequest(error.config, error.response, error);
        }
        return Promise.reject(error);
      },
    );
  }

  /**
   * Intercepta e registra uma instância específica do Axios
   */
  interceptAxiosInstance(axiosInstance: AxiosInstance): void {
    const config = this.devtoolsService.getConfig();
    if (!config?.captureHttpClient) return;

    // Request interceptor
    axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        (config as any).__startTime = Date.now();
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor
    axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        this.trackHttpRequest(response.config, response);
        return response;
      },
      (error) => {
        if (error.config) {
          this.trackHttpRequest(error.config, error.response, error);
        }
        return Promise.reject(error);
      },
    );
  }

  /**
   * Registra uma requisição HTTP
   */
  private trackHttpRequest(
    requestConfig: AxiosRequestConfig | InternalAxiosRequestConfig,
    response?: AxiosResponse,
    error?: any,
  ): void {
    const config = this.devtoolsService.getConfig();
    if (!config?.captureHttpClient) return;

    const startTime = (requestConfig as any).__startTime || Date.now();
    const duration = Date.now() - startTime;
    const maxBodySize = config.maxBodySize || 10240;

    const meta: HttpClientEventMeta = {
      timestamp: startTime,
      method: (requestConfig.method || 'GET').toUpperCase(),
      url: this.buildFullUrl(requestConfig),
      baseURL: requestConfig.baseURL,
      duration,
      hostname: require('os').hostname(),
      pid: process.pid,
      environment: config.environment,
    };

    // Captura headers da requisição
    if (config.captureHeaders && requestConfig.headers) {
      meta.headers = requestConfig.headers as Record<string, string | string[]>;
    }

    // Captura body da requisição
    if (config.captureBody && requestConfig.data) {
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

      if (config.captureResponseHeaders && response.headers) {
        meta.responseHeaders = response.headers as Record<string, string | string[]>;
      }

      if (config.captureResponse && response.data) {
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
      `${statusEmoji} HTTP Client: ${meta.method} ${meta.url} - ${meta.responseStatus || 'ERR'} (${duration}ms)`,
    );

    this.devtoolsService.sendEvent({
      type: EventType.HTTP_CLIENT,
      meta,
    });
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
    },
  ): Promise<T> {
    const config = this.devtoolsService.getConfig();
    if (!config?.captureHttpClient) {
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
      const maxBodySize = config.maxBodySize || 10240;

      const meta: HttpClientEventMeta = {
        timestamp: startTime,
        method: method.toUpperCase(),
        url,
        duration,
        responseStatus: statusCode,
        hostname: require('os').hostname(),
        pid: process.pid,
        environment: config.environment,
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
