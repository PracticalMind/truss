import { apiRequest } from './client'
import type { TrainMetrics } from '../../types'

interface TrainConfig {
  model_type: string
  target_column: string
  test_size: number
  hyperparameters?: Record<string, unknown>
}

interface TrainResponse {
  success: boolean
  model_type: string
  target_column: string
  task_type: string
  metrics: TrainMetrics
}

interface ModelResult {
  model: string
  metrics: TrainMetrics
  task_type: string
}

export interface EvaluateResponse {
  accuracy: number
  precision: number
  recall: number
  f1_score: number
  problem_type: string | null
  best_model: string | null
  target_column: string | null
  trained_models: string[]
  results: ModelResult[]
  confusion_matrix: number[][] | null
  class_names: string[] | null
  feature_importance: Record<string, number> | null
}

interface OptimizeResponse {
  success: boolean
  best_params: Record<string, unknown>
  best_score: number | null
}

export const modelApi = {
  train: (projectId: string, config: TrainConfig) =>
    apiRequest<TrainResponse>(`/model/train/${projectId}`, {
      method: 'POST',
      body: JSON.stringify(config),
    }),

  evaluate: (projectId: string) =>
    apiRequest<EvaluateResponse>(`/model/evaluate/${projectId}`),

  optimize: (projectId: string, params: Record<string, unknown>) =>
    apiRequest<OptimizeResponse>(`/model/optimize/${projectId}`, {
      method: 'POST',
      body: JSON.stringify({ params }),
    }),
}
