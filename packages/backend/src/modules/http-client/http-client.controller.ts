import { Controller, Get, Query, Param, Logger } from '@nestjs/common';
import { HttpClientService } from './http-client.service';
import { QueryHttpClientDto } from './dto/query-http-client.dto';

@Controller('api/http-clients')
export class HttpClientController {
  private readonly logger = new Logger(HttpClientController.name);

  constructor(private readonly httpClientService: HttpClientService) {}

  @Get()
  async findAll(@Query() query: QueryHttpClientDto) {
    this.logger.debug(`GET /api/http-clients - Query: ${JSON.stringify(query)}`);
    return this.httpClientService.findAll(query);
  }

  @Get('stats')
  async getStats(@Query('projectId') projectId?: string) {
    this.logger.debug(`GET /api/http-clients/stats - ProjectId: ${projectId}`);
    return this.httpClientService.getStats(projectId);
  }

  @Get('slowest')
  async getSlowestRequests(@Query('limit') limit?: string, @Query('projectId') projectId?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    this.logger.debug(`GET /api/http-clients/slowest - Limit: ${limitNum}`);
    return this.httpClientService.getSlowestRequests(limitNum, projectId);
  }

  @Get('status-distribution')
  async getStatusDistribution(@Query('projectId') projectId?: string) {
    this.logger.debug(`GET /api/http-clients/status-distribution`);
    return this.httpClientService.getStatusDistribution(projectId);
  }

  @Get('most-called')
  async getMostCalledEndpoints(
    @Query('limit') limit?: string,
    @Query('projectId') projectId?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    this.logger.debug(`GET /api/http-clients/most-called - Limit: ${limitNum}`);
    return this.httpClientService.getMostCalledEndpoints(limitNum, projectId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.debug(`GET /api/http-clients/${id}`);
    return this.httpClientService.findOne(id);
  }
}
