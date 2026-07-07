import { apiRequest } from './client'
import type { Project, ProjectStats } from '../../types'

interface ProjectCreate {
  name: string
}

interface ProjectUpdate {
  name?: string
  status?: string
  current_step?: string
  view_mode?: string
}

export const projectsApi = {
  list: () => apiRequest<Project[]>('/projects'),

  stats: () => apiRequest<ProjectStats>('/projects/stats'),

  create: (data: ProjectCreate) =>
    apiRequest<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  get: (id: string) => apiRequest<Project>(`/projects/${id}`),

  update: (id: string, patch: ProjectUpdate) =>
    apiRequest<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    }),

  delete: (id: string) =>
    apiRequest<void>(`/projects/${id}`, { method: 'DELETE' }),
}
