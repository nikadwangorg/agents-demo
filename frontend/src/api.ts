import axios from 'axios'
import type {
  Objective,
  CreateObjectiveRequest,
  CreateKeyResultRequest,
  UpdateKeyResultRequest,
  KeyResult,
} from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Objectives API
export const objectivesApi = {
  getAll: async (): Promise<Objective[]> => {
    const { data } = await api.get<Objective[]>('/objectives')
    return data
  },

  getById: async (id: string): Promise<Objective> => {
    const { data } = await api.get<Objective>(`/objectives/${id}`)
    return data
  },

  create: async (payload: CreateObjectiveRequest): Promise<Objective> => {
    const { data } = await api.post<Objective>('/objectives', payload)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/objectives/${id}`)
  },
}

// Key Results API
export const keyResultsApi = {
  create: async (
    objectiveId: string,
    payload: CreateKeyResultRequest
  ): Promise<KeyResult> => {
    const { data } = await api.post<KeyResult>(
      `/objectives/${objectiveId}/key-results`,
      payload
    )
    return data
  },

  update: async (
    id: string,
    payload: UpdateKeyResultRequest
  ): Promise<KeyResult> => {
    const { data } = await api.patch<KeyResult>(`/key-results/${id}`, payload)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/key-results/${id}`)
  },
}

export default api
