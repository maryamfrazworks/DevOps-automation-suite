import { RefreshCw, TrendingUp } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend
} from 'recharts'
import { useKPIs } from '../hooks/useData'
import KPICard from '../components/KPICard'

const mockDailyDeploys = [
  { day: 'Mon', deploys: 4, failures: 0 },
  { day: 'Tue', deploys: 7, failures: 1 },
  { day: 'Wed', deploys: 3, failures: 0 },
  { day: 'Thu', deploys: 9, failures: 2 },
  { day: 'Fri', deploys: 6, failures: 0 },
  { day: 'Sat', deploys: 2, failures: 0 },
  { day: 'Sun', deploys: 1, failures: 0 },
]

const mockMTTR = [
  { week: 'W1', mttr: 45 },
  { week: 'W2', mttr: 32 },
  { week: 'W3', mttr: 28 },
  { week: 'W4', mttr: 15 },
]

const tooltipStyle = {
  backgroundColor: '#111827',
  border: '1px solid #1f2937',
  borderRadius: 8,
  color: '#e5e7eb',
  fontSize: 12,
}

export default function Metrics() {
  const { data: kpis, isLoading } = useKPIs()

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500">
          <RefreshCw size={16} className="animate-spin" />
          Loading metrics…
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <TrendingUp size={22} className="text-brand-400" />
          DORA Metrics
        </h1>
        <p className="text-sm text-gray-500 mt-1">DevOps Research and Assessment — last 30 days</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Deploy Frequency"
          value={kpis?.deployment_frequency.per_day ?? 0}
          unit="/ day"
          sub={`${kpis?.deployment_frequency.total ?? 0} total`}
        />
        <KPICard
          title="Change Failure Rate"
          value={`${kpis?.change_failure_rate.value ?? 0}`}
          unit="%"
          sub="of deploys failed"
        />
        <KPICard
          title="Mean Time to Recovery"
          value={kpis?.mean_time_to_recovery.value ?? 0}
          unit="min"
          sub="average MTTR"
        />
        <KPICard
          title="Avg Deploy Duration"
          value={kpis?.avg_deployment_duration.value ?? 0}
          unit="s"
          sub="per deployment"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deploy frequency */}
        <div className="card">
          <h2 className="text-sm font-semibold text-white mb-5">Deployments per Day (last 7 days)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mockDailyDeploys} barGap={4}>
              <XAxis dataKey="day" stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#ffffff08' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
              <Bar dataKey="deploys" name="Deploys" fill="#4f6ef7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="failures" name="Failures" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* MTTR trend */}
        <div className="card">
          <h2 className="text-sm font-semibold text-white mb-5">MTTR Trend (minutes)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={mockMTTR}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="week" stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="mttr"
                name="MTTR (min)"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* DORA Performance Band */}
      <div className="card">
        <h2 className="text-sm font-semibold text-white mb-4">DORA Performance Classification</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              metric: 'Deploy Frequency',
              value: kpis?.deployment_frequency.per_day ?? 0,
              elite: '> 1/day',
              rating: (kpis?.deployment_frequency.per_day ?? 0) >= 1 ? 'Elite' : 'High',
              color: (kpis?.deployment_frequency.per_day ?? 0) >= 1 ? 'text-green-400' : 'text-yellow-400',
            },
            {
              metric: 'Lead Time',
              value: `${kpis?.avg_deployment_duration.value ?? 0}s`,
              elite: '< 1 hour',
              rating: 'Elite',
              color: 'text-green-400',
            },
            {
              metric: 'Change Failure Rate',
              value: `${kpis?.change_failure_rate.value ?? 0}%`,
              elite: '0–15%',
              rating: (kpis?.change_failure_rate.value ?? 0) <= 15 ? 'Elite' : 'High',
              color: (kpis?.change_failure_rate.value ?? 0) <= 15 ? 'text-green-400' : 'text-yellow-400',
            },
            {
              metric: 'MTTR',
              value: `${kpis?.mean_time_to_recovery.value ?? 0}min`,
              elite: '< 1 hour',
              rating: (kpis?.mean_time_to_recovery.value ?? 0) <= 60 ? 'Elite' : 'High',
              color: (kpis?.mean_time_to_recovery.value ?? 0) <= 60 ? 'text-green-400' : 'text-yellow-400',
            },
          ].map(item => (
            <div key={item.metric} className="bg-gray-800/50 rounded-xl p-4 text-center">
              <div className="text-xs text-gray-500 mb-2">{item.metric}</div>
              <div className="text-2xl font-bold text-white">{item.value}</div>
              <div className={`text-xs font-semibold mt-2 ${item.color}`}>{item.rating}</div>
              <div className="text-xs text-gray-600 mt-0.5">Elite: {item.elite}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
