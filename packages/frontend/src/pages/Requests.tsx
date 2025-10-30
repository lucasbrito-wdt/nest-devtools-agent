import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { IconSearch, IconInbox } from '@tabler/icons-react';
import { eventsApi } from '@/lib/api';
import { EventType, RequestEventMeta } from 'nest-devtools-shared';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function Requests() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['events', EventType.REQUEST, page, search, statusFilter],
    queryFn: () =>
      eventsApi.list(
        {
          type: EventType.REQUEST,
          search: search || undefined,
          status: statusFilter ? parseInt(statusFilter) : undefined,
        },
        { page, limit: 20 },
      ),
    retry: false,
  });

  const getStatusVariant = (
    status: number,
  ): 'success' | 'info' | 'warning' | 'destructive' | 'default' => {
    if (status >= 200 && status < 300) return 'success';
    if (status >= 300 && status < 400) return 'info';
    if (status >= 400 && status < 500) return 'warning';
    if (status >= 500) return 'destructive';
    return 'default';
  };

  const getStatusDescription = (status: number): string => {
    const descriptions: Record<number, string> = {
      200: 'OK - Requisição bem-sucedida',
      201: 'Created - Recurso criado com sucesso',
      204: 'No Content - Sem conteúdo para retornar',
      301: 'Moved Permanently - Redirecionamento permanente',
      302: 'Found - Redirecionamento temporário',
      304: 'Not Modified - Recurso não modificado',
      400: 'Bad Request - Requisição inválida',
      401: 'Unauthorized - Não autorizado',
      403: 'Forbidden - Acesso proibido',
      404: 'Not Found - Recurso não encontrado',
      405: 'Method Not Allowed - Método não permitido',
      409: 'Conflict - Conflito de estado',
      422: 'Unprocessable Entity - Entidade não processável',
      429: 'Too Many Requests - Muitas requisições',
      500: 'Internal Server Error - Erro interno do servidor',
      502: 'Bad Gateway - Gateway inválido',
      503: 'Service Unavailable - Serviço indisponível',
      504: 'Gateway Timeout - Timeout do gateway',
    };
    return descriptions[status] || `HTTP ${status}`;
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen p-8">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            Erro ao carregar requisições. Verifique se o backend está rodando.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">HTTP Requests</h1>
        <p className="mt-2 text-muted-foreground">
          {data?.meta?.total || 0} requisições capturadas
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <IconSearch
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={20}
              />
              <Input
                type="text"
                placeholder="Buscar por rota, método, etc..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="flex h-9 w-[180px] items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos os status</option>
              <option value="200">200 - OK</option>
              <option value="201">201 - Created</option>
              <option value="400">400 - Bad Request</option>
              <option value="401">401 - Unauthorized</option>
              <option value="404">404 - Not Found</option>
              <option value="500">500 - Internal Error</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : data?.data.length === 0 ? (
            <EmptyState
              icon={<IconInbox size={48} />}
              title="Nenhuma requisição encontrada"
              description="Não há requisições HTTP para exibir. Faça algumas requisições para vê-las aqui."
            />
          ) : (
            <>
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Método</TableHead>
                      <TableHead>Rota</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duração</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Quando</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.data.map((event: any) => {
                      const meta = event.payload as RequestEventMeta;
                      return (
                        <TableRow
                          key={event.id}
                          onClick={() => navigate(`/requests/${event.id}`)}
                          className="cursor-pointer"
                        >
                          <TableCell className="font-mono font-medium">{meta.method}</TableCell>
                          <TableCell className="max-w-md truncate">
                            {event.route || meta.url}
                          </TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant={getStatusVariant(event.status!)}>
                                  {event.status}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>{getStatusDescription(event.status!)}</TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell>{meta.duration}ms</TableCell>
                          <TableCell className="font-mono text-sm">{meta.ip || '-'}</TableCell>
                          <TableCell>
                            {meta.sessionId ? (
                              <div className="flex items-center gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="secondary" className="font-mono text-xs">
                                      {meta.sessionId.substring(0, 8)}...
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="space-y-1">
                                      <div className="font-mono text-xs">{meta.sessionId}</div>
                                      {meta.userId && (
                                        <div className="text-xs">User ID: {meta.userId}</div>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                                {meta.userId && (
                                  <span className="text-xs text-muted-foreground">
                                    User: {meta.userId}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDistanceToNow(new Date(event.createdAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TooltipProvider>

              {/* Paginação */}
              {data && data.meta && data.meta.totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-6 py-4">
                  <div className="text-sm text-muted-foreground">
                    Página {data.meta.page} de {data.meta.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= data.meta.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
