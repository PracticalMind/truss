import { apiRequest } from './client'

interface UserInfo {
  id: string
  email: string
}

export const authApi = {
  sync: () => apiRequest<UserInfo>('/auth/sync', { method: 'POST' }),
}
