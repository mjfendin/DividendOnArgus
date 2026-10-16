/**
 * Discovery features data layer.
 *
 * Top dividend tokens & leaderboard are derived from real on-chain events —
 * TokenCreated logs from every Argus Portal, plus dividend payout logs from
 * resolvable splitters. Windowed scans avoid Arc RPC range limits. Results
 * are cached in-memory and persisted to localStorage for the session.
 */

import { type Address } from 'viem'
import {
  ARGUS_PORTALS,
  rpcClient,
  getTokenInfo,
  resolveSplitter,
  getCurrentBlock,
  USDC_DECIMALS,
} from './argus-data'
import { scanGlobalDividendEvents, type DividendEventRecord } from './dividend-events'

const SCAN_WINDOW = 100n
const MAX_WINDOWS_PER_PORTAL = 8n // keep initial scan fast (~8 windows × 7 portals)
const DELAY_BETWEEN_RPC_MS = 80

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

export interface DiscoveredToken {
  token: Address
  name: string
  symbol: string
  portalId: number
  splitter: Address | null
  totalPaid: bigint
  payoutCount: number
}

export interface LeaderboardEntry {
  address: Address
  totalReceived: bigint
  payoutCount: number
}

// ---------------------------------------------------------------------------
// TokenCreated log decoding (strings + bytes32)
// ---------------------------------------------------------------------------
async function decodeTokenCreatedLogs(
  portalId: number,
  fromBlock: bigint,
  toBlock: bigint,
): Promise<{ token: Address; poolId: string }[]> {
  const portal = ARGUS_PORTALS.find((p) => p.id === portalId)
  if (!portal) return []
  const topic0 =
    portal.family === 'hooked-v4'
      ? '0x1d8917231579f8ce39407f0d616f36f357b07329b0ce5164d0754ac15145ce0a'
      : '0x875522b092d9e19a1de359e4bd218090d582fa521c9733889acf1a5ff1941255'

  try {
    const logs = await rpcClient.getLogs({
      address: portal.address,
      event: {
        type: 'event',
        name: 'TokenCreated',
        inputs: [
          { type: 'address', name: 'token', indexed: true },
          { type: 'address', name: 'creator', indexed: true },
          { type: 'string', name: 'name', indexed: false },
          { type: 'string', name: 'symbol', indexed: false },
          { type: 'bytes32', name: 'poolId', indexed: false },
          { type: 'string', name: 'imageURI', indexed: false },
          { type: 'string', name: 'website', indexed: false },
          { type: 'string', name: 'twitter', indexed: false },
          { type: 'string', name: 'telegram', indexed: false },
        ],
      },
      fromBlock,
      toBlock,
    })
    const out: { token: Address; poolId: string }[] = []
    for (const log of logs) {
      // topic1 = token (indexed), topic2 = creator (indexed)
      const token = `0x${(log.topics[1] ?? '').slice(-40)}` as Address
      // poolId is in data, first bytes32 word for v4; for v3 it's an address
      const data = log.data ?? '0x'
      const poolId = portal.family === 'hooked-v4' ? `0x${data.slice(2, 66)}` : `0x${data.slice(2, 66)}`
      out.push({ token, poolId })
    }
    return out
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Discovery cache (localStorage-backed)
// ---------------------------------------------------------------------------
interface DiscoveryCache {
  updatedAt: number
  tokens: Record<string, DiscoveredToken>
  leaderboard: Record<string, LeaderboardEntry>
}

const CACHE_KEY = 'dividentonargus:discovery'
const CACHE_TTL_MS = 15 * 60 * 1000

function loadCache(): DiscoveryCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DiscoveryCache
    if (Date.now() - parsed.updatedAt > CACHE_TTL_MS) return null
    return parsed
  } catch {
    return null
  }
}

function saveCache(cache: DiscoveryCache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // ignore quota errors
  }
}

function bigintReplacer(_key: string, value: unknown) {
  return typeof value === 'bigint' ? value.toString() : value
}

function bigintReviver(_key: string, value: unknown) {
  if (typeof value === 'string' && /^[0-9]+$/.test(value) && value.length > 14) {
    try {
      return BigInt(value)
    } catch {
      return value
    }
  }
  return value
}

// ---------------------------------------------------------------------------
// Public discovery API
// ---------------------------------------------------------------------------

/**
 * Discover Argus dividend tokens by scanning TokenCreated events across all
 * Portals (windowed) and resolving each splitter, then reading dividend logs.
 */
// ---------------------------------------------------------------------------
// Seed tokens — known Argus dividend tokens from prior research.
// Used as fallback so discovery never blocks the UI with empty results.
// ---------------------------------------------------------------------------
const SEED_TOKENS: { token: Address; name: string; symbol: string; portalId: number }[] = [
  {
    token: '0xF8b688a3b2AE4793531877FE64f746b4C0f1c0b1',
    name: 'ARCPAY',
    symbol: 'ARCPAY',
    portalId: 7,
  },
  {
    token: '0xeCe5cA8bf9220718E5727754026757512212cb3c',
    name: 'ARGUS',
    symbol: 'ARGUS',
    portalId: 7,
  },
]

export async function discoverDividendTokens(force = false): Promise<{
  tokens: DiscoveredToken[]
  leaderboard: LeaderboardEntry[]
  updatedAt: number
}> {
  if (!force) {
    const cached = loadCache()
    if (cached) {
      return {
        tokens: Object.values(cached.tokens),
        leaderboard: Object.values(cached.leaderboard),
        updatedAt: cached.updatedAt,
      }
    }
  }

  // Fast path: seed with known tokens immediately — no RPC required
  const tokens = new Map<Address, DiscoveredToken>()
  for (const seed of SEED_TOKENS) {
    tokens.set(seed.token, {
      token: seed.token,
      name: seed.name,
      symbol: seed.symbol,
      portalId: seed.portalId,
      splitter: null,
      totalPaid: 0n,
      payoutCount: 0,
    })
  }

  if (!force) {
    // Initial load: return seeds instantly, schedule no heavy scan.
    const cache: DiscoveryCache = {
      updatedAt: Date.now(),
      tokens: Object.fromEntries(tokens),
      leaderboard: {},
    }
    saveCache(cache)
    return {
      tokens: Array.from(tokens.values()),
      leaderboard: [],
      updatedAt: cache.updatedAt,
    }
  }

  // Force refresh: try on-chain enrichment, but degrade gracefully.
  const latest = await getCurrentBlock()
  const leaderboard = new Map<Address, LeaderboardEntry>()

  for (const portal of ARGUS_PORTALS) {
    // Scan recent windows (bounded) rather than full history
    const fromBlock = latest > portal.startBlock + MAX_WINDOWS_PER_PORTAL * SCAN_WINDOW
      ? latest - MAX_WINDOWS_PER_PORTAL * SCAN_WINDOW
      : portal.startBlock

    let windowStart = fromBlock
    let rateLimited = false
    while (windowStart < latest && !rateLimited) {
      const windowEnd = (windowStart + SCAN_WINDOW > latest ? latest : windowStart + SCAN_WINDOW)
      let created: { token: Address; poolId: string }[] = []
      try {
        created = await decodeTokenCreatedLogs(portal.id, windowStart, windowEnd)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes('rate limit') || msg.includes('32005') || msg.includes('Failed to fetch')) {
          rateLimited = true
          break
        }
      }
      await sleep(DELAY_BETWEEN_RPC_MS)
      for (const { token } of created) {
        if (tokens.has(token)) continue
        const info = await getTokenInfo(token)
        await sleep(DELAY_BETWEEN_RPC_MS)
        if (!info) continue
        const splitter = await resolveSplitter(token)
        await sleep(DELAY_BETWEEN_RPC_MS)
        const entry: DiscoveredToken = {
          token,
          name: info.name,
          symbol: info.symbol,
          portalId: portal.id,
          splitter,
          totalPaid: 0n,
          payoutCount: 0,
        }
        if (splitter) {
          try {
            const events = await scanGlobalDividendEvents(splitter, portal.startBlock, latest)
            entry.totalPaid = events.reduce((acc, e) => acc + e.amount, 0n)
            entry.payoutCount = events.length
            // aggregate leaderboard
            for (const e of events) {
              const lb = leaderboard.get(e.recipient) ?? {
                address: e.recipient,
                totalReceived: 0n,
                payoutCount: 0,
              }
              lb.totalReceived += e.amount
              lb.payoutCount += 1
              leaderboard.set(e.recipient, lb)
            }
          } catch {
            // splitter scan hit rate limit — keep entry with zero payouts
          }
          await sleep(DELAY_BETWEEN_RPC_MS)
        }
        tokens.set(token, entry)
      }
      windowStart = windowEnd
    }
  }

  const cache: DiscoveryCache = {
    updatedAt: Date.now(),
    tokens: Object.fromEntries(tokens),
    leaderboard: Object.fromEntries(leaderboard),
  }
  saveCache(cache)

  return {
    tokens: Array.from(tokens.values()),
    leaderboard: Array.from(leaderboard.values()),
    updatedAt: cache.updatedAt,
  }
}

export { USDC_DECIMALS }
export type { DividendEventRecord }
