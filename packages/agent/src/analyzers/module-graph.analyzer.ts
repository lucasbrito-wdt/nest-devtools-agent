import { Injectable, Type } from '@nestjs/common';
import { ModuleRef, DiscoveryService } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';

export interface ModuleNode {
  name: string;
  type: 'module' | 'controller' | 'provider' | 'guard' | 'interceptor' | 'pipe' | 'filter';
  dependencies: string[];
  imports: string[];
  exports: string[];
  controllers?: string[];
  providers?: string[];
}

export interface ModuleGraph {
  modules: ModuleNode[];
  edges: Array<{ from: string; to: string; type: string }>;
  metadata: {
    totalModules: number;
    totalProviders: number;
    totalControllers: number;
    analyzedAt: string;
  };
}

/**
 * Analisador de grafo de módulos NestJS
 * Gera análise estática da estrutura da aplicação
 */
@Injectable()
export class ModuleGraphAnalyzer {
  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly discoveryService: DiscoveryService,
  ) {}

  /**
   * Analisa toda a aplicação e gera o grafo
   */
  async analyze(): Promise<ModuleGraph> {
    const modules = await this.analyzeModules();
    const edges = this.buildEdges(modules);

    return {
      modules,
      edges,
      metadata: {
        totalModules: modules.filter((m) => m.type === 'module').length,
        totalProviders: modules.filter((m) => m.type === 'provider').length,
        totalControllers: modules.filter((m) => m.type === 'controller').length,
        analyzedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Analisa todos os módulos da aplicação
   */
  private async analyzeModules(): Promise<ModuleNode[]> {
    const modules: ModuleNode[] = [];

    // Busca todos os controllers
    const controllers = this.discoveryService.getControllers();
    for (const controller of controllers) {
      modules.push(this.analyzeController(controller));
    }

    // Busca todos os providers
    const providers = this.discoveryService.getProviders();
    for (const provider of providers) {
      modules.push(this.analyzeProvider(provider));
    }

    return modules;
  }

  /**
   * Analisa um controller
   */
  private analyzeController(wrapper: InstanceWrapper): ModuleNode {
    const name = wrapper.name || wrapper.metatype?.name || 'Unknown';
    const dependencies = this.extractDependencies(wrapper);

    return {
      name,
      type: 'controller',
      dependencies,
      imports: [],
      exports: [],
    };
  }

  /**
   * Analisa um provider
   */
  private analyzeProvider(wrapper: InstanceWrapper): ModuleNode {
    const name = wrapper.name || wrapper.metatype?.name || 'Unknown';
    const dependencies = this.extractDependencies(wrapper);

    // Detecta tipo específico de provider
    let type: ModuleNode['type'] = 'provider';
    
    if (name.includes('Guard')) type = 'guard';
    else if (name.includes('Interceptor')) type = 'interceptor';
    else if (name.includes('Pipe')) type = 'pipe';
    else if (name.includes('Filter')) type = 'filter';

    return {
      name,
      type,
      dependencies,
      imports: [],
      exports: [],
    };
  }

  /**
   * Extrai dependências de um wrapper
   */
  private extractDependencies(wrapper: InstanceWrapper): string[] {
    try {
      // Acessa injeções do construtor via metadados
      const dependencies: string[] = [];
      
      if (wrapper.inject) {
        dependencies.push(...wrapper.inject.map((dep) => {
          if (typeof dep === 'string') return dep;
          if (typeof dep === 'function') return dep.name;
          return 'Unknown';
        }));
      }

      return dependencies;
    } catch {
      return [];
    }
  }

  /**
   * Constrói edges (relações) entre nós
   */
  private buildEdges(modules: ModuleNode[]): Array<{ from: string; to: string; type: string }> {
    const edges: Array<{ from: string; to: string; type: string }> = [];

    for (const module of modules) {
      // Adiciona edges de dependência
      for (const dep of module.dependencies) {
        edges.push({
          from: module.name,
          to: dep,
          type: 'depends_on',
        });
      }

      // Adiciona edges de import
      for (const imp of module.imports) {
        edges.push({
          from: module.name,
          to: imp,
          type: 'imports',
        });
      }
    }

    return edges;
  }
}

