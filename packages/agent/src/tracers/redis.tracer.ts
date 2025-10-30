import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventType, RedisEventMeta } from '../shared/types';
import { DevtoolsService } from '../devtools.service';
import { truncatePayload } from '../utils/sanitizer';

/**
 * Tracer para capturar operações Redis
 * Monitora comandos executados no Redis
 */
@Injectable()
export class RedisTracer implements OnModuleInit {
  private readonly logger = new Logger(RedisTracer.name);

  constructor(private readonly devtoolsService: DevtoolsService) {}

  onModuleInit() {
    if (this.devtoolsService.shouldCaptureRedis()) {
      this.logger.log('🔴 RedisTracer habilitado');
    } else {
      this.logger.debug('🔴 RedisTracer desabilitado');
    }
  }

  /**
   * Intercepta cliente Redis (ioredis ou node-redis)
   */
  interceptRedisClient(redisClient: any): void {
    if (!this.devtoolsService.shouldCaptureRedis()) return;

    // Detecta tipo de cliente
    const isIoRedis =
      redisClient.constructor.name === 'Redis' || redisClient.constructor.name === 'Cluster';
    const isNodeRedis = typeof redisClient.sendCommand === 'function';

    if (isIoRedis) {
      this.interceptIoRedis(redisClient);
    } else if (isNodeRedis) {
      this.interceptNodeRedis(redisClient);
    } else {
      this.logger.warn('Cliente Redis não reconhecido. Suporta ioredis e node-redis.');
    }
  }

  /**
   * Intercepta ioredis
   */
  private interceptIoRedis(redisClient: any): void {
    const originalSendCommand = redisClient.sendCommand;
    const self = this;

    redisClient.sendCommand = function (command: any, ...args: any[]) {
      const startTime = Date.now();
      const commandName = command?.name || 'UNKNOWN';
      const commandArgs = command?.args || [];

      return originalSendCommand.call(this, command, ...args).then(
        (result: any) => {
          self.trackRedisCommand(commandName, commandArgs, Date.now() - startTime, result);
          return result;
        },
        (error: any) => {
          self.trackRedisCommand(
            commandName,
            commandArgs,
            Date.now() - startTime,
            undefined,
            error,
          );
          throw error;
        },
      );
    };
  }

  /**
   * Intercepta node-redis
   */
  private interceptNodeRedis(redisClient: any): void {
    const originalSendCommand = redisClient.sendCommand;
    const self = this;

    redisClient.sendCommand = async function (command: any, ...args: any[]) {
      const startTime = Date.now();
      const commandName = Array.isArray(command) ? command[0] : 'UNKNOWN';
      const commandArgs = Array.isArray(command) ? command.slice(1) : [];

      try {
        const result = await originalSendCommand.call(this, command, ...args);
        self.trackRedisCommand(commandName, commandArgs, Date.now() - startTime, result);
        return result;
      } catch (error) {
        self.trackRedisCommand(commandName, commandArgs, Date.now() - startTime, undefined, error);
        throw error;
      }
    };
  }

  /**
   * Registra comando Redis
   */
  trackRedisCommand(
    command: string,
    args: any[] = [],
    duration: number,
    result?: any,
    error?: any,
  ): void {
    if (!this.devtoolsService.shouldCaptureRedis()) return;

    const maxBodySize = this.devtoolsService.getMaxBodySize();
    const key = args[0]?.toString();
    const value = args[1];
    const redisConfig = this.devtoolsService.getRedisConfig();

    const meta: RedisEventMeta = {
      timestamp: Date.now(),
      command: command.toUpperCase(),
      args: args.map((arg) => truncatePayload(arg, 1000)), // Limita args individuais
      key,
      duration,
      hostname: require('os').hostname(),
      pid: process.pid,
      environment: this.devtoolsService.getEnvironment(),
      database: redisConfig?.db,
    };

    // Captura valor para comandos SET/GET
    if (['SET', 'SETEX', 'SETNX', 'MSET'].includes(meta.command) && value !== undefined) {
      meta.value = truncatePayload(value, maxBodySize);
    }

    // Captura resultado
    if (result !== undefined) {
      meta.result = truncatePayload(result, maxBodySize);
    }

    // Captura erro
    if (error) {
      meta.error = error.message || 'Unknown error';
    }

    const statusEmoji = error ? '❌' : '✅';
    this.logger.debug(`${statusEmoji} Redis: ${meta.command} ${key || ''} (${duration}ms)`);

    this.devtoolsService.sendEvent({
      type: EventType.REDIS,
      meta,
    });
  }

  /**
   * Método manual para rastrear operações Redis customizadas
   */
  async trackCustomOperation<T = any>(
    command: string,
    operationFn: () => Promise<T>,
    options?: {
      key?: string;
      args?: any[];
    },
  ): Promise<T> {
    if (!this.devtoolsService.shouldCaptureRedis()) {
      return operationFn();
    }

    const startTime = Date.now();
    let result: T | undefined;
    let error: any;

    try {
      result = await operationFn();
      return result;
    } catch (err) {
      error = err;
      throw err;
    } finally {
      const duration = Date.now() - startTime;
      const redisConfig = this.devtoolsService.getRedisConfig();

      const meta: RedisEventMeta = {
        timestamp: startTime,
        command: command.toUpperCase(),
        key: options?.key,
        args: options?.args,
        duration,
        hostname: require('os').hostname(),
        pid: process.pid,
        environment: this.devtoolsService.getEnvironment(),
        database: redisConfig?.db,
      };

      if (error) {
        meta.error = error.message || 'Unknown error';
      } else if (result !== undefined) {
        const maxBodySize = this.devtoolsService.getMaxBodySize();
        meta.result = truncatePayload(result, maxBodySize);
      }

      this.devtoolsService.sendEvent({
        type: EventType.REDIS,
        meta,
      });
    }
  }

  /**
   * Wrapper para comandos Redis comuns
   */
  createTrackedRedisClient(redisClient: any): any {
    if (!this.devtoolsService.shouldCaptureRedis()) {
      return redisClient;
    }

    const self = this;
    const trackedClient: any = {};

    // Lista de comandos comuns para wrappear
    const commands = [
      'get',
      'set',
      'del',
      'exists',
      'expire',
      'ttl',
      'incr',
      'decr',
      'incrby',
      'decrby',
      'hget',
      'hset',
      'hdel',
      'hgetall',
      'lpush',
      'rpush',
      'lpop',
      'rpop',
      'lrange',
      'sadd',
      'srem',
      'smembers',
      'sismember',
      'zadd',
      'zrem',
      'zrange',
      'zscore',
    ];

    commands.forEach((cmd) => {
      if (typeof redisClient[cmd] === 'function') {
        trackedClient[cmd] = async function (...args: any[]) {
          const startTime = Date.now();
          try {
            const result = await redisClient[cmd](...args);
            self.trackRedisCommand(cmd, args, Date.now() - startTime, result);
            return result;
          } catch (error) {
            self.trackRedisCommand(cmd, args, Date.now() - startTime, undefined, error);
            throw error;
          }
        };
      }
    });

    // Preserva outros métodos não rastreados
    return new Proxy(trackedClient, {
      get(target, prop) {
        if (prop in target) {
          return target[prop];
        }
        return redisClient[prop];
      },
    });
  }
}
