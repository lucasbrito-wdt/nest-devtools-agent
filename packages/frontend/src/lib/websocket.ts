import { io, Socket } from 'socket.io-client';
import { PersistedEvent, DevToolsStats } from 'nest-devtools-shared';

let socket: Socket | null = null;

/**
 * Conecta ao WebSocket do DevTools
 */
export const connectWebSocket = (url: string = 'http://localhost:4000') => {
  if (socket) return socket;

  socket = io(`${url}/devtools`, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('✅ WebSocket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ WebSocket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error);
  });

  socket.on('connection-status', (data) => {
    console.log('📡 Connection status:', data);
  });

  return socket;
};

/**
 * Desconecta do WebSocket
 */
export const disconnectWebSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Inscreve-se em um projeto específico
 */
export const subscribeToProject = (projectId: string) => {
  if (!socket) return;
  socket.emit('subscribe-project', projectId);
};

/**
 * Desinscreve-se de um projeto
 */
export const unsubscribeFromProject = (projectId: string) => {
  if (!socket) return;
  socket.emit('unsubscribe-project', projectId);
};

/**
 * Listener para novos eventos
 */
export const onNewEvent = (callback: (event: PersistedEvent) => void) => {
  if (!socket) return;
  socket.on('new-event', callback);
};

/**
 * Listener para atualização de estatísticas
 */
export const onStatsUpdate = (callback: (stats: DevToolsStats) => void) => {
  if (!socket) return;
  socket.on('stats-update', callback);
};

/**
 * Listener para alertas
 */
export const onAlert = (callback: (alert: {
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
}) => void) => {
  if (!socket) return;
  socket.on('alert', callback);
};

/**
 * Remove listener para novos eventos
 */
export const offNewEvent = (callback: (event: PersistedEvent) => void) => {
  if (!socket) return;
  socket.off('new-event', callback);
};

/**
 * Remove listener para estatísticas
 */
export const offStatsUpdate = (callback: (stats: DevToolsStats) => void) => {
  if (!socket) return;
  socket.off('stats-update', callback);
};

/**
 * Remove listener para alertas
 */
export const offAlert = (callback: any) => {
  if (!socket) return;
  socket.off('alert', callback);
};

/**
 * Retorna status de conexão
 */
export const isConnected = (): boolean => {
  return socket?.connected || false;
};

/**
 * Ping manual para testar conexão
 */
export const ping = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket not connected'));
      return;
    }
    
    socket.emit('ping', {}, (response: any) => {
      resolve(response);
    });
  });
};
