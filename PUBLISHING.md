# 📦 Guia de Publicação do Pacote Agent

> Como publicar `@nest-devtools/agent` e `@nest-devtools/shared` no npm

---

## 🎯 Pré-requisitos

1. ✅ Conta npm criada
2. ✅ Token npm configurado no GitHub Secrets
3. ✅ Permissões no escopo `@nest-devtools`
4. ✅ Todos os testes passando

---

## 📋 Checklist Antes de Publicar

- [ ] Código revisado e testado
- [ ] README.md atualizado
- [ ] CHANGELOG.md atualizado
- [ ] Versão atualizada no package.json
- [ ] Build funciona sem erros
- [ ] Testes passando
- [ ] Type check passa
- [ ] Lint passa
- [ ] Documentação atualizada

---

## 🚀 Métodos de Publicação

### Método 1: GitHub Actions (Recomendado)

**Passo a passo:**

1. **Acesse GitHub Actions:**
```
Repository → Actions → Publish Agent Package
```

2. **Click em "Run workflow":**
- Branch: `main`
- Version: `0.1.0` (ou próxima versão)
- Tag: `latest` (ou `beta`, `next`, `alpha`)

3. **Confirme e aguarde:**
- Workflow executa automaticamente
- Build → Test → Publish
- GitHub Release criado automaticamente

**Vantagens:**
- ✅ Automatizado e seguro
- ✅ Cria release no GitHub
- ✅ Gera changelog automático
- ✅ Roda todos os testes

---

### Método 2: Publicação Manual Local

**Importante:** ⚠️ Não recomendado para produção!

**Passo 1: Preparar ambiente**
```bash
# Garantir que está na branch main
git checkout main
git pull origin main

# Limpar builds anteriores
pnpm clean

# Instalar dependências
pnpm install
```

**Passo 2: Build dos pacotes**
```bash
# Build shared primeiro (dependência do agent)
pnpm --filter @nest-devtools/shared build

# Build agent
pnpm --filter @nest-devtools/agent build
```

**Passo 3: Executar testes**
```bash
# Testes do agent
pnpm --filter @nest-devtools/agent test

# Type check
pnpm typecheck

# Lint
pnpm lint
```

**Passo 4: Atualizar versão**
```bash
# Shared
cd packages/shared
npm version patch  # ou minor/major
cd ../..

# Agent
cd packages/agent
npm version patch  # ou minor/major
cd ../..
```

**Passo 5: Publicar**
```bash
# Login no npm (se necessário)
npm login

# Publicar shared
cd packages/shared
npm publish --access public
cd ../..

# Publicar agent
cd packages/agent
npm publish --access public
cd ../..
```

**Passo 6: Commit e Tag**
```bash
git add .
git commit -m "chore: release v0.1.0"
git tag v0.1.0
git push origin main --tags
```

---

## 🔄 Versionamento Semântico

Seguimos [Semantic Versioning](https://semver.org/):

### MAJOR.MINOR.PATCH (ex: 1.2.3)

- **MAJOR (1.x.x)**: Breaking changes
  ```bash
  npm version major
  ```

- **MINOR (x.2.x)**: Novas features (backward compatible)
  ```bash
  npm version minor
  ```

- **PATCH (x.x.3)**: Bug fixes
  ```bash
  npm version patch
  ```

### Pre-releases

- **Alpha**: `0.1.0-alpha.1`
  ```bash
  npm version prerelease --preid=alpha
  ```

- **Beta**: `0.1.0-beta.1`
  ```bash
  npm version prerelease --preid=beta
  ```

- **Release Candidate**: `0.1.0-rc.1`
  ```bash
  npm version prerelease --preid=rc
  ```

---

## 🏷️ Tags npm

### latest (default)
Versão estável recomendada para produção
```bash
npm publish --tag latest
```

Usuários instalam com:
```bash
npm install @nest-devtools/agent
```

### beta
Versão em teste, preview de features
```bash
npm publish --tag beta
```

Usuários instalam com:
```bash
npm install @nest-devtools/agent@beta
```

### next
Versão de desenvolvimento, bleeding edge
```bash
npm publish --tag next
```

Usuários instalam com:
```bash
npm install @nest-devtools/agent@next
```

### alpha
Versão muito instável, early preview
```bash
npm publish --tag alpha
```

---

## 📝 Exemplo de Fluxo Completo

### Cenário: Publicar nova feature (versão minor)

```bash
# 1. Criar branch
git checkout -b feature/new-cool-feature
# ... desenvolver feature ...
git commit -m "feat: add cool new feature"
git push origin feature/new-cool-feature

# 2. Criar PR e merge para main

# 3. Na main, atualizar versão
git checkout main
git pull origin main

# 4. Atualizar versão nos pacotes
cd packages/shared
npm version minor  # 0.1.0 → 0.2.0
cd ../agent
npm version minor  # 0.1.0 → 0.2.0
cd ../..

# 5. Commit versão
git add .
git commit -m "chore: bump version to 0.2.0"
git push origin main

# 6. Publicar via GitHub Actions
# Actions → Publish Agent Package → Run workflow
# Version: 0.2.0
# Tag: latest
```

---

## 🔍 Verificar Publicação

### Via CLI
```bash
# Ver versões publicadas
npm view @nest-devtools/agent versions

# Ver última versão
npm view @nest-devtools/agent version

# Ver informações completas
npm view @nest-devtools/agent

# Ver dist-tags
npm view @nest-devtools/agent dist-tags
```

### Via Web
- npm: https://www.npmjs.com/package/@nest-devtools/agent
- Bundlephobia: https://bundlephobia.com/package/@nest-devtools/agent
- npm trends: https://npmtrends.com/@nest-devtools/agent

---

## 🧪 Testar Pacote Publicado

### 1. Criar projeto teste
```bash
mkdir test-nest-app
cd test-nest-app
npm init -y
npm install @nestjs/common @nestjs/core @nest-devtools/agent
```

### 2. Criar arquivo teste
```typescript
// test.ts
import { DevtoolsModule } from '@nest-devtools/agent';

console.log('✅ Import successful!', DevtoolsModule);
```

### 3. Executar
```bash
npx ts-node test.ts
```

---

## 🐛 Despublicar (Emergência)

⚠️ **Atenção:** Apenas nas primeiras 72h após publicação!

```bash
# Despublicar versão específica
npm unpublish @nest-devtools/agent@0.1.0

# Despublicar todas as versões (PERIGOSO!)
npm unpublish @nest-devtools/agent --force
```

**Alternativa:** Deprecar versão
```bash
npm deprecate @nest-devtools/agent@0.1.0 "Versão com bug crítico, use 0.1.1"
```

---

## 📊 Atualizar dist-tags

```bash
# Mover 'latest' para outra versão
npm dist-tag add @nest-devtools/agent@0.2.0 latest

# Adicionar tag customizada
npm dist-tag add @nest-devtools/agent@0.3.0 stable

# Listar tags
npm dist-tag ls @nest-devtools/agent

# Remover tag
npm dist-tag rm @nest-devtools/agent beta
```

---

## 📈 Monitoramento Pós-Publicação

### npm Stats
```bash
# Ver downloads
npm view @nest-devtools/agent

# Via API
curl https://api.npmjs.org/downloads/point/last-month/@nest-devtools/agent
```

### Ferramentas Úteis
- [npm-stat](https://npm-stat.com/charts.html?package=@nest-devtools/agent)
- [Bundlephobia](https://bundlephobia.com/package/@nest-devtools/agent)
- [npms.io](https://npms.io/search?q=%40nest-devtools%2Fagent)

---

## 🔐 Segurança

### Auditar Dependências
```bash
npm audit
pnpm audit

# Fix vulnerabilidades
npm audit fix
```

### 2FA (Recomendado)
```bash
# Habilitar 2FA na conta npm
npm profile enable-2fa auth-and-writes
```

---

## ❓ FAQ

**Q: Posso publicar versões diferentes de shared e agent?**
A: Sim, mas mantenha compatibilidade. Agent especifica `@nest-devtools/shared` como dependência.

**Q: Como faço beta testing?**
A: Publique com tag `beta`:
```bash
npm publish --tag beta
```

**Q: Erro "need auth" ao publicar?**
A: Execute `npm login` ou verifique `NPM_TOKEN` no GitHub Secrets.

**Q: Pacote ficou muito grande?**
A: Verifique o que está sendo incluído:
```bash
npm pack --dry-run
```

---

## 📚 Recursos

- [npm Docs - Publishing](https://docs.npmjs.com/cli/v10/commands/npm-publish)
- [Semantic Versioning](https://semver.org/)
- [npm Dist Tags](https://docs.npmjs.com/cli/v10/commands/npm-dist-tag)
- [GitHub Actions - npm Publish](https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages)

---

**Pronto para publicar! 🚀**

