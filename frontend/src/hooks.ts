import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { objectivesApi, keyResultsApi } from './api'
import type {
  CreateObjectiveRequest,
  CreateKeyResultRequest,
  UpdateKeyResultRequest,
} from './types'

// Query keys
export const queryKeys = {
  objectives: ['objectives'] as const,
  objective: (id: string) => ['objective', id] as const,
}

// Objectives hooks
export function useObjectives() {
  return useQuery({
    queryKey: queryKeys.objectives,
    queryFn: objectivesApi.getAll,
  })
}

export function useObjective(id: string) {
  return useQuery({
    queryKey: queryKeys.objective(id),
    queryFn: () => objectivesApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateObjective() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateObjectiveRequest) =>
      objectivesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.objectives })
    },
  })
}

export function useDeleteObjective() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => objectivesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.objectives })
    },
  })
}

// Key Results hooks
export function useCreateKeyResult() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      objectiveId,
      payload,
    }: {
      objectiveId: string
      payload: CreateKeyResultRequest
    }) => keyResultsApi.create(objectiveId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.objectives })
    },
  })
}

export function useUpdateKeyResult() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateKeyResultRequest }) =>
      keyResultsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.objectives })
    },
  })
}

export function useDeleteKeyResult() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => keyResultsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.objectives })
    },
  })
}
