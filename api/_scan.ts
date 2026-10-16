/**
 * Argus discovery data.
 *
 * HONESTY FIRST: Arc RPC rate-limits getLogs aggressively (even 5k-block
 * ranges intermittently return -32012 / -32005 / time out from Vercel
 * serverless). A real-time indexer needs a dedicated Arc RPC plan; it cannot
 * run reliably inside a Hobby Vercel function.
 *
 * So this module serves VERIFIED static data (each entry was checked
 * on-chain via eth_call / eth_getStorageAt / eth_getCode) with an explicit
 * `notDeployed` flag, instead of pretending to stream live data that is not
 * available.
 */

export interface DiscoveredToken {
  token: string
  name: string
  symbol: string
  portalId: number
  splitter: string | null
  totalPaid: string
  payoutCount: number
  /** true when the token contract has no code yet (predicted/recorded only) */
  notDeployed?: boolean
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

const VERIFIED_TOKENS: DiscoveredToken[] = [
  {
    token: '0xF8b688a3b2AE4793531877FE64f746b4C0f1c0b1',
    name: 'ARCPAY',
    symbol: 'ARCPAY',
    portalId: 7,
    splitter: '0x8ff827a1a0084cf7abe0a05234e0ae72eeae636f',
    totalPaid: '0',
    payoutCount: 0,
    notDeployed: true,
  },
  {
    token: '0xeCe5cA8bf9220718E5727754026757512212cb3c',
    name: 'ARGUS',
    symbol: 'ARGUS',
    portalId: 7,
    splitter: null,
    totalPaid: '0',
    payoutCount: 0,
    notDeployed: true,
  },
]

/**
 * Return the verified token set. The on-chain scan is intentionally skipped
 * here; see module comment for why.
 */
export async function scanArgusPortals(
  _maxWindowsPerPortal: bigint = 8n,
): Promise<ScanResult> {
  return {
    tokens: VERIFIED_TOKENS,
    leaderboard: [],
  }
}
