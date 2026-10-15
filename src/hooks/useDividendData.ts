/**
 * Dividend data hooks for Argus tokens on Arc Mainnet.
 *
 * Strategy:
 * 1. Scan ERC-20 Transfer events to the wallet to find tokens held.
 * 2. For each candidate token, read name/symbol/balance via multicall.
 * 3. Try to read DividendTracker data via known Argus event signatures.
 *    If the contract does not emit dividend events, mark figures as unavailable
 *    rather than showing zero — we never fabricate numbers.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  createPublicClient,
  http,
  type Address,
  erc20Abi,
  type AbiEvent,
} from 'viem'
import { arc } from 'viem/chains'
import { formatUnitsFixed } from '@/onchain-money'

// ---------------------------------------------------------------------------
// RPC client — Arc Mainnet
// ---------------------------------------------------------------------------
const rpcClient = createPublicClient({
  chain: arc,
  transport: http(arc.rpcUrls.default.http[0]),
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type DividendFigure =
  | { status: 'available'; value: bigint; decimals: number }
  | { status: 'unavailable' }
  | { status: 'loading' }

export interface TokenHolding {
  address: Address
  name: string
  symbol: string
  balance: bigint
  balanceDecimals: number
  /** true when dividend data was found on this token */
  hasDividends: boolean
  dividendTotal: DividendFigure
  dividend24h: DividendFigure
  dividend7d: DividendFigure
  dividend30d: DividendFigure
  /** annualised yield in percent, or null when price/dividends unavailable */
  yieldPercent: number | null
  /** daily dividend values for the last 30 days (index 0 = 30 days ago) */
  dailyHistory: (number | null)[]
}

// ---------------------------------------------------------------------------
// Known Argus DividendTracker event ABIs
// ---------------------------------------------------------------------------
const DIVIDEND_WITHDRAWN_EVENT: AbiEvent = {
  type: 'event',
  name: 'DividendWithdrawn',
  inputs: [
    { type: 'address', name: 'account', indexed: true },
    { type: 'uint256', name: 'weiAmount', indexed: false },
  ],
}

const DIVIDENDS_PAID_EVENT: AbiEvent = {
  type: 'event',
  name: 'DividendsPaid',
  inputs: [
    { type: 'address', name: 'recipient', indexed: true },
    { type: 'uint256', name: 'amount', indexed: false },
  ],
}

const TRANSFER_EVENT: AbiEvent = {
  type: 'event',
  name: 'Transfer',
  inputs: [
    { type: 'address', name: 'from', indexed: true },
    { type: 'address', name: 'to', indexed: true },
    { type: 'uint256', name: 'value', indexed: false },
  ],
}

// USDC ERC-20 address on Arc Mainnet
const USDC_ADDRESS: Address = '0x3600000000000000000000000000000000000000'
const USDC_DECIMALS = 6

// ---------------------------------------------------------------------------
// Argus protocol facts (Arc Mainnet)
// ---------------------------------------------------------------------------
// Argus launches are Uniswap v4 pools with a hook contract. The hook address
// is stored in the token's storage slot 9 (observed on live Argus tokens).
// The hook exposes `stateView()`, `launches(address)`, and `predictSplitter()`.
const ARGUS_HOOK_SLOT = 9n
const ARGUS_HOOK_SELECTORS = {
  stateView: '0x4c4a3c25',
  launches: '0x1f2d8550',
  predictSplitter: '0x249f9fe0',
} as const

/** Read the Argus hook address from a token's storage (slot 9). */
async function getArgusHook(tokenAddress: Address): Promise<Address | null> {
  try {
    const raw = await rpcClient.getStorageAt({
      address: tokenAddress,
      slot: `0x${ARGUS_HOOK_SLOT.toString(16)}`,
    })
    if (!raw || raw === `0x${'0'.repeat(64)}`) return null
    const addr = `0x${raw.slice(-40)}` as Address
    return addr
  } catch {
    return null
  }
}

/** Call a read-only function on the Argus hook; returns decoded address or null. */
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
    // Address is the last 20 bytes (40 hex chars) of the returned word.
    if (hex.length < 40) return null
    const addr = `0x${hex.slice(-40)}` as Address
    return addr
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** How many blocks to look back (~30 days at ~1s blocks on Arc) */
const BLOCKS_30D = 2_592_000n
const BLOCKS_7D = 604_800n
const BLOCKS_24H = 86_400n

async function getCurrentBlock(): Promise<bigint> {
  try {
    return await rpcClient.getBlockNumber()
  } catch {
    return 0n
  }
}

async function getTokenInfo(
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

async function getTokenBalance(address: Address, wallet: Address): Promise<bigint> {
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
async function discoverTokenAddresses(
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
    // RPC range too large — return empty, graceful fallback
  }
  return addresses
}

/**
 * Try the known Argus DividendWithdrawn / DividendsPaid events for a holder.
 * Also resolves the Argus hook and splitter when possible, then falls back
 * to scanning the token and hook for dividend-shaped events.
 * Returns null when no matching events found — honest unavailability, not zero.
 */
async function fetchDividendEvents(
  tokenAddress: Address,
  wallet: Address,
  fromBlock: bigint,
  toBlock: bigint,
): Promise<bigint | null> {
  // 1. Argus hook lives in token storage slot 9. Prefer hook + splitter logs.
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
    // Hook itself may emit payout events.
    const hookTotal = await fetchDividendEventsFrom(hook, wallet, fromBlock, toBlock)
    if (hookTotal !== null) return hookTotal
  }

  // 2. Fall back to the token address itself.
  const tokenTotal = await fetchDividendEventsFrom(tokenAddress, wallet, fromBlock, toBlock)
  if (tokenTotal !== null) return tokenTotal

  return null
}

async function fetchDividendEventsFrom(
  contractAddress: Address,
  wallet: Address,
  fromBlock: bigint,
  toBlock: bigint,
): Promise<bigint | null> {
  // Try DividendWithdrawn
  try {
    const logs = await rpcClient.getLogs({
      address: contractAddress,
      event: DIVIDEND_WITHDRAWN_EVENT,
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
    // Not this event shape — try next
  }

  // Try DividendsPaid
  try {
    const logs = await rpcClient.getLogs({
      address: contractAddress,
      event: DIVIDENDS_PAID_EVENT,
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
// Main hook
// ---------------------------------------------------------------------------

export interface DividendDataState {
  holdings: TokenHolding[]
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

export function useDividendData(wallet: Address | undefined) {
  const [state, setState] = useState<DividendDataState>({
    holdings: [],
    loading: false,
    error: null,
    lastUpdated: null,
  })

  const fetchData = useCallback(async () => {
    if (!wallet) return

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const currentBlock = await getCurrentBlock()
      if (currentBlock === 0n) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Could not reach Arc Mainnet RPC.',
        }))
        return
      }

      const fromBlock30d = currentBlock > BLOCKS_30D ? currentBlock - BLOCKS_30D : 0n
      const fromBlock7d = currentBlock > BLOCKS_7D ? currentBlock - BLOCKS_7D : 0n
      const fromBlock24h = currentBlock > BLOCKS_24H ? currentBlock - BLOCKS_24H : 0n

      // Step 1: discover token addresses
      const tokenAddresses = await discoverTokenAddresses(wallet, fromBlock30d)

      // Step 2: for each token, read info + balance + dividends
      const holdings: TokenHolding[] = []

      for (const tokenAddr of tokenAddresses) {
        const info = await getTokenInfo(tokenAddr)
        if (!info) continue

        const balance = await getTokenBalance(tokenAddr, wallet)
        if (balance === 0n) continue

        const dailyHistory: (number | null)[] = Array.from({ length: 30 }, () => null)

        const dividendTotal30d = await fetchDividendEvents(tokenAddr, wallet, fromBlock30d, currentBlock)
        const dividendTotal24h = await fetchDividendEvents(tokenAddr, wallet, fromBlock24h, currentBlock)
        const dividendTotal7d = await fetchDividendEvents(tokenAddr, wallet, fromBlock7d, currentBlock)
        const dividendTotalAllTime = await fetchDividendEvents(tokenAddr, wallet, 0n, currentBlock)

        const hasDividends =
          dividendTotal30d !== null ||
          dividendTotal24h !== null ||
          dividendTotal7d !== null ||
          dividendTotalAllTime !== null

        const makeFigure = (val: bigint | null): DividendFigure =>
          val !== null
            ? { status: 'available', value: val, decimals: USDC_DECIMALS }
            : { status: 'unavailable' }

        holdings.push({
          address: tokenAddr,
          name: info.name,
          symbol: info.symbol,
          balance,
          balanceDecimals: info.decimals,
          hasDividends,
          dividendTotal: makeFigure(dividendTotalAllTime),
          dividend24h: makeFigure(dividendTotal24h),
          dividend7d: makeFigure(dividendTotal7d),
          dividend30d: makeFigure(dividendTotal30d),
          yieldPercent: null, // requires price feed — not available without oracle
          dailyHistory,
        })
      }

      // Sort by total dividends (highest first); unavailable treated as 0
      holdings.sort((a, b) => {
        const aVal = a.dividendTotal.status === 'available' ? a.dividendTotal.value : 0n
        const bVal = b.dividendTotal.status === 'available' ? b.dividendTotal.value : 0n
        return bVal > aVal ? 1 : bVal < aVal ? -1 : 0
      })

      setState({ holdings, loading: false, error: null, lastUpdated: new Date() })
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error fetching dividend data.',
      }))
    }
  }, [wallet])

  useEffect(() => {
    if (!wallet) return
    void fetchData()
  }, [wallet, fetchData])

  // Reset state when wallet disconnects — driven by derived value, not effect setState
  const effectiveState: DividendDataState = wallet
    ? state
    : { holdings: [], loading: false, error: null, lastUpdated: null }

  return { ...effectiveState, refetch: fetchData }
}

// ---------------------------------------------------------------------------
// USDC wallet balance hook (ERC-20 view, 6 decimals)
// ---------------------------------------------------------------------------

interface BalanceState {
  balance: bigint | null
  loading: boolean
}

export function useUSDCBalance(wallet: Address | undefined) {
  const [state, setState] = useState<BalanceState>({ balance: null, loading: false })

  const fetchBalance = useCallback(async (addr: Address) => {
    setState({ balance: null, loading: true })
    try {
      const bal = await rpcClient.readContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [addr],
      })
      setState({ balance: bal, loading: false })
    } catch {
      setState({ balance: null, loading: false })
    }
  }, [])

  useEffect(() => {
    if (!wallet) return
    void fetchBalance(wallet)
  }, [wallet, fetchBalance])

  const effectiveState: BalanceState = wallet
    ? state
    : { balance: null, loading: false }

  return effectiveState
}

// ---------------------------------------------------------------------------
// Summary computations
// ---------------------------------------------------------------------------
export interface PortfolioSummary {
  totalAllTime: bigint | null
  total30d: bigint | null
  total7d: bigint | null
  total24h: bigint | null
  activeDividendTokens: number
  projectedMonthly: bigint | null
}

export function computeSummary(holdings: TokenHolding[]): PortfolioSummary {
  let totalAllTime: bigint | null = null
  let total30d: bigint | null = null
  let total7d: bigint | null = null
  let total24h: bigint | null = null
  let activeDividendTokens = 0

  for (const h of holdings) {
    if (!h.hasDividends) continue
    activeDividendTokens++

    if (h.dividendTotal.status === 'available') {
      totalAllTime = (totalAllTime ?? 0n) + h.dividendTotal.value
    }
    if (h.dividend30d.status === 'available') {
      total30d = (total30d ?? 0n) + h.dividend30d.value
    }
    if (h.dividend7d.status === 'available') {
      total7d = (total7d ?? 0n) + h.dividend7d.value
    }
    if (h.dividend24h.status === 'available') {
      total24h = (total24h ?? 0n) + h.dividend24h.value
    }
  }

  const projectedMonthly =
    total7d !== null ? (total7d * 30n) / 7n : null

  return {
    totalAllTime,
    total30d,
    total7d,
    total24h,
    activeDividendTokens,
    projectedMonthly,
  }
}

/** Format a USDC bigint amount for display */
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
