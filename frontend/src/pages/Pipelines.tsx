import { useState } from 'react'
import { Plus, GitBranch, RefreshCw, GitCommit } from 'lucide-react'
import { usePipelines } from '../hooks/useData'
import { pipelinesApi } from '../utils/api'
import { useQueryClient } from '@tanstack/react-query'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'
import { timeAgo } from '../utils/format'
import clsx from 'clsx'

const STAGE_COLORS: Record<string, string> = {
  passed: 'bg-green-500',
  failed: 'bg-red-500',
  running: 'bg-blue-500 animate-pulse',
  pending: 'bg-gray-600',
  skipped: 'bg-gray-700',
}

function CreateModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    repository: '',
    branch: 'main',
    commit_sha: '',
    triggered_by: 'push',
  })

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async () => {
    setLoading(true)
    await pipelinesApi.create({
      ...form,
      stages: [
        { name: 'lint', status: 'passed', duration_seconds: 12 },
        { name: 'test', status: 'passed', duration_seconds: 47 },
        { name: 'build', status: 'running' },
        { name: 'deploy', status: 'pending' },
      ],
    } as any)
    qc.invalidateQueries({ queryKey: ['pipelines'] })
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white mb-5">New Pipeline Run</h2>
        <div className="space-y-4">
          {[
            { name: 'name', label: 'Pipeline Name', placeholder: 'Build & Deploy' },
            { name: 'repository', label: 'Repository', placeholder: 'org/service-name' },
            { name: 'branch', label: 'Branch', placeholder: 'main' },
            { name: 'commit_sha', label: 'Commit SHA', placeholder: 'abc1234def5678' },
            { name: 'triggered_by', label: 'Triggered By', placeholder: 'push / schedule / manual' },
          ].map(f => (
            <div key={f.name}>
              <label className="block text-xs text-gray-400 mb-1.5">{f.label}</label>
              <input
                name={f.name}
                value={(form as any)[f.name]}
                onChange={handle}
                placeholder={f.placeholder}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
          <button
            onClick={submit}
            disabled={!form.name || loading}
            className="btn-primary flex-1 justify-center"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <GitBranch size={14} />}
            Run Pipeline
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Pipelines() {
  const [showCreate, setShowCreate] = useState(false)
  const { data: pipelines, isLoading } = usePipelines()

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">CI/CD Pipelines</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor your build and deploy pipelines</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={14} /> New Run
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-600 text-sm py-8">
          <RefreshCw size={14} className="animate-spin" /> Loading…
        </div>
      ) : !pipelines?.length ? (
        <EmptyState
          icon={GitBranch}
          title="No pipeline runs"
          description="Trigger a pipeline run to see it here."
          action={
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus size={14} /> New Run
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {pipelines.map(p => (
            <div key={p.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white">{p.name}</span>
                    <StatusBadge status={p.overall_status} pulse />
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 flex-wrap">
                    <span className="font-mono text-gray-400">{p.repository}</span>
                    <span className="text-gray-700">·</span>
                    <span className="text-gray-400">{p.branch}</span>
                    {p.commit_sha && (
                      <>
                        <span className="text-gray-700">·</span>
                        <span className="flex items-center gap-1">
                          <GitCommit size={10} />
                          <span className="font-mono">{p.commit_sha.slice(0, 8)}</span>
                        </span>
                      </>
                    )}
                    <span className="text-gray-700">·</span>
                    <span>{timeAgo(p.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Stages */}
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                {p.stages.map((stage, i) => (
                  <div key={stage.name} className="flex items-center gap-2">
                    {i > 0 && (
                      <div className={clsx(
                        'h-px w-6',
                        p.stages[i - 1].status === 'passed' ? 'bg-green-700' : 'bg-gray-700'
                      )} />
                    )}
                    <div
                      className={clsx(
                        'flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors',
                        stage.status === 'passed' ? 'bg-green-900/30 border-green-800/60 text-green-300' :
                        stage.status === 'failed' ? 'bg-red-900/30 border-red-800/60 text-red-300' :
                        stage.status === 'running' ? 'bg-blue-900/30 border-blue-800/60 text-blue-300' :
                        stage.status === 'skipped' ? 'bg-gray-800 border-gray-700 text-gray-500' :
                        'bg-gray-800/50 border-gray-700 text-gray-600'
                      )}
                    >
                      <span className={clsx('w-1.5 h-1.5 rounded-full', STAGE_COLORS[stage.status])} />
                      {stage.name}
                      {stage.duration_seconds && (
                        <span className="opacity-60">{stage.duration_seconds}s</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
