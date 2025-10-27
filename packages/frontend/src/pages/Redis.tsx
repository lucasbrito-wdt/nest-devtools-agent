import { useState, useEffect } from 'react';

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

  const getCommandColor = (command: string) => {
    const readCommands = ['GET', 'MGET', 'HGET', 'HGETALL', 'LRANGE', 'SMEMBERS', 'ZRANGE'];
    const writeCommands = ['SET', 'MSET', 'HSET', 'LPUSH', 'RPUSH', 'SADD', 'ZADD'];
    const deleteCommands = ['DEL', 'HDEL', 'LPOP', 'RPOP', 'SREM', 'ZREM'];

    if (readCommands.includes(command)) return 'bg-blue-100 text-blue-800';
    if (writeCommands.includes(command)) return 'bg-green-100 text-green-800';
    if (deleteCommands.includes(command)) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading Redis operations...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Redis Operations</h1>
        <p className="text-gray-600">Monitor Redis commands and performance</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Operations</div>
            <div className="text-2xl font-bold">{stats.totalOperations}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Successful</div>
            <div className="text-2xl font-bold text-green-600">{stats.successfulOperations}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Failed</div>
            <div className="text-2xl font-bold text-red-600">{stats.failedOperations}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Avg Duration</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatDuration(stats.avgDuration)}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Command</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., GET, SET..."
              value={filter.command}
              onChange={(e) =>
                setFilter({ ...filter, command: e.target.value.toUpperCase(), page: 1 })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Key</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              placeholder="Filter by key..."
              value={filter.key}
              onChange={(e) => setFilter({ ...filter, key: e.target.value, page: 1 })}
            />
          </div>
          <div className="flex items-end">
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={() => setFilter({ command: '', key: '', page: 1, limit: 50 })}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Operations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Command
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Key
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {operations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No Redis operations found
                </td>
              </tr>
            ) : (
              operations.map((operation) => (
                <tr
                  key={operation.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedOperation(operation)}
                >
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${getCommandColor(
                        operation.command,
                      )}`}
                    >
                      {operation.command}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{operation.key || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {operation.value ? truncateValue(operation.value) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatDuration(operation.duration)}
                  </td>
                  <td className="px-6 py-4">
                    {operation.error ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">
                        ERROR
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">
                        OK
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(operation.createdAt)}
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
          disabled={operations.length < filter.limit}
          onClick={() => setFilter({ ...filter, page: filter.page + 1 })}
        >
          Next
        </button>
      </div>

      {/* Operation Detail Modal */}
      {selectedOperation && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedOperation(null)}
        >
          <div
            className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">Operation Details</h2>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setSelectedOperation(null)}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Command</div>
                    <div className="font-semibold">{selectedOperation.command}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Duration</div>
                    <div className="font-semibold">
                      {formatDuration(selectedOperation.duration)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Key</div>
                    <div className="font-semibold">{selectedOperation.key || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Database</div>
                    <div className="font-semibold">{selectedOperation.database ?? 'N/A'}</div>
                  </div>
                </div>

                {selectedOperation.args && selectedOperation.args.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Arguments</h3>
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                      {JSON.stringify(selectedOperation.args, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedOperation.value && (
                  <div>
                    <h3 className="font-semibold mb-2">Value</h3>
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                      {JSON.stringify(selectedOperation.value, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedOperation.result && (
                  <div>
                    <h3 className="font-semibold mb-2">Result</h3>
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                      {JSON.stringify(selectedOperation.result, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedOperation.error && (
                  <div>
                    <h3 className="font-semibold mb-2 text-red-600">Error</h3>
                    <div className="bg-red-50 p-3 rounded text-sm text-red-800">
                      {selectedOperation.error}
                    </div>
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
