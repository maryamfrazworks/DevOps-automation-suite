import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { deploymentsApi, incidentsApi, pipelinesApi, metricsApi } from '../utils/api'

// ── Deployments ───────────────────────────────────────────────────────────────

export function useDeployments(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['deployments', params],
    queryFn: () => deploymentsApi.list(params),
    refetchInterval: 5000,
  })
}

export function useDeployment(id: string) {
  return useQuery({
    queryKey: ['deployment', id],
    queryFn: () => deploymentsApi.get(id),
    refetchInterval: 3000,
  })
}

export function useDeploymentLogs(id: string) {
  return useQuery({
    queryKey: ['deployment-logs', id],
    queryFn: () => deploymentsApi.logs(id),
    refetchInterval: 2000,
  })
}

export function useCreateDeployment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deploymentsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deployments'] }),
  })
}

export function useRollback() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deploymentsApi.rollback,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deployments'] }),
  })
}

// ── Incidents ─────────────────────────────────────────────────────────────────

export function useIncidents(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['incidents', params],
    queryFn: () => incidentsApi.list(params),
    refetchInterval: 10000,
  })
}

export function useCreateIncident() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: incidentsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['incidents'] }),
  })
}

export function useUpdateIncident() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      incidentsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['incidents'] }),
  })
}

// ── Pipelines ─────────────────────────────────────────────────────────────────

export function usePipelines() {
  return useQuery({
    queryKey: ['pipelines'],
    queryFn: pipelinesApi.list,
    refetchInterval: 8000,
  })
}

// ── Metrics ───────────────────────────────────────────────────────────────────

export function useKPIs() {
  return useQuery({
    queryKey: ['kpis'],
    queryFn: metricsApi.kpis,
    refetchInterval: 60000,
  })
}
