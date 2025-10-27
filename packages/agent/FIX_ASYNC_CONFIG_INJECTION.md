# Correção de Injeção Assíncrona de Configuração

## 📋 Problema Identificado

No método `forRootAsync` do `DevtoolsModule`, os custom providers (`APP_INTERCEPTOR` e `APP_FILTER`) não estavam recebendo a configuração corretamente quando resolvida de forma assíncrona através da `useFactory`.

**Root Cause:**

- Os interceptors e filters injetavam tanto `DevtoolsService` quanto `DEVTOOLS_CONFIG` diretamente
- A `DEVTOOLS_CONFIG` era resolvida via factory assíncrona
- A ordem de resolução das dependências podia causar que os interceptors/filters recebessem a configuração antes dela estar completamente resolvida
- Duplicação de injeção de configuração (via service e via token)

## ✅ Solução Implementada

### 1. Adicionar Getter no DevtoolsService

**Arquivo:** `packages/agent/src/devtools.service.ts`

Adicionado método público `getConfig()` para expor a configuração:

```typescript
/**
 * Retorna a configuração atual do DevTools
 * Útil para interceptors e filters acessarem a config
 */
getConfig(): DevToolsAgentConfig {
  return this.config;
}
```

### 2. Simplificar Interceptors e Filters

**Arquivos Modificados:**

- `packages/agent/src/interceptors/request.interceptor.ts`
- `packages/agent/src/filters/exception.filter.ts`

**Mudanças:**

- Removida a injeção direta de `DEVTOOLS_CONFIG` via `@Inject(DEVTOOLS_CONFIG)`
- Os constructors agora recebem apenas `DevtoolsService`
- A configuração é acessada via `this.devtoolsService.getConfig()`
- Adicionados logs de debug para validar que a configuração está acessível

**Antes:**

```typescript
constructor(
  private readonly devtoolsService: DevtoolsService,
  @Optional()
  @Inject(DEVTOOLS_CONFIG)
  private readonly config?: DevToolsAgentConfig,
) { }
```

**Depois:**

```typescript
constructor(private readonly devtoolsService: DevtoolsService) {
  this.logger.log('🎯 DevtoolsRequestInterceptor registrado');
  this.logger.debug(
    `  └─ Config acessível via service: ${this.devtoolsService.getConfig() ? 'SIM' : 'NÃO'}`,
  );
}
```

### 3. Simplificar Factories no DevtoolsModule

**Arquivo:** `packages/agent/src/devtools.module.ts`

**Mudanças no método `buildProviders` (forRoot):**

- Removida a injeção de `DEVTOOLS_CONFIG` dos factories
- Os factories agora injetam apenas `DevtoolsService`
- Adicionados logs de debug para rastreamento

**Mudanças no método `buildAsyncProviders` (forRootAsync):**

- Removida a injeção de `DEVTOOLS_CONFIG` dos factories
- Os factories agora injetam apenas `DevtoolsService`
- Adicionados logs detalhados mostrando:
  - Quando os interceptors/filters são criados
  - Se o DevtoolsService está presente
  - Se a configuração está acessível via service
  - Valores da configuração (enabled, backendUrl)

**Antes:**

```typescript
{
  provide: APP_INTERCEPTOR,
  useFactory: (service: DevtoolsService, config: DevToolsAgentConfig) => {
    return new DevtoolsRequestInterceptor(service, config);
  },
  inject: [DevtoolsService, DEVTOOLS_CONFIG],
}
```

**Depois:**

```typescript
{
  provide: APP_INTERCEPTOR,
  useFactory: (service: DevtoolsService) => {
    this.logger.debug('🔧 Criando APP_INTERCEPTOR via factory (forRootAsync)');
    this.logger.debug(
      `  └─ DevtoolsService: ${service ? 'PRESENTE' : 'AUSENTE'}`,
    );
    const config = service.getConfig();
    this.logger.debug(`  └─ Config enabled: ${config?.enabled}`);
    this.logger.debug(`  └─ Config backendUrl: ${config?.backendUrl}`);
    return new DevtoolsRequestInterceptor(service);
  },
  inject: [DevtoolsService],
}
```

## 🎯 Benefícios

1. **Fonte única de verdade:** A configuração existe apenas no `DevtoolsService`, eliminando duplicação
2. **Resolução garantida:** Como o `DevtoolsService` já tem a configuração injetada via factory, os interceptors/filters sempre receberão a configuração correta
3. **Simplificação:** Menos dependências para injetar, código mais limpo
4. **Melhor debugging:** Logs detalhados mostram exatamente quando e como a configuração é acessada
5. **Conformidade com NestJS:** Segue as [melhores práticas de Custom Providers](https://docs.nestjs.com/providers#custom-providers)

## 🔍 Validação

### Logs Esperados na Inicialização

Quando usar `forRootAsync`:

```
[DevtoolsModule] 🔍 Executando useFactory para DEVTOOLS_CONFIG
[DevtoolsModule]   └─ Args recebidos: 1
[DevtoolsModule] ✅ Configuração resolvida pela useFactory:
[DevtoolsModule]   ├─ Enabled: true
[DevtoolsModule]   ├─ Backend URL: http://localhost:4000
[DevtoolsModule]   └─ Timeout: 5000ms
[DevtoolsModule] 🔍 Criando DevtoolsService via useFactory
[DevtoolsModule]   └─ Config: PRESENTE
[DevtoolsService] 🔍 DevtoolsService - Construtor chamado
[DevtoolsService]   └─ Config recebido: SIM
[DevtoolsService] 🔧 DevtoolsService inicializado
[DevtoolsService]   ├─ Enabled: true
[DevtoolsService]   ├─ Backend URL: http://localhost:4000
[DevtoolsService]   └─ Timeout: 5000ms
[DevtoolsModule] ✅ Registrando interceptors e filters via forRootAsync
[DevtoolsModule] 🔧 Criando APP_INTERCEPTOR via factory (forRootAsync)
[DevtoolsModule]   └─ DevtoolsService: PRESENTE
[DevtoolsModule]   └─ Config enabled: true
[DevtoolsModule]   └─ Config backendUrl: http://localhost:4000
[DevtoolsRequestInterceptor] 🎯 DevtoolsRequestInterceptor registrado
[DevtoolsRequestInterceptor]   └─ Config acessível via service: SIM
[DevtoolsModule] 🔧 Criando APP_FILTER via factory (forRootAsync)
[DevtoolsModule]   └─ DevtoolsService: PRESENTE
[DevtoolsExceptionFilter] 🚨 DevtoolsExceptionFilter registrado
[DevtoolsExceptionFilter]   └─ Config acessível via service: SIM
```

## 📦 Arquivos Modificados

- `packages/agent/src/devtools.service.ts` - Adicionado getter `getConfig()`
- `packages/agent/src/devtools.module.ts` - Simplificados factories dos providers
- `packages/agent/src/interceptors/request.interceptor.ts` - Removida injeção de config
- `packages/agent/src/filters/exception.filter.ts` - Removida injeção de config

## 🧪 Como Testar

1. **Compile o pacote:**

   ```bash
   cd packages/agent
   pnpm run build
   ```

2. **Compile o backend:**

   ```bash
   cd packages/backend
   pnpm run build
   ```

3. **Inicie o backend e observe os logs:**

   ```bash
   pnpm start
   ```

4. **Verifique que:**
   - O DevtoolsService recebe a configuração corretamente
   - Os interceptors e filters conseguem acessar a configuração via service
   - Não há erros de "config is undefined"

## 📚 Referências

- [NestJS Custom Providers](https://docs.nestjs.com/providers#custom-providers)
- [NestJS Dynamic Modules](https://docs.nestjs.com/fundamentals/dynamic-modules)
- [NestJS Async Configuration](https://docs.nestjs.com/techniques/configuration#async-configuration)

## ✨ Conclusão

A correção garante que a configuração assíncrona seja passada corretamente aos interceptors e filters, eliminando problemas de ordem de resolução de dependências e simplificando o código seguindo as melhores práticas do NestJS.
