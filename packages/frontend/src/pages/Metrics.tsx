import { useQuery } from '@tanstack/react-query';
import { IconTrendingUp, IconClock, IconActivity } from '@tabler/icons-react';
import axios from 'axios';

export default function Metrics() {
  const { data: performance } = useQuery({
    queryKey: ['metrics', 'performance'],
    queryFn: () => axios.get('/api/events/metrics/performance?hours=24').then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: statusDist } = useQuery({
    queryKey: ['metrics', 'status'],
    queryFn: () => axios.get('/api/events/metrics/status-distribution').then(r => r.data),
  });

  const { data: slowest } = useQuery({
    queryKey: ['metrics', 'slowest'],
    queryFn: () => axios.get('/api/events/metrics/slowest-routes?limit=10').then(r => r.data),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Métricas & Performance</h1>

      {/* Performance ao longo do tempo */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4"><IconTrendingUp size={20} className="inline mr-2" />Performance (24h)</h2>
        <div className="space-y-2">
          {performance?.map((point: any) => (
            <div key={point.timestamp} className="flex justify-between text-sm">
              <span>{new Date(point.timestamp).toLocaleTimeString()}</span>
              <span>{point.count} requests • {Math.round(point.avgDuration)}ms avg</span>
            </div>
          ))}
        </div>
      </div>

      {/* Status distribution */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4"><IconActivity size={20} className="inline mr-2" />Distribuição de Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statusDist?.map((item: any) => (
            <div key={item.status} className="text-center">
              <div className={`text-2xl font-bold ${item.status < 400 ? 'text-green-600' : 'text-red-600'}`}>{item.count}</div>
              <div className="text-sm text-gray-600">{item.status}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Rotas mais lentas */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4"><IconClock size={20} className="inline mr-2" />Rotas Mais Lentas</h2>
        <div className="space-y-2">
          {slowest?.map((route: any) => (
            <div key={route.route} className="flex justify-between items-center border-b pb-2">
              <span className="font-mono text-sm">{route.route}</span>
              <div className="text-right">
                <div className="font-semibold">{Math.round(route.avgDuration)}ms</div>
                <div className="text-xs text-gray-500">{route.count} requests</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

