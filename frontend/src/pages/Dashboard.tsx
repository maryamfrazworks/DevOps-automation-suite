import { Link } from 'react-router-dom'
import { Rocket, AlertTriangle, GitBranch, ArrowRight, RefreshCw } from 'lucide-react'
import { useDeployments, useIncidents, usePipelines, useKPIs } from '../hooks/useData'
import KPICard from '../components/KPICard'
import StatusBadge from '../components/StatusBadge'
import { timeAgo, formatDuration, ENV_COLORS } from '../utils/format'
import clsx from 'clsx'

export default function Dashboard() {
  const { data: deployments, isLoading: dLoading } = useDeployments({ limit: '5' } as any)
  const { data: incidents } = useIncidents({ status: 'open' })
  const { data: pipelines } = usePipelines()
  const { data: kpis } = useKPIs()

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Last 30 days · auto-refreshing</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Deploy Frequency"
          value={kpis?.deployment_frequency.per_day ?? '—'}
          unit="/ day"
          sub={`${kpis?.deployment_frequency.total ?? 0} total deploys`}
        />
        <KPICard
          title="Failure Rate"
          value={kpis?.change_failure_rate.value ?? '—'}
          unit="%"
          sub="change failure rate"
        />
        <KPICard
          title="MTTR"
          value={kpis?.mean_time_to_recovery.value ?? '—'}
          unit="min"
          sub="mean time to recovery"
        />
        <KPICard
          title="Open Incidents"
          value={kpis?.open_incidents ?? '—'}
          sub="requiring attention"
          className={kpis && kpis.open_incidents > 0 ? 'border-red-800/60' : ''}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Deployments */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Rocket size={16} className="text-brand-400" />
              <h2 className="font-semibold text-white">Recent Deployments</h2>
            </div>
            <Link to="/deployments" className="text-xs text-gray-500 hover:text-white flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {dLoading ? (
            <div className="flex items-center gap-2 text-gray-600 text-sm py-4">
              <RefreshCw size={14} className="animate-spin" /> Loading…
            </div>
          ) : deployments?.length === 0 ? (
            <p className="text-gray-600 text-sm py-4">No deployments yet.</p>
          ) : (
            <div className="space-y-2">
              {deployments?.map(dep => (
                <Link
                  key={dep.id}
                  to={`/deployments/${dep.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-800 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">
                        {dep.service_name}
                      </span>
                      <span className="text-xs text-gray-600 font-mono">@{dep.version}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={clsx('badge text-[10px]', ENV_COLORS[dep.environment])}>
                        {dep.environment}
                      </span>
                      <span className="text-xs text-gray-600">{timeAgo(dep.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {dep.duration_seconds && (
                      <span className="text-xs text-gray-600">{formatDuration(dep.duration_seconds)}</span>
                    )}
                    <StatusBadge status={dep.status} pulse />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Open Incidents */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-400" />
              <h2 className="font-semibold text-white">Open Incidents</h2>
            </div>
            <Link to="/incidents" className="text-xs text-gray-500 hover:text-white flex items-center gap-1">
              All <ArrowRight size={12} />
            </Link>
          </div>
          {incidents?.length === 0 ? (
            <p className="text-gray-600 text-sm py-4">No open incidents 🎉</p>
          ) : (
            <div className="space-y-2">
              {incidents?.slice(0, 5).map(inc => (
                <Link
                  key={inc.id}
                  to="/incidents"
                  className="block px-3 py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <StatusBadge status={inc.severity} />
                    <span className="text-sm text-gray-300 line-clamp-1">{inc.title}</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1 ml-0">{timeAgo(inc.created_at)}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pipelines */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GitBranch size={16} className="text-purple-400" />
            <h2 className="font-semibold text-white">Recent Pipelines</h2>
          </div>
          <Link to="/pipelines" className="text-xs text-gray-500 hover:text-white flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {!pipelines?.length ? (
          <p className="text-gray-600 text-sm py-2">No pipeline runs yet.</p>
        ) : (
          <div className="space-y-2">
            {pipelines.slice(0, 4).map(p => (
              <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-800/50">
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-white font-medium">{p.name}</span>
                  <span className="text-xs text-gray-500 ml-2 font-mono">{p.repository}@{p.branch}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {p.stages.map(s => (
                    <span
                      key={s.name}
                      title={`${s.name}: ${s.status}`}
                      className={clsx(
                        'w-2 h-2 rounded-full',
                        s.status === 'passed' ? 'bg-green-400' :
                        s.status === 'failed' ? 'bg-red-400' :
                        s.status === 'running' ? 'bg-blue-400 animate-pulse' :
                        'bg-gray-600'
                      )}
                    />
                  ))}
                </div>
                <StatusBadge status={p.overall_status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
