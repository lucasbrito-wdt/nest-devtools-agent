import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '@/lib/api';
import { EventType, LogEventMeta } from 'nest-devtools-shared';

export default function Logs() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['events', EventType.LOG],
    queryFn: () => eventsApi.list({ type: EventType.LOG }, { page: 1, limit: 100 }),
    retry: false,
  });

  if (error) {
    return (
      <div className="text-center text-red-500 dark:text-red-400">
        Erro ao carregar logs. Verifique se o backend está rodando.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Logs</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {data?.meta?.total || 0} logs capturados
        </p>
      </div>

      <div className="card">
        <div className="space-y-2 font-mono text-sm">
          {isLoading ? (
            <div className="text-center text-gray-500">Carregando...</div>
          ) : data?.data.length === 0 ? (
            <div className="text-center text-gray-500">Nenhum log encontrado</div>
          ) : (
            data?.data.map((event) => {
              const meta = event.payload as LogEventMeta;
              return (
                <div key={event.id} className="py-1">
                  <span className="text-gray-500 dark:text-gray-400">
                    [{new Date(event.createdAt).toLocaleTimeString()}]
                  </span>{' '}
                  <span
                    className={`font-semibold ${
                      meta.level === 'error'
                        ? 'text-red-600'
                        : meta.level === 'warn'
                          ? 'text-yellow-600'
                          : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    [{meta.level.toUpperCase()}]
                  </span>{' '}
                  <span className="text-gray-900 dark:text-white">{meta.message}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
