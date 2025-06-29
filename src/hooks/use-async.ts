import { useState, useEffect, useCallback } from 'react'

interface UseAsyncState<T> {
  data: T | null
  error: Error | null
  loading: boolean
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = true
): UseAsyncState<T> & { execute: () => Promise<void> } {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    error: null,
    loading: false,
  })

  const execute = useCallback(async () => {
    setState({ data: null, error: null, loading: true })
    
    try {
      const data = await asyncFunction()
      setState({ data, error: null, loading: false })
    } catch (error) {
      setState({ data: null, error: error as Error, loading: false })
    }
  }, [asyncFunction])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [execute, immediate])

  return { ...state, execute }
}