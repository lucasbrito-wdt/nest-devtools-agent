# Webhooks do Supabase

## 📋 Visão Geral

Configure webhooks do Supabase para receber notificações em tempo real sobre mudanças no banco de dados, eventos de autenticação e mais.

## 🎯 Casos de Uso

1. **Database Webhooks**: Notificações de INSERT, UPDATE, DELETE
2. **Auth Webhooks**: Novos usuários, login, logout
3. **Storage Webhooks**: Upload/delete de arquivos
4. **Custom Events**: Eventos personalizados

## 1. Database Webhooks

### 1.1 Criar Webhook no Supabase

1. **Database** → **Webhooks** → **Create a new hook**
2. Configure:

```
Name: event-created
Table: events
Events: INSERT
Type: HTTP Request
Method: POST
URL: https://seu-backend.railway.app/api/webhooks/supabase/event-created
Headers:
  Authorization: Bearer YOUR_WEBHOOK_SECRET
  Content-Type: application/json
```

### 1.2 Criar Controller de Webhooks

```typescript:packages/backend/src/modules/webhooks/webhooks.module.ts
import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
```

```typescript:packages/backend/src/modules/webhooks/webhooks.controller.ts
import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebhooksService } from './webhooks.service';

interface SupabaseWebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: any;
  old_record?: any;
}

@Controller('webhooks/supabase')
export class WebhooksController {
  constructor(
    private webhooksService: WebhooksService,
    private configService: ConfigService,
  ) {}

  /**
   * Valida webhook do Supabase
   */
  private validateWebhook(authHeader: string): boolean {
    const expectedToken = this.configService.get<string>('WEBHOOK_SECRET');
    const receivedToken = authHeader?.replace('Bearer ', '');
    return receivedToken === expectedToken;
  }

  @Post('event-created')
  async handleEventCreated(
    @Headers('authorization') authHeader: string,
    @Body() payload: SupabaseWebhookPayload,
  ) {
    if (!this.validateWebhook(authHeader)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    if (payload.type !== 'INSERT') {
      throw new BadRequestException('Only INSERT events are supported');
    }

    return this.webhooksService.handleEventCreated(payload.record);
  }

  @Post('event-updated')
  async handleEventUpdated(
    @Headers('authorization') authHeader: string,
    @Body() payload: SupabaseWebhookPayload,
  ) {
    if (!this.validateWebhook(authHeader)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    return this.webhooksService.handleEventUpdated(
      payload.old_record,
      payload.record,
    );
  }

  @Post('event-deleted')
  async handleEventDeleted(
    @Headers('authorization') authHeader: string,
    @Body() payload: SupabaseWebhookPayload,
  ) {
    if (!this.validateWebhook(authHeader)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    return this.webhooksService.handleEventDeleted(payload.old_record);
  }

  @Post('user-created')
  async handleUserCreated(
    @Headers('authorization') authHeader: string,
    @Body() payload: any,
  ) {
    if (!this.validateWebhook(authHeader)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    return this.webhooksService.handleUserCreated(payload);
  }
}
```

```typescript:packages/backend/src/modules/webhooks/webhooks.service.ts
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  async handleEventCreated(record: any) {
    this.logger.log(`New event created: ${record.id}`);

    // Exemplo: Enviar notificação
    // await this.notificationService.send({
    //   type: 'event_created',
    //   data: record,
    // });

    // Exemplo: Processar analytics
    // await this.analyticsService.track('event_created', record);

    return { success: true, message: 'Event processed' };
  }

  async handleEventUpdated(oldRecord: any, newRecord: any) {
    this.logger.log(`Event updated: ${newRecord.id}`);

    // Lógica de processamento
    const changes = this.detectChanges(oldRecord, newRecord);
    
    return { success: true, changes };
  }

  async handleEventDeleted(record: any) {
    this.logger.log(`Event deleted: ${record.id}`);

    // Cleanup, audit log, etc.
    
    return { success: true };
  }

  async handleUserCreated(user: any) {
    this.logger.log(`New user created: ${user.email}`);

    // Exemplo: Enviar email de boas-vindas
    // await this.emailService.sendWelcome(user.email);

    return { success: true };
  }

  private detectChanges(oldRecord: any, newRecord: any): string[] {
    const changes: string[] = [];
    
    Object.keys(newRecord).forEach((key) => {
      if (oldRecord[key] !== newRecord[key]) {
        changes.push(key);
      }
    });

    return changes;
  }
}
```

### 1.3 Registrar Módulo

```typescript:packages/backend/src/app.module.ts
import { WebhooksModule } from './modules/webhooks/webhooks.module';

@Module({
  imports: [
    // ... outros módulos
    WebhooksModule,
  ],
})
export class AppModule {}
```

## 2. Auth Webhooks

### 2.1 Configurar no Supabase

1. **Authentication** → **Hooks** → **Enable Hooks**
2. Configure:

```
Hook: user.created
URL: https://seu-backend.railway.app/api/webhooks/supabase/user-created
Secret: YOUR_WEBHOOK_SECRET
```

### 2.2 Payload de Auth Webhook

```typescript
interface AuthWebhookPayload {
  event: 'user.created' | 'user.updated' | 'user.deleted';
  user: {
    id: string;
    email: string;
    user_metadata: any;
    app_metadata: any;
    created_at: string;
  };
}
```

## 3. Segurança

### 3.1 Validação de Assinatura

```typescript
import * as crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest),
  );
}
```

### 3.2 Rate Limiting

```typescript
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 10, ttl: 60000 } })
@Post('event-created')
async handleEventCreated() {
  // ...
}
```

## 4. Retry Logic

### 4.1 Supabase Retry

O Supabase tenta reenviar webhooks falhos:
- 1ª tentativa: imediata
- 2ª tentativa: após 1 minuto
- 3ª tentativa: após 5 minutos
- 4ª tentativa: após 15 minutos

### 4.2 Idempotência

```typescript
async handleEventCreated(record: any) {
  // Verificar se já processado
  const processed = await this.cache.get(`webhook:${record.id}`);
  
  if (processed) {
    return { success: true, message: 'Already processed' };
  }

  // Processar
  await this.processEvent(record);

  // Marcar como processado
  await this.cache.set(`webhook:${record.id}`, true, 3600);

  return { success: true };
}
```

## 5. Testing

### 5.1 Teste Local com ngrok

```bash
# Instalar ngrok
npm install -g ngrok

# Expor porta local
ngrok http 4000

# Usar URL do ngrok no webhook
https://abc123.ngrok.io/api/webhooks/supabase/event-created
```

### 5.2 Teste Manual

```bash
curl -X POST http://localhost:4000/api/webhooks/supabase/event-created \
  -H "Authorization: Bearer YOUR_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INSERT",
    "table": "events",
    "schema": "public",
    "record": {
      "id": "123",
      "type": "request",
      "payload": {}
    }
  }'
```

## 6. Monitoramento

### 6.1 Logs

```typescript
async handleEventCreated(record: any) {
  const startTime = Date.now();
  
  try {
    await this.processEvent(record);
    
    this.logger.log({
      webhook: 'event-created',
      recordId: record.id,
      duration: Date.now() - startTime,
      status: 'success',
    });
  } catch (error) {
    this.logger.error({
      webhook: 'event-created',
      recordId: record.id,
      duration: Date.now() - startTime,
      status: 'error',
      error: error.message,
    });
    throw error;
  }
}
```

### 6.2 Métricas

```typescript
import { Counter, Histogram } from 'prom-client';

const webhookCounter = new Counter({
  name: 'webhooks_total',
  help: 'Total webhooks received',
  labelNames: ['type', 'status'],
});

const webhookDuration = new Histogram({
  name: 'webhook_duration_seconds',
  help: 'Webhook processing duration',
  labelNames: ['type'],
});
```

## 7. Variáveis de Ambiente

```env
# Webhook Security
WEBHOOK_SECRET=your-super-secret-webhook-key-change-in-production
```

## 8. Database Functions (Alternativa)

### 8.1 Trigger + Function

```sql
-- Criar função que chama webhook
CREATE OR REPLACE FUNCTION notify_event_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://seu-backend.railway.app/api/webhooks/supabase/event-created',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_WEBHOOK_SECRET'
    ),
    body := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'record', row_to_json(NEW)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
CREATE TRIGGER event_created_webhook
AFTER INSERT ON events
FOR EACH ROW
EXECUTE FUNCTION notify_event_created();
```

## 9. Próximos Passos

- ✅ Webhooks configurados
- ⏳ Implementar queue para processar webhooks
- ⏳ Adicionar retry exponencial
- ⏳ Criar dashboard de monitoramento
- ⏳ Implementar circuit breaker

## 📚 Recursos

- [Supabase Webhooks](https://supabase.com/docs/guides/database/webhooks)
- [Database Functions](https://supabase.com/docs/guides/database/functions)
- [Auth Hooks](https://supabase.com/docs/guides/auth/auth-hooks)

