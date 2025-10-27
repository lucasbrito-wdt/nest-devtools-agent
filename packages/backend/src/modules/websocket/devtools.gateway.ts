import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { DevToolsStats } from '@nest-devtools/shared';

/**
 * Gateway WebSocket para updates em tempo real
 */
@WebSocketGateway({
  cors: {
    origin: '*', // Configure adequadamente em produção
  },
  namespace: '/devtools',
})
export class DevToolsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(DevToolsGateway.name);
  private connectedClients = new Map<string, Socket>();

  handleConnection(client: Socket) {
    this.connectedClients.set(client.id, client);
    this.logger.log(`Client connected: ${client.id} (Total: ${this.connectedClients.size})`);

    // Envia status inicial
    client.emit('connection-status', {
      connected: true,
      clientId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id} (Total: ${this.connectedClients.size})`);
  }

  /**
   * Cliente se inscreve em um projeto específico
   */
  @SubscribeMessage('subscribe-project')
  handleSubscribeProject(@MessageBody() projectId: string, @ConnectedSocket() client: Socket) {
    client.join(`project:${projectId}`);
    this.logger.log(`Client ${client.id} subscribed to project ${projectId}`);
    return { success: true, projectId };
  }

  /**
   * Cliente se desinscreve de um projeto
   */
  @SubscribeMessage('unsubscribe-project')
  handleUnsubscribeProject(@MessageBody() projectId: string, @ConnectedSocket() client: Socket) {
    client.leave(`project:${projectId}`);
    this.logger.log(`Client ${client.id} unsubscribed from project ${projectId}`);
    return { success: true, projectId };
  }

  /**
   * Ping para keep-alive
   */
  @SubscribeMessage('ping')
  handlePing() {
    return { pong: true, timestamp: Date.now() };
  }

  /**
   * Emite novo evento para todos os clientes conectados
   */
  emitNewEvent(event: Event, projectId?: string) {
    if (projectId) {
      // Emite apenas para clientes inscritos nesse projeto
      this.server.to(`project:${projectId}`).emit('new-event', event);
    } else {
      // Emite para todos os clientes
      this.server.emit('new-event', event);
    }

    this.logger.debug(`Emitted new-event (type: ${event.type})`);
  }

  /**
   * Emite atualização de estatísticas
   */
  emitStatsUpdate(stats: DevToolsStats, projectId?: string) {
    if (projectId) {
      this.server.to(`project:${projectId}`).emit('stats-update', stats);
    } else {
      this.server.emit('stats-update', stats);
    }

    this.logger.debug('Emitted stats-update');
  }

  /**
   * Emite alerta em tempo real
   */
  emitAlert(
    alert: {
      type: 'error' | 'warning' | 'info';
      title: string;
      message: string;
      timestamp: string;
    },
    projectId?: string,
  ) {
    if (projectId) {
      this.server.to(`project:${projectId}`).emit('alert', alert);
    } else {
      this.server.emit('alert', alert);
    }
  }

  /**
   * Retorna número de clientes conectados
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Broadcast de mensagem genérica
   */
  broadcast(event: string, data: any, projectId?: string) {
    if (projectId) {
      this.server.to(`project:${projectId}`).emit(event, data);
    } else {
      this.server.emit(event, data);
    }
  }
}
