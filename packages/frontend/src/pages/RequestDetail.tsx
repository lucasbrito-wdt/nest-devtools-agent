import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { IconArrowLeft } from '@tabler/icons-react';
import { eventsApi } from '@/lib/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.get(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!event) {
    return <div>Evento não encontrado</div>;
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-primary-600 hover:text-primary-700 dark:text-primary-400"
      >
        <IconArrowLeft size={20} />
        Voltar
      </button>

      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {event.payload.method} {event.route || event.payload.url}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {format(new Date(event.createdAt), "PPpp", { locale: ptBR })}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Overview */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Overview</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-600 dark:text-gray-400">Status</dt>
              <dd className="mt-1 font-medium text-gray-900 dark:text-white">{event.status}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600 dark:text-gray-400">Duração</dt>
              <dd className="mt-1 font-medium text-gray-900 dark:text-white">
                {event.payload.duration}ms
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600 dark:text-gray-400">IP</dt>
              <dd className="mt-1 font-medium text-gray-900 dark:text-white">
                {event.payload.ip || 'N/A'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600 dark:text-gray-400">User Agent</dt>
              <dd className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                {event.payload.userAgent || 'N/A'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Query Params */}
        {event.payload.query && Object.keys(event.payload.query).length > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Query Params
            </h2>
            <pre className="text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded overflow-x-auto">
              {JSON.stringify(event.payload.query, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Headers */}
      {event.payload.headers && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Headers</h2>
          <pre className="text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded overflow-x-auto">
            {JSON.stringify(event.payload.headers, null, 2)}
          </pre>
        </div>
      )}

      {/* Body */}
      {event.payload.body && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Body</h2>
          <pre className="text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded overflow-x-auto">
            {JSON.stringify(event.payload.body, null, 2)}
          </pre>
        </div>
      )}

      {/* Response */}
      {event.payload.response && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Response</h2>
          <pre className="text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded overflow-x-auto">
            {JSON.stringify(event.payload.response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

