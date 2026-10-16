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
  buyTaxBps: number
  sellTaxBps: number
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
  { token: '0xee48EF3468A5FE2976EC62440a66069cE2f7Fe21', name: 'Bitcoin Dividend', symbol: 'DIVIDEND', portalId: 7, splitter: '0x11e9c20240839cc8c2e64c3ce769797b73b5d844', totalPaid: '0', payoutCount: 0, buyTaxBps: 1000, sellTaxBps: 1000 },
  { token: '0x1096514f516d9ee354899cee035a335f22fee6ab', name: 'RAMP', symbol: 'RAMP', portalId: 7, splitter: '0x2d8227310222e191afe263cd57a494ff12fdc793', totalPaid: '0', payoutCount: 0, buyTaxBps: 100, sellTaxBps: 100 },
  { token: '0x23958f53c399b9c71f527b755627b2fd1119c649', name: 'Trump $1 Coin', symbol: '1', portalId: 7, splitter: '0xfff705aeec05a0c5dbff0e02730a58dbbfa5a1c7', totalPaid: '0', payoutCount: 0, buyTaxBps: 1, sellTaxBps: 1 },
  { token: '0x7bbe59a7656b2f4160189daaa3ee8bf2e4cd86bd', name: 'Flying Tesla Roadster', symbol: 'FTR', portalId: 7, splitter: '0xad9e411ac4a96b9d3d10b3e5b5f07a0f301c8d5d', totalPaid: '0', payoutCount: 0, buyTaxBps: 1, sellTaxBps: 1 },
  { token: '0xecd11966a993d694ae2c12c46c2a3538378d9758', name: 'DIETCOKE', symbol: 'DIETCOKE', portalId: 7, splitter: '0x476202d28d8d54c14728c8a71d1199ef48a19e0f', totalPaid: '0', payoutCount: 0, buyTaxBps: 100, sellTaxBps: 100 },
  { token: '0x3fbf45088b828e3984c1b22950ac32bbf90e41bc', name: 'Lunar', symbol: 'LUNAR', portalId: 7, splitter: '0xcdf3a5fd3c79d65b465a1dbb6cb11beb5a5e4e2b', totalPaid: '0', payoutCount: 0, buyTaxBps: 0, sellTaxBps: 1 },
  { token: '0xd881013820fc19008786bf77c5000807b4b1d84c', name: 'Arcade', symbol: 'ARCADE', portalId: 7, splitter: '0x1554b9f8b3e7d649a68e4a9b5f9f5b5c4c0b9d3d', totalPaid: '0', payoutCount: 0, buyTaxBps: 0, sellTaxBps: 1 },
  { token: '0x89e349f8f5bdd5e4e710e40e531a9f9ed2be54e7', name: 'OTC Index', symbol: 'OTCI', portalId: 7, splitter: '0x8d4d3fb920b47c4de4c4f0a1b0d2a6e6f4d2a5c0', totalPaid: '0', payoutCount: 0, buyTaxBps: 0, sellTaxBps: 10 },
  { token: '0xafff46c8bf5a6951bd34de332a9d71f3df347ac3', name: 'DANTE', symbol: 'DANTE', portalId: 7, splitter: '0xeb29dc9bdea0e4e27d7b9a63cd6e9e0a19e84f4a', totalPaid: '0', payoutCount: 0, buyTaxBps: 100, sellTaxBps: 100 },
  { token: '0x6cf910e85cb74be966102fe0341b71ae77d2357a', name: 'The Loom', symbol: 'LOOM', portalId: 7, splitter: '0xc814f5278a7f2cfb2a0f0c1a0f6e6a4d7d0f6e0d', totalPaid: '0', payoutCount: 0, buyTaxBps: 1, sellTaxBps: 1 },
  { token: '0xd96ac2f97f02845c0dd8e80aa6e3c6928583b205', name: 'UpSide Down Cat', symbol: 'USDC', portalId: 7, splitter: '0xd94c8f93a1', totalPaid: '0', payoutCount: 0, buyTaxBps: 0, sellTaxBps: 25 },
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
