# 📦 Setup de Publicação no npm

Este documento explica como configurar a publicação automática do pacote `@nest-devtools/agent` no npm.

## 🚨 Problema: Scope não encontrado

O erro que você está vendo:

```
npm error 404 Not Found - PUT https://registry.npmjs.org/@nest-devtools%2fagent
npm error 404  '@nest-devtools/agent@0.1.0' is not in this registry.
```

Isso acontece porque o **scope** `@nest-devtools` não existe no npm registry.

## ✅ Solução: Criar Organização no npm

### Opção 1: Criar Organização (Recomendado)

Siga estes passos:

#### 1. Acesse o npm

```
https://www.npmjs.com/org/create
```

#### 2. Crie a organização `nest-devtools`

**Passos:**

1. Login na sua conta npm
2. Clique em "Create an Organization"
3. Escolha o plano **Free**
4. Nome da organização: `nest-devtools`
5. Slug: `nest-devtools`
6. Marque como **Pública** (para publicar pacotes públicos)

#### 3. Adicione o usuário à organização

```
https://www.npmjs.com/settings/nest-devtools/members
```

Adicione seu usuário npm à organização.

#### 4. Configure o token no GitHub

**Settings → Secrets and variables → Actions → NPM_TOKEN**

Seu token deve ter permissões para:

- ✅ Read
- ✅ Write
- ✅ Automate

Para criar um novo token:

```
https://www.npmjs.com/settings/[SEU-USUARIO]/tokens
```

Clique em "Generate New Token" → "Automation"

#### 5. Teste a publicação

Agora você pode fazer push e o workflow irá publicar automaticamente:

```bash
git add .
git commit -m "chore: setup npm publication"
git push origin master
```

---

## ✅ Opção 2: Publicar sem Scope (Alternativa)

Se você não quiser criar uma organização, pode publicar o pacote sem o scope:

### 1. Alterar nome do pacote

Edite `packages/agent/package.json`:

```json
{
  "name": "nest-devtools-agent"
  // remova o scope @nest-devtools/
}
```

### 2. Publicar como usuário

O pacote ficará disponível como:

```
https://www.npmjs.com/package/nest-devtools-agent
```

**Instalação:**

```bash
npm install nest-devtools-agent
```

---

## 🔍 Verificação

### Verificar se a organização existe

Acesse no navegador:

```
https://www.npmjs.com/org/nest-devtools
```

Se retornar **404**, a organização não existe ainda.

### Verificar publicação

Após o workflow executar com sucesso:

```
https://www.npmjs.com/package/@nest-devtools/agent
```

---

## 🎯 Comparação das Opções

### Com Scope (@nest-devtools/agent)

**Prós:**

- ✅ Organização profissional
- ✅ Múltiplos pacotes na mesma org
- ✅ Namespace limpo
- ✅ Melhor para projetos open source

**Contras:**

- ⚠️ Requer criar organização no npm
- ⚠️ Pode ter custo em planos pagos (grátis é suficiente)

### Sem Scope (nest-devtools-agent)

**Prós:**

- ✅ Mais simples de configurar
- ✅ Não precisa criar organização

**Contras:**

- ❌ Nome mais longo
- ❌ Menos organizado para múltiplos pacotes
- ❌ Usuário fica visível no nome

---

## 📝 Checklist

Antes de publicar, verifique:

- [ ] Organização `nest-devtools` criada no npm
- [ ] Usuário adicionado como membro da organização
- [ ] Token `NPM_TOKEN` configurado no GitHub Secrets
- [ ] Token tem permissão "Automation"
- [ ] Versão atualizada no `packages/agent/package.json`
- [ ] Build local funciona: `cd packages/agent && bun run build`

---

## 🚀 Como Publicar

### Automaticamente (Recomendado)

```bash
# Fazer push na branch master
git push origin master

# → Workflow executa automaticamente
# → Publica no npm
```

### Manualmente

```bash
cd packages/agent

# Publicar
npm publish --access public
```

---

## 🐛 Troubleshooting

### Erro: "scope not found"

**Solução:** Criar organização no npm (veja Opção 1)

### Erro: "authentication failed"

**Solução:** Verificar se `NPM_TOKEN` está correto no GitHub Secrets

### Erro: "package already exists"

**Solução:** Atualizar a versão no `package.json`:

```json
{
  "version": "0.1.1" // bump version
}
```

### Erro: "You do not have permission"

**Solução:**

1. Verificar se usuário está na organização
2. Verificar permissões do token
3. Criar novo token com permissão "Automation"

---

## 📚 Recursos

- [npm Organizations](https://docs.npmjs.com/organizations/introducing-orgs)
- [npm Publishing](https://docs.npmjs.com/packages-and-modules/publishing-packages)
- [npm Token](https://docs.npmjs.com/creating-and-viewing-access-tokens)
- [Two-Factor Authentication](https://docs.npmjs.com/configuring-two-factor-authentication)

---

## ✅ Próximos Passos

1. **Criar organização no npm** (Opção 1)
2. **Configurar GitHub Secret** `NPM_TOKEN`
3. **Fazer push** e verificar publicação

```bash
git add .
git commit -m "chore: setup npm publication"
git push origin master
```

🎉 **Pronto para publicar!**
