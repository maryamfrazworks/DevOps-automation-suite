import axios from 'axios'

export const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    console.error('API error:', err.response?.data ?? err.message)
    return Promise.reject(err)
  }
)

// ── Types ─────────────────────────────────────────────────────────────────────

export type DeploymentStatus = 'pending' | 'running' | 'success' | 'failed' | 'rolled_back' | 'cancelled'
export type Environment = 'dev' | 'staging' | 'production'
export type IncidentSeverity = 'P1' | 'P2' | 'P3' | 'P4'
export type IncidentStatus = 'open' | 'investigating' | 'identified' | 'monitoring' | 'resolved' | 'postmortem'

export interface Deployment {
  id: string
  service_name: string
  version: string
  environment: Environment
  status: DeploymentStatus
  triggered_by: string
  commit_sha?: string
  branch?: string
  image_tag?: string
  duration_seconds?: number
  error_message?: string
  created_at: string
  completed_at?: string
}

export interface DeploymentLog {
  id: number
  level: string
  message: string
  timestamp: string
}

export interface Incident {
  id: string
  title: string
  description?: string
  severity: IncidentSeverity
  status: IncidentStatus
  affected_services: string[]
  assigned_to?: string
  resolution_summary?: string
  mttr_minutes?: number
  tags: string[]
  created_at: string
  updated_at?: string
  resolved_at?: string
}

export interface Pipeline {
  id: string
  name: string
  repository: string
  branch: string
  commit_sha: string
  triggered_by: string
  overall_status: string
  stages: PipelineStage[]
  created_at: string
}

export interface PipelineStage {
  name: string
  status: string
  duration_seconds?: number
  logs_url?: string
}

export interface KPIs {
  period_days: number
  deployment_frequency: { total: number; per_day: number; label: string }
  change_failure_rate: { value: number; label: string }
  mean_time_to_recovery: { value: number; label: string }
  avg_deployment_duration: { value: number; label: string }
  open_incidents: number
}

// ── API helpers ───────────────────────────────────────────────────────────────

export const deploymentsApi = {
  list: (params?: Record<string, string>) => api.get<Deployment[]>('/deployments/', { params }).then(r => r.data),
  get: (id: string) => api.get<Deployment>(`/deployments/${id}`).then(r => r.data),
  create: (data: Partial<Deployment>) => api.post<Deployment>('/deployments/', data).then(r => r.data),
  logs: (id: string) => api.get<DeploymentLog[]>(`/deployments/${id}/logs`).then(r => r.data),
  rollback: (id: string) => api.post<Deployment>(`/deployments/${id}/rollback`).then(r => r.data),
  cancel: (id: string) => api.delete(`/deployments/${id}`),
}

export const incidentsApi = {
  list: (params?: Record<string, string>) => api.get<Incident[]>('/incidents/', { params }).then(r => r.data),
  get: (id: string) => api.get<Incident>(`/incidents/${id}`).then(r => r.data),
  create: (data: Partial<Incident>) => api.post<Incident>('/incidents/', data).then(r => r.data),
  update: (id: string, data: Partial<Incident>) => api.patch<Incident>(`/incidents/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/incidents/${id}`),
}

export const pipelinesApi = {
  list: () => api.get<Pipeline[]>('/pipelines/').then(r => r.data),
  get: (id: string) => api.get<Pipeline>(`/pipelines/${id}`).then(r => r.data),
  create: (data: Partial<Pipeline>) => api.post<Pipeline>('/pipelines/', data).then(r => r.data),
}

export const metricsApi = {
  kpis: () => api.get<KPIs>('/metrics/kpis').then(r => r.data),
}
