import { useQuery } from '@tanstack/react-query';
import { IconWorld, IconAlertTriangle, IconFileText, IconClock } from '@tabler/icons-react';
import { eventsApi } from '@/lib/api';

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: eventsApi.stats,
    refetchInterval: 5000, // Atualiza a cada 5s
  });

  if (isLoading) {
    return <div className="text-center text-gray-500 dark:text-gray-400">Carregando...</div>;
  }

  const statCards = [
    {
      label: 'Total Requests',
      value: stats?.totalRequests || 0,
      icon: IconWorld,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: 'Exceções',
      value: stats?.totalExceptions || 0,
      icon: IconAlertTriangle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
    },
    {
      label: 'Logs',
      value: stats?.totalLogs || 0,
      icon: IconFileText,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    },
    {
      label: 'Tempo Médio',
      value: `${Math.round(stats?.averageResponseTime || 0)}ms`,
      icon: IconClock,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Visão geral do seu sistema em tempo real
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {card.label}
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {card.value}
                </p>
              </div>
              <div className={`rounded-full p-3 ${card.bgColor}`}>
                <card.icon className={card.color} size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Últimas 24h */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Últimas 24 horas
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Requests</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats?.last24Hours.requests || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Exceções</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                {stats?.last24Hours.exceptions || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Taxa de Sucesso</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {stats?.successRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Performance
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Tempo Médio</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {Math.round(stats?.averageResponseTime || 0)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total Eventos</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats?.totalEvents || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

