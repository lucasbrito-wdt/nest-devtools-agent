# Real-time Subscriptions com Supabase

## 📋 Visão Geral

Configure subscriptions em tempo real para receber atualizações instantâneas do banco de dados via WebSocket, integrando com o sistema de WebSocket existente do NestJS.

## 🎯 Arquitetura

```
Supabase DB → Realtime Server → Backend NestJS → Frontend
                                      ↓
                                WebSocket Gateway
                                      ↓
                                  Clientes
```

## 1. Habilitar Realtime no Supabase

### 1.1 Configurar Tabelas

1. **Database** → **Replication**
2. Selecione as tabelas:
   - ✅ `events`
   - ✅ `projects`
   - ✅ `users` (opcional)

3. Habilite eventos:
   - ✅ INSERT
   - ✅ UPDATE
   - ✅ DELETE

### 1.2 Row Level Security (RLS)

```sql
-- Habilitar RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários veem eventos do seu projeto
CREATE POLICY "Users can subscribe to their project events"
  ON events FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM users WHERE id = auth.uid()
    )
  );
```

## 2. Instalar Dependências

```bash
cd packages/backend
npm install @supabase/supabase-js
npm install @supabase/realtime-js
```

## 3. Criar Serviço de Realtime

### 3.1 Realtime Service

```typescript:packages/backend/src/modules/realtime/realtime.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { DevToolsGateway } from '../websocket/devtools.gateway';

@Injectable()
export class RealtimeService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RealtimeService.name);
  private supabase: SupabaseClient;
  private channels: Map<string, RealtimeChannel> = new Map();

  constructor(
    private configService: ConfigService,
    private wsGateway: DevToolsGateway,
  ) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      },
    );
  }

  async onModuleInit() {
    this.logger.log('Initializing Supabase Realtime subscriptions...');
    await this.subscribeToEvents();
  }

  async onModuleDestroy() {
    this.logger.log('Cleaning up Supabase Realtime subscriptions...');
    this.channels.forEach((channel) => {
      this.supabase.removeChannel(channel);
    });
    this.channels.clear();
  }

  /**
   * Subscribe to events table changes
   */
  private async subscribeToEvents() {
    const channel = this.supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events',
        },
        (payload) => this.handleEventInsert(payload),
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
        },
        (payload) => this.handleEventUpdate(payload),
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'events',
        },
        (payload) => this.handleEventDelete(payload),
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.logger.log('Successfully subscribed to events table');
        } else if (status === 'CHANNEL_ERROR') {
          this.logger.error('Error subscribing to events table');
        }
      });

    this.channels.set('events', channel);
  }

  /**
   * Handle new event inserted
   */
  private handleEventInsert(payload: any) {
    this.logger.debug(`New event inserted: ${payload.new.id}`);

    // Emitir para clientes WebSocket
    this.wsGateway.emitNewEvent(payload.new, payload.new.project_id);

    // Atualizar estatísticas
    this.updateStats(payload.new.project_id);
  }

  /**
   * Handle event updated
   */
  private handleEventUpdate(payload: any) {
    this.logger.debug(`Event updated: ${payload.new.id}`);

    // Emitir atualização
    this.wsGateway.broadcast(
      'event-updated',
      {
        old: payload.old,
        new: payload.new,
      },
      payload.new.project_id,
    );
  }

  /**
   * Handle event deleted
   */
  private handleEventDelete(payload: any) {
    this.logger.debug(`Event deleted: ${payload.old.id}`);

    // Emitir deleção
    this.wsGateway.broadcast(
      'event-deleted',
      { id: payload.old.id },
      payload.old.project_id,
    );
  }

  /**
   * Subscribe to specific project events
   */
  async subscribeToProject(projectId: string): Promise<void> {
    if (this.channels.has(`project:${projectId}`)) {
      return; // Já inscrito
    }

    const channel = this.supabase
      .channel(`project:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          this.logger.debug(`Project ${projectId} event: ${payload.eventType}`);
          this.wsGateway.broadcast(
            `project:${projectId}:event`,
            payload,
            projectId,
          );
        },
      )
      .subscribe();

    this.channels.set(`project:${projectId}`, channel);
    this.logger.log(`Subscribed to project ${projectId}`);
  }

  /**
   * Unsubscribe from project
   */
  async unsubscribeFromProject(projectId: string): Promise<void> {
    const channel = this.channels.get(`project:${projectId}`);
    
    if (channel) {
      await this.supabase.removeChannel(channel);
      this.channels.delete(`project:${projectId}`);
      this.logger.log(`Unsubscribed from project ${projectId}`);
    }
  }

  /**
   * Update stats and broadcast
   */
  private async updateStats(projectId?: string) {
    // Implementar lógica de atualização de stats
    // e emitir via WebSocket
  }

  /**
   * Get channel status
   */
  getChannelStatus(channelName: string): string {
    const channel = this.channels.get(channelName);
    return channel?.state || 'not_found';
  }

  /**
   * List active channels
   */
  listChannels(): string[] {
    return Array.from(this.channels.keys());
  }
}
```

### 3.2 Realtime Module

```typescript:packages/backend/src/modules/realtime/realtime.module.ts
import { Module } from '@nestjs/common';
import { RealtimeService } from './realtime.service';
import { RealtimeController } from './realtime.controller';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [WebSocketModule],
  controllers: [RealtimeController],
  providers: [RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}
```

### 3.3 Realtime Controller

```typescript:packages/backend/src/modules/realtime/realtime.controller.ts
import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RealtimeService } from './realtime.service';

@Controller('realtime')
@UseGuards(AuthGuard('jwt'))
export class RealtimeController {
  constructor(private realtimeService: RealtimeService) {}

  @Get('channels')
  listChannels() {
    return {
      channels: this.realtimeService.listChannels(),
    };
  }

  @Get('channels/:name/status')
  getChannelStatus(@Param('name') name: string) {
    return {
      channel: name,
      status: this.realtimeService.getChannelStatus(name),
    };
  }

  @Post('projects/:id/subscribe')
  async subscribeToProject(@Param('id') projectId: string) {
    await this.realtimeService.subscribeToProject(projectId);
    return {
      message: `Subscribed to project ${projectId}`,
    };
  }

  @Delete('projects/:id/subscribe')
  async unsubscribeFromProject(@Param('id') projectId: string) {
    await this.realtimeService.unsubscribeFromProject(projectId);
    return {
      message: `Unsubscribed from project ${projectId}`,
    };
  }
}
```

## 4. Integrar com WebSocket Gateway

### 4.1 Atualizar WebSocket Gateway

```typescript:packages/backend/src/modules/websocket/devtools.gateway.ts
// Adicionar método para emitir eventos do Realtime
emitRealtimeEvent(event: string, data: any, projectId?: string) {
  if (projectId) {
    this.server.to(`project:${projectId}`).emit(event, data);
  } else {
    this.server.emit(event, data);
  }
  
  this.logger.debug(`Emitted realtime event: ${event}`);
}
```

### 4.2 Exportar Gateway

```typescript:packages/backend/src/modules/websocket/websocket.module.ts
import { Module } from '@nestjs/common';
import { DevToolsGateway } from './devtools.gateway';

@Module({
  providers: [DevToolsGateway],
  exports: [DevToolsGateway], // Exportar para uso em outros módulos
})
export class WebSocketModule {}
```

## 5. Frontend Integration

### 5.1 Supabase Client

```typescript:packages/frontend/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
```

### 5.2 Subscribe to Changes

```typescript:packages/frontend/src/hooks/useRealtimeEvents.ts
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useRealtimeEvents(projectId?: string) {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel('events-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events',
          filter: projectId ? `project_id=eq.${projectId}` : undefined,
        },
        (payload) => {
          console.log('New event:', payload.new);
          setEvents((prev) => [payload.new, ...prev]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  return events;
}
```

### 5.3 React Component

```typescript:packages/frontend/src/components/RealtimeEvents.tsx
import { useRealtimeEvents } from '../hooks/useRealtimeEvents';

export function RealtimeEvents({ projectId }: { projectId?: string }) {
  const events = useRealtimeEvents(projectId);

  return (
    <div>
      <h2>Real-time Events</h2>
      {events.map((event) => (
        <div key={event.id}>
          <span>{event.type}</span>
          <span>{event.route}</span>
        </div>
      ))}
    </div>
  );
}
```

## 6. Presence (Usuários Online)

### 6.1 Track Online Users

```typescript
const channel = supabase.channel('online-users');

// Entrar
channel
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState();
    console.log('Online users:', state);
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        user_id: currentUser.id,
        online_at: new Date().toISOString(),
      });
    }
  });

// Sair
channel.untrack();
```

## 7. Broadcast (Mensagens entre Clientes)

```typescript
// Enviar mensagem
channel.send({
  type: 'broadcast',
  event: 'cursor-position',
  payload: { x: 100, y: 200 },
});

// Receber mensagens
channel.on('broadcast', { event: 'cursor-position' }, (payload) => {
  console.log('Cursor moved:', payload);
});
```

## 8. Performance

### 8.1 Throttling

```typescript
import { throttle } from 'lodash';

const handleEvent = throttle((payload) => {
  // Processar evento
}, 1000); // Max 1 evento por segundo

channel.on('postgres_changes', { event: '*' }, handleEvent);
```

### 8.2 Batching

```typescript
let eventBatch: any[] = [];

const flushBatch = () => {
  if (eventBatch.length > 0) {
    processEvents(eventBatch);
    eventBatch = [];
  }
};

// Flush a cada 5 segundos
setInterval(flushBatch, 5000);

channel.on('postgres_changes', { event: '*' }, (payload) => {
  eventBatch.push(payload);
  
  // Flush se batch ficar muito grande
  if (eventBatch.length >= 100) {
    flushBatch();
  }
});
```

## 9. Monitoramento

### 9.1 Logs

```typescript
channel
  .on('system', {}, (payload) => {
    console.log('System event:', payload);
  })
  .subscribe((status, err) => {
    if (status === 'SUBSCRIBED') {
      console.log('Connected to realtime');
    }
    if (status === 'CHANNEL_ERROR') {
      console.error('Channel error:', err);
    }
    if (status === 'TIMED_OUT') {
      console.warn('Connection timed out');
    }
  });
```

### 9.2 Métricas

```typescript
const metrics = {
  messagesReceived: 0,
  messagesPerSecond: 0,
  lastMessageAt: null,
};

channel.on('postgres_changes', { event: '*' }, () => {
  metrics.messagesReceived++;
  metrics.lastMessageAt = new Date();
});

// Calcular taxa
setInterval(() => {
  metrics.messagesPerSecond = metrics.messagesReceived / 60;
  metrics.messagesReceived = 0;
}, 60000);
```

## 10. Variáveis de Ambiente

```env
# Frontend (.env)
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]

# Backend (.env)
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
```

## 11. Troubleshooting

### Erro: "Channel not found"
✅ Verifique se a tabela está habilitada em Replication

### Erro: "Unauthorized"
✅ Verifique RLS policies

### Erro: "Too many connections"
✅ Limite de conexões no Free tier: 200
✅ Implemente connection pooling

## 12. Próximos Passos

- ✅ Realtime configurado
- ⏳ Implementar reconnection automática
- ⏳ Adicionar offline queue
- ⏳ Implementar conflict resolution
- ⏳ Otimizar performance com batching

## 📚 Recursos

- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Realtime Presence](https://supabase.com/docs/guides/realtime/presence)
- [Realtime Broadcast](https://supabase.com/docs/guides/realtime/broadcast)

