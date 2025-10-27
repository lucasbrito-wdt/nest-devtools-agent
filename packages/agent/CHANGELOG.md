# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [0.1.8] - 2025-10-27

### ✨ Adicionado

- **Suporte para NestJS 11**: Atualizado peerDependencies para aceitar tanto NestJS 10 quanto 11
  - `@nestjs/common`: `^10.0.0 || ^11.0.0`
  - `@nestjs/core`: `^10.0.0 || ^11.0.0`
  
### 🔧 Melhorias

- Atualizado devDependencies para usar NestJS 11.1.0 para desenvolvimento
- Maior compatibilidade com projetos que usam versões mais recentes do NestJS

---

## [0.1.5] - 2025-10-27

### ✅ Corrigido

- Republicação da versão 0.1.4 com todas as correções compiladas corretamente

---

## [0.1.4] - 2025-10-27 [YANKED]

**Nota**: Esta versão foi publicada sem as correções compiladas. Use 0.1.5 ao invés.

### ✅ Corrigido

- **[CRÍTICO]** Corrigido erro "Nest can't resolve dependencies of the DevtoolsService" ao instalar o pacote
  - Adicionado export dos tipos `shared` no `index.ts` para que usuários possam importar `DevToolsAgentConfig` e outros tipos
  - Adicionada validação no módulo para mostrar mensagens de erro mais claras quando `.forRoot()` ou `.forRootAsync()` não são usados
  - Adicionado suporte para `imports` no método `forRootAsync()`

### 📚 Documentação

- Adicionado guia detalhado de instalação (`INSTALLATION.md`) com:
  - Passo a passo completo de instalação
  - Exemplos de configuração básica e avançada
  - Seção de troubleshooting específica para erros comuns
  - Guia de configuração para produção
  - Testes de integração

- Adicionado guia de exemplos de uso (`USAGE_EXAMPLE.md`) com:
  - 10+ exemplos práticos de configuração
  - Exemplo com ConfigService
  - Configuração por ambiente
  - Feature flags
  - Monitoramento seletivo
  - Microserviços
  - Injeção manual do DevtoolsService
  - Testes
  - Docker Compose
  - Kubernetes

- Melhorado `README.md` com:
  - Seção de troubleshooting expandida com solução específica para o erro de dependências
  - Exemplos de uso correto vs incorreto
  - Links para novos guias de documentação

### 🔧 Melhorias

- Adicionado construtor no `DevtoolsModule` com comentário explicativo
- Adicionada validação de configuração obrigatória no método `forRoot()`
- Adicionada validação de `useFactory` no método `forRootAsync()`
- Melhoradas mensagens de erro para facilitar debugging

---

## [0.1.3] - 2025-10-26

### ✨ Adicionado

- Primeira versão pública do pacote
- Suporte para captura automática de requisições HTTP
- Suporte para captura de exceções
- Interceptors e filters automáticos
- Sanitização de dados sensíveis
- Buffer de eventos quando backend está offline
- Retry automático com exponential backoff
- Configuração assíncrona com `forRootAsync()`

### 📦 Dependências

- axios ^1.6.5
- @nestjs/common ^10.0.0 (peer)
- @nestjs/core ^10.0.0 (peer)

---

## [0.1.0] - [0.1.2]

Versões de desenvolvimento inicial (não publicadas no npm).

---

## 🔗 Links

- [npm](https://www.npmjs.com/package/nest-devtools-agent)
- [GitHub](https://github.com/lucasbrito-wdt/nest-devtools-agent)
- [Issues](https://github.com/lucasbrito-wdt/nest-devtools-agent/issues)

---

**Legenda:**

- ✨ `Adicionado` - Novas funcionalidades
- 🔧 `Melhorias` - Melhorias em funcionalidades existentes
- ✅ `Corrigido` - Correções de bugs
- 🚨 `Depreciado` - Funcionalidades que serão removidas em versões futuras
- 🗑️ `Removido` - Funcionalidades removidas
- 🔒 `Segurança` - Correções de vulnerabilidades de segurança
- 📚 `Documentação` - Mudanças na documentação
