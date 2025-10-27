import { useState, useEffect } from 'react';

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

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'bg-green-100 text-green-800';
      case 'updated':
        return 'bg-blue-100 text-blue-800';
      case 'destroyed':
        return 'bg-red-100 text-red-800';
      case 'accessed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (ms: number) => {
    if (ms < 60000) return `${(ms / 1000).toFixed(0)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(0)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  };

  const truncateSessionId = (sessionId: string, maxLength: number = 20) => {
    if (sessionId.length <= maxLength) return sessionId;
    return sessionId.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading sessions...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Sessions</h1>
        <p className="text-gray-600">Monitor user sessions and activity</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Sessions</div>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Active Sessions</div>
            <div className="text-2xl font-bold text-green-600">{stats.activeSessions}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Unique Users</div>
            <div className="text-2xl font-bold text-blue-600">{stats.uniqueUsers}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Avg Duration</div>
            <div className="text-2xl font-bold text-purple-600">
              {formatDuration(stats.avgSessionDuration)}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Action</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={filter.action}
              onChange={(e) => setFilter({ ...filter, action: e.target.value, page: 1 })}
            >
              <option value="">All Actions</option>
              <option value="created">Created</option>
              <option value="updated">Updated</option>
              <option value="destroyed">Destroyed</option>
              <option value="accessed">Accessed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Session ID</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              placeholder="Filter by session ID..."
              value={filter.sessionId}
              onChange={(e) => setFilter({ ...filter, sessionId: e.target.value, page: 1 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">User ID</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              placeholder="Filter by user ID..."
              value={filter.userId}
              onChange={(e) => setFilter({ ...filter, userId: e.target.value, page: 1 })}
            />
          </div>
          <div className="flex items-end">
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={() =>
                setFilter({ action: '', sessionId: '', userId: '', page: 1, limit: 50 })
              }
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Session ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                User ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                IP Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No sessions found
                </td>
              </tr>
            ) : (
              sessions.map((session) => (
                <tr
                  key={session.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedSession(session)}
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-mono text-gray-900" title={session.sessionId}>
                      {truncateSessionId(session.sessionId)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {session.userId || 'Anonymous'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${getActionColor(
                        session.action,
                      )}`}
                    >
                      {session.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{session.ip || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(session.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <button
          className="bg-gray-200 px-4 py-2 rounded disabled:opacity-50"
          disabled={filter.page === 1}
          onClick={() => setFilter({ ...filter, page: filter.page - 1 })}
        >
          Previous
        </button>
        <span className="text-sm text-gray-600">Page {filter.page}</span>
        <button
          className="bg-gray-200 px-4 py-2 rounded disabled:opacity-50"
          disabled={sessions.length < filter.limit}
          onClick={() => setFilter({ ...filter, page: filter.page + 1 })}
        >
          Next
        </button>
      </div>

      {/* Session Detail Modal */}
      {selectedSession && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedSession(null)}
        >
          <div
            className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">Session Details</h2>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setSelectedSession(null)}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Session ID</div>
                    <div className="font-mono text-sm break-all">{selectedSession.sessionId}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">User ID</div>
                    <div className="font-semibold">{selectedSession.userId || 'Anonymous'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Action</div>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${getActionColor(
                        selectedSession.action,
                      )}`}
                    >
                      {selectedSession.action}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">IP Address</div>
                    <div className="font-semibold">{selectedSession.ip || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Created At</div>
                    <div className="font-semibold">{formatDate(selectedSession.createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Expires At</div>
                    <div className="font-semibold">{formatDate(selectedSession.expiresAt)}</div>
                  </div>
                </div>

                {selectedSession.userAgent && (
                  <div>
                    <h3 className="font-semibold mb-2">User Agent</h3>
                    <div className="bg-gray-50 p-3 rounded text-sm break-all">
                      {selectedSession.userAgent}
                    </div>
                  </div>
                )}

                {selectedSession.sessionData && (
                  <div>
                    <h3 className="font-semibold mb-2">Session Data</h3>
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                      {JSON.stringify(selectedSession.sessionData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
