import { formatDistanceToNow, parseISO } from 'date-fns'

export function timeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true })
  } catch {
    return dateStr
  }
}

export function formatDuration(seconds?: number): string {
  if (!seconds) return '—'
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

export const STATUS_COLORS: Record<string, string> = {
  // Deployment
  pending: 'bg-gray-700 text-gray-300',
  running: 'bg-blue-900 text-blue-300',
  success: 'bg-green-900 text-green-300',
  failed: 'bg-red-900 text-red-300',
  rolled_back: 'bg-orange-900 text-orange-300',
  cancelled: 'bg-gray-700 text-gray-400',
  // Incidents
  open: 'bg-red-900 text-red-300',
  investigating: 'bg-orange-900 text-orange-300',
  identified: 'bg-yellow-900 text-yellow-300',
  monitoring: 'bg-blue-900 text-blue-300',
  resolved: 'bg-green-900 text-green-300',
  postmortem: 'bg-purple-900 text-purple-300',
  // Pipelines
  passed: 'bg-green-900 text-green-300',
  // Severity
  P1: 'bg-red-900 text-red-300',
  P2: 'bg-orange-900 text-orange-300',
  P3: 'bg-yellow-900 text-yellow-300',
  P4: 'bg-gray-700 text-gray-300',
}

export const ENV_COLORS: Record<string, string> = {
  production: 'bg-red-900/40 text-red-400 border border-red-800',
  staging: 'bg-yellow-900/40 text-yellow-400 border border-yellow-800',
  dev: 'bg-gray-800 text-gray-400 border border-gray-700',
}
