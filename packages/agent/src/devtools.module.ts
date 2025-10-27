import { Module, DynamicModule, Global, Provider } from '@nestjs/common';
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
  static forRoot(config: DevToolsAgentConfig): DynamicModule {
    const configProvider: Provider = {
      provide: DEVTOOLS_CONFIG,
      useValue: config,
    };

    const providers: Provider[] = [configProvider, DevtoolsService];

    // Só registra interceptors/filters se estiver habilitado
    if (config.enabled) {
      providers.push(
        {
          provide: APP_INTERCEPTOR,
          useClass: DevtoolsRequestInterceptor,
        },
        {
          provide: APP_FILTER,
          useClass: DevtoolsExceptionFilter,
        },
      );
    }

    return {
      module: DevtoolsModule,
      providers,
      exports: [DevtoolsService],
    };
  }

  static forRootAsync(options: {
    useFactory: (...args: any[]) => Promise<DevToolsAgentConfig> | DevToolsAgentConfig;
    inject?: any[];
    enabled?: boolean;
  }): DynamicModule {
    const configProvider: Provider = {
      provide: DEVTOOLS_CONFIG,
      useFactory: options.useFactory,
      inject: options.inject || [],
    };

    const providers: Provider[] = [configProvider, DevtoolsService];

    const isEnabled = options.enabled ?? true;

    if (isEnabled) {
      providers.push(
        {
          provide: APP_INTERCEPTOR,
          useClass: DevtoolsRequestInterceptor,
        },
        {
          provide: APP_FILTER,
          useClass: DevtoolsExceptionFilter,
        },
      );
    }

    return {
      module: DevtoolsModule,
      providers,
      exports: [DevtoolsService],
    };
  }
}
