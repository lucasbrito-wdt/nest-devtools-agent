import { useState, useEffect } from 'react';
import { IconUsers } from '@tabler/icons-react';
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

interface Session {
  id: string;
  sessionId: string;
  userId?: string;
  action: 'created' | 'updated' | 'destroyed' | 'accessed';
  sessionData?: any;
  expiresAt?: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  uniqueUsers: number;
  avgSessionDuration: number;
}

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [filter, setFilter] = useState({
    action: '',
    sessionId: '',
    userId: '',
    page: 1,
    limit: 50,
  });

  useEffect(() => {
    fetchSessions();
    fetchStats();
  }, [filter]);

  const fetchSessions = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.action) params.append('action', filter.action);
      if (filter.sessionId) params.append('sessionId', filter.sessionId);
      if (filter.userId) params.append('userId', filter.userId);
      params.append('page', filter.page.toString());
      params.append('limit', filter.limit.toString());

      const response = await fetch(`http://localhost:4000/api/sessions?${params}`);
      const data = await response.json();
      setSessions(data.data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/sessions/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getActionVariant = (
    action: string,
  ): 'success' | 'info' | 'warning' | 'destructive' | 'default' | 'secondary' => {
    switch (action) {
      case 'created':
        return 'success';
      case 'accessed':
        return 'info';
      case 'updated':
        return 'warning';
      case 'destroyed':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(0)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(0)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">User Sessions</h1>
        <p className="mt-2 text-muted-foreground">Monitor user sessions and activity</p>
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
                <CardDescription>Total Sessions</CardDescription>
                <CardTitle className="text-3xl">{stats.totalSessions}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active Sessions</CardDescription>
                <CardTitle className="text-3xl text-green-600">{stats.activeSessions}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Unique Users</CardDescription>
                <CardTitle className="text-3xl text-blue-600">{stats.uniqueUsers}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Avg Duration</CardDescription>
                <CardTitle className="text-3xl text-purple-600">
                  {formatDuration(stats.avgSessionDuration)}
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
              <label className="block text-sm font-medium mb-2">Action</label>
              <select
                className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={filter.action}
                onChange={(e) => setFilter({ ...filter, action: e.target.value, page: 1 })}
              >
                <option value="">All Actions</option>
                <option value="created">Created</option>
                <option value="accessed">Accessed</option>
                <option value="updated">Updated</option>
                <option value="destroyed">Destroyed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Session ID</label>
              <Input
                type="text"
                placeholder="Filter by session ID..."
                value={filter.sessionId}
                onChange={(e) => setFilter({ ...filter, sessionId: e.target.value, page: 1 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">User ID</label>
              <Input
                type="text"
                placeholder="Filter by user ID..."
                value={filter.userId}
                onChange={(e) => setFilter({ ...filter, userId: e.target.value, page: 1 })}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() =>
                  setFilter({ action: '', sessionId: '', userId: '', page: 1, limit: 50 })
                }
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Table */}
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
          ) : sessions.length === 0 ? (
            <EmptyState
              icon={<IconUsers size={48} />}
              title="No sessions found"
              description="There are no user sessions to display."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session ID</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Expires At</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow
                      key={session.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedSession(session)}
                    >
                      <TableCell className="font-mono text-sm">
                        {session.sessionId.substring(0, 12)}...
                      </TableCell>
                      <TableCell>{session.userId || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={getActionVariant(session.action)}>{session.action}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{session.ip || 'N/A'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(session.expiresAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(session.createdAt)}
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
                  disabled={sessions.length < filter.limit}
                  onClick={() => setFilter({ ...filter, page: filter.page + 1 })}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Session Detail Dialog */}
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Session Details</DialogTitle>
          </DialogHeader>

          {selectedSession && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Session Information</h3>
                <div className="bg-muted p-4 rounded-md space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Session ID:</span>
                    <span className="text-sm font-mono">{selectedSession.sessionId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">User ID:</span>
                    <span className="text-sm">{selectedSession.userId || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Action:</span>
                    <Badge variant={getActionVariant(selectedSession.action)}>
                      {selectedSession.action}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">IP Address:</span>
                    <span className="text-sm font-mono">{selectedSession.ip || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Expires At:</span>
                    <span className="text-sm">{formatDate(selectedSession.expiresAt)}</span>
                  </div>
                </div>
              </div>

              {selectedSession.userAgent && (
                <div>
                  <h3 className="font-semibold mb-2">User Agent</h3>
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-sm break-all">{selectedSession.userAgent}</p>
                  </div>
                </div>
              )}

              {selectedSession.sessionData && (
                <div>
                  <h3 className="font-semibold mb-2">Session Data</h3>
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="text-xs overflow-x-auto bg-background p-2 rounded">
                      {JSON.stringify(selectedSession.sessionData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
