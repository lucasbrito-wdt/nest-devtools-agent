import { Controller, Get, Query, Param, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';
import { QueryRedisDto } from './dto/query-redis.dto';

@Controller('api/redis')
export class RedisController {
  private readonly logger = new Logger(RedisController.name);

  constructor(private readonly redisService: RedisService) {}

  @Get()
  async findAll(@Query() query: QueryRedisDto) {
    this.logger.debug(`GET /api/redis - Query: ${JSON.stringify(query)}`);
    return this.redisService.findAll(query);
  }

  @Get('stats')
  async getStats(@Query('projectId') projectId?: string) {
    this.logger.debug(`GET /api/redis/stats - ProjectId: ${projectId}`);
    return this.redisService.getStats(projectId);
  }

  @Get('slowest')
  async getSlowestOperations(
    @Query('limit') limit?: string,
    @Query('projectId') projectId?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    this.logger.debug(`GET /api/redis/slowest - Limit: ${limitNum}`);
    return this.redisService.getSlowestOperations(limitNum, projectId);
  }

  @Get('command-distribution')
  async getCommandDistribution(@Query('projectId') projectId?: string) {
    this.logger.debug(`GET /api/redis/command-distribution`);
    return this.redisService.getCommandDistribution(projectId);
  }

  @Get('most-accessed-keys')
  async getMostAccessedKeys(
    @Query('limit') limit?: string,
    @Query('projectId') projectId?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    this.logger.debug(`GET /api/redis/most-accessed-keys - Limit: ${limitNum}`);
    return this.redisService.getMostAccessedKeys(limitNum, projectId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.debug(`GET /api/redis/${id}`);
    return this.redisService.findOne(id);
  }
}
