/**
 * Discovery features data layer (client).
 *
 * Reads the server-side indexer cache from /api/discovery. The heavy on-chain
 * scan runs in a Vercel serverless function (api/cron-refresh.ts), so the
 * browser never performs large getLogs scans and never hits Arc RPC rate
 * limits directly.
 */

import { type Address } from 'viem'

export interface DiscoveredToken {
  token: Address
  name: string
  symbol: string
  portalId: number
  splitter: Address | null
  totalPaid: bigint
  payoutCount: number
  buyTaxBps?: number
  sellTaxBps?: number
  notDeployed?: boolean
}

export interface LeaderboardEntry {
  address: Address
  totalReceived: bigint
  payoutCount: number
}

interface DiscoveryResponse {
  tokens: Array<Omit<DiscoveredToken, 'totalPaid'> & { totalPaid: string }>
  leaderboard: Array<Omit<LeaderboardEntry, 'totalReceived'> & { totalReceived: string }>
  updatedAt: number | null
  source?: string
}

const API_URL = '/api/discovery'

function toBigInt(value: string): bigint {
  try {
    return BigInt(value)
  } catch {
    return 0n
  }
}

/**
 * Fetch cached discovery data from the serverless indexer.
 */
export async function discoverDividendTokens(): Promise<{
  tokens: DiscoveredToken[]
  leaderboard: LeaderboardEntry[]
  updatedAt: number | null
  source: string
}> {
  const res = await fetch(API_URL, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`Discovery API HTTP ${res.status}`)
  }
  const data = (await res.json()) as DiscoveryResponse

  return {
    tokens: (data.tokens ?? []).map(t => ({
      token: t.token as Address,
      name: t.name,
      symbol: t.symbol,
      portalId: t.portalId,
      splitter: (t.splitter as Address | null) ?? null,
      totalPaid: toBigInt(t.totalPaid),
      payoutCount: t.payoutCount,
      buyTaxBps: t.buyTaxBps,
      sellTaxBps: t.sellTaxBps,
      notDeployed: t.notDeployed,
    })),
    leaderboard: (data.leaderboard ?? []).map(l => ({
      address: l.address as Address,
      totalReceived: toBigInt(l.totalReceived),
      payoutCount: l.payoutCount,
    })),
    updatedAt: data.updatedAt,
    source: data.source ?? 'unknown',
  }
}

export { USDC_DECIMALS } from '@/lib/argus-data'
