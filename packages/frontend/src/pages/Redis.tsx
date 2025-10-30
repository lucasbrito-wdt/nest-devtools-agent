import { useState, useEffect } from 'react';
import { IconDatabase } from '@tabler/icons-react';
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

interface RedisOperation {
  id: string;
  command: string;
  args?: any[];
  key?: string;
  value?: any;
  duration: number;
  error?: string;
  database?: number;
  result?: any;
  createdAt: string;
}

interface RedisStats {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  avgDuration: number;
  successRate: number;
}

export default function Redis() {
  const [operations, setOperations] = useState<RedisOperation[]>([]);
  const [stats, setStats] = useState<RedisStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOperation, setSelectedOperation] = useState<RedisOperation | null>(null);
  const [filter, setFilter] = useState({
    command: '',
    key: '',
    page: 1,
    limit: 50,
  });

  useEffect(() => {
    fetchOperations();
    fetchStats();
  }, [filter]);

  const fetchOperations = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.command) params.append('command', filter.command);
      if (filter.key) params.append('key', filter.key);
      params.append('page', filter.page.toString());
      params.append('limit', filter.limit.toString());

      const response = await fetch(`http://localhost:4000/api/redis?${params}`);
      const data = await response.json();
      setOperations(data.data || []);
    } catch (error) {
      console.error('Error fetching Redis operations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/redis/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getCommandVariant = (
    command: string,
  ): 'success' | 'info' | 'warning' | 'destructive' | 'default' => {
    const readCommands = ['GET', 'MGET', 'HGET', 'HGETALL', 'LRANGE', 'SMEMBERS', 'ZRANGE'];
    const writeCommands = ['SET', 'MSET', 'HSET', 'LPUSH', 'RPUSH', 'SADD', 'ZADD'];
    const deleteCommands = ['DEL', 'HDEL', 'LPOP', 'RPOP', 'SREM', 'ZREM'];

    if (readCommands.includes(command)) return 'info';
    if (writeCommands.includes(command)) return 'success';
    if (deleteCommands.includes(command)) return 'destructive';
    return 'default';
  };

  const formatDuration = (ms: number) => {
    if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const truncateValue = (value: any, maxLength: number = 50) => {
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Redis Operations</h1>
        <p className="mt-2 text-muted-foreground">Monitor Redis commands and performance</p>
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
                <CardDescription>Total Operations</CardDescription>
                <CardTitle className="text-3xl">{stats.totalOperations}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Successful</CardDescription>
                <CardTitle className="text-3xl text-green-600">
                  {stats.successfulOperations}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Failed</CardDescription>
                <CardTitle className="text-3xl text-red-600">{stats.failedOperations}</CardTitle>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Command</label>
              <Input
                type="text"
                placeholder="e.g., GET, SET..."
                value={filter.command}
                onChange={(e) =>
                  setFilter({ ...filter, command: e.target.value.toUpperCase(), page: 1 })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Key</label>
              <Input
                type="text"
                placeholder="Filter by key..."
                value={filter.key}
                onChange={(e) => setFilter({ ...filter, key: e.target.value, page: 1 })}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setFilter({ command: '', key: '', page: 1, limit: 50 })}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operations Table */}
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
          ) : operations.length === 0 ? (
            <EmptyState
              icon={<IconDatabase size={48} />}
              title="No Redis operations found"
              description="There are no Redis operations to display."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Command</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Database</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operations.map((operation) => (
                    <TableRow
                      key={operation.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedOperation(operation)}
                    >
                      <TableCell>
                        <Badge variant={getCommandVariant(operation.command)}>
                          {operation.command}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{operation.key || 'N/A'}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {operation.value ? truncateValue(operation.value) : 'N/A'}
                      </TableCell>
                      <TableCell>{formatDuration(operation.duration)}</TableCell>
                      <TableCell>{operation.database ?? 0}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(operation.createdAt)}
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
                  disabled={operations.length < filter.limit}
                  onClick={() => setFilter({ ...filter, page: filter.page + 1 })}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Operation Detail Dialog */}
      <Dialog open={!!selectedOperation} onOpenChange={() => setSelectedOperation(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Operation Details</DialogTitle>
          </DialogHeader>

          {selectedOperation && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Command</h3>
                <div className="bg-muted p-4 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={getCommandVariant(selectedOperation.command)}>
                      {selectedOperation.command}
                    </Badge>
                    <span className="text-sm font-mono">{selectedOperation.key}</span>
                  </div>
                  {selectedOperation.args && selectedOperation.args.length > 0 && (
                    <div className="mt-2">
                      <span className="text-sm font-medium">Arguments:</span>
                      <pre className="text-xs overflow-x-auto mt-1 bg-background p-2 rounded">
                        {JSON.stringify(selectedOperation.args, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Result</h3>
                <div className="bg-muted p-4 rounded-md">
                  <div className="mb-2 text-sm">
                    Duration: {formatDuration(selectedOperation.duration)} | Database:{' '}
                    {selectedOperation.database ?? 0}
                  </div>
                  {selectedOperation.error ? (
                    <div className="text-destructive text-sm">Error: {selectedOperation.error}</div>
                  ) : selectedOperation.result ? (
                    <pre className="text-xs overflow-x-auto bg-background p-2 rounded">
                      {JSON.stringify(selectedOperation.result, null, 2)}
                    </pre>
                  ) : (
                    <span className="text-muted-foreground text-sm">No result data</span>
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
