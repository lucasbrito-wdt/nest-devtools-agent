import { useState, useEffect } from 'react';
import { IconWorld } from '@tabler/icons-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface HttpClientRequest {
  id: string;
  method: string;
  url: string;
  baseURL?: string;
  headers?: any;
  requestBody?: any;
  responseStatus?: number;
  responseHeaders?: any;
  responseBody?: any;
  duration: number;
  error?: string;
  timeout?: number;
  retries?: number;
  createdAt: string;
}

interface HttpClientStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgDuration: number;
  successRate: number;
}

export default function HttpClient() {
  const [requests, setRequests] = useState<HttpClientRequest[]>([]);
  const [stats, setStats] = useState<HttpClientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<HttpClientRequest | null>(null);
  const [filter, setFilter] = useState({
    method: '',
    url: '',
    responseStatus: '',
    page: 1,
    limit: 50,
  });

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.method) params.append('method', filter.method);
      if (filter.url) params.append('url', filter.url);
      if (filter.responseStatus) params.append('responseStatus', filter.responseStatus);
      params.append('page', filter.page.toString());
      params.append('limit', filter.limit.toString());

      const response = await fetch(`http://localhost:4000/api/http-clients?${params}`);
      const data = await response.json();
      setRequests(data.data || []);
    } catch (error) {
      console.error('Error fetching HTTP requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/http-clients/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getMethodVariant = (
    method: string,
  ): 'success' | 'info' | 'warning' | 'destructive' | 'default' | 'secondary' => {
    switch (method) {
      case 'GET':
        return 'success';
      case 'POST':
        return 'info';
      case 'PUT':
        return 'warning';
      case 'PATCH':
        return 'secondary';
      case 'DELETE':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getStatusVariant = (
    status?: number,
  ): 'success' | 'info' | 'warning' | 'destructive' | 'default' => {
    if (!status) return 'default';
    if (status >= 200 && status < 300) return 'success';
    if (status >= 300 && status < 400) return 'info';
    if (status >= 400 && status < 500) return 'warning';
    if (status >= 500) return 'destructive';
    return 'default';
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const truncateUrl = (url: string, maxLength: number = 60) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">HTTP Client</h1>
        <p className="mt-2 text-muted-foreground">Monitor outgoing HTTP requests</p>
      </div>

      {/* Statistics Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Requests</CardDescription>
                <CardTitle className="text-3xl">{stats.totalRequests}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Successful</CardDescription>
                <CardTitle className="text-3xl text-green-600">
                  {stats.successfulRequests}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Failed</CardDescription>
                <CardTitle className="text-3xl text-red-600">{stats.failedRequests}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Avg Duration</CardDescription>
                <CardTitle className="text-3xl text-blue-600">
                  {formatDuration(stats.avgDuration)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        )
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Method</label>
              <select
                className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={filter.method}
                onChange={(e) => setFilter({ ...filter, method: e.target.value, page: 1 })}
              >
                <option value="">All Methods</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">URL</label>
              <Input
                type="text"
                placeholder="Filter by URL..."
                value={filter.url}
                onChange={(e) => setFilter({ ...filter, url: e.target.value, page: 1 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <Input
                type="number"
                placeholder="e.g., 200"
                value={filter.responseStatus}
                onChange={(e) => setFilter({ ...filter, responseStatus: e.target.value, page: 1 })}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() =>
                  setFilter({ method: '', url: '', responseStatus: '', page: 1, limit: 50 })
                }
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : requests.length === 0 ? (
            <EmptyState
              icon={<IconWorld size={48} />}
              title="No HTTP requests found"
              description="There are no outgoing HTTP requests to display."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Method</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow
                      key={request.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedRequest(request)}
                    >
                      <TableCell>
                        <Badge variant={getMethodVariant(request.method)}>{request.method}</Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate" title={request.url}>
                        {truncateUrl(request.url)}
                      </TableCell>
                      <TableCell>
                        {request.error ? (
                          <Badge variant="destructive">ERROR</Badge>
                        ) : (
                          <Badge variant={getStatusVariant(request.responseStatus)}>
                            {request.responseStatus || 'N/A'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDuration(request.duration)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(request.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t px-6 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filter.page === 1}
                  onClick={() => setFilter({ ...filter, page: filter.page - 1 })}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">Page {filter.page}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={requests.length < filter.limit}
                  onClick={() => setFilter({ ...filter, page: filter.page + 1 })}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Request Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Request</h3>
                <div className="bg-muted p-4 rounded-md">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant={getMethodVariant(selectedRequest.method)}>
                      {selectedRequest.method}
                    </Badge>
                    <span className="text-sm">{selectedRequest.url}</span>
                  </div>
                  {selectedRequest.requestBody && (
                    <pre className="text-xs overflow-x-auto mt-2 bg-background p-2 rounded">
                      {JSON.stringify(selectedRequest.requestBody, null, 2)}
                    </pre>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Response</h3>
                <div className="bg-muted p-4 rounded-md">
                  <div className="mb-2 flex items-center gap-4">
                    <span className="text-sm">Status:</span>
                    <Badge variant={getStatusVariant(selectedRequest.responseStatus)}>
                      {selectedRequest.responseStatus || 'N/A'}
                    </Badge>
                    <span className="text-sm">
                      Duration: {formatDuration(selectedRequest.duration)}
                    </span>
                  </div>
                  {selectedRequest.error && (
                    <div className="text-destructive text-sm mb-2">
                      Error: {selectedRequest.error}
                    </div>
                  )}
                  {selectedRequest.responseBody && (
                    <pre className="text-xs overflow-x-auto mt-2 bg-background p-2 rounded">
                      {JSON.stringify(selectedRequest.responseBody, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
