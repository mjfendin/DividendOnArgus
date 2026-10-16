/**
 * On-chain Argus scan — shared by the inline discovery endpoint and cron.
 * Runs server-side (Vercel Edge) where Arc RPC is reachable without browser
 * CORS/rate-limit issues.
 */

import { type Address } from 'viem'

// Portal registry (copied from src/lib/argus-data.ts — self-contained for Edge)
interface ArgusPortal {
  id: number
  address: Address
  family: 'hooked-v4' | 'legacy-v3'
  startBlock: bigint
}

const ARGUS_PORTALS: ArgusPortal[] = [
  { id: 7, address: '0xB021Be536808f551b31789422Fd28a6c9c6e97Da', family: 'hooked-v4', startBlock: 20_395_275n },
  { id: 6, address: '0xA5628A11c412596E1f63b75a2C0284F843C549d6', family: 'hooked-v4', startBlock: 20_240_260n },
  { id: 5, address: '0x07a688a001f416cC433c68Ff56Aa26bC5131Cc6E', family: 'hooked-v4', startBlock: 20_081_606n },
  { id: 4, address: '0xa36c443A797771Df82533B8B4A86F0AFfd970862', family: 'hooked-v4', startBlock: 19_690_658n },
  { id: 3, address: '0x7A17Ab0106C46C0be30623F3EB7F299CC0058338', family: 'hooked-v4', startBlock: 19_674_154n },
  { id: 2, address: '0xBed9880A0ba12722ba4b8791c0B6F8c74338246C', family: 'legacy-v3', startBlock: 19_056_397n },
  { id: 1, address: '0x0F1C7Cb26D6cD36BD4189E41947658b39437587A', family: 'legacy-v3', startBlock: 18_817_867n },
]

const RPC_URL = 'https://rpc.mainnet.arc.io/'
const SCAN_WINDOW = 100n

export interface DiscoveredToken {
  token: string
  name: string
  symbol: string
  portalId: number
  splitter: string | null
  totalPaid: string
  payoutCount: number
}

export interface LeaderboardEntry {
  address: string
  totalReceived: string
  payoutCount: number
}

export interface ScanResult {
  tokens: DiscoveredToken[]
  leaderboard: LeaderboardEntry[]
}

// Known Argus dividend tokens (from prior on-chain verification).
// Served as fallback when Arc RPC rate-limits the full history scan.
// Each entry was verified on-chain: name/symbol resolved via eth_call.
const KNOWN_TOKENS: DiscoveredToken[] = [
  {
    token: '0xF8b688a3b2AE4793531877FE64f746b4C0f1c0b1',
    name: 'ARCPAY',
    symbol: 'ARCPAY',
    portalId: 7,
    splitter: null,
    totalPaid: '0',
    payoutCount: 0,
  },
  {
    token: '0xeCe5cA8bf9220718E5727754026757512212cb3c',
    name: 'ARGUS',
    symbol: 'ARGUS',
    portalId: 7,
    splitter: null,
    totalPaid: '0',
    payoutCount: 0,
  },
]

async function rpc(method: string, params: unknown[]): Promise<unknown> {
  const res = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })
  if (!res.ok) throw new Error(`RPC ${method} HTTP ${res.status}`)
  const data = (await res.json()) as { result?: unknown; error?: { message?: string } }
  if (data.error) throw new Error(data.error.message ?? `RPC ${method} error`)
  return data.result
}

async function getBlockNumber(): Promise<bigint> {
  const raw = await rpc('eth_blockNumber', [])
  return BigInt(raw as string)
}

async function getTokenCreatedLogs(
  portalAddress: string,
  topic0: string,
  fromBlock: bigint,
  toBlock: bigint,
): Promise<{ token: string; poolId: string }[]> {
  try {
    const logs = (await rpc('eth_getLogs', [
      {
        address: portalAddress,
        topics: [topic0],
        fromBlock: `0x${fromBlock.toString(16)}`,
        toBlock: `0x${toBlock.toString(16)}`,
      },
    ])) as Array<{ topics: string[]; data: string }>
    return logs.map(log => ({
      token: `0x${(log.topics[1] ?? '').slice(-40)}`,
      poolId: `0x${(log.data ?? '0x').slice(2, 66)}`,
    }))
  } catch {
    return []
  }
}

async function getTokenInfo(token: string): Promise<{ name: string; symbol: string } | null> {
  try {
    const nameData = (await rpc('eth_call', [
      { to: token, data: '0x06fdde03' },
      'latest',
    ])) as string
    const symbolData = (await rpc('eth_call', [
      { to: token, data: '0x95d89b41' },
      'latest',
    ])) as string
    return {
      name: decodeString(nameData),
      symbol: decodeString(symbolData),
    }
  } catch {
    return null
  }
}

function decodeString(data: string): string {
  try {
    const hex = data.slice(2)
    if (hex.length < 128) return 'Unknown'
    const len = parseInt(hex.slice(64, 128), 16)
    const strHex = hex.slice(128, 128 + len * 2)
    let out = ''
    for (let i = 0; i < strHex.length; i += 2) {
      out += String.fromCharCode(parseInt(strHex.slice(i, i + 2), 16))
    }
    return out || 'Unknown'
  } catch {
    return 'Unknown'
  }
}

/**
 * Scan Argus Portal TokenCreated events.
 * @param maxWindowsPerPortal depth of scan per portal. Pass 0n for FULL history.
 */
export async function scanArgusPortals(
  maxWindowsPerPortal: bigint = 8n,
): Promise<ScanResult> {
  const latest = await getBlockNumber()
  const tokens = new Map<string, DiscoveredToken>()

  for (const portal of ARGUS_PORTALS) {
    const topic0 =
      portal.family === 'hooked-v4'
        ? '0x1d8917231579f8ce39407f0d616f36f357b07329b0ce5164d0754ac15145ce0a'
        : '0x875522b092d9e19a1de359e4bd218090d582fa521c9733889acf1a5ff1941255'

    const fromBlock =
      maxWindowsPerPortal === 0n
        ? portal.startBlock
        : latest > portal.startBlock + maxWindowsPerPortal * SCAN_WINDOW
          ? latest - maxWindowsPerPortal * SCAN_WINDOW
          : portal.startBlock

    let windowStart = fromBlock
    while (windowStart < latest) {
      const windowEnd = (windowStart + SCAN_WINDOW > latest ? latest : windowStart + SCAN_WINDOW)
      const created = await getTokenCreatedLogs(portal.address, topic0, windowStart, windowEnd)
      for (const { token } of created) {
        if (tokens.has(token)) continue
        const info = await getTokenInfo(token)
        if (!info) continue
        tokens.set(token, {
          token,
          name: info.name,
          symbol: info.symbol,
          portalId: portal.id,
          splitter: null,
          totalPaid: '0',
          payoutCount: 0,
        })
      }
      windowStart = windowEnd
    }
  }

  return {
    tokens: tokens.size > 0 ? Array.from(tokens.values()) : KNOWN_TOKENS,
    leaderboard: [],
  }
}
