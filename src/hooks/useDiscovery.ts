/**
 * Discovery hook — Top Dividend Tokens + Leaderboard.
 * Wraps src/lib/discovery.ts with loading/error state.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  discoverDividendTokens,
  type DiscoveredToken,
  type LeaderboardEntry,
} from '@/lib/discovery'

export interface DiscoveryState {
  tokens: DiscoveredToken[]
  leaderboard: LeaderboardEntry[]
  loading: boolean
  error: string | null
  updatedAt: number | null
}

export function useDiscovery() {
  const [state, setState] = useState<DiscoveryState>({
    tokens: [],
    leaderboard: [],
    loading: false,
    error: null,
    updatedAt: null,
  })

  const fetchDiscovery = useCallback(async (force = false) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    // Timeout guard: if the scan takes too long, show empty state
    const timeout = setTimeout(() => {
      setState(prev =>
        prev.loading
          ? {
              ...prev,
              loading: false,
              error: 'Scan timed out. Try refreshing in a moment.',
            }
          : prev,
      )
    }, 25000)

    try {
      const res = await discoverDividendTokens(force)
      clearTimeout(timeout)
      setState({
        tokens: res.tokens,
        leaderboard: res.leaderboard,
        loading: false,
        error: null,
        updatedAt: res.updatedAt,
      })
    } catch (err) {
      clearTimeout(timeout)
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Discovery failed.',
      }))
    }
  }, [])

  useEffect(() => {
    void fetchDiscovery(false)
  }, [fetchDiscovery])

  return { ...state, refetch: fetchDiscovery }
}
