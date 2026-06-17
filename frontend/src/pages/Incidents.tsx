import { useState } from 'react'
import { Plus, AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react'
import { useIncidents, useCreateIncident, useUpdateIncident } from '../hooks/useData'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'
import { timeAgo } from '../utils/format'
import clsx from 'clsx'

function CreateModal({ onClose }: { onClose: () => void }) {
  const create = useCreateIncident()
  const [form, setForm] = useState({
    title: '',
    description: '',
    severity: 'P3',
    affected_services: '',
    assigned_to: '',
  })

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async () => {
    await create.mutateAsync({
      ...form,
      affected_services: form.affected_services.split(',').map(s => s.trim()).filter(Boolean),
    } as any)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white mb-5">Declare Incident</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Title *</label>
            <input
              name="title"
              value={form.title}
              onChange={handle}
              placeholder="Brief description of the incident"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Severity</label>
            <select
              name="severity"
              value={form.severity}
              onChange={handle}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            >
              <option value="P1">P1 – Critical (service down)</option>
              <option value="P2">P2 – Major (significant degradation)</option>
              <option value="P3">P3 – Minor (partial degradation)</option>
              <option value="P4">P4 – Low (cosmetic issue)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handle}
              rows={3}
              placeholder="What is happening? What is the user impact?"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Affected Services (comma-separated)</label>
            <input
              name="affected_services"
              value={form.affected_services}
              onChange={handle}
              placeholder="api-gateway, auth-service, database"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Assigned To</label>
            <input
              name="assigned_to"
              value={form.assigned_to}
              onChange={handle}
              placeholder="@oncall-engineer"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
          <button
            onClick={submit}
            disabled={!form.title || create.isPending}
            className="flex-1 btn bg-red-600 hover:bg-red-700 text-white justify-center"
          >
            {create.isPending ? <RefreshCw size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
            Declare
          </button>
        </div>
      </div>
    </div>
  )
}

const STATUSES = ['', 'open', 'investigating', 'identified', 'monitoring', 'resolved']
const SEVERITIES = ['', 'P1', 'P2', 'P3', 'P4']

export default function Incidents() {
  const [showCreate, setShowCreate] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [sevFilter, setSevFilter] = useState('')
  const update = useUpdateIncident()

  const { data: incidents, isLoading } = useIncidents({
    ...(statusFilter && { status: statusFilter }),
    ...(sevFilter && { severity: sevFilter }),
  })

  const quickResolve = (id: string) => {
    update.mutate({ id, data: { status: 'resolved', resolution_summary: 'Resolved via dashboard' } })
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Incidents</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage production incidents</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn bg-red-600 hover:bg-red-700 text-white"
        >
          <Plus size={14} /> Declare Incident
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                statusFilter === s ? 'bg-brand-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              )}
            >
              {s || 'All status'}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {SEVERITIES.map(s => (
            <button
              key={s}
              onClick={() => setSevFilter(s)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                sevFilter === s ? 'bg-brand-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              )}
            >
              {s || 'All sev'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-600 text-sm py-8">
          <RefreshCw size={14} className="animate-spin" /> Loading…
        </div>
      ) : !incidents?.length ? (
        <EmptyState
          icon={AlertTriangle}
          title="No incidents found"
          description="No incidents match the current filters."
        />
      ) : (
        <div className="space-y-2">
          {incidents.map(inc => (
            <div
              key={inc.id}
              className="card hover:border-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={inc.severity} />
                    <StatusBadge status={inc.status} />
                    <h3 className="text-sm font-medium text-white">{inc.title}</h3>
                  </div>
                  {inc.description && (
                    <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{inc.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {inc.affected_services.map(s => (
                      <span key={s} className="text-xs text-gray-600 font-mono bg-gray-800 px-1.5 py-0.5 rounded">{s}</span>
                    ))}
                    {inc.assigned_to && (
                      <span className="text-xs text-gray-500">→ {inc.assigned_to}</span>
                    )}
                    <span className="text-xs text-gray-600">{timeAgo(inc.created_at)}</span>
                    {inc.mttr_minutes && (
                      <span className="text-xs text-green-400">MTTR: {inc.mttr_minutes}min</span>
                    )}
                  </div>
                </div>
                {inc.status !== 'resolved' && inc.status !== 'postmortem' && (
                  <button
                    onClick={() => quickResolve(inc.id)}
                    className="btn-ghost text-green-400 hover:text-green-300 shrink-0"
                    title="Mark resolved"
                  >
                    <CheckCircle size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
