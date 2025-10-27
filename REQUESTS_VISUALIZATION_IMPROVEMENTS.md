# Melhorias na Visualização de Requests

## Resumo das Alterações

Este documento descreve as melhorias implementadas nas páginas de visualização de requests do dashboard do NestJS DevTools.

## 1. Página de Listagem de Requests (`Requests.tsx`)

### Novas Colunas Adicionadas

- **IP Address**: Exibe o endereço IP de origem da requisição
- **Session**: Mostra informações de sessão quando disponíveis
  - Session ID (primeiros 8 caracteres)
  - User ID (quando disponível)

### Melhorias Visuais

- Session ID exibido em badge roxo para fácil identificação
- User ID exibido ao lado do Session ID quando disponível
- IP em fonte monoespaçada para melhor legibilidade
- Indicador visual "-" quando dados não estão disponíveis

## 2. Página de Detalhes de Request (`RequestDetail.tsx`)

### Nova Estrutura com Tabs

A página foi completamente reestruturada com um sistema de tabs de dois níveis:

#### Overview (Sempre Visível)
- **Status**: Com badge colorido baseado no código HTTP
  - Verde: 2xx (sucesso)
  - Azul: 3xx (redirecionamento)
  - Amarelo: 4xx (erro do cliente)
  - Vermelho: 5xx (erro do servidor)
- **Duração**: Tempo de resposta em milissegundos
- **IP**: Endereço IP de origem
- **User Agent**: String do navegador/cliente
- **Query Params**: Parâmetros da URL (quando presentes)

#### Tab: Request
Sub-tabs:
1. **Headers**: Cabeçalhos HTTP da requisição
2. **Payload**: Corpo da requisição (body)

#### Tab: Response
Sub-tabs:
1. **Data**: Dados retornados pela API
2. **Headers**: Cabeçalhos HTTP da resposta
3. **Session**: Informações de sessão
   - Session ID
   - User ID
   - Session Data (objeto completo)

### Melhorias de UX

- Navegação intuitiva com tabs principais e sub-tabs
- JSON formatado com syntax highlighting
- Mensagens claras quando dados não estão disponíveis
- Botão "Voltar" para retornar à listagem
- Layout responsivo que se adapta a diferentes tamanhos de tela

## 3. Dados Capturados

Para que todas as funcionalidades funcionem corretamente, o agent deve estar configurado para capturar:

```typescript
DevtoolsModule.forRoot({
  // ... outras configurações
  captureHeaders: true,
  captureBody: true,
  captureResponse: true,
  captureResponseHeaders: true,
  captureSession: true,
})
```

## 4. Estrutura de Dados Esperada

### Event Payload (RequestEventMeta)

```typescript
{
  method: string;           // GET, POST, PUT, DELETE, etc.
  url: string;             // URL completa
  headers: object;         // Cabeçalhos da requisição
  body: any;               // Corpo da requisição
  query: object;           // Query parameters
  ip: string;              // IP de origem
  userAgent: string;       // User agent string
  duration: number;        // Duração em ms
  response: any;           // Dados da resposta
  responseHeaders: object; // Cabeçalhos da resposta
  sessionId?: string;      // ID da sessão (opcional)
  userId?: string;         // ID do usuário (opcional)
  sessionData?: any;       // Dados da sessão (opcional)
}
```

## 5. Benefícios das Melhorias

### Para Desenvolvedores
- **Debugging Facilitado**: Visualização completa de request/response
- **Rastreamento de Sessão**: Identificação rápida de usuários e sessões
- **Análise de Performance**: Duração e status code visíveis
- **Inspeção de Headers**: Acesso fácil a todos os cabeçalhos

### Para DevOps
- **Monitoramento de IPs**: Identificação de origem das requisições
- **Análise de Erros**: Status codes coloridos para rápida identificação
- **Auditoria**: Rastreamento completo de requisições por sessão/usuário

### Para Segurança
- **Tracking de Sessões**: Monitoramento de atividades por sessão
- **Identificação de Usuários**: Rastreamento de ações por user ID
- **Análise de Origem**: Verificação de IPs suspeitos

## 6. Exemplos de Uso

### Visualizando Request com Sessão

Quando uma requisição possui sessão ativa, você verá:
- Badge roxo com Session ID truncado na listagem
- User ID ao lado (se disponível)
- Na página de detalhes, tab "Session" com dados completos

### Analisando Erros

1. Na listagem, status codes 4xx e 5xx aparecem em badges amarelos/vermelhos
2. Clique na requisição para ver detalhes
3. Tab "Request" → "Payload" mostra o que foi enviado
4. Tab "Response" → "Data" mostra a resposta de erro

### Debugging de Headers

1. Acesse a página de detalhes da requisição
2. Tab "Request" → "Headers" para ver headers enviados
3. Tab "Response" → "Headers" para ver headers retornados
4. JSON formatado facilita a leitura

## 7. Próximos Passos Sugeridos

- [ ] Adicionar filtro por Session ID na listagem
- [ ] Adicionar filtro por User ID na listagem
- [ ] Implementar busca por IP
- [ ] Adicionar exportação de requests para JSON/CSV
- [ ] Implementar comparação de requests (diff)
- [ ] Adicionar gráficos de performance por rota
- [ ] Implementar replay de requests

## 8. Compatibilidade

- ✅ React 18+
- ✅ TypeScript 5+
- ✅ Tailwind CSS 3+
- ✅ Dark Mode
- ✅ Responsive Design

## Conclusão

As melhorias implementadas transformam a visualização de requests em uma ferramenta poderosa para debugging, monitoramento e análise de aplicações NestJS. A estrutura com tabs organiza as informações de forma intuitiva, enquanto as novas colunas na listagem facilitam a identificação rápida de requisições específicas.

