import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { IconArrowLeft } from '@tabler/icons-react';
import { eventsApi } from '@/lib/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.get(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-12 w-full" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert variant="destructive">
          <AlertDescription>Evento não encontrado</AlertDescription>
        </Alert>
      </div>
    );
  }

  const getStatusVariant = (
    status: number,
  ): 'success' | 'info' | 'warning' | 'destructive' | 'default' => {
    if (status >= 200 && status < 300) return 'success';
    if (status >= 300 && status < 400) return 'info';
    if (status >= 400 && status < 500) return 'warning';
    if (status >= 500) return 'destructive';
    return 'default';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 -ml-2">
          <IconArrowLeft size={20} />
          Voltar
        </Button>

        <div className="flex items-center gap-4 mb-2">
          <Badge variant="info">{event.payload.method}</Badge>
          <h1 className="text-2xl font-bold">{event.route || event.payload.url}</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {format(new Date(event.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
        </p>
      </div>

      {/* Overview Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-muted-foreground mb-2">Status</div>
              <Badge variant={getStatusVariant(event.status)} className="text-lg px-3 py-1">
                {event.status}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-2">Duração</div>
              <div className="text-2xl font-bold">{event.payload.duration}ms</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-2">IP</div>
              <div className="text-lg font-mono">{event.payload.ip || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-2">User Agent</div>
              <div className="text-sm truncate" title={event.payload.userAgent}>
                {event.payload.userAgent || 'N/A'}
              </div>
            </div>
          </div>

          {/* Query Params */}
          {event.payload.query && Object.keys(event.payload.query).length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Query Params</h3>
              <div className="bg-muted p-4 rounded-md">
                <pre className="text-sm overflow-x-auto">
                  {JSON.stringify(event.payload.query, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="request">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="request">Request</TabsTrigger>
              <TabsTrigger value="response">Response</TabsTrigger>
            </TabsList>

            <TabsContent value="request" className="space-y-4">
              <Tabs defaultValue="headers">
                <TabsList>
                  <TabsTrigger value="headers">Headers</TabsTrigger>
                  <TabsTrigger value="payload">Payload</TabsTrigger>
                </TabsList>

                <TabsContent value="headers">
                  {event.payload.headers ? (
                    <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                      {JSON.stringify(event.payload.headers, null, 2)}
                    </pre>
                  ) : (
                    <Alert>
                      <AlertDescription>No headers available</AlertDescription>
                    </Alert>
                  )}
                </TabsContent>

                <TabsContent value="payload">
                  {event.payload.body ? (
                    <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                      {JSON.stringify(event.payload.body, null, 2)}
                    </pre>
                  ) : (
                    <Alert>
                      <AlertDescription>No payload available</AlertDescription>
                    </Alert>
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="response" className="space-y-4">
              <Tabs defaultValue="data">
                <TabsList>
                  <TabsTrigger value="data">Data</TabsTrigger>
                  <TabsTrigger value="headers">Headers</TabsTrigger>
                  <TabsTrigger value="session">Session</TabsTrigger>
                </TabsList>

                <TabsContent value="data">
                  {event.payload.response ? (
                    <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                      {JSON.stringify(event.payload.response, null, 2)}
                    </pre>
                  ) : (
                    <Alert>
                      <AlertDescription>No response data available</AlertDescription>
                    </Alert>
                  )}
                </TabsContent>

                <TabsContent value="headers">
                  {event.payload.responseHeaders ? (
                    <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                      {JSON.stringify(event.payload.responseHeaders, null, 2)}
                    </pre>
                  ) : (
                    <Alert>
                      <AlertDescription>No response headers available</AlertDescription>
                    </Alert>
                  )}
                </TabsContent>

                <TabsContent value="session">
                  {event.payload.sessionId || event.payload.sessionData ? (
                    <div className="space-y-4">
                      {event.payload.sessionId && (
                        <div>
                          <div className="text-sm font-semibold text-muted-foreground mb-2">
                            Session ID
                          </div>
                          <div className="bg-muted p-3 rounded-md font-mono text-sm">
                            {event.payload.sessionId}
                          </div>
                        </div>
                      )}
                      {event.payload.userId && (
                        <div>
                          <div className="text-sm font-semibold text-muted-foreground mb-2">
                            User ID
                          </div>
                          <div className="bg-muted p-3 rounded-md font-mono text-sm">
                            {event.payload.userId}
                          </div>
                        </div>
                      )}
                      {event.payload.sessionData && (
                        <div>
                          <div className="text-sm font-semibold text-muted-foreground mb-2">
                            Session Data
                          </div>
                          <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                            {JSON.stringify(event.payload.sessionData, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Alert>
                      <AlertDescription>No session data available</AlertDescription>
                    </Alert>
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
