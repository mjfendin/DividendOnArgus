/**
 * Discovery hook — Top Dividend Tokens + Leaderboard.
 * Reads the serverless indexer cache via /api/discovery.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
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
  source: string | null
}

const EMPTY_STATE: DiscoveryState = {
  tokens: [],
  leaderboard: [],
  loading: false,
  error: null,
  updatedAt: null,
  source: null,
}

export function useDiscovery() {
  const [state, setState] = useState<DiscoveryState>(EMPTY_STATE)
  const inFlight = useRef(false)

  const fetchDiscovery = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const res = await discoverDividendTokens()
      setState({
        tokens: res.tokens,
        leaderboard: res.leaderboard,
        loading: false,
        error: null,
        updatedAt: res.updatedAt,
        source: res.source,
      })
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Discovery failed.',
      }))
    } finally {
      inFlight.current = false
    }
  }, [])

  useEffect(() => {
    void fetchDiscovery()
  }, [fetchDiscovery])

  return { ...state, refetch: fetchDiscovery }
}
