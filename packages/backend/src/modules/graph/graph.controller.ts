import { Controller, Get, Post, Body } from '@nestjs/common';
import { GraphService } from './graph.service';

/**
 * Controller para grafo de módulos
 */
@Controller('graph')
export class GraphController {
  constructor(private readonly graphService: GraphService) {}

  /**
   * Retorna grafo de módulos registrado
   */
  @Get()
  async getGraph() {
    return this.graphService.getGraph();
  }

  /**
   * Registra um novo grafo de módulos enviado pelo agent
   */
  @Post()
  async registerGraph(@Body() graph: any) {
    return this.graphService.saveGraph(graph);
  }

  /**
   * Retorna estatísticas do grafo
   */
  @Get('stats')
  async getGraphStats() {
    return this.graphService.getGraphStats();
  }
}

