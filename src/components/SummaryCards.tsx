import { TrendingUp, Calendar, Coins, BarChart2 } from 'lucide-react'
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
        background: accent ? 'var(--surface-strong)' : 'var(--surface)',
        border: `1px solid ${accent ? 'var(--border-strong)' : 'var(--border)'}`,
        borderRadius: 16,
        padding: '20px 24px',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
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
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--subtle)',
          }}
        >
          {label}
        </span>
        <span style={{ color: 'var(--accent)', opacity: 0.7 }}>{icon}</span>
      </div>
      <div
        className="display tabular"
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--ink)',
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {sublabel && (
        <div style={{ fontSize: 12, color: 'var(--subtle)', marginTop: -2 }}>
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
        label="Total Dividends"
        value={loading ? '...' : formatUSDCAmount(summary.totalAllTime)}
        sublabel="All time, across all tokens"
        icon={<Coins size={16} />}
        accent
      />
      <StatCard
        label="Last 30 Days"
        value={loading ? '...' : formatUSDCAmount(summary.total30d)}
        sublabel="Dividends earned this month"
        icon={<Calendar size={16} />}
      />
      <StatCard
        label="Active Tokens"
        value={loading ? '...' : String(summary.activeDividendTokens)}
        sublabel="Tokens with dividend history"
        icon={<BarChart2 size={16} />}
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
