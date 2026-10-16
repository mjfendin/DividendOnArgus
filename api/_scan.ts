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
  { token: '0x1096514f516d9ee354899cee035a335f22fee6ab', name: 'RAMP', symbol: 'RAMP', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0x23958f53c399b9c71f527b755627b2fd1119c649', name: 'Trump $1 Coin', symbol: '1', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0x7bbe59a7656b2f4160189daaa3ee8bf2e4cd86bd', name: 'Flying Tesla Roadster', symbol: 'FTR', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0xecd11966a993d694ae2c12c46c2a3538378d9758', name: 'DIETCOKE', symbol: 'DIETCOKE', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0x3fbf45088b828e3984c1b22950ac32bbf90e41bc', name: 'Lunar', symbol: 'LUNAR', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0xd881013820fc19008786bf77c5000807b4b1d84c', name: 'Arcade', symbol: 'ARCADE', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0x89e349f8f5bdd5e4e710e40e531a9f9ed2be54e7', name: 'OTC Index', symbol: 'OTCI', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0xafff46c8bf5a6951bd34de332a9d71f3df347ac3', name: 'DANTE', symbol: 'DANTE', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0x6cf910e85cb74be966102fe0341b71ae77d2357a', name: 'The Loom', symbol: 'LOOM', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0x90f49814993e0f7c713a5a42b9c17b289e394389', name: 'Flying Tesla Roadster', symbol: 'FTR', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0x20b89237f0b5b1e7d8fce9b5d8a7ae263d4c7b9f', name: 'Flying Tesla Roadster', symbol: 'FTR', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0xd96ac2f97f02845c0dd8e80aa6e3c6928583b205', name: 'UpSide Down Cat', symbol: 'USDC', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0x99c871e44e1fa50f32146a54088d4e04ca6cae3e', name: 'Trump $1 Coin', symbol: '1', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
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
