# 🤝 Guia de Contribuição

Obrigado por considerar contribuir com o Nest DevTools Telescope! 🎉

---

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Contribuir](#como-contribuir)
- [Setup de Desenvolvimento](#setup-de-desenvolvimento)
- [Convenções de Código](#convenções-de-código)
- [Processo de Pull Request](#processo-de-pull-request)
- [Reportar Bugs](#reportar-bugs)
- [Sugerir Features](#sugerir-features)

---

## Código de Conduta

Este projeto adere ao [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/).
Ao participar, você concorda em manter um ambiente respeitoso e inclusivo.

---

## Como Contribuir

### 1. Fork o Repositório

```bash
# Via GitHub: clique em "Fork"
# Clone seu fork
git clone https://github.com/seu-usuario/nest-devtools-telescope.git
cd nest-devtools-telescope
```

### 2. Crie uma Branch

```bash
git checkout -b feature/minha-feature
# ou
git checkout -b fix/meu-bug-fix
```

**Convenção de nomes:**
- `feature/nome-da-feature`
- `fix/nome-do-bug`
- `docs/descricao-da-doc`
- `refactor/descricao`

### 3. Faça suas Mudanças

- Escreva código limpo e documentado
- Adicione testes se aplicável
- Atualize documentação se necessário

### 4. Commit

```bash
git add .
git commit -m "feat: adiciona query tracing para TypeORM"
```

**Convenção de commits:** [Conventional Commits](https://www.conventionalcommits.org/)

### 5. Push

```bash
git push origin feature/minha-feature
```

### 6. Abra Pull Request

- Vá para o repositório original no GitHub
- Clique em "New Pull Request"
- Selecione sua branch
- Preencha o template de PR

---

## Setup de Desenvolvimento

### Pré-requisitos

- Node.js >= 20
- pnpm >= 8
- Docker (para PostgreSQL/Redis)
- Git

### Instalação

```bash
# Clone
git clone https://github.com/yourorg/nest-devtools-telescope.git
cd nest-devtools-telescope

# Instale dependências
pnpm install

# Suba banco de dados
pnpm docker:up

# Inicie desenvolvimento
pnpm dev
```

### Estrutura do Projeto

```
nest-devtools-telescope/
├── packages/
│   ├── agent/      → Biblioteca de instrumentação
│   ├── backend/    → API NestJS
│   ├── frontend/   → UI React
│   └── shared/     → Tipos compartilhados
├── docs/           → Documentação
├── docker-compose.yml
└── README.md
```

---

## Convenções de Código

### TypeScript

- Use TypeScript strict mode
- Sempre tipagem explícita em funções públicas
- Evite `any` (use `unknown` se necessário)

```typescript
// ✅ Bom
function processEvent(event: DevToolsEvent): Promise<void> {
  // ...
}

// ❌ Ruim
function processEvent(event: any) {
  // ...
}
```

### Nomenclatura

- **Classes:** `PascalCase` (ex: `DevtoolsService`)
- **Funções/Métodos:** `camelCase` (ex: `sendEvent`)
- **Constantes:** `UPPER_SNAKE_CASE` (ex: `MAX_BUFFER_SIZE`)
- **Interfaces:** `PascalCase` com `I` se ambíguo (ex: `DevToolsEvent`)

### Imports

```typescript
// Ordem: built-in → externos → internos → relativos
import { Module } from '@nestjs/common';
import axios from 'axios';
import { DevtoolsService } from './devtools.service';
import { sanitize } from '../utils';
```

### Comentários

```typescript
/**
 * Envia evento para o backend DevTools
 * 
 * @param event - Evento a ser enviado
 * @throws {Error} - Se o backend estiver offline e buffer desabilitado
 */
async sendEvent(event: DevToolsEvent): Promise<void> {
  // ...
}
```

---

## Processo de Pull Request

### Checklist antes de abrir PR

- [ ] Código compila sem erros (`pnpm build`)
- [ ] Lint passa (`pnpm lint`)
- [ ] Testes passam (`pnpm test`)
- [ ] Documentação atualizada se necessário
- [ ] CHANGELOG.md atualizado (na seção Unreleased)
- [ ] Commit messages seguem Conventional Commits

### Template de PR

```markdown
## Descrição

Breve descrição do que foi feito.

## Tipo de Mudança

- [ ] Bug fix
- [ ] Nova feature
- [ ] Breaking change
- [ ] Documentação

## Como Testar

1. Passo 1
2. Passo 2

## Checklist

- [ ] Lint passa
- [ ] Testes passam
- [ ] Documentação atualizada

## Screenshots (se aplicável)

```

### Revisão

- Pelo menos 1 aprovação necessária
- CI deve passar
- Conflitos resolvidos

---

## Reportar Bugs

### Antes de Reportar

- Verifique se já não existe issue aberta
- Use a versão mais recente
- Tente reproduzir em ambiente limpo

### Template de Bug Report

```markdown
**Descrição do Bug**
Descrição clara e concisa.

**Como Reproduzir**
1. Vá para '...'
2. Clique em '...'
3. Veja erro

**Comportamento Esperado**
O que deveria acontecer.

**Screenshots**
Se aplicável.

**Ambiente**
- OS: [Windows 11]
- Node: [20.10.0]
- Versão: [0.1.0]

**Contexto Adicional**
Qualquer outra informação relevante.
```

---

## Sugerir Features

### Template de Feature Request

```markdown
**Problema a Resolver**
Descreva o problema que a feature resolveria.

**Solução Proposta**
Descreva sua ideia de solução.

**Alternativas Consideradas**
Outras formas de resolver.

**Contexto Adicional**
Screenshots, mockups, etc.
```

---

## Testes

### Rodando Testes

```bash
# Todos os testes
pnpm test

# Testes de um pacote específico
cd packages/agent
pnpm test

# Com coverage
pnpm test --coverage
```

### Escrevendo Testes

```typescript
// agent.service.spec.ts
describe('DevtoolsService', () => {
  let service: DevtoolsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [DevtoolsService],
    }).compile();

    service = module.get<DevtoolsService>(DevtoolsService);
  });

  it('should sanitize sensitive fields', () => {
    const event = {
      type: EventType.REQUEST,
      meta: { password: 'secret' },
    };

    const sanitized = service['sanitizeEvent'](event);
    expect(sanitized.meta.password).toBe('[REDACTED]');
  });
});
```

---

## Documentação

### Atualizando Docs

- `README.md` — Overview geral
- `docs/` — Documentação detalhada
- Código — JSDoc em funções públicas

### Escrevendo Docs

- Use linguagem clara e objetiva
- Adicione exemplos de código
- Inclua screenshots se relevante
- Mantenha atualizado com mudanças de código

---

## Perguntas?

- **GitHub Discussions:** [Link]
- **Discord:** [Link]
- **Email:** dev@yourcompany.com

---

**Obrigado por contribuir! 🚀**

