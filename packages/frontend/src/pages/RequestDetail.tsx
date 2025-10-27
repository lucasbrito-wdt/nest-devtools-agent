import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { IconArrowLeft } from '@tabler/icons-react';
import { eventsApi } from '@/lib/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type TabType = 'request' | 'response';
type RequestSubTab = 'headers' | 'payload';
type ResponseSubTab = 'data' | 'headers' | 'session';

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('request');
  const [requestSubTab, setRequestSubTab] = useState<RequestSubTab>('headers');
  const [responseSubTab, setResponseSubTab] = useState<ResponseSubTab>('data');

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.get(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Carregando...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Evento não encontrado</div>
      </div>
    );
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600 bg-green-100';
    if (status >= 300 && status < 400) return 'text-blue-600 bg-blue-100';
    if (status >= 400 && status < 500) return 'text-yellow-600 bg-yellow-100';
    if (status >= 500) return 'text-red-600 bg-red-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
        >
          <IconArrowLeft size={20} />
          Voltar
        </button>

        <div className="flex items-center gap-4 mb-2">
          <span className="px-3 py-1 text-sm font-semibold rounded bg-blue-100 text-blue-800">
            {event.payload.method}
          </span>
          <h1 className="text-2xl font-bold">{event.route || event.payload.url}</h1>
        </div>
        <p className="text-gray-600">
          {format(new Date(event.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
        </p>
      </div>

      {/* Overview Section */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <h2 className="text-xl font-bold mb-4">Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600">Status</div>
            <div className={`text-2xl font-bold px-3 py-1 rounded inline-block ${getStatusColor(event.status)}`}>
              {event.status}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Duração</div>
            <div className="text-2xl font-bold">{event.payload.duration}ms</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">IP</div>
            <div className="text-lg font-mono">{event.payload.ip || 'N/A'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">User Agent</div>
            <div className="text-sm truncate" title={event.payload.userAgent}>
              {event.payload.userAgent || 'N/A'}
            </div>
          </div>
        </div>

        {/* Query Params */}
        {event.payload.query && Object.keys(event.payload.query).length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Query Params</h3>
            <div className="bg-gray-50 p-4 rounded">
              <pre className="text-sm overflow-x-auto">
                {JSON.stringify(event.payload.query, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Main Tabs */}
      <div className="bg-white rounded-lg shadow">
        {/* Tab Headers */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              className={`px-6 py-3 font-medium ${
                activeTab === 'request'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab('request')}
            >
              Request
            </button>
            <button
              className={`px-6 py-3 font-medium ${
                activeTab === 'response'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab('response')}
            >
              Response
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'request' && (
            <div>
              {/* Request Sub-tabs */}
              <div className="flex gap-2 mb-4 border-b">
                <button
                  className={`px-4 py-2 font-medium ${
                    requestSubTab === 'headers'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  onClick={() => setRequestSubTab('headers')}
                >
                  Headers
                </button>
                <button
                  className={`px-4 py-2 font-medium ${
                    requestSubTab === 'payload'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  onClick={() => setRequestSubTab('payload')}
                >
                  Payload
                </button>
              </div>

              {/* Request Content */}
              {requestSubTab === 'headers' && (
                <div>
                  {event.payload.headers ? (
                    <pre className="bg-gray-50 p-4 rounded text-sm overflow-x-auto">
                      {JSON.stringify(event.payload.headers, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-gray-500 text-center py-8">No headers available</div>
                  )}
                </div>
              )}

              {requestSubTab === 'payload' && (
                <div>
                  {event.payload.body ? (
                    <pre className="bg-gray-50 p-4 rounded text-sm overflow-x-auto">
                      {JSON.stringify(event.payload.body, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-gray-500 text-center py-8">No payload available</div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'response' && (
            <div>
              {/* Response Sub-tabs */}
              <div className="flex gap-2 mb-4 border-b">
                <button
                  className={`px-4 py-2 font-medium ${
                    responseSubTab === 'data'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  onClick={() => setResponseSubTab('data')}
                >
                  Data
                </button>
                <button
                  className={`px-4 py-2 font-medium ${
                    responseSubTab === 'headers'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  onClick={() => setResponseSubTab('headers')}
                >
                  Headers
                </button>
                <button
                  className={`px-4 py-2 font-medium ${
                    responseSubTab === 'session'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  onClick={() => setResponseSubTab('session')}
                >
                  Session
                </button>
              </div>

              {/* Response Content */}
              {responseSubTab === 'data' && (
                <div>
                  {event.payload.response ? (
                    <pre className="bg-gray-50 p-4 rounded text-sm overflow-x-auto">
                      {JSON.stringify(event.payload.response, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-gray-500 text-center py-8">No response data available</div>
                  )}
                </div>
              )}

              {responseSubTab === 'headers' && (
                <div>
                  {event.payload.responseHeaders ? (
                    <pre className="bg-gray-50 p-4 rounded text-sm overflow-x-auto">
                      {JSON.stringify(event.payload.responseHeaders, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-gray-500 text-center py-8">
                      No response headers available
                    </div>
                  )}
                </div>
              )}

              {responseSubTab === 'session' && (
                <div>
                  {event.payload.sessionId || event.payload.sessionData ? (
                    <div className="space-y-4">
                      {event.payload.sessionId && (
                        <div>
                          <div className="text-sm font-semibold text-gray-600 mb-2">
                            Session ID
                          </div>
                          <div className="bg-gray-50 p-3 rounded font-mono text-sm">
                            {event.payload.sessionId}
                          </div>
                        </div>
                      )}
                      {event.payload.userId && (
                        <div>
                          <div className="text-sm font-semibold text-gray-600 mb-2">User ID</div>
                          <div className="bg-gray-50 p-3 rounded font-mono text-sm">
                            {event.payload.userId}
                          </div>
                        </div>
                      )}
                      {event.payload.sessionData && (
                        <div>
                          <div className="text-sm font-semibold text-gray-600 mb-2">
                            Session Data
                          </div>
                          <pre className="bg-gray-50 p-4 rounded text-sm overflow-x-auto">
                            {JSON.stringify(event.payload.sessionData, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-8">No session data available</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

