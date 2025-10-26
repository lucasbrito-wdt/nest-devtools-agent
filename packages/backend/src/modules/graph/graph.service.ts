import { Injectable } from '@nestjs/common';

/**
 * Serviço para gerenciamento de grafos de módulos
 */
@Injectable()
export class GraphService {
  private graph: any = null;

  /**
   * Retorna grafo armazenado
   */
  getGraph() {
    return this.graph || {
      modules: [],
      edges: [],
      metadata: {
        totalModules: 0,
        totalProviders: 0,
        totalControllers: 0,
        analyzedAt: null,
      },
    };
  }

  /**
   * Salva grafo recebido do agent
   */
  saveGraph(graph: any) {
    this.graph = graph;
    return { success: true, savedAt: new Date().toISOString() };
  }

  /**
   * Retorna estatísticas do grafo
   */
  getGraphStats() {
    if (!this.graph) {
      return {
        totalModules: 0,
        totalProviders: 0,
        totalControllers: 0,
        totalEdges: 0,
        avgDependencies: 0,
      };
    }

    const { modules, edges, metadata } = this.graph;

    const avgDependencies =
      modules.length > 0
        ? modules.reduce((sum: number, m: any) => sum + m.dependencies.length, 0) / modules.length
        : 0;

    return {
      totalModules: metadata.totalModules,
      totalProviders: metadata.totalProviders,
      totalControllers: metadata.totalControllers,
      totalEdges: edges.length,
      avgDependencies: Math.round(avgDependencies * 10) / 10,
    };
  }
}

