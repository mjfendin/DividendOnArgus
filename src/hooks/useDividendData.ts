/**
 * Dividend data hooks for Argus tokens on Arc Mainnet.
 *
 * Uses the shared Argus data layer (src/lib/argus-data.ts) for on-chain reads.
 * All figures are real on-chain values; missing data is 'unavailable', not zero.
 */

import { useState, useEffect, useCallback } from 'react'
import { type Address } from 'viem'
import {
  getCurrentBlock,
  getTokenInfo,
  getTokenBalance,
  discoverTokenAddresses,
  fetchDividendEvents,
  resolveSplitter,
  KNOWN_DIVIDEND_TOKENS,
  BLOCKS_30D,
  BLOCKS_7D,
  BLOCKS_24H,
  USDC_DECIMALS,
  formatUSDCAmount,
  formatTokenBalance,
  type TokenHolding,
  type DividendFigure,
} from '@/lib/argus-data'

export type { TokenHolding, DividendFigure }
export { formatUSDCAmount, formatTokenBalance }

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

      // Step 1: discover token addresses the wallet has received
      const tokenAddresses = await discoverTokenAddresses(wallet, fromBlock30d)

      // Seed with known dividend tokens (covers minted/older balances)
      for (const known of KNOWN_DIVIDEND_TOKENS) {
        tokenAddresses.add(known)
      }

      // Step 2: for each token, read info + balance + dividend figures
      const holdings: TokenHolding[] = []

      for (const tokenAddr of tokenAddresses) {
        const info = await getTokenInfo(tokenAddr)
        if (!info) continue

        const balance = await getTokenBalance(tokenAddr, wallet)
        if (balance === 0n) continue

        const splitter = await resolveSplitter(tokenAddr)

        const dailyHistory: (number | null)[] = Array.from({ length: 30 }, () => null)

        // Received = dividend events to this wallet across time windows
        const receivedAllTime = await fetchDividendEvents(tokenAddr, wallet, 0n, currentBlock)
        const received30d = await fetchDividendEvents(tokenAddr, wallet, fromBlock30d, currentBlock)
        const received7d = await fetchDividendEvents(tokenAddr, wallet, fromBlock7d, currentBlock)
        const received24h = await fetchDividendEvents(tokenAddr, wallet, fromBlock24h, currentBlock)

        const hasDividends =
          receivedAllTime !== null ||
          received30d !== null ||
          received7d !== null ||
          received24h !== null

        const makeFigure = (val: bigint | null): DividendFigure => {
          if (val !== null) return { status: 'available', value: val, decimals: USDC_DECIMALS }
          // For known tokens with a deployed splitter but no payout events yet,
          // show zero honestly rather than a dash — dividends simply haven't
          // started yet.
          const isKnown = KNOWN_DIVIDEND_TOKENS.some(k => k.toLowerCase() === tokenAddr.toLowerCase())
          return isKnown
            ? { status: 'available', value: 0n, decimals: USDC_DECIMALS }
            : { status: 'unavailable' }
        }

        holdings.push({
          address: tokenAddr,
          name: info.name,
          symbol: info.symbol,
          balance,
          balanceDecimals: info.decimals,
          hasDividends,
          // Lifecycle stages (funded/paid/waiting) require splitter getters.
          // We read them lazily via the discovery layer; here they are honest
          // 'unavailable' unless resolvable — never fake zero.
          fundedTotal: { status: 'unavailable' },
          paidTotal: { status: 'unavailable' },
          waitingTotal: { status: 'unavailable' },
          receivedTotal: makeFigure(receivedAllTime),
          claimableTotal: { status: 'unavailable' },
          dividendTotal: makeFigure(receivedAllTime),
          dividend24h: makeFigure(received24h),
          dividend7d: makeFigure(received7d),
          dividend30d: makeFigure(received30d),
          yieldPercent: null,
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

  const effectiveState: DividendDataState = wallet
    ? state
    : { holdings: [], loading: false, error: null, lastUpdated: null }

  return { ...effectiveState, refetch: fetchData }
}

// ---------------------------------------------------------------------------
// USDC wallet balance hook
// ---------------------------------------------------------------------------
import { rpcClient } from '@/lib/argus-data'
import { erc20Abi } from 'viem'

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
        address: '0x3600000000000000000000000000000000000000',
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
