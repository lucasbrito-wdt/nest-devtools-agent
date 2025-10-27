import { Controller, Get, Query, Param, Logger } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { QuerySessionsDto } from './dto/query-sessions.dto';

@Controller('api/sessions')
export class SessionsController {
  private readonly logger = new Logger(SessionsController.name);

  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  async findAll(@Query() query: QuerySessionsDto) {
    this.logger.debug(`GET /api/sessions - Query: ${JSON.stringify(query)}`);
    return this.sessionsService.findAll(query);
  }

  @Get('stats')
  async getStats(@Query('projectId') projectId?: string) {
    this.logger.debug(`GET /api/sessions/stats - ProjectId: ${projectId}`);
    return this.sessionsService.getStats(projectId);
  }

  @Get('longest')
  async getLongestSessions(@Query('limit') limit?: string, @Query('projectId') projectId?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    this.logger.debug(`GET /api/sessions/longest - Limit: ${limitNum}`);
    return this.sessionsService.getLongestSessions(limitNum, projectId);
  }

  @Get('most-active-users')
  async getMostActiveUsers(@Query('limit') limit?: string, @Query('projectId') projectId?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    this.logger.debug(`GET /api/sessions/most-active-users - Limit: ${limitNum}`);
    return this.sessionsService.getMostActiveUsers(limitNum, projectId);
  }

  @Get('by-session/:sessionId')
  async findBySessionId(@Param('sessionId') sessionId: string) {
    this.logger.debug(`GET /api/sessions/by-session/${sessionId}`);
    return this.sessionsService.findBySessionId(sessionId);
  }

  @Get('by-user/:userId')
  async findByUserId(@Param('userId') userId: string, @Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    this.logger.debug(`GET /api/sessions/by-user/${userId} - Limit: ${limitNum}`);
    return this.sessionsService.findByUserId(userId, limitNum);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.debug(`GET /api/sessions/${id}`);
    return this.sessionsService.findOne(id);
  }
}
