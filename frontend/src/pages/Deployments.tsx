import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Plus, ArrowLeft, RefreshCw, Rocket, RotateCcw } from 'lucide-react'
import { useDeployments, useDeployment, useDeploymentLogs, useCreateDeployment, useRollback } from '../hooks/useData'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'
import { timeAgo, formatDuration, ENV_COLORS } from '../utils/format'
import { type Environment } from '../utils/api'
import clsx from 'clsx'

// ── Create Deployment Modal ───────────────────────────────────────────────────

interface DeploymentForm {
  service_name: string
  version: string
  environment: Environment
  triggered_by: string
  commit_sha: string
  branch: string
  image_tag: string
}

function CreateModal({ onClose }: { onClose: () => void }) {
  const create = useCreateDeployment()
  const navigate = useNavigate()
  const [form, setForm] = useState<DeploymentForm>({
    service_name: '',
    version: '1.0.0',
    environment: 'staging',
    triggered_by: 'manual',
    commit_sha: '',
    branch: 'main',
    image_tag: '',
  })

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async () => {
    const dep = await create.mutateAsync(form)
    onClose()
    navigate(`/deployments/${dep.id}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white mb-5">New Deployment</h2>
        <div className="space-y-4">
          {([
            { name: 'service_name', label: 'Service Name', placeholder: 'api-gateway' },
            { name: 'version', label: 'Version', placeholder: '1.2.3' },
            { name: 'commit_sha', label: 'Commit SHA', placeholder: 'abc1234' },
            { name: 'branch', label: 'Branch', placeholder: 'main' },
            { name: 'image_tag', label: 'Image Tag', placeholder: 'registry/image:tag' },
            { name: 'triggered_by', label: 'Triggered By', placeholder: 'ci-bot' },
          ] as { name: keyof DeploymentForm; label: string; placeholder: string }[]).map(f => (
            <div key={f.name}>
              <label className="block text-xs text-gray-400 mb-1.5">{f.label}</label>
              <input
                name={f.name}
                value={form[f.name]}
                onChange={handle}
                placeholder={f.placeholder}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Environment</label>
            <select
              name="environment"
              value={form.environment}
              onChange={handle}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            >
              <option value="dev">dev</option>
              <option value="staging">staging</option>
              <option value="production">production</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
          <button
            onClick={submit}
            disabled={!form.service_name || create.isPending}
            className="btn-primary flex-1 justify-center"
          >
            {create.isPending ? <RefreshCw size={14} className="animate-spin" /> : <Rocket size={14} />}
            Deploy
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Deployment Detail ─────────────────────────────────────────────────────────

export function DeploymentDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: dep } = useDeployment(id!)
  const { data: logs } = useDeploymentLogs(id!)
  const rollback = useRollback()

  if (!dep) return <div className="p-6 text-gray-500 text-sm">Loading…</div>

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/deployments" className="btn-ghost text-gray-500 px-2">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">
            {dep.service_name}{' '}
            <span className="text-gray-500 font-normal font-mono">@{dep.version}</span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={dep.status} pulse />
            <span className={clsx('badge text-[10px]', ENV_COLORS[dep.environment])}>{dep.environment}</span>
            <span className="text-xs text-gray-600">{timeAgo(dep.created_at)}</span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {['failed', 'success'].includes(dep.status) && (
            <button
              onClick={() => rollback.mutate(dep.id)}
              disabled={rollback.isPending}
              className="btn-ghost text-orange-400 hover:text-orange-300"
            >
              <RotateCcw size={14} />
              Rollback
            </button>
          )}
        </div>
      </div>

      <div className="card grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Triggered by', value: dep.triggered_by },
          { label: 'Duration', value: formatDuration(dep.duration_seconds) },
          { label: 'Branch', value: dep.branch ?? '—' },
          { label: 'Commit', value: dep.commit_sha?.slice(0, 8) ?? '—' },
        ].map(item => (
          <div key={item.label}>
            <div className="text-xs text-gray-500">{item.label}</div>
            <div className="text-sm text-white mt-0.5 font-mono">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          Deployment Logs
          {dep.status === 'running' && <RefreshCw size={12} className="animate-spin text-blue-400" />}
        </h2>
        <div className="bg-gray-950 rounded-lg p-4 font-mono text-xs space-y-1 max-h-96 overflow-y-auto">
          {!logs?.length ? (
            <span className="text-gray-600">No logs yet…</span>
          ) : (
            logs.map(log => (
              <div key={log.id} className="flex gap-3">
                <span className="text-gray-600 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span className={clsx(
                  log.level === 'ERROR' ? 'text-red-400' :
                  log.level === 'WARN' ? 'text-yellow-400' : 'text-gray-300'
                )}>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {dep.error_message && (
        <div className="card border-red-800/50">
          <div className="text-xs text-red-400 font-semibold mb-1">Error</div>
          <pre className="text-xs text-red-300 whitespace-pre-wrap font-mono">{dep.error_message}</pre>
        </div>
      )}
    </div>
  )
}

// ── Deployments List ──────────────────────────────────────────────────────────

export default function Deployments() {
  const [showCreate, setShowCreate] = useState(false)
  const [env, setEnv] = useState('')
  const { data: deployments, isLoading } = useDeployments(env ? { environment: env } : undefined)

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Deployments</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track all deployments</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={14} /> New Deployment
        </button>
      </div>

      <div className="flex items-center gap-2">
        {(['', 'dev', 'staging', 'production'] as const).map(e => (
          <button
            key={e}
            onClick={() => setEnv(e)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              env === e ? 'bg-brand-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            )}
          >
            {e || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-600 text-sm py-8">
          <RefreshCw size={14} className="animate-spin" /> Loading deployments…
        </div>
      ) : !deployments?.length ? (
        <EmptyState
          icon={Rocket}
          title="No deployments yet"
          description="Trigger your first deployment to get started."
          action={
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus size={14} /> New Deployment
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-medium">Service</th>
                <th className="text-left px-5 py-3 font-medium">Environment</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Duration</th>
                <th className="text-left px-5 py-3 font-medium">By</th>
                <th className="text-left px-5 py-3 font-medium">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {deployments.map(dep => (
                <tr
                  key={dep.id}
                  className="hover:bg-gray-800/50 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3">
                    <Link to={`/deployments/${dep.id}`} className="hover:text-brand-400 transition-colors">
                      <span className="font-medium text-white">{dep.service_name}</span>
                      <span className="text-gray-600 font-mono ml-1.5 text-xs">@{dep.version}</span>
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <span className={clsx('badge text-[10px]', ENV_COLORS[dep.environment])}>
                      {dep.environment}
                    </span>
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={dep.status} pulse /></td>
                  <td className="px-5 py-3 text-gray-400">{formatDuration(dep.duration_seconds)}</td>
                  <td className="px-5 py-3 text-gray-400">{dep.triggered_by}</td>
                  <td className="px-5 py-3 text-gray-500">{timeAgo(dep.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
