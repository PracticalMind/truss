import { QueryClient, QueryCache } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ApiError } from '../services/api/client'

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'Something went wrong'
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      // 404s are "not ready yet" states (e.g. a project before its first upload)
      // that the UI already renders as empty; surfacing them as toasts is noise.
      if (error instanceof ApiError && error.status === 404) return
      toast.error(errorMessage(error))
    },
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
})
