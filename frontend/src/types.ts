export interface KeyResult {
  id: string
  objectiveId: string
  title: string
  targetValue: number
  currentValue: number
  unit: string
  createdAt: string
  progress?: number
}

export interface Objective {
  id: string
  title: string
  description?: string
  createdAt: string
  keyResults: KeyResult[]
  progress?: number
}

export interface CreateObjectiveRequest {
  title: string
  description?: string
}

export interface CreateKeyResultRequest {
  title: string
  targetValue: number
  unit: string
}

export interface UpdateKeyResultRequest {
  currentValue: number
}
