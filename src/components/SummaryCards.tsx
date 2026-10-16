import { Coins, Hourglass, CheckCircle2, Gift, TrendingUp } from 'lucide-react'
import type { PortfolioSummary } from '../hooks/useDividendData'
import { formatUSDCAmount } from '../hooks/useDividendData'

interface SummaryCardsProps {
  summary: PortfolioSummary
  loading: boolean
}

interface CardProps {
  label: string
  value: string
  sublabel?: string
  icon: React.ReactNode
  accent?: boolean
}

function StatCard({ label, value, sublabel, icon, accent }: CardProps) {
  return (
    <div
      style={{
        background: accent ? 'var(--color-iris-gleam)' : 'var(--surface)',
        border: accent ? 'none' : '1px solid var(--border)',
        borderRadius: 16,
        padding: '20px 24px',
        boxShadow: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontFamily: "'Roboto Mono', monospace",
            color: accent ? 'rgba(255,255,255,0.85)' : 'var(--subtle)',
          }}
        >
          {label}
        </span>
        <span style={{ color: accent ? 'rgba(255,255,255,0.9)' : 'var(--accent)', opacity: 0.7 }}>{icon}</span>
      </div>
      <div
        className="display tabular"
        style={{
          fontSize: 28,
          fontWeight: 400,
          color: accent ? '#ffffff' : 'var(--ink)',
          letterSpacing: 0,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {sublabel && (
        <div style={{ fontSize: 12, color: accent ? 'rgba(255,255,255,0.85)' : 'var(--subtle)', marginTop: -2 }}>
          {sublabel}
        </div>
      )}
    </div>
  )
}

export function SummaryCards({ summary, loading }: SummaryCardsProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}
    >
      <StatCard
        label="Received"
        value={loading ? '...' : formatUSDCAmount(summary.totalAllTime)}
        sublabel="Paid to your wallet since launch"
        icon={<Gift size={16} />}
        accent
      />
      <StatCard
        label="Last 30 Days"
        value={loading ? '...' : formatUSDCAmount(summary.total30d)}
        sublabel="Dividends earned this month"
        icon={<Coins size={16} />}
      />
      <StatCard
        label="Last 7 Days"
        value={loading ? '...' : formatUSDCAmount(summary.total7d)}
        sublabel="Dividends earned this week"
        icon={<CheckCircle2 size={16} />}
      />
      <StatCard
        label="Projected Monthly"
        value={loading ? '...' : formatUSDCAmount(summary.projectedMonthly)}
        sublabel="Based on trailing 7-day average"
        icon={<TrendingUp size={16} />}
      />
    </div>
  )
}
