import { DevtoolsService } from '../devtools.service';
import { EventType, QueryEventMeta } from '../shared/types';

/**
 * Tipo de middleware do Prisma
 */
type PrismaMiddleware = (params: any, next: (params: any) => Promise<any>) => Promise<any>;

/**
 * Middleware do Prisma para capturar queries
 *
 * @example
 * ```typescript
 * // No seu prisma.service.ts
 * @Injectable()
 * export class PrismaService extends PrismaClient {
 *   constructor(private devtoolsService: DevtoolsService) {
 *     super();
 *     this.$use(createPrismaDevtoolsMiddleware(devtoolsService));
 *   }
 * }
 * ```
 */
export function createPrismaDevtoolsMiddleware(devtoolsService: DevtoolsService): PrismaMiddleware {
  return async (params, next) => {
    const startTime = Date.now();

    try {
      const result = await next(params);
      const duration = Date.now() - startTime;

      // Captura metadata da query
      const meta: QueryEventMeta = {
        timestamp: Date.now(),
        query: `${params.model}.${params.action}`,
        parameters: params.args ? [params.args] : undefined,
        duration,
        connection: 'prisma',
        database: process.env.DATABASE_URL?.split('/').pop()?.split('?')[0],
      };

      // Envia evento
      devtoolsService.sendEvent({
        type: EventType.QUERY,
        meta,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Captura query com erro
      const meta: QueryEventMeta = {
        timestamp: Date.now(),
        query: `${params.model}.${params.action}`,
        parameters: params.args ? [params.args] : undefined,
        duration,
        connection: 'prisma',
        database: process.env.DATABASE_URL?.split('/').pop()?.split('?')[0],
      };

      devtoolsService.sendEvent({
        type: EventType.QUERY,
        meta,
      });

      throw error;
    }
  };
}
