import { useState, useEffect } from 'react'
import { useAccount, useSwitchChain } from 'wagmi'
import { arc } from 'viem/chains'
import type { Address } from 'viem'
import { AppHeader } from './components/AppHeader'
import { SummaryCards } from './components/SummaryCards'
import { IncomeChart } from './components/IncomeChart'
import { TokenTable } from './components/TokenTable'
import { EmptyState } from './components/EmptyState'
import { WrongNetworkBanner } from './components/WrongNetwork'
import { ClaimCenter } from './components/ClaimCenter'
import {
  DailyIncomeTicker,
  DiscoveryGrid,
  useWatchlist,
} from './components/DiscoveryModules'
import {
  useDividendData,
  useUSDCBalance,
  computeSummary,
} from './hooks/useDividendData'

const ARC_MAINNET_ID = arc.id // 5042

export default function App() {
  const { address, isConnected, chainId } = useAccount()
  const { switchChain } = useSwitchChain()

  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  const isOnArc = chainId === ARC_MAINNET_ID
  const walletForData: Address | undefined =
    isConnected && isOnArc ? address : undefined

  const { holdings, loading, error, lastUpdated, refetch } = useDividendData(walletForData)
  const { balance: usdcBalance, loading: balanceLoading } = useUSDCBalance(walletForData)
  const { watchlist, toggleWatch, isWatched } = useWatchlist()

  const summary = computeSummary(holdings)

  // Daily income = total24h
  const dailyIncome = summary.total24h

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const handleSwitchToArc = () => {
    switchChain({ chainId: ARC_MAINNET_ID })
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--bg-gradient)',
        color: 'var(--ink)',
      }}
    >
      <AppHeader
        theme={theme}
        onThemeToggle={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
        usdcBalance={isConnected && isOnArc ? usdcBalance : null}
        balanceLoading={balanceLoading}
        onRefresh={isConnected && isOnArc ? () => void refetch() : undefined}
        refreshing={loading}
      />

      <main
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '32px 20px 80px',
        }}
      >
        {/* Page title */}
        <div style={{ marginBottom: 32 }}>
          <h1
            className="display"
            style={{
              fontSize: 32,
              fontWeight: 400,
              color: 'var(--ink)',
              letterSpacing: 0,
              margin: 0,
              marginBottom: 8,
            }}
          >
            Passive Income Dashboard
          </h1>
          <p style={{ fontSize: 15, color: 'var(--subtle)', margin: 0, lineHeight: 1.6 }}>
            {lastUpdated
              ? `Last updated ${lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
              : 'Aggregated dividend income across all Argus tokens you hold'}
          </p>
        </div>

        {/* Wrong network warning */}
        {isConnected && !isOnArc && (
          <WrongNetworkBanner />
        )}

        {/* Not connected */}
        {!isConnected && (
          <EmptyState type="no-wallet" />
        )}

        {/* Connected, wrong network */}
        {isConnected && !isOnArc && (
          <EmptyState type="wrong-network" onSwitchNetwork={handleSwitchToArc} />
        )}

        {/* Discovery modules — visible without wallet (public data) */}
        <div style={{ marginBottom: 24 }}>
          <h2
            className="display"
            style={{
              fontSize: 22,
              fontWeight: 400,
              color: 'var(--ink)',
              margin: '0 0 16px',
            }}
          >
            Argus Dividend Discovery
          </h2>
          <DiscoveryGrid
            holdings={holdings}
            watchlist={watchlist}
            onToggleWatch={toggleWatch}
            isWatched={isWatched}
          />
        </div>

        {/* Connected on Arc — main content */}
        {isConnected && isOnArc && (
          <>
            {/* Error banner */}
            {error && (
              <div
                style={{
                  background: 'rgba(232, 109, 122, 0.1)',
                  border: '1px solid rgba(232, 109, 122, 0.3)',
                  borderRadius: 10,
                  padding: '12px 16px',
                  marginBottom: 20,
                  fontSize: 13,
                  color: 'var(--danger)',
                }}
              >
                Could not load all dividend data: {error}
              </div>
            )}

            {/* Summary cards */}
            <SummaryCards summary={summary} loading={loading} />

            {/* Daily passive income ticker */}
            <DailyIncomeTicker dailyIncome={dailyIncome} loading={loading} />

            {/* Claim center */}
            <ClaimCenter holdings={holdings} />

            {/* Income chart */}
            <IncomeChart holdings={holdings} loading={loading} theme={theme} />

            {/* Token table or empty state */}
            {!loading && holdings.length === 0 ? (
              <EmptyState type="no-tokens" />
            ) : (
              <TokenTable holdings={holdings} loading={loading} />
            )}
          </>
        )}
      </main>
    </div>
  )
}
