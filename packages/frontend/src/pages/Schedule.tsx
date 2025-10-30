import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconClock } from '@tabler/icons-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Schedule {
  id: string;
  jobId: string;
  jobName: string;
  cronExpression?: string;
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  error?: string;
  result?: any;
  nextRunAt?: string;
  createdAt: string;
}

interface ScheduleStats {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  runningJobs: number;
  avgDuration: number;
  successRate: number;
}

export default function Schedule() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [stats, setStats] = useState<ScheduleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: '',
    jobName: '',
    page: 1,
    limit: 50,
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchSchedules();
    fetchStats();
  }, [filter]);

  const fetchSchedules = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.jobName) params.append('jobName', filter.jobName);
      params.append('page', filter.page.toString());
      params.append('limit', filter.limit.toString());

      const response = await fetch(`http://localhost:4000/api/schedules?${params}`);
      const data = await response.json();
      setSchedules(data.data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/schedules/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getStatusVariant = (
    status: string,
  ): 'success' | 'info' | 'warning' | 'destructive' | 'default' | 'secondary' => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'destructive';
      case 'running':
        return 'info';
      case 'scheduled':
        return 'warning';
      case 'cancelled':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Schedule & Jobs</h1>
        <p className="mt-2 text-muted-foreground">Monitor scheduled tasks and cron jobs</p>
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
                <CardDescription>Total Jobs</CardDescription>
                <CardTitle className="text-3xl">{stats.totalJobs}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Completed</CardDescription>
                <CardTitle className="text-3xl text-green-600">{stats.completedJobs}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Failed</CardDescription>
                <CardTitle className="text-3xl text-red-600">{stats.failedJobs}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Success Rate</CardDescription>
                <CardTitle className="text-3xl text-blue-600">
                  {stats.successRate.toFixed(1)}%
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
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value, page: 1 })}
              >
                <option value="">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Job Name</label>
              <Input
                type="text"
                placeholder="Filter by job name..."
                value={filter.jobName}
                onChange={(e) => setFilter({ ...filter, jobName: e.target.value, page: 1 })}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setFilter({ status: '', jobName: '', page: 1, limit: 50 })}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedules Table */}
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
          ) : schedules.length === 0 ? (
            <EmptyState
              icon={<IconClock size={48} />}
              title="No schedules found"
              description="There are no scheduled jobs to display. Create a scheduled task to see it here."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cron Expression</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Started At</TableHead>
                    <TableHead>Next Run</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((schedule) => (
                    <TableRow
                      key={schedule.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/schedules/${schedule.id}`)}
                    >
                      <TableCell>
                        <div className="font-medium">{schedule.jobName}</div>
                        <div className="text-sm text-muted-foreground">{schedule.jobId}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(schedule.status)}>{schedule.status}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {schedule.cronExpression || 'N/A'}
                      </TableCell>
                      <TableCell>{formatDuration(schedule.duration)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(schedule.startedAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(schedule.nextRunAt)}
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
                  disabled={schedules.length < filter.limit}
                  onClick={() => setFilter({ ...filter, page: filter.page + 1 })}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
