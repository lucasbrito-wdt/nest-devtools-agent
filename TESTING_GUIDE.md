# Guia de Testes - Dashboard DevTools

## 🧪 Como Testar as Novas Funcionalidades

Este guia mostra como testar todas as funcionalidades implementadas no dashboard.

## 📋 Pré-requisitos

1. **Backend rodando**:
```bash
cd packages/backend
npm run dev
```

2. **Frontend rodando**:
```bash
cd packages/frontend
npm run dev
```

3. **Aplicação de exemplo com o agent configurado** (opcional, mas recomendado)

## 🧪 Testes por Página

### 1. ✅ Página de Requests

#### Teste 1: Visualização da Listagem
1. Acesse `http://localhost:5173/requests`
2. Verifique se a tabela exibe:
   - ✅ Coluna "Método" (GET, POST, etc.)
   - ✅ Coluna "Rota"
   - ✅ Coluna "Status" com badge colorido
   - ✅ Coluna "Duração" em ms
   - ✅ Coluna "IP" com fonte monoespaçada
   - ✅ Coluna "Session" com badge roxo (se houver sessão)
   - ✅ Coluna "Quando" com timestamp relativo

#### Teste 2: Filtros
1. Digite algo no campo de busca
2. Verifique se a tabela filtra em tempo real
3. Selecione um status code no dropdown
4. Verifique se apenas requests com aquele status aparecem

#### Teste 3: Paginação
1. Se houver mais de 20 requests, verifique os botões de paginação
2. Clique em "Próxima" e verifique se carrega a próxima página
3. Clique em "Anterior" e verifique se volta

#### Teste 4: Detalhes do Request
1. Clique em qualquer linha da tabela
2. Verifique se abre a página de detalhes
3. Verifique a seção "Overview":
   - ✅ Status com badge colorido
   - ✅ Duração
   - ✅ IP
   - ✅ User Agent
   - ✅ Query Params (se houver)

#### Teste 5: Tab Request
1. Clique na tab "Request" (deve estar ativa por padrão)
2. Clique em "Headers"
   - ✅ Deve exibir JSON formatado dos headers
3. Clique em "Payload"
   - ✅ Deve exibir JSON formatado do body
   - ✅ Se não houver payload, deve exibir "No payload available"

#### Teste 6: Tab Response
1. Clique na tab "Response"
2. Clique em "Data"
   - ✅ Deve exibir JSON formatado da resposta
3. Clique em "Headers"
   - ✅ Deve exibir JSON formatado dos headers de resposta
4. Clique em "Session"
   - ✅ Deve exibir Session ID (se houver)
   - ✅ Deve exibir User ID (se houver)
   - ✅ Deve exibir Session Data (se houver)
   - ✅ Se não houver sessão, deve exibir "No session data available"

### 2. ✅ Página de Schedule

#### Teste 1: Dashboard de Estatísticas
1. Acesse `http://localhost:5173/schedule`
2. Verifique os cards de estatísticas:
   - ✅ Total de Jobs
   - ✅ Completados
   - ✅ Falhados
   - ✅ Em Execução
   - ✅ Taxa de Sucesso (%)
   - ✅ Duração Média (ms)

#### Teste 2: Listagem de Jobs
1. Verifique a tabela de jobs:
   - ✅ Job Name
   - ✅ Status com badge colorido
   - ✅ Cron Expression
   - ✅ Duração
   - ✅ Próxima Execução
   - ✅ Timestamp

#### Teste 3: Filtros
1. Selecione um status no dropdown
2. Verifique se filtra corretamente
3. Digite no campo de busca
4. Verifique se busca por job name

#### Teste 4: Detalhes do Job
1. Clique em um job na tabela
2. Verifique o modal com:
   - ✅ Job Name
   - ✅ Job ID
   - ✅ Status
   - ✅ Cron Expression
   - ✅ Duração
   - ✅ Started At / Completed At
   - ✅ Resultado (se houver)
   - ✅ Erro (se houver)

### 3. ✅ Página de HTTP Client

#### Teste 1: Dashboard de Estatísticas
1. Acesse `http://localhost:5173/http-client`
2. Verifique os cards:
   - ✅ Total de Requisições
   - ✅ Bem-sucedidas
   - ✅ Falhadas
   - ✅ Taxa de Sucesso (%)
   - ✅ Duração Média (ms)

#### Teste 2: Listagem de Requisições
1. Verifique a tabela:
   - ✅ Método (GET, POST, etc.)
   - ✅ URL
   - ✅ Status com badge
   - ✅ Duração
   - ✅ Timestamp

#### Teste 3: Filtros
1. Selecione um método no dropdown
2. Verifique se filtra
3. Selecione um status
4. Verifique se filtra

#### Teste 4: Detalhes da Requisição
1. Clique em uma requisição
2. Verifique o modal com:
   - ✅ Método e URL
   - ✅ Request Headers
   - ✅ Request Body
   - ✅ Response Status
   - ✅ Response Headers
   - ✅ Response Body
   - ✅ Duração
   - ✅ Erro (se houver)

### 4. ✅ Página de Redis

#### Teste 1: Dashboard de Estatísticas
1. Acesse `http://localhost:5173/redis`
2. Verifique os cards:
   - ✅ Total de Operações
   - ✅ Bem-sucedidas
   - ✅ Falhadas
   - ✅ Taxa de Sucesso (%)
   - ✅ Duração Média (ms)

#### Teste 2: Listagem de Operações
1. Verifique a tabela:
   - ✅ Comando (GET, SET, DEL, etc.)
   - ✅ Chave
   - ✅ Status
   - ✅ Duração
   - ✅ Timestamp

#### Teste 3: Filtros
1. Selecione um comando no dropdown
2. Verifique se filtra
3. Digite uma chave no campo de busca
4. Verifique se busca

#### Teste 4: Detalhes da Operação
1. Clique em uma operação
2. Verifique o modal com:
   - ✅ Comando
   - ✅ Chave
   - ✅ Argumentos
   - ✅ Valor
   - ✅ Resultado
   - ✅ Duração
   - ✅ Database
   - ✅ Erro (se houver)

### 5. ✅ Página de Sessions

#### Teste 1: Dashboard de Estatísticas
1. Acesse `http://localhost:5173/sessions`
2. Verifique os cards:
   - ✅ Total de Sessões
   - ✅ Ativas
   - ✅ Criadas
   - ✅ Destruídas

#### Teste 2: Listagem de Sessões
1. Verifique a tabela:
   - ✅ Session ID
   - ✅ User ID
   - ✅ Ação (created, updated, destroyed, accessed)
   - ✅ IP
   - ✅ Timestamp

#### Teste 3: Filtros
1. Selecione uma ação no dropdown
2. Verifique se filtra
3. Digite no campo de busca
4. Verifique se busca por session ID ou user ID

#### Teste 4: Detalhes da Sessão
1. Clique em uma sessão
2. Verifique o modal com:
   - ✅ Session ID
   - ✅ User ID
   - ✅ Ação
   - ✅ Session Data (JSON formatado)
   - ✅ IP
   - ✅ User Agent
   - ✅ Expires At

### 6. ✅ Navegação e Layout

#### Teste 1: Menu Lateral
1. Verifique se todos os itens estão visíveis:
   - ✅ Dashboard
   - ✅ Requests
   - ✅ Exceptions
   - ✅ Logs
   - ✅ Schedule
   - ✅ HTTP Client
   - ✅ Redis
   - ✅ Sessions

#### Teste 2: Navegação
1. Clique em cada item do menu
2. Verifique se navega para a página correta
3. Verifique se o item fica destacado

#### Teste 3: Dark Mode
1. Clique no botão de dark mode (ícone de lua/sol)
2. Verifique se todas as cores mudam
3. Navegue entre páginas
4. Verifique se o tema persiste

#### Teste 4: Responsividade
1. Redimensione a janela do navegador
2. Verifique se o layout se adapta
3. Teste em mobile (< 768px)
4. Teste em tablet (768px - 1024px)
5. Teste em desktop (> 1024px)

## 🔧 Gerando Dados de Teste

Se você não tiver dados reais, pode gerar dados de teste:

### Opção 1: Usar a aplicação de exemplo

```bash
cd examples/demo-app
npm install
npm run dev
```

Então faça algumas requisições para gerar dados.

### Opção 2: Inserir dados manualmente no banco

```sql
-- Inserir um request de teste
INSERT INTO events (id, type, payload, route, status, session_id, user_id, created_at)
VALUES (
  gen_random_uuid(),
  'request',
  '{"method":"GET","url":"/api/test","headers":{"host":"localhost:3000"},"body":null,"query":{},"ip":"127.0.0.1","userAgent":"Mozilla/5.0","duration":45,"response":{"message":"OK"},"responseHeaders":{"content-type":"application/json"},"sessionId":"sess_123","userId":"user_456","sessionData":{"authenticated":true}}',
  '/api/test',
  200,
  'sess_123',
  'user_456',
  NOW()
);

-- Inserir um schedule de teste
INSERT INTO schedules (id, job_id, job_name, cron_expression, status, started_at, completed_at, duration, created_at)
VALUES (
  gen_random_uuid(),
  'job_123',
  'Daily Cleanup',
  '0 0 * * *',
  'completed',
  NOW() - INTERVAL '5 minutes',
  NOW(),
  300000,
  NOW()
);

-- Inserir um HTTP client de teste
INSERT INTO http_clients (id, method, url, request_headers, request_body, response_status, response_headers, response_body, duration, created_at)
VALUES (
  gen_random_uuid(),
  'GET',
  'https://api.example.com/data',
  '{"authorization":"Bearer token"}',
  null,
  200,
  '{"content-type":"application/json"}',
  '{"data":"test"}',
  1200,
  NOW()
);

-- Inserir uma operação Redis de teste
INSERT INTO redis_operations (id, command, key, value, duration, result, created_at)
VALUES (
  gen_random_uuid(),
  'GET',
  'user:123',
  null,
  5,
  '{"name":"John Doe"}',
  NOW()
);

-- Inserir uma sessão de teste
INSERT INTO sessions (id, session_id, user_id, action, session_data, ip, user_agent, created_at)
VALUES (
  gen_random_uuid(),
  'sess_123',
  'user_456',
  'created',
  '{"authenticated":true,"role":"admin"}',
  '127.0.0.1',
  'Mozilla/5.0',
  NOW()
);
```

## ✅ Checklist de Testes

Use este checklist para garantir que tudo está funcionando:

### Requests
- [ ] Listagem carrega
- [ ] Colunas IP e Session aparecem
- [ ] Filtros funcionam
- [ ] Paginação funciona
- [ ] Detalhes abrem
- [ ] Tab Request funciona
- [ ] Tab Response funciona
- [ ] Sub-tab Session exibe dados

### Schedule
- [ ] Dashboard carrega
- [ ] Estatísticas aparecem
- [ ] Listagem carrega
- [ ] Filtros funcionam
- [ ] Modal de detalhes abre

### HTTP Client
- [ ] Dashboard carrega
- [ ] Estatísticas aparecem
- [ ] Listagem carrega
- [ ] Filtros funcionam
- [ ] Modal de detalhes abre

### Redis
- [ ] Dashboard carrega
- [ ] Estatísticas aparecem
- [ ] Listagem carrega
- [ ] Filtros funcionam
- [ ] Modal de detalhes abre

### Sessions
- [ ] Dashboard carrega
- [ ] Estatísticas aparecem
- [ ] Listagem carrega
- [ ] Filtros funcionam
- [ ] Modal de detalhes abre

### Geral
- [ ] Menu lateral funciona
- [ ] Navegação funciona
- [ ] Dark mode funciona
- [ ] Responsivo funciona
- [ ] Sem erros no console

## 🐛 Problemas Comuns

### Erro: "Erro ao carregar requisições"
- Verifique se o backend está rodando
- Verifique a URL da API em `packages/frontend/src/lib/api.ts`
- Verifique o console do navegador para mais detalhes

### Tabelas vazias
- Verifique se há dados no banco de dados
- Use as queries SQL acima para inserir dados de teste
- Verifique se o agent está configurado corretamente

### Dark mode não funciona
- Limpe o localStorage do navegador
- Recarregue a página
- Verifique se o Tailwind CSS está configurado corretamente

### Paginação não aparece
- Normal se houver menos de 20 itens
- Insira mais dados para testar a paginação

## 📊 Métricas de Sucesso

Após os testes, você deve ter:

✅ Todas as 8 páginas funcionando
✅ Todos os filtros funcionando
✅ Todas as estatísticas calculando corretamente
✅ Todos os modais abrindo e fechando
✅ Dark mode funcionando em todas as páginas
✅ Responsividade funcionando em todos os tamanhos
✅ Sem erros no console do navegador
✅ Sem erros no console do backend

## 🎉 Conclusão

Se todos os testes passaram, parabéns! O dashboard está completo e funcional. 🚀

Caso encontre algum problema, verifique:
1. Logs do backend
2. Console do navegador
3. Network tab do DevTools
4. Configuração do agent
5. Dados no banco de dados

