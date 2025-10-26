# 🔒 Guia de Segurança — Nest DevTools Telescope

> ⚠️ **ATENÇÃO:** Este documento é CRÍTICO. Leia completamente antes de usar em produção.

---

## ⛔ Regra #1: NUNCA em Produção sem Autenticação

**O DevTools Telescope NÃO deve estar habilitado em produção sem autenticação forte.**

Por padrão, configure assim:

```typescript
DevtoolsModule.forRoot({
  enabled: process.env.NODE_ENV !== 'production', // ← CRÍTICO
  backendUrl: 'http://localhost:4000',
  apiKey: process.env.DEVTOOLS_API_KEY!,
})
```

**Por quê?**
- DevTools expõe dados internos da aplicação
- Stacktraces revelam estrutura de código
- Headers/payloads podem conter tokens/secrets
- Rotas internas ficam visíveis

---

## 🔑 Autenticação

### API Key (Padrão)

**Backend:**

```env
DEVTOOLS_API_KEY=gerar-chave-forte-aqui-com-32-caracteres
```

**Agent:**

```typescript
DevtoolsModule.forRoot({
  apiKey: process.env.DEVTOOLS_API_KEY!,
})
```

**Como gerar chave forte:**

```bash
# Linux/Mac
openssl rand -base64 32

# Node
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Validação no backend:**

```typescript
// ApiKeyGuard valida header x-api-key
// Implementado em: packages/backend/src/common/guards/api-key.guard.ts
```

---

### OAuth/SSO (Recomendado para Produção)

**Para staging/produção, adicione autenticação OAuth:**

```typescript
// packages/backend/src/common/guards/oauth.guard.ts
@Injectable()
export class OAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];
    
    // Valida com seu provedor OAuth (Google, Auth0, etc)
    const user = await this.validateToken(token);
    
    // Verifica se user tem role 'devtools-viewer'
    return user?.roles?.includes('devtools-viewer');
  }
}
```

---

## 🛡️ CORS

**Configure CORS restrito no backend:**

```env
# .env
CORS_ORIGINS=https://devtools.myapp.com,http://localhost:3000
```

**Nunca use:**

```typescript
app.enableCors({ origin: '*' }); // ❌ INSEGURO!
```

---

## 🔍 Sanitização de Dados Sensíveis

### Redação Automática

O Agent já faz redação de campos sensíveis:

```typescript
const sensitiveFields = [
  'password',
  'token',
  'secret',
  'authorization',
  'cookie',
  'api_key',
  'apiKey',
  'access_token',
  'refresh_token',
  'creditCard',
  'cvv',
  'ssn',
];
```

**Resultado:**

```json
{
  "username": "lucas",
  "password": "[REDACTED]",  // ← Automaticamente escondido
  "token": "[REDACTED]"
}
```

### Adicionar Campos Customizados

```typescript
DevtoolsModule.forRoot({
  sensitiveFields: [
    'password',
    'cpf',           // ← Custom
    'contaBancaria', // ← Custom
    'pixKey',        // ← Custom
  ],
})
```

---

## 🚫 Prevenção de Execução Remota de Código

**NUNCA implemente endpoints que executem código inbound!**

❌ **INSEGURO:**

```typescript
// NÃO FAÇA ISSO!
@Post('/eval')
eval(@Body() code: string) {
  return eval(code); // ← RCE vulnerability!
}
```

**Lição do ecossistema:**
- O `@nestjs/devtools-integration` oficial teve advisories por endpoints inseguros
- Projetos comunitários já tiveram vulnerabilidades de RCE

**Nossa abordagem:**
- ✅ Apenas ingestão de dados (POST /ingest)
- ✅ Consultas read-only (GET /events)
- ✅ Zero endpoints de execução de código

---

## 🔐 Rate Limiting

**Proteja contra abuso:**

```typescript
// Backend já vem configurado com Throttler
@Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 req/min
```

**Ajuste conforme necessário:**

```env
RATE_LIMIT=100  # requests por minuto por IP
```

---

## 🗄️ Política de Retenção

**Não acumule dados indefinidamente:**

```env
RETENTION_DAYS=7  # Deleta eventos > 7 dias
```

**Cleanup manual:**

```sql
SELECT cleanup_old_events(7);
```

**Cleanup automático (cron - futuro):**

```typescript
@Cron('0 2 * * *') // Toda noite às 2h
async cleanupOldEvents() {
  const deleted = await this.eventsService.cleanup(
    this.config.retentionDays
  );
  this.logger.log(`Deleted ${deleted} old events`);
}
```

---

## 🌐 HTTPS Obrigatório

**Em staging/produção, sempre use HTTPS:**

```typescript
// Agent
DevtoolsModule.forRoot({
  backendUrl: 'https://devtools.myapp.com', // ← HTTPS!
})
```

**Backend (com proxy reverso):**

```nginx
# Nginx
server {
  listen 443 ssl;
  ssl_certificate /etc/ssl/certs/cert.pem;
  ssl_certificate_key /etc/ssl/private/key.pem;
  
  location / {
    proxy_pass http://localhost:4000;
  }
}
```

---

## 🔒 Criptografia de Dados em Repouso

**Para dados ultra-sensíveis:**

```typescript
// Antes de persistir
const encrypted = encrypt(payload, process.env.ENCRYPTION_KEY);
await this.eventRepository.save({ payload: encrypted });

// Ao ler
const decrypted = decrypt(event.payload, process.env.ENCRYPTION_KEY);
```

**Biblioteca recomendada:**

```bash
pnpm add @nestjs/config crypto-js
```

---

## 👁️ Auditoria

**Registre quem acessa o DevTools:**

```typescript
@Controller('events')
@UseGuards(AuditGuard) // ← Log de acesso
export class EventsController {
  @Get()
  findAll(@User() user: User) {
    this.auditService.log({
      action: 'view_events',
      userId: user.id,
      timestamp: new Date(),
    });
    // ...
  }
}
```

---

## 🚨 Vulnerabilidades Conhecidas

### CVEs do Ecossistema NestJS DevTools

**1. @nestjs/devtools-integration (oficial)**

- Advisory: Endpoints inseguros que aceitavam código e executavam
- Status: Patches disponíveis
- Nossa solução: Não usamos esse pacote, implementação própria

**Referência:**
- https://github.com/advisories/GHSA-xxxx (verificar no GitHub)

---

## ✅ Checklist de Segurança

Antes de ir para produção:

- [ ] `enabled: false` em produção ou OAuth configurado
- [ ] API Key forte (32+ caracteres)
- [ ] CORS configurado (sem `*`)
- [ ] HTTPS habilitado
- [ ] Rate limiting ativo
- [ ] Sanitização de campos sensíveis
- [ ] Política de retenção configurada
- [ ] Logs de auditoria ativos
- [ ] IP allowlist (se possível)
- [ ] Firewall permitindo apenas IPs internos

---

## 🔍 Testes de Segurança

### Teste 1: API Key inválida

```bash
curl -X POST http://localhost:4000/api/ingest \
  -H "x-api-key: INVALID_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type":"request","meta":{}}'

# Esperado: 401 Unauthorized
```

### Teste 2: Rate limiting

```bash
for i in {1..150}; do
  curl -X POST http://localhost:4000/api/ingest \
    -H "x-api-key: ${API_KEY}" \
    -H "Content-Type: application/json" \
    -d '{"type":"request","meta":{}}'
done

# Esperado: 429 Too Many Requests após 100 requests
```

### Teste 3: CORS

```bash
curl -H "Origin: https://evil.com" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS http://localhost:4000/api/events

# Esperado: CORS error ou sem headers CORS
```

---

## 📖 Referências

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security Best Practices](https://docs.nestjs.com/security/helmet)
- [GitHub Security Advisories](https://github.com/advisories)

---

## 🚨 Reportar Vulnerabilidade

Encontrou uma vulnerabilidade?

**NÃO abra issue pública!**

Envie para: security@yourcompany.com

Incluir:
- Descrição da vulnerabilidade
- Passos para reproduzir
- Impacto potencial
- Sugestão de fix (se tiver)

---

**Lembre-se: Segurança não é opcional. É obrigatória. 🔒**

