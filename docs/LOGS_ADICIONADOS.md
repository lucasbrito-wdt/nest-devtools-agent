# 📋 Logs Detalhados Adicionados ao DevTools

**Data:** 27 de Outubro de 2025  
**Versão Agent:** 0.1.9  
**Objetivo:** Facilitar debugging e troubleshooting

---

## 🎯 Resumo

Logs detalhados foram adicionados em **todos os pontos críticos** do Agent e do Backend DevTools para facilitar o rastreamento de eventos e identificação de problemas.

---

## 📦 Agent (nest-devtools-agent@0.1.9)

### 1. **DevtoolsService** (`packages/agent/src/devtools.service.ts`)

#### Logs de Inicialização

```
🔧 DevtoolsService inicializado
  ├─ Enabled: true
  ├─ Backend URL: http://localhost:4001
  ├─ Timeout: 10000ms
  ├─ Max Retries: 3
  ├─ Buffer Enabled: false
  ├─ Capture Headers: true
  ├─ Capture Body: true
  └─ Capture Response: false
```

#### Logs de Envio de Eventos

```
📤 Tentando enviar evento: GET /api/users
  ├─ URL destino: http://localhost:4001/ingest
  ├─ Tipo: request
  └─ Payload sanitizado: {"type":"request","meta":{"timestamp":1234567890...}}

✅ Evento enviado com sucesso em 45ms: GET /api/users
```

#### Logs de Erro

```
❌ Falha ao enviar evento: GET /api/users
  ├─ Erro: connect ECONNREFUSED 127.0.0.1:4001
  ├─ Código: ECONNREFUSED
  ├─ Sem resposta do servidor
  ├─ URL tentada: http://localhost:4001/ingest
  └─ Stack: Error: connect ECONNREFUSED...

📦 Adicionando evento ao buffer local
```

#### Logs de Buffer

```
📦 Evento adicionado ao buffer (1/100)
⚠️  Buffer cheio (100), removendo evento mais antigo

🔄 Tentando reenviar 5 eventos do buffer
  ✅ Evento 1 reenviado com sucesso
  ✅ Evento 2 reenviado com sucesso
  ❌ Falha ao reenviar evento 3
  ✅ Evento 4 reenviado com sucesso
  ✅ Evento 5 reenviado com sucesso
📊 Flush completo: 4 sucesso, 1 falhas
```

### 2. **DevtoolsRequestInterceptor** (`packages/agent/src/interceptors/request.interceptor.ts`)

#### Logs de Captura

```
🎯 DevtoolsRequestInterceptor registrado

🔍 Interceptando requisição: GET /api/users

🟢 Capturado: GET /api/users - 200 (45ms)
  └─ Response capturado (512 bytes)

🟡 Capturado: POST /api/login - 401 (23ms)

🔴 Capturado: GET /api/internal - 500 (156ms)
```

### 3. **DevtoolsExceptionFilter** (`packages/agent/src/filters/exception.filter.ts`)

#### Logs de Exceções

```
🚨 DevtoolsExceptionFilter registrado

⚠️ Exceção capturada: HttpException
  ├─ Status: 404
  ├─ Mensagem: Resource not found
  ├─ Rota: GET /api/users/123
  └─ Stack: at UsersController.findOne

💥 Exceção capturada: Error
  ├─ Status: 500
  ├─ Mensagem: Database connection failed
  ├─ Rota: GET /api/data
  └─ Stack: at DatabaseService.connect
```

---

## 🖥️ Backend DevTools

### 1. **IngestController** (`packages/backend/src/modules/ingest/ingest.controller.ts`)

#### Logs de Recebimento

```
🚀 IngestController inicializado

📥 Recebido evento: GET /api/users
  ├─ Tipo: request
  └─ Payload size: 1024 bytes

✅ Evento persistido com sucesso em 12ms: 01HQ1K2M3N4P5Q6R7S8T9V
```

#### Logs de Erro

```
❌ Erro ao ingerir evento: GET /api/users
  ├─ Erro: Connection to database failed
  └─ Stack: at PrismaClient.connect
```

### 2. **IngestService** (`packages/backend/src/modules/ingest/ingest.service.ts`)

#### Logs de Persistência

```
💾 Persistindo evento no banco de dados
  ├─ Tipo: request
  ├─ Route: /api/users
  ├─ Status: 200
  └─ Project ID: N/A

✅ Evento persistido: 01HQ1K2M3N4P5Q6R7S8T9V (request)

📡 Emitindo evento via WebSocket
```

#### Logs de Exceções

```
🚨 Exceção detectada: Database connection timeout
```

### 3. **EventsService** (`packages/backend/src/modules/events/events.service.ts`)

#### Logs de Consulta

```
📊 EventsService inicializado

🔍 Consultando eventos - Página 1, Limit 50
  ├─ Tipo: request, exception
  ├─ Route: /api/users
  └─ Status: 500
```

---

## 🎨 Legenda de Emojis

| Emoji | Significado                            |
| ----- | -------------------------------------- |
| 🔧    | Inicialização / Configuração           |
| 📤    | Envio de evento                        |
| ✅    | Sucesso                                |
| ❌    | Erro                                   |
| 🔍    | Interceptação / Captura                |
| 🟢    | Status 2xx (sucesso)                   |
| 🟡    | Status 4xx (erro cliente)              |
| 🔴    | Status 5xx (erro servidor)             |
| 🚨    | Exceção                                |
| ⚠️    | Aviso                                  |
| 💥    | Erro crítico / Exceção fatal           |
| 📦    | Buffer                                 |
| 🔄    | Retry / Reenvio                        |
| 📊    | Estatísticas / Resumo                  |
| 💾    | Persistência / Banco de dados          |
| 📡    | WebSocket / Real-time                  |
| 📥    | Recebimento                            |
| 🎯    | Registro / Inicialização de componente |

---

## 🚀 Como Usar

### 1. Ativar Logs Detalhados

Por padrão, logs DEBUG e VERBOSE não aparecem. Para visualizá-los:

**Desenvolvimento (via npm/pnpm):**

```bash
# Linux/Mac
export LOG_LEVEL=debug
pnpm run start:dev

# Windows (PowerShell)
$env:LOG_LEVEL="debug"
pnpm run start:dev
```

**Produção:**

```env
# .env
LOG_LEVEL=error  # Apenas erros
# ou
LOG_LEVEL=warn   # Avisos e erros
# ou
LOG_LEVEL=log    # Logs normais (default)
```

### 2. Visualizar Apenas Logs do DevTools

```bash
# Filtrar apenas logs do DevTools
pnpm run start:dev | grep "Devtools\|Agent\|Ingest\|Events"
```

### 3. Exemplo de Saída Completa

```
[Nest] 12345  - 27/10/2025, 17:00:00     LOG [DevtoolsService] 🔧 DevtoolsService inicializado
[Nest] 12345  - 27/10/2025, 17:00:00     LOG [DevtoolsService]   ├─ Enabled: true
[Nest] 12345  - 27/10/2025, 17:00:00     LOG [DevtoolsService]   ├─ Backend URL: http://localhost:4001
[Nest] 12345  - 27/10/2025, 17:00:00     LOG [DevtoolsService]   ├─ Timeout: 10000ms
[Nest] 12345  - 27/10/2025, 17:00:00     LOG [DevtoolsService]   ├─ Max Retries: 3
[Nest] 12345  - 27/10/2025, 17:00:00     LOG [DevtoolsService]   ├─ Buffer Enabled: false
[Nest] 12345  - 27/10/2025, 17:00:00     LOG [DevtoolsService]   ├─ Capture Headers: true
[Nest] 12345  - 27/10/2025, 17:00:00     LOG [DevtoolsService]   ├─ Capture Body: true
[Nest] 12345  - 27/10/2025, 17:00:00     LOG [DevtoolsService]   └─ Capture Response: false
[Nest] 12345  - 27/10/2025, 17:00:00     LOG [DevtoolsRequestInterceptor] 🎯 DevtoolsRequestInterceptor registrado
[Nest] 12345  - 27/10/2025, 17:00:00     LOG [DevtoolsExceptionFilter] 🚨 DevtoolsExceptionFilter registrado
[Nest] 12345  - 27/10/2025, 17:00:00     LOG [NestApplication] Nest application successfully started

--- Requisição feita: GET /api/users ---

[Nest] 12345  - 27/10/2025, 17:00:05   DEBUG [DevtoolsRequestInterceptor] 🔍 Interceptando requisição: GET /api/users
[Nest] 12345  - 27/10/2025, 17:00:05     LOG [DevtoolsRequestInterceptor] 🟢 Capturado: GET /api/users - 200 (45ms)
[Nest] 12345  - 27/10/2025, 17:00:05   DEBUG [DevtoolsService] 📤 Tentando enviar evento: GET /api/users
[Nest] 12345  - 27/10/2025, 17:00:05 VERBOSE [DevtoolsService]   ├─ URL destino: http://localhost:4001/ingest
[Nest] 12345  - 27/10/2025, 17:00:05 VERBOSE [DevtoolsService]   ├─ Tipo: request
[Nest] 12345  - 27/10/2025, 17:00:05 VERBOSE [DevtoolsService]   └─ Payload sanitizado: {"type":"request","meta":...}
[Nest] 12345  - 27/10/2025, 17:00:05     LOG [DevtoolsService] ✅ Evento enviado com sucesso em 23ms: GET /api/users
```

---

## 🔍 Troubleshooting com Logs

### Problema: Eventos não aparecem

**O que procurar nos logs:**

1. ✅ Verificar se `DevtoolsService inicializado` aparece com `Enabled: true`
2. ✅ Verificar se `DevtoolsRequestInterceptor registrado` aparece
3. ✅ Verificar se `Interceptando requisição` aparece ao fazer requests
4. ❌ Se aparecer `Falha ao enviar evento`, verificar erro específico

### Problema: Timeout / ECONNREFUSED

**Log característico:**

```
❌ Falha ao enviar evento: GET /api/users
  ├─ Erro: connect ECONNREFUSED 127.0.0.1:4001
  ├─ Código: ECONNREFUSED
  ├─ Sem resposta do servidor
  ├─ URL tentada: http://localhost:4001/ingest
```

**Solução:** Backend DevTools não está rodando. Inicie com `pnpm run dev`.

### Problema: 401 Unauthorized

**Log característico:**

```
❌ Falha ao enviar evento: GET /api/users
  ├─ Erro: Request failed with status code 401
  ├─ Status HTTP: 401
  ├─ Response: {"error":"Unauthorized","message":"Invalid API key"}
```

**Solução:** API Keys não correspondem entre agent e backend.

---

## 📚 Recursos Adicionais

- [CHANGELOG do Agent](packages/agent/CHANGELOG.md)
- [Documentação de Configuração](E:\NoBreakAds\back\DEVTOOLS_CONFIG.md)
- [README do Agent](packages/agent/README.md)

---

**Logs implementados com sucesso! Agora é muito mais fácil debugar problemas. 🎉**
