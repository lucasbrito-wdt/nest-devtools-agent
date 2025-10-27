import { useState, useEffect } from 'react';

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

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-green-100 text-green-800';
      case 'POST':
        return 'bg-blue-100 text-blue-800';
      case 'PUT':
        return 'bg-yellow-100 text-yellow-800';
      case 'PATCH':
        return 'bg-orange-100 text-orange-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status?: number) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    if (status >= 200 && status < 300) return 'bg-green-100 text-green-800';
    if (status >= 300 && status < 400) return 'bg-blue-100 text-blue-800';
    if (status >= 400 && status < 500) return 'bg-yellow-100 text-yellow-800';
    if (status >= 500) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading HTTP requests...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">HTTP Client</h1>
        <p className="text-gray-600">Monitor outgoing HTTP requests</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Requests</div>
            <div className="text-2xl font-bold">{stats.totalRequests}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Successful</div>
            <div className="text-2xl font-bold text-green-600">{stats.successfulRequests}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Failed</div>
            <div className="text-2xl font-bold text-red-600">{stats.failedRequests}</div>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Method</label>
            <select
              className="w-full border rounded px-3 py-2"
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
            <label className="block text-sm font-medium mb-1">URL</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              placeholder="Filter by URL..."
              value={filter.url}
              onChange={(e) => setFilter({ ...filter, url: e.target.value, page: 1 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., 200"
              value={filter.responseStatus}
              onChange={(e) => setFilter({ ...filter, responseStatus: e.target.value, page: 1 })}
            />
          </div>
          <div className="flex items-end">
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={() =>
                setFilter({ method: '', url: '', responseStatus: '', page: 1, limit: 50 })
              }
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                URL
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No HTTP requests found
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr
                  key={request.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedRequest(request)}
                >
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${getMethodColor(
                        request.method,
                      )}`}
                    >
                      {request.method}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900" title={request.url}>
                      {truncateUrl(request.url)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {request.error ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">
                        ERROR
                      </span>
                    ) : (
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(
                          request.responseStatus,
                        )}`}
                      >
                        {request.responseStatus || 'N/A'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatDuration(request.duration)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(request.createdAt)}
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
          disabled={requests.length < filter.limit}
          onClick={() => setFilter({ ...filter, page: filter.page + 1 })}
        >
          Next
        </button>
      </div>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedRequest(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">Request Details</h2>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setSelectedRequest(null)}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Request</h3>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="mb-2">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${getMethodColor(selectedRequest.method)}`}
                      >
                        {selectedRequest.method}
                      </span>
                      <span className="ml-2 text-sm">{selectedRequest.url}</span>
                    </div>
                    {selectedRequest.requestBody && (
                      <pre className="text-xs overflow-x-auto mt-2">
                        {JSON.stringify(selectedRequest.requestBody, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Response</h3>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="mb-2">
                      Status:{' '}
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(selectedRequest.responseStatus)}`}
                      >
                        {selectedRequest.responseStatus || 'N/A'}
                      </span>
                      <span className="ml-4">
                        Duration: {formatDuration(selectedRequest.duration)}
                      </span>
                    </div>
                    {selectedRequest.error && (
                      <div className="text-red-600 text-sm mb-2">
                        Error: {selectedRequest.error}
                      </div>
                    )}
                    {selectedRequest.responseBody && (
                      <pre className="text-xs overflow-x-auto mt-2">
                        {JSON.stringify(selectedRequest.responseBody, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
