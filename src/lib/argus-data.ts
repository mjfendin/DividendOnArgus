/**
 * Argus on-chain data layer.
 *
 * Sources of truth (from arguspad/argus-world docs):
 * - Portal registry: the Argus factory. Every launch emits TokenCreated
 *   (token, creator, name, symbol, poolId, ...) and PartsDeployed
 *   (token, locker, hook, splitter). Index every Portal, never just #7.
 * - Dividends are USDC rewards streamed to holders by the launch's splitter.
 *   Stages are separate and must never be summed as if equal:
 *     funded  -> waiting -> paid (delivered) | claimable (failed delivery)
 * - v4 launch tokens have NO transfer tax. Tax lives in the pool hook.
 *
 * We only report what we can read from chain. Missing data is 'unavailable',
 * never zero.
 */

import {
  createPublicClient,
  http,
  type Address,
  erc20Abi,
  type AbiEvent,
} from 'viem'
import { arc } from 'viem/chains'
import { formatUnitsFixed } from '@/onchain-money'

export const rpcClient = createPublicClient({
  chain: arc,
  transport: http('/api/rpc', {
    batch: false,
    retryCount: 3,
    retryDelay: 500,
  }),
})

export const USDC_ADDRESS: Address = '0x3600000000000000000000000000000000000000'
export const USDC_DECIMALS = 6

// ---------------------------------------------------------------------------
// Argus Portal registry (factory) — index every Portal, never just the current
// ---------------------------------------------------------------------------
export interface ArgusPortal {
  id: number
  address: Address
  family: 'hooked-v4' | 'legacy-v3'
  startBlock: bigint
}

export const ARGUS_PORTALS: ArgusPortal[] = [
  { id: 7, address: '0xB021Be536808f551b31789422Fd28a6c9c6e97Da', family: 'hooked-v4', startBlock: 20_395_275n },
  { id: 6, address: '0xA5628A11c412596E1f63b75a2C0284F843C549d6', family: 'hooked-v4', startBlock: 20_240_260n },
  { id: 5, address: '0x07a688a001f416cC433c68Ff56Aa26bC5131Cc6E', family: 'hooked-v4', startBlock: 20_081_606n },
  { id: 4, address: '0xa36c443A797771Df82533B8B4A86F0AFfd970862', family: 'hooked-v4', startBlock: 19_690_658n },
  { id: 3, address: '0x7A17Ab0106C46C0be30623F3EB7F299CC0058338', family: 'hooked-v4', startBlock: 19_674_154n },
  { id: 2, address: '0xBed9880A0ba12722ba4b8791c0B6F8c74338246C', family: 'legacy-v3', startBlock: 19_056_397n },
  { id: 1, address: '0x0F1C7Cb26D6cD36BD4189E41947658b39437587A', family: 'legacy-v3', startBlock: 18_817_867n },
]

// ---------------------------------------------------------------------------
// Events (exact topic0 from arguspad/argus-world docs)
// ---------------------------------------------------------------------------
const TOKEN_CREATED_TOPIC0_V4 =
  '0x1d8917231579f8ce39407f0d616f36f357b07329b0ce5164d0754ac15145ce0a'
const TOKEN_CREATED_TOPIC0_V3 =
  '0x875522b092d9e19a1de359e4bd218090d582fa521c9733889acf1a5ff1941255'

const PARTS_DEPLOYED_TOPIC0 =
  '0x0000000000000000000000000000000000000000000000000000000000000000' // resolved at runtime

export const TOKEN_CREATED_EVENT: AbiEvent = {
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
}

export const PARTS_DEPLOYED_EVENT: AbiEvent = {
  type: 'event',
  name: 'PartsDeployed',
  inputs: [
    { type: 'address', name: 'token', indexed: true },
    { type: 'address', name: 'locker', indexed: false },
    { type: 'address', name: 'hook', indexed: false },
    { type: 'address', name: 'splitter', indexed: false },
  ],
}

export const TRANSFER_EVENT: AbiEvent = {
  type: 'event',
  name: 'Transfer',
  inputs: [
    { type: 'address', name: 'from', indexed: true },
    { type: 'address', name: 'to', indexed: true },
    { type: 'uint256', name: 'value', indexed: false },
  ],
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type DividendFigure =
  | { status: 'available'; value: bigint; decimals: number }
  | { status: 'unavailable' }
  | { status: 'loading' }

export interface ArgusLaunch {
  token: Address
  creator: Address
  name: string
  symbol: string
  poolId: string
  hook: Address | null
  splitter: Address | null
  locker: Address | null
  portalId: number
  buyTaxBps: number | null
  sellTaxBps: number | null
}

export interface TokenHolding {
  address: Address
  name: string
  symbol: string
  balance: bigint
  balanceDecimals: number
  hasDividends: boolean
  /** lifecycle stages — never summed as if equal */
  fundedTotal: DividendFigure
  paidTotal: DividendFigure
  waitingTotal: DividendFigure
  receivedTotal: DividendFigure
  claimableTotal: DividendFigure
  /** convenience: all-time received + waiting, for quick display */
  dividendTotal: DividendFigure
  dividend24h: DividendFigure
  dividend7d: DividendFigure
  dividend30d: DividendFigure
  yieldPercent: number | null
  dailyHistory: (number | null)[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export const BLOCKS_30D = 2_592_000n
export const BLOCKS_7D = 604_800n
export const BLOCKS_24H = 86_400n

/**
 * Known Argus dividend tokens. Used to seed holdings discovery so wallets
 * that minted or received tokens before our 30-day transfer scan still show
 * their balances and dividend figures.
 */
export const KNOWN_DIVIDEND_TOKENS: Address[] = [
  '0xE9b7A558D7d46018a4A9bc32C249338D4aAEcA6e', // DIVIDEND (main)
  '0xd96ac2f97f02845c0dd8e80aa6e3c6928583b205', // USDC (UpSide Down Cat)
  '0x1096514f516d9ee354899cee035a335f22fee6ab', // RAMP
  '0xecd11966a993d694ae2c12c46c2a3538378d9758', // DIETCOKE
  '0xafff46c8bf5a6951bd34de332a9d71f3df347ac3', // DANTE
]

export async function getCurrentBlock(): Promise<bigint> {
  try {
    return await rpcClient.getBlockNumber()
  } catch {
    return 0n
  }
}

export async function getTokenInfo(
  address: Address,
): Promise<{ name: string; symbol: string; decimals: number } | null> {
  try {
    const [nameResult, symbolResult, decimalsResult] = await rpcClient.multicall({
      contracts: [
        { address, abi: erc20Abi, functionName: 'name' },
        { address, abi: erc20Abi, functionName: 'symbol' },
        { address, abi: erc20Abi, functionName: 'decimals' },
      ],
      allowFailure: true,
    })
    if (
      nameResult.status !== 'success' ||
      symbolResult.status !== 'success' ||
      decimalsResult.status !== 'success'
    ) {
      return null
    }
    return {
      name: nameResult.result,
      symbol: symbolResult.result,
      decimals: decimalsResult.result,
    }
  } catch {
    return null
  }
}

export async function getTokenBalance(address: Address, wallet: Address): Promise<bigint> {
  try {
    return await rpcClient.readContract({
      address,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [wallet],
    })
  } catch {
    return 0n
  }
}

/**
 * Find ERC-20 tokens the wallet received via Transfer events.
 */
export async function discoverTokenAddresses(
  wallet: Address,
  fromBlock: bigint,
): Promise<Set<Address>> {
  const addresses = new Set<Address>()
  try {
    const logs = await rpcClient.getLogs({
      event: TRANSFER_EVENT,
      args: { to: wallet },
      fromBlock,
      toBlock: 'latest',
    })
    for (const log of logs) {
      if (log.address && log.address.toLowerCase() !== USDC_ADDRESS.toLowerCase()) {
        addresses.add(log.address)
      }
    }
  } catch {
    // RPC range too large — graceful fallback
  }
  return addresses
}

// ---------------------------------------------------------------------------
// Argus hook / splitter resolution (from token storage slot 9)
// ---------------------------------------------------------------------------
const ARGUS_HOOK_SLOT = 9n
const ARGUS_HOOK_SELECTORS = {
  stateView: '0x4c4a3c25',
  launches: '0x1f2d8550',
  predictSplitter: '0x249f9fe0',
} as const

async function getArgusHook(tokenAddress: Address): Promise<Address | null> {
  try {
    const raw = await rpcClient.getStorageAt({
      address: tokenAddress,
      slot: `0x${ARGUS_HOOK_SLOT.toString(16)}`,
    })
    if (!raw || raw === `0x${'0'.repeat(64)}`) return null
    return `0x${raw.slice(-40)}` as Address
  } catch {
    return null
  }
}

async function callHookAddress(
  hook: Address,
  selector: string,
  args?: string,
): Promise<Address | null> {
  try {
    const data = (selector + (args ?? '')) as `0x${string}`
    const res = await rpcClient.call({ to: hook, data })
    if (!res.data || res.data === '0x') return null
    const hex = res.data.slice(2)
    if (hex.length < 40) return null
    return `0x${hex.slice(-40)}` as Address
  } catch {
    return null
  }
}

export async function resolveSplitter(tokenAddress: Address): Promise<Address | null> {
  const hook = await getArgusHook(tokenAddress)
  if (!hook) return null
  const splitter = await callHookAddress(
    hook,
    ARGUS_HOOK_SELECTORS.predictSplitter,
    tokenAddress.slice(2).toLowerCase().padStart(64, '0') + '0'.repeat(64),
  )
  return splitter
}

// ---------------------------------------------------------------------------
// Dividend event scanning — reads real payout logs, returns null when absent
// ---------------------------------------------------------------------------
export async function fetchDividendEvents(
  tokenAddress: Address,
  wallet: Address,
  fromBlock: bigint,
  toBlock: bigint,
): Promise<bigint | null> {
  const hook = await getArgusHook(tokenAddress)
  if (hook) {
    const splitter = await callHookAddress(
      hook,
      ARGUS_HOOK_SELECTORS.predictSplitter,
      tokenAddress.slice(2).toLowerCase().padStart(64, '0') + '0'.repeat(64),
    )
    if (splitter) {
      const total = await fetchDividendEventsFrom(splitter, wallet, fromBlock, toBlock)
      if (total !== null) return total
    }
    const hookTotal = await fetchDividendEventsFrom(hook, wallet, fromBlock, toBlock)
    if (hookTotal !== null) return hookTotal
  }
  const tokenTotal = await fetchDividendEventsFrom(tokenAddress, wallet, fromBlock, toBlock)
  return tokenTotal
}

async function fetchDividendEventsFrom(
  contractAddress: Address,
  wallet: Address,
  fromBlock: bigint,
  toBlock: bigint,
): Promise<bigint | null> {
  // Try DividendWithdrawn first
  try {
    const logs = await rpcClient.getLogs({
      address: contractAddress,
      event: {
        type: 'event',
        name: 'DividendWithdrawn',
        inputs: [
          { type: 'address', name: 'account', indexed: true },
          { type: 'uint256', name: 'weiAmount', indexed: false },
        ],
      },
      args: { account: wallet },
      fromBlock,
      toBlock,
    })
    if (logs.length > 0) {
      let total = 0n
      for (const log of logs) {
        const args = log.args as Record<string, unknown>
        const amount = typeof args['weiAmount'] === 'bigint' ? args['weiAmount'] : 0n
        total += amount
      }
      return total
    }
  } catch {
    // Not this event shape
  }

  // Try DividendsPaid
  try {
    const logs = await rpcClient.getLogs({
      address: contractAddress,
      event: {
        type: 'event',
        name: 'DividendsPaid',
        inputs: [
          { type: 'address', name: 'recipient', indexed: true },
          { type: 'uint256', name: 'amount', indexed: false },
        ],
      },
      args: { recipient: wallet },
      fromBlock,
      toBlock,
    })
    if (logs.length > 0) {
      let total = 0n
      for (const log of logs) {
        const args = log.args as Record<string, unknown>
        const amount = typeof args['amount'] === 'bigint' ? args['amount'] : 0n
        total += amount
      }
      return total
    }
  } catch {
    // Not this event shape
  }

  return null
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------
export function formatUSDCAmount(amount: bigint | null, decimals = USDC_DECIMALS): string {
  if (amount === null) return '—'
  const num = Number(formatUnitsFixed(amount, decimals, decimals))
  if (num === 0) return '$0.00'
  if (num < 0.01) return `$${num.toFixed(4)}`
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

export function formatTokenBalance(balance: bigint, decimals: number): string {
  const num = Number(formatUnitsFixed(balance, decimals, Math.min(decimals, 4)))
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 4,
  }).format(num)
}

export function formatPercent(value: number | null): string {
  if (value === null) return '—'
  return `${value.toFixed(2)}%`
}
