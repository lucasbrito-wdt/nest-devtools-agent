import { Controller, Get, Query, Param, Res, StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import { EventsService } from './events.service';
import { QueryEventsDto } from './dto/query-events.dto';
import { PaginatedEventsResponse, DevToolsStats } from '@nest-devtools/shared';
import { Event } from './entities/event.entity';

/**
 * Controller para consulta de eventos
 */
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /**
   * Lista eventos com filtros e paginação
   */
  @Get()
  async findAll(@Query() query: QueryEventsDto): Promise<PaginatedEventsResponse> {
    return this.eventsService.findAll(query);
  }

  /**
   * Busca evento por ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Event> {
    return this.eventsService.findOne(id);
  }

  /**
   * Retorna estatísticas gerais
   */
  @Get('stats/summary')
  async getStats(): Promise<DevToolsStats> {
    return this.eventsService.getStats();
  }

  /**
   * Exporta eventos para CSV
   */
  @Get('export/csv')
  async exportCsv(@Query() query: QueryEventsDto, @Res() res: Response) {
    const csv = await this.eventsService.exportToCsv(query);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="devtools-events-${Date.now()}.csv"`);
    res.send(csv);
  }

  /**
   * Exporta eventos para JSON
   */
  @Get('export/json')
  async exportJson(@Query() query: QueryEventsDto, @Res() res: Response) {
    const data = await this.eventsService.exportToJson(query);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="devtools-events-${Date.now()}.json"`);
    res.send(JSON.stringify(data, null, 2));
  }

  /**
   * Retorna métricas de performance ao longo do tempo
   */
  @Get('metrics/performance')
  async getPerformanceMetrics(@Query('hours') hours: number = 24) {
    return this.eventsService.getPerformanceMetrics(hours);
  }

  /**
   * Retorna distribuição de status codes
   */
  @Get('metrics/status-distribution')
  async getStatusDistribution() {
    return this.eventsService.getStatusDistribution();
  }

  /**
   * Retorna rotas mais lentas
   */
  @Get('metrics/slowest-routes')
  async getSlowestRoutes(@Query('limit') limit: number = 10) {
    return this.eventsService.getSlowestRoutes(limit);
  }
}
