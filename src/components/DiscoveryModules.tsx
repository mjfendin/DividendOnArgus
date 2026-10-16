import { useState, useEffect, useCallback } from 'react'
import * as React from 'react'
import { Flame, Eye, EyeOff, Trophy, Radio } from 'lucide-react'
import type { Address } from 'viem'
import { formatUSDCAmount, type TokenHolding } from '../hooks/useDividendData'
import { useDiscovery } from '../hooks/useDiscovery'

// ---------------------------------------------------------------------------
// Daily Passive Income Ticker (Grup B5)
// ---------------------------------------------------------------------------
export function DailyIncomeTicker({
  dailyIncome,
  loading,
}: {
  dailyIncome: bigint | null
  loading: boolean
}) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '16px 20px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: 'rgba(255, 200, 87, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Flame size={17} style={{ color: '#ffc857' }} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          className="eyebrow"
          style={{ fontSize: 10, marginBottom: 2 }}
        >
          Passive income today
        </div>
        <div
          className="display tabular"
          style={{
            fontSize: 22,
            fontWeight: 400,
            color: 'var(--ink)',
            lineHeight: 1.1,
          }}
        >
          {loading ? 'Calculating…' : formatUSDCAmount(dailyIncome)}
        </div>
      </div>
      <span style={{ fontSize: 12, color: 'var(--subtle)', maxWidth: 220 }}>
        Auto-refreshes with on-chain dividend payouts
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Watchlist (Grup B7)
// ---------------------------------------------------------------------------
const WATCHLIST_KEY = 'dividentonargus:watchlist'

function loadWatchlist(): string[] {
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>([])

  useEffect(() => {
    setWatchlist(loadWatchlist())
  }, [])

  const toggleWatch = useCallback((address: string) => {
    setWatchlist(prev => {
      const next = prev.includes(address)
        ? prev.filter(a => a !== address)
        : [...prev, address]
      try {
        localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  const isWatched = useCallback(
    (address: string) => watchlist.includes(address),
    [watchlist],
  )

  return { watchlist, toggleWatch, isWatched }
}

// ---------------------------------------------------------------------------
// Top Dividend Tokens (Grup C9)
// ---------------------------------------------------------------------------
export function TopDividendTokens({
  onWatch,
  isWatched,
}: {
  onWatch: (address: string) => void
  isWatched: (address: string) => boolean
}) {
  const { tokens, loading, error, refetch } = useDiscovery()

  const sorted = [...tokens]
    .filter(t => (t.dividendBps ?? 0) > 0)
    .sort((a, b) => {
      // DIVIDEND flagship always first
      if (a.symbol === 'DIVIDEND') return -1
      if (b.symbol === 'DIVIDEND') return 1
      // Then sort by dividends allocation (highest % first)
      return (b.dividendBps ?? 0) - (a.dividendBps ?? 0)
    })
    .slice(0, 5)

  return (
    <DiscoveryCard
      title="Top Dividend Tokens"
      subtitle="Live launches on Argus — dividends accrue from trading"
      loading={loading}
      error={error}
      onRefresh={() => void refetch()}
      emptyText="No dividend launches discovered yet"
    >
      {sorted.map((t, i) => (
        <div
          key={t.token}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 0',
            borderBottom: i < sorted.length - 1 ? '1px solid var(--border)' : 'none',
          }}
        >
          <span
            className="display tabular"
            style={{
              fontSize: 16,
              color: t.symbol === 'DIVIDEND' ? 'var(--accent)' : i === 0 ? 'var(--accent)' : 'var(--subtle)',
              width: 22,
            }}
          >
            {t.symbol === 'DIVIDEND' ? '★' : i + 1}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                {t.notDeployed ? 'Launch recorded' : t.symbol}
              </div>
              <a
                href={`https://argus.world/token/${t.token}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 11,
                  color: 'var(--accent)',
                  textDecoration: 'none',
                  borderBottom: '1px dashed var(--accent)',
                }}
              >
                Argus ↗
              </a>
            </div>
            <div style={{ fontSize: 12, color: 'var(--subtle)' }}>
              {t.notDeployed
                ? `${t.token.slice(0, 6)}…${t.token.slice(-4)} — contract not yet deployed`
                : t.name}
            </div>
          </div>
          <span
            className="tabular"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--success)',
            }}
          >
            {t.dividendBps !== undefined
              ? `Dividends ${(t.dividendBps / 100).toFixed(0)}%`
              : t.buyTaxBps !== undefined && t.sellTaxBps !== undefined
                ? `Tax ${(t.buyTaxBps / 100).toFixed(2)}/${(t.sellTaxBps / 100).toFixed(2)}%`
                : '—'}
          </span>
          <button
            onClick={() => onWatch(t.token)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              color: isWatched(t.token) ? 'var(--accent)' : 'var(--subtle)',
            }}
            title={isWatched(t.token) ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            {isWatched(t.token) ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      ))}
    </DiscoveryCard>
  )
}

// ---------------------------------------------------------------------------
// Leaderboard Earners (Grup C10)
// ---------------------------------------------------------------------------
export function LeaderboardEarners() {
  const { leaderboard, loading, error, refetch } = useDiscovery()

  const sorted = [...leaderboard]
    .sort((a, b) => (b.totalReceived > a.totalReceived ? 1 : -1))
    .slice(0, 8)

  return (
    <DiscoveryCard
      title="Top Earners"
      subtitle="Wallets with the most dividends received"
      loading={loading}
      error={error}
      onRefresh={() => void refetch()}
      emptyText="No dividend recipients discovered yet"
    >
      {sorted.map((e, i) => (
        <div
          key={e.address}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 0',
            borderBottom: i < sorted.length - 1 ? '1px solid var(--border)' : 'none',
          }}
        >
          <span
            className="display tabular"
            style={{
              fontSize: 16,
              color: i === 0 ? 'var(--accent)' : 'var(--subtle)',
              width: 22,
            }}
          >
            {i + 1}
          </span>
          <Trophy size={15} style={{ color: i === 0 ? '#ffc857' : 'var(--subtle)' }} />
          <span
            className="mono"
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 12,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: 'var(--muted)',
            }}
          >
            {e.address.slice(0, 6)}…{e.address.slice(-4)}
          </span>
          <span className="tabular" style={{ fontSize: 14, fontWeight: 600, color: 'var(--success)' }}>
            {formatUSDCAmount(e.totalReceived)}
          </span>
        </div>
      ))}
    </DiscoveryCard>
  )
}

// ---------------------------------------------------------------------------
// Live Dividend Feed (Grup B6)
// ---------------------------------------------------------------------------
export function LiveDividendFeed({
  holdings,
}: {
  holdings: TokenHolding[]
}) {
  const { tokens, loading, error, refetch } = useDiscovery()

  // Build feed from dividend-bearing tokens' payout counts (real on-chain counts)
  const feed = holdings
    .filter(h => h.hasDividends && h.receivedTotal.status === 'available')
    .map(h => ({
      id: h.address,
      symbol: h.symbol,
      amount: h.receivedTotal.status === 'available' ? h.receivedTotal.value : 0n,
      when: 'Recent',
    }))

  return (
    <DiscoveryCard
      title="Live Dividend Feed"
      subtitle="Your latest on-chain dividend receipts"
      loading={loading}
      error={error}
      onRefresh={() => void refetch()}
      emptyText="Connect your wallet to see your dividend feed"
    >
      {feed.slice(0, 6).map((f, i) => (
        <div
          key={f.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 0',
            borderBottom: i < feed.length - 1 ? '1px solid var(--border)' : 'none',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--success)',
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{f.symbol}</div>
            <div style={{ fontSize: 12, color: 'var(--subtle)' }}>Dividend received</div>
          </div>
          <span className="tabular" style={{ fontSize: 14, fontWeight: 600, color: 'var(--success)' }}>
            {formatUSDCAmount(f.amount)}
          </span>
        </div>
      ))}
    </DiscoveryCard>
  )
}

// ---------------------------------------------------------------------------
// Shared discovery card shell
// ---------------------------------------------------------------------------
function DiscoveryCard({
  title,
  subtitle,
  loading,
  error,
  onRefresh,
  emptyText,
  children,
}: {
  title: string
  subtitle: string
  loading: boolean
  error: string | null
  onRefresh: () => void
  emptyText: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '20px 24px',
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          gap: 8,
        }}
      >
        <div>
          <div className="display" style={{ fontSize: 17, fontWeight: 400, color: 'var(--ink)' }}>
            {title}
          </div>
          <div style={{ fontSize: 12, color: 'var(--subtle)', marginTop: 2 }}>
            {subtitle}
          </div>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '6px 10px',
            cursor: loading ? 'not-allowed' : 'pointer',
            color: 'var(--muted)',
            opacity: loading ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
          }}
        >
          <Radio size={12} />
          Refresh
        </button>
      </div>

      {error && (
        <div style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 8 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ fontSize: 13, color: 'var(--subtle)', padding: '20px 0' }}>
          Scanning Argus on-chain…
        </div>
      ) : error ? (
        <div style={{ fontSize: 13, color: 'var(--danger)', padding: '12px 0' }}>
          {error}
        </div>
      ) : (
        <div style={{ minHeight: 40 }}>
          {children}
          {React.Children.count(children) === 0 && (
            <span style={{ fontSize: 11, color: 'var(--subtle)', display: 'block', marginTop: 8 }}>
              {emptyText}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Grid wrapper for discovery modules
// ---------------------------------------------------------------------------
export function DiscoveryGrid({
  holdings,
  watchlist,
  onToggleWatch,
  isWatched,
}: {
  holdings: TokenHolding[]
  watchlist: string[]
  onToggleWatch: (address: string) => void
  isWatched: (address: string) => boolean
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}
    >
      <TopDividendTokens onWatch={onToggleWatch} isWatched={isWatched} />
      <LeaderboardEarners />
      <LiveDividendFeed holdings={holdings} />
    </div>
  )
}
