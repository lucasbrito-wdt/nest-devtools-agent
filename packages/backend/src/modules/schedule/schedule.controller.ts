import { Controller, Get, Query, Param, Logger } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { QueryScheduleDto } from './dto/query-schedule.dto';

@Controller('api/schedules')
export class ScheduleController {
  private readonly logger = new Logger(ScheduleController.name);

  constructor(private readonly scheduleService: ScheduleService) {}

  @Get()
  async findAll(@Query() query: QueryScheduleDto) {
    this.logger.debug(`GET /api/schedules - Query: ${JSON.stringify(query)}`);
    return this.scheduleService.findAll(query);
  }

  @Get('stats')
  async getStats(@Query('projectId') projectId?: string) {
    this.logger.debug(`GET /api/schedules/stats - ProjectId: ${projectId}`);
    return this.scheduleService.getStats(projectId);
  }

  @Get('slowest')
  async getSlowestJobs(@Query('limit') limit?: string, @Query('projectId') projectId?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    this.logger.debug(`GET /api/schedules/slowest - Limit: ${limitNum}`);
    return this.scheduleService.getSlowestJobs(limitNum, projectId);
  }

  @Get('most-failed')
  async getMostFailedJobs(@Query('limit') limit?: string, @Query('projectId') projectId?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    this.logger.debug(`GET /api/schedules/most-failed - Limit: ${limitNum}`);
    return this.scheduleService.getMostFailedJobs(limitNum, projectId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.debug(`GET /api/schedules/${id}`);
    return this.scheduleService.findOne(id);
  }
}
