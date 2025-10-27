import { Module, DynamicModule, Global, Provider, Logger } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { DevToolsAgentConfig } from './shared/types/config';
import { DevtoolsService } from './devtools.service';
import { DevtoolsRequestInterceptor } from './interceptors/request.interceptor';
import { DevtoolsExceptionFilter } from './filters/exception.filter';

/**
 * Token de injeção para a configuração
 */
export const DEVTOOLS_CONFIG = 'DEVTOOLS_CONFIG';

/**
 * Módulo principal do DevTools Agent
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     DevtoolsModule.forRoot({
 *       enabled: process.env.NODE_ENV !== 'production',
 *       backendUrl: 'http://localhost:4000',
 *       apiKey: process.env.DEVTOOLS_API_KEY!,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({})
export class DevtoolsModule {
  private static readonly logger = new Logger(DevtoolsModule.name);

  static forRoot(config: DevToolsAgentConfig): DynamicModule {
    // Validação básica da configuração
    if (!config) {
      throw new Error(
        '[DevtoolsModule] Configuration is required. Use DevtoolsModule.forRoot({ enabled: true, backendUrl: "...", apiKey: "..." })',
      );
    }

    if (config.enabled && !config.backendUrl) {
      throw new Error('[DevtoolsModule] backendUrl is required when DevTools is enabled');
    }

    const providers = this.buildProviders(config);

    this.logger.log(
      `DevtoolsModule registrado em modo ${config.enabled ? 'habilitado' : 'desabilitado'}`,
    );

    return {
      module: DevtoolsModule,
      providers,
      exports: [DevtoolsService],
    };
  }

  static forRootAsync(options: {
    useFactory: (...args: any[]) => Promise<DevToolsAgentConfig> | DevToolsAgentConfig;
    inject?: any[];
    imports?: any[];
    enabled?: boolean;
  }): DynamicModule {
    // Validação básica
    if (!options.useFactory) {
      throw new Error('[DevtoolsModule] useFactory is required for forRootAsync');
    }

    const providers = this.buildAsyncProviders(options);

    return {
      module: DevtoolsModule,
      imports: options.imports || [],
      providers,
      exports: [DevtoolsService],
    };
  }

  constructor() {
    // Este construtor nunca deve ser chamado diretamente
    // Se você está vendo este erro, certifique-se de usar .forRoot() ou .forRootAsync()
  }

  private static buildProviders(config: DevToolsAgentConfig): Provider[] {
    const providers: Provider[] = [
      {
        provide: DEVTOOLS_CONFIG,
        useValue: config,
      },
      DevtoolsService,
    ];

    if (!config.enabled) {
      this.logger.warn(
        'DevtoolsModule está desabilitado. Os interceptors e filters não serão registrados e o DevtoolsService trabalhará em modo silencioso.',
      );
      return providers;
    }

    providers.push(
      {
        provide: APP_INTERCEPTOR,
        useFactory: (service: DevtoolsService, config: DevToolsAgentConfig) => {
          return new DevtoolsRequestInterceptor(service, config);
        },
        inject: [DevtoolsService, DEVTOOLS_CONFIG],
      },
      {
        provide: APP_FILTER,
        useFactory: (service: DevtoolsService, config: DevToolsAgentConfig) => {
          return new DevtoolsExceptionFilter(service, config);
        },
        inject: [DevtoolsService, DEVTOOLS_CONFIG],
      },
    );

    return providers;
  }

  private static buildAsyncProviders(options: {
    useFactory: (...args: any[]) => Promise<DevToolsAgentConfig> | DevToolsAgentConfig;
    inject?: any[];
    enabled?: boolean;
  }): Provider[] {
    const providers: Provider[] = [
      {
        provide: DEVTOOLS_CONFIG,
        useFactory: async (...args: any[]) => {
          const config = await options.useFactory(...args);
          if (!config) {
            throw new Error(
              '[DevtoolsModule] useFactory must resolve a valid configuration object',
            );
          }
          return config;
        },
        inject: options.inject || [],
      },
      DevtoolsService,
    ];

    const isEnabled = options.enabled ?? true;

    if (!isEnabled) {
      this.logger.warn(
        'DevtoolsModule.forRootAsync() foi registrado com enabled=false. Interceptors e filters permanecerão inativos.',
      );
      return providers;
    }

    providers.push(
      {
        provide: APP_INTERCEPTOR,
        useFactory: (service: DevtoolsService, config: DevToolsAgentConfig) => {
          return new DevtoolsRequestInterceptor(service, config);
        },
        inject: [DevtoolsService, DEVTOOLS_CONFIG],
      },
      {
        provide: APP_FILTER,
        useFactory: (service: DevtoolsService, config: DevToolsAgentConfig) => {
          return new DevtoolsExceptionFilter(service, config);
        },
        inject: [DevtoolsService, DEVTOOLS_CONFIG],
      },
    );

    return providers;
  }
}
