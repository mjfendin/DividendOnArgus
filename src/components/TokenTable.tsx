import { useState } from 'react'
import { ChevronDown, ChevronUp, Download } from 'lucide-react'
import type { TokenHolding } from '../hooks/useDividendData'
import { formatUSDCAmount, formatTokenBalance } from '../hooks/useDividendData'
import { TokenDetailPanel } from './TokenDetailPanel'
import { exportDividendsCSV } from '../utils/csvExport'

interface TokenTableProps {
  holdings: TokenHolding[]
  loading: boolean
}

type SortKey = 'symbol' | 'balance' | 'dividend24h' | 'dividend7d' | 'dividend30d' | 'dividendTotal' | 'yield'
type SortDir = 'asc' | 'desc'

function figureNum(f: TokenHolding['dividendTotal']): number {
  return f.status === 'available' ? Number(f.value) : -1
}

function sortHoldings(holdings: TokenHolding[], key: SortKey, dir: SortDir): TokenHolding[] {
  return [...holdings].sort((a, b) => {
    let comparison = 0
    switch (key) {
      case 'symbol':
        comparison = a.symbol.localeCompare(b.symbol)
        break
      case 'balance':
        comparison = Number(a.balance) - Number(b.balance)
        break
      case 'dividend24h':
        comparison = figureNum(a.dividend24h) - figureNum(b.dividend24h)
        break
      case 'dividend7d':
        comparison = figureNum(a.dividend7d) - figureNum(b.dividend7d)
        break
      case 'dividend30d':
        comparison = figureNum(a.dividend30d) - figureNum(b.dividend30d)
        break
      case 'dividendTotal':
        comparison = figureNum(a.dividendTotal) - figureNum(b.dividendTotal)
        break
      case 'yield':
        comparison = (a.yieldPercent ?? -1) - (b.yieldPercent ?? -1)
        break
    }
    return dir === 'asc' ? comparison : -comparison
  })
}

function FigureCell({ figure }: { figure: TokenHolding['dividendTotal'] }) {
  if (figure.status !== 'available') {
    return (
      <span
        style={{
          fontSize: 12,
          color: 'var(--subtle)',
          fontStyle: 'italic',
        }}
      >
        Unavailable
      </span>
    )
  }
  return (
    <span
      className="tabular"
      style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}
    >
      {formatUSDCAmount(figure.value, figure.decimals)}
    </span>
  )
}

function SortButton({
  label,
  sortKey,
  currentKey,
  dir,
  onSort,
}: {
  label: string
  sortKey: SortKey
  currentKey: SortKey
  dir: SortDir
  onSort: (k: SortKey) => void
}) {
  const active = currentKey === sortKey
  return (
    <button
      onClick={() => onSort(sortKey)}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        color: active ? 'var(--ink)' : 'var(--subtle)',
        fontFamily: 'DM Sans, sans-serif',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
      {active ? (
        dir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />
      ) : (
        <ChevronDown size={12} style={{ opacity: 0.3 }} />
      )}
    </button>
  )
}

function TokenInitials({ symbol }: { symbol: string }) {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: 'var(--surface-muted)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 700,
        color: 'var(--accent)',
        flexShrink: 0,
        fontFamily: 'Space Grotesk, sans-serif',
      }}
    >
      {symbol.slice(0, 2).toUpperCase()}
    </div>
  )
}

export function TokenTable({ holdings, loading }: TokenTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('dividendTotal')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [selectedToken, setSelectedToken] = useState<TokenHolding | null>(null)

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(prev => (prev === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = sortHoldings(holdings, sortKey, sortDir)

  return (
    <>
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          overflow: 'hidden',
        }}
      >
        {/* Table header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div
            className="display"
            style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.01em' }}
          >
            Token Holdings
          </div>
          <button
            onClick={() => exportDividendsCSV(holdings)}
            disabled={holdings.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              color: holdings.length === 0 ? 'var(--subtle)' : 'var(--accent)',
              background: 'var(--surface-muted)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '7px 14px',
              cursor: holdings.length === 0 ? 'not-allowed' : 'pointer',
              opacity: holdings.length === 0 ? 0.5 : 1,
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            <Download size={13} />
            Export CSV
          </button>
        </div>

        {/* Column headers — desktop */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr 1.2fr 1fr',
            padding: '10px 20px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface-muted)',
            gap: 8,
          }}
          className="hidden-mobile"
        >
          <SortButton label="Token" sortKey="symbol" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
          <SortButton label="Balance" sortKey="balance" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
          <SortButton label="24h" sortKey="dividend24h" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
          <SortButton label="7d" sortKey="dividend7d" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
          <SortButton label="30d" sortKey="dividend30d" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
          <SortButton label="All Time" sortKey="dividendTotal" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
          <SortButton label="Yield" sortKey="yield" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
        </div>

        {/* Rows */}
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))
        ) : sorted.length === 0 ? null : (
          sorted.map(token => (
            <TokenRow
              key={token.address}
              token={token}
              onClick={() => setSelectedToken(token)}
            />
          ))
        )}
      </div>

      {selectedToken && (
        <TokenDetailPanel
          token={selectedToken}
          onClose={() => setSelectedToken(null)}
        />
      )}

      <style>{`
        @media (max-width: 640px) {
          .hidden-mobile { display: none !important; }
        }
      `}</style>
    </>
  )
}

function TokenRow({
  token,
  onClick,
}: {
  token: TokenHolding
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        background: 'none',
        border: 'none',
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'DM Sans, sans-serif',
        padding: 0,
      }}
    >
      {/* Desktop row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr 1.2fr 1fr',
          padding: '14px 20px',
          alignItems: 'center',
          gap: 8,
          transition: 'background 0.1s',
        }}
        className="token-row-desktop"
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          el.style.background = 'var(--surface-muted)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.background = 'transparent'
        }}
      >
        {/* Token name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TokenInitials symbol={token.symbol} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{token.symbol}</div>
            <div style={{ fontSize: 12, color: 'var(--subtle)' }}>{token.name}</div>
          </div>
        </div>

        {/* Balance */}
        <span className="tabular" style={{ fontSize: 13, color: 'var(--muted)' }}>
          {formatTokenBalance(token.balance, token.balanceDecimals)}
        </span>

        <FigureCell figure={token.dividend24h} />
        <FigureCell figure={token.dividend7d} />
        <FigureCell figure={token.dividend30d} />
        <FigureCell figure={token.dividendTotal} />

        {/* Yield */}
        <span
          className="tabular"
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: token.yieldPercent !== null ? 'var(--success)' : 'var(--subtle)',
          }}
        >
          {token.yieldPercent !== null ? `${token.yieldPercent.toFixed(2)}%` : '—'}
        </span>
      </div>

      {/* Mobile row */}
      <div
        className="token-row-mobile"
        style={{
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TokenInitials symbol={token.symbol} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{token.symbol}</div>
            <div style={{ fontSize: 12, color: 'var(--subtle)' }}>
              {formatTokenBalance(token.balance, token.balanceDecimals)}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: 'var(--subtle)', marginBottom: 2 }}>All Time</div>
          <FigureCell figure={token.dividendTotal} />
        </div>
      </div>

      <style>{`
        @media (min-width: 641px) { .token-row-mobile { display: none !important; } }
        @media (max-width: 640px) { .token-row-desktop { display: none !important; } }
      `}</style>
    </button>
  )
}

function SkeletonRow() {
  return (
    <div
      style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'var(--surface-muted)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ height: 12, width: '30%', background: 'var(--surface-muted)', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: 10, width: '50%', background: 'var(--surface-muted)', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite 0.15s' }} />
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
