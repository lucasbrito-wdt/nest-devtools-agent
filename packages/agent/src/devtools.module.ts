import { Module, DynamicModule, Global, Provider, Logger } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { DevToolsAgentConfig } from './shared/types/config';
import { DevtoolsService } from './devtools.service';
import { DevtoolsRequestInterceptor } from './interceptors/request.interceptor';
import { DevtoolsExceptionFilter } from './filters/exception.filter';
import { ScheduleTracer } from './tracers/schedule.tracer';
import { HttpClientTracer } from './tracers/http-client.tracer';
import { RedisTracer } from './tracers/redis.tracer';
import { SessionSubscriber } from './subscribers/session.subscriber';

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
      exports: [DevtoolsService, ScheduleTracer, HttpClientTracer, RedisTracer, SessionSubscriber],
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
      exports: [DevtoolsService, ScheduleTracer, HttpClientTracer, RedisTracer, SessionSubscriber],
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
      ScheduleTracer,
      HttpClientTracer,
      RedisTracer,
      SessionSubscriber,
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
        useFactory: (service: DevtoolsService) => {
          this.logger.debug('🔧 Criando APP_INTERCEPTOR via factory (forRoot)');
          this.logger.debug(`  └─ DevtoolsService: ${service ? 'PRESENTE' : 'AUSENTE'}`);
          return new DevtoolsRequestInterceptor(service);
        },
        inject: [DevtoolsService],
      },
      {
        provide: APP_FILTER,
        useFactory: (service: DevtoolsService) => {
          this.logger.debug('🔧 Criando APP_FILTER via factory (forRoot)');
          this.logger.debug(`  └─ DevtoolsService: ${service ? 'PRESENTE' : 'AUSENTE'}`);
          return new DevtoolsExceptionFilter(service);
        },
        inject: [DevtoolsService],
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
          this.logger.log('🔍 [DEVTOOLS_CONFIG] Executando useFactory assíncrona');
          this.logger.log(`  ├─ Args recebidos: ${args.length}`);
          this.logger.log(`  └─ Inject configurado: ${JSON.stringify(options.inject || [])}`);

          const config = await options.useFactory(...args);

          if (!config) {
            this.logger.error('❌ [DEVTOOLS_CONFIG] Factory retornou undefined/null!');
            throw new Error(
              '[DevtoolsModule] useFactory must resolve a valid configuration object',
            );
          }

          this.logger.log('✅ [DEVTOOLS_CONFIG] Configuração resolvida:');
          this.logger.log(`  ├─ Enabled: ${config.enabled}`);
          this.logger.log(`  ├─ Backend URL: ${config.backendUrl}`);
          this.logger.log(`  ├─ API Key: ${config.apiKey ? '***' : 'não definido'}`);
          this.logger.log(`  └─ Timeout: ${config.timeout || 5000}ms`);

          return config;
        },
        inject: options.inject || [],
      },
      {
        provide: DevtoolsService,
        useFactory: (config: DevToolsAgentConfig) => {
          this.logger.debug('🔍 Criando DevtoolsService via useFactory');
          this.logger.debug(`  └─ Config: ${config ? 'PRESENTE' : 'AUSENTE'}`);
          if (config) {
            this.logger.debug(`  └─ Config.enabled: ${config.enabled}`);
            this.logger.debug(`  └─ Config.backendUrl: ${config.backendUrl}`);
          } else {
            this.logger.error(
              '❌ Config é UNDEFINED! A configuração não foi resolvida corretamente.',
            );
          }
          return new DevtoolsService(config);
        },
        inject: [DEVTOOLS_CONFIG],
      },
      ScheduleTracer,
      HttpClientTracer,
      RedisTracer,
      SessionSubscriber,
    ];

    const isEnabled = options.enabled ?? true;

    if (!isEnabled) {
      this.logger.warn(
        'DevtoolsModule.forRootAsync() foi registrado com enabled=false. Interceptors e filters permanecerão inativos.',
      );
      return providers;
    }

    this.logger.log('✅ Registrando interceptors e filters via forRootAsync');

    providers.push(
      {
        provide: APP_INTERCEPTOR,
        useFactory: (service: DevtoolsService) => {
          this.logger.debug('🔧 Criando APP_INTERCEPTOR via factory (forRootAsync)');
          this.logger.debug(`  └─ DevtoolsService: ${service ? 'PRESENTE' : 'AUSENTE'}`);
          const config = service.getConfig();
          this.logger.debug(`  └─ Config enabled: ${config?.enabled}`);
          this.logger.debug(`  └─ Config backendUrl: ${config?.backendUrl}`);
          return new DevtoolsRequestInterceptor(service);
        },
        inject: [DevtoolsService],
      },
      {
        provide: APP_FILTER,
        useFactory: (service: DevtoolsService) => {
          this.logger.debug('🔧 Criando APP_FILTER via factory (forRootAsync)');
          this.logger.debug(`  └─ DevtoolsService: ${service ? 'PRESENTE' : 'AUSENTE'}`);
          return new DevtoolsExceptionFilter(service);
        },
        inject: [DevtoolsService],
      },
    );

    return providers;
  }
}
