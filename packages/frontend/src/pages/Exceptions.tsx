import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '@/lib/api';
import { EventType, ExceptionEventMeta } from 'nest-devtools-shared';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Exceptions() {
  const { data, isLoading } = useQuery({
    queryKey: ['events', EventType.EXCEPTION],
    queryFn: () => eventsApi.list({ type: EventType.EXCEPTION }, { page: 1, limit: 50 }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Exceções</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {data?.meta.total || 0} exceções capturadas
        </p>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center text-gray-500">Carregando...</div>
        ) : data?.data.length === 0 ? (
          <div className="card text-center text-gray-500">Nenhuma exceção encontrada</div>
        ) : (
          data?.data.map((event) => {
            const meta = event.payload as ExceptionEventMeta;
            return (
              <div key={event.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="badge badge-error">{event.status || 500}</span>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {meta.name}
                      </h3>
                    </div>
                    <p className="mt-2 text-gray-700 dark:text-gray-300">{meta.message}</p>
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      {meta.method} {event.route || meta.url}
                    </div>
                    <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(event.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </div>
                  </div>
                </div>
                {meta.stack && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium text-primary-600 dark:text-primary-400">
                      Ver stacktrace
                    </summary>
                    <pre className="mt-2 text-xs bg-gray-50 dark:bg-gray-900 p-4 rounded overflow-x-auto">
                      {meta.stack}
                    </pre>
                  </details>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
