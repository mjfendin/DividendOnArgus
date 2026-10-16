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
  { token: '0x5684273b2e7c6aab7f26a920f7f736efa520cc1b', name: 'GATEWAY', symbol: 'GATEWAY', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0xef4984246f2616416741a3d270e4c14b17cca8e8', name: 'EURC', symbol: 'EURC', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0x1a7201817c6de8c65a5c5f2c53dd0bfcdfc67566', name: 'Peach', symbol: 'PEACH', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0xc1439626ea082cff963b5d1988223a7f0a5982fa', name: 'Peach', symbol: 'PEACH', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0x6a4fb07389e9d37c6e90b1a3c5021a3f262a4dea', name: 'Peach', symbol: 'PEACH', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0x06c2b1fcbcebaf05ff2480b69ce04af595b105d8', name: 'Peach', symbol: 'PEACH', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0xf4b9ac516788ff955429040994cb5578d4791641', name: 'Peach', symbol: 'PEACH', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0x519202327a60a9d78691de9d9e60c8e950ec9f32', name: 'Peach', symbol: 'PEACH', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0x62446c985a12d1360d7e6f590ca5fc3e7f548891', name: 'Peach', symbol: 'PEACH', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0x1096514f516d9ee354899cee035a335f22fee6ab', name: 'RAMP', symbol: 'RAMP', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0x23958f53c399b9c71f527b755627b2fd1119c649', name: 'Trump $1 Coin', symbol: '1', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0x0206ea3486b4de54decfeaa2de5fa674cf676049', name: 'Trump $1 Coin', symbol: '1', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0x6d35330dac800e5258b49341944b2c567ba89e3d', name: 'Trump $1 Coin', symbol: '1', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0x7bbe59a7656b2f4160189daaa3ee8bf2e4cd86bd', name: 'Flying Tesla Roadster', symbol: 'FTR', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0xecd11966a993d694ae2c12c46c2a3538378d9758', name: 'DIETCOKE', symbol: 'DIETCOKE', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0x31071960cac3ec131b91606014041feb34959c32', name: 'Flying Tesla Roadster', symbol: 'FTR', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0x5651cc303f395d15039e15e183c7131415bb6274', name: 'Flying Tesla Roadster', symbol: 'FTR', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0x3fbf45088b828e3984c1b22950ac32bbf90e41bc', name: 'Lunar', symbol: 'LUNAR', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0x38ddc97c3cde8069f8e8ad2d93ec71824dcb57a7', name: 'Flying Tesla Roadster', symbol: 'FTR', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0xd881013820fc19008786bf77c5000807b4b1d84c', name: 'Arcade', symbol: 'ARCADE', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0x89e349f8f5bdd5e4e710e40e531a9f9ed2be54e7', name: 'OTC Index', symbol: 'OTCI', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0xafff46c8bf5a6951bd34de332a9d71f3df347ac3', name: 'DANTE', symbol: 'DANTE', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0x6cf910e85cb74be966102fe0341b71ae77d2357a', name: 'The Loom', symbol: 'LOOM', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0xa8921db9cbddca717d5fc07ddd93fa4d612b1375', name: 'The Loom', symbol: 'LOOM', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0x8ee747c462b11fbcd86a3f856f5a39113e8f5b34', name: 'The Loom', symbol: 'LOOM', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0x71e3013454b4d8c362d8b51d91cad9ad4f88f2da', name: 'The Loom', symbol: 'LOOM', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0x4c87881e7f6b21f3145f41b4190ff106d3a88910', name: 'The Loom', symbol: 'LOOM', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0xf240a0e38770bb35f319d9d3b106b4004e46ad46', name: 'The Loom', symbol: 'LOOM', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0x01a48ca823600c6134a6d40f45b3238822eedbe9', name: 'The Loom', symbol: 'LOOM', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0x90f49814993e0f7c713a5a42b9c17b289e394389', name: 'Flying Tesla Roadster', symbol: 'FTR', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0x20b89237f0b5b1e7d8fce9b5d8a7ae263d4c7b9f', name: 'Flying Tesla Roadster', symbol: 'FTR', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0xd96ac2f97f02845c0dd8e80aa6e3c6928583b205', name: 'UpSide Down Cat', symbol: 'USDC', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0x99c871e44e1fa50f32146a54088d4e04ca6cae3e', name: 'Trump $1 Coin', symbol: '1', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0x7d266d4a0959c2bccfe4e8c7b1dc744452777518', name: 'ArcTools', symbol: 'ARCT', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0xd1f00b7623d24c29495b7be54d3f8c76e6fb1d57', name: 'e-money token', symbol: 'EMT', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0x2dc40f75075318e373bf419377e0bfd4f980143f', name: 'Artificial Girlfriend Intelligence', symbol: 'AGI', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
  { token: '0xd5f693324f04d4beaf43d0d0853d8a0f67c95c55', name: 'Archiel Finance', symbol: 'ARCHIEL', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0 },
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
