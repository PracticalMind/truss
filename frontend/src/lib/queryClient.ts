import { QueryClient, QueryCache } from '@tanstack/react-query'
import toast from 'react-hot-toast'

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'Something went wrong'
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => toast.error(errorMessage(error)),
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
})
