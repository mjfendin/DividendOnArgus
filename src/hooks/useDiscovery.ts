/**
 * Discovery hook — Top Dividend Tokens + Leaderboard.
 * Wraps src/lib/discovery.ts with loading/error state.
 *
 * The initial load returns instantly with an empty-but-honest state, then
 * enriches in the background. This keeps the dashboard responsive even when
 * Arc RPC getLogs is slow.
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
}

const EMPTY_STATE: DiscoveryState = {
  tokens: [],
  leaderboard: [],
  loading: false,
  error: null,
  updatedAt: null,
}

export function useDiscovery() {
  const [state, setState] = useState<DiscoveryState>(EMPTY_STATE)
  const scanRef = useRef<Promise<void> | null>(null)

  const runScan = useCallback(async (force: boolean) => {
    // Don't stack concurrent scans
    if (scanRef.current) return scanRef.current

    setState(prev => ({ ...prev, loading: true, error: null }))

    const task = (async () => {
      try {
        const res = await discoverDividendTokens(force)
        setState({
          tokens: res.tokens,
          leaderboard: res.leaderboard,
          loading: false,
          error: null,
          updatedAt: res.updatedAt,
        })
      } catch (err) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Discovery failed.',
        }))
      } finally {
        scanRef.current = null
      }
    })()

    scanRef.current = task
    return task
  }, [])

  const fetchDiscovery = useCallback(
    (force = false) => runScan(force),
    [runScan],
  )

  useEffect(() => {
    void fetchDiscovery(false)
  }, [fetchDiscovery])

  return { ...state, refetch: fetchDiscovery }
}
