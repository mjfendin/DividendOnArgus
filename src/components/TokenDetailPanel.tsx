import { X, ExternalLink } from 'lucide-react'
import type { TokenHolding } from '../hooks/useDividendData'
import { formatUSDCAmount, formatTokenBalance } from '../hooks/useDividendData'
import { buildAddressExplorerUrl } from '@/onchain-facts'

const ARC_MAINNET_CHAIN_ID = 5042

interface TokenDetailPanelProps {
  token: TokenHolding
  onClose: () => void
}

function Sparkline({ data }: { data: (number | null)[] }) {
  const values = data.filter((v): v is number => v !== null)
  if (values.length < 2) {
    return (
      <div
        style={{
          height: 40,
          display: 'flex',
          alignItems: 'center',
          color: 'var(--subtle)',
          fontSize: 12,
        }}
      >
        Insufficient history data
      </div>
    )
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const W = 240
  const H = 40

  // Build sparse point list (only non-null days)
  const points: Array<{ i: number; v: number }> = []
  data.forEach((v, i) => {
    if (v !== null) points.push({ i, v })
  })

  const pathParts = points.map(({ i, v }, idx) => {
    const x = (i / (data.length - 1)) * W
    const y = H - ((v - min) / range) * (H - 4) - 2
    return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
  })

  return (
    <svg width={W} height={H} className="overflow-visible" style={{ display: 'block' }}>
      <path
        d={pathParts.join(' ')}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <span style={{ fontSize: 13, color: 'var(--subtle)' }}>{label}</span>
      <span
        className="tabular"
        style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}
      >
        {value}
      </span>
    </div>
  )
}

export function TokenDetailPanel({ token, onClose }: TokenDetailPanelProps) {
  const explorerUrl = buildAddressExplorerUrl(ARC_MAINNET_CHAIN_ID, token.address)
  const argusUrl = `https://argus.world/token/${token.address}`

  const figure = (f: TokenHolding['dividendTotal']) =>
    f.status === 'available' ? formatUSDCAmount(f.value, f.decimals) : 'Unavailable'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 600,
          background: 'var(--surface-strong)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '20px 20px 0 0',
          border: '1px solid var(--border-strong)',
          borderBottom: 'none',
          padding: '24px 24px 32px',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            width: 40,
            height: 4,
            background: 'var(--border-strong)',
            borderRadius: 2,
            margin: '-8px auto 20px',
          }}
        />

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <div>
            <div
              className="display"
              style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}
            >
              {token.name}
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'var(--subtle)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontWeight: 600,
                marginTop: 2,
              }}
            >
              {token.symbol}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '6px 8px',
              cursor: 'pointer',
              color: 'var(--subtle)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Dividend breakdown */}
        <div style={{ marginBottom: 20 }}>
          <Row
            label="Balance Held"
            value={`${formatTokenBalance(token.balance, token.balanceDecimals)} ${token.symbol}`}
          />
          <Row label="Dividends — All Time" value={figure(token.dividendTotal)} />
          <Row label="Dividends — Last 30 Days" value={figure(token.dividend30d)} />
          <Row label="Dividends — Last 7 Days" value={figure(token.dividend7d)} />
          <Row label="Dividends — Last 24 Hours" value={figure(token.dividend24h)} />
          <Row
            label="Annualised Yield"
            value={token.yieldPercent !== null ? `${token.yieldPercent.toFixed(2)}%` : 'Unavailable'}
          />
        </div>

        {/* Sparkline */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: 'var(--subtle)',
              marginBottom: 10,
            }}
          >
            30-Day Dividend Sparkline
          </div>
          <Sparkline data={token.dailyHistory} />
        </div>

        {/* Note about tax allocation */}
        <div
          style={{
            background: 'var(--surface-muted)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '12px 14px',
            marginBottom: 20,
            fontSize: 13,
            color: 'var(--subtle)',
            lineHeight: 1.5,
          }}
        >
          Tax allocation breakdown and token launch settings are available on the
          Argus token page. This dashboard shows only dividend inflow data
          readable from on-chain events.
        </div>

        {/* Links */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a
            href={argusUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--accent)',
              textDecoration: 'none',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '8px 14px',
            }}
          >
            <ExternalLink size={13} />
            View on Argus
          </a>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--muted)',
              textDecoration: 'none',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '8px 14px',
            }}
          >
            <ExternalLink size={13} />
            Block Explorer
          </a>
        </div>
      </div>
    </div>
  )
}
