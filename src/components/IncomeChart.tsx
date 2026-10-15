import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { TokenHolding } from '../hooks/useDividendData'

interface IncomeChartProps {
  holdings: TokenHolding[]
  loading: boolean
  theme: 'dark' | 'light'
}

interface DayPoint {
  day: string
  value: number | null
  hasData: boolean
}

function buildChartData(holdings: TokenHolding[]): DayPoint[] {
  const now = new Date()
  const days: DayPoint[] = []

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    // Sum dividends across tokens for this day index
    const dayIndex = 29 - i
    let dayTotal = 0
    let anyData = false

    for (const h of holdings) {
      if (h.dailyHistory[dayIndex] !== null) {
        dayTotal += h.dailyHistory[dayIndex]
        anyData = true
      }
    }

    days.push({
      day: label,
      value: anyData ? dayTotal : null,
      hasData: anyData,
    })
  }

  return days
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number | null; name: string }>
  label?: string
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const val = payload[0].value
  return (
    <div
      style={{
        background: 'var(--surface-strong)',
        border: '1px solid var(--border-strong)',
        borderRadius: 10,
        padding: '10px 14px',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div style={{ fontSize: 12, color: 'var(--subtle)', marginBottom: 4 }}>{label}</div>
      <div
        className="display tabular"
        style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}
      >
        {val !== null
          ? new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: val < 0.01 ? 4 : 2,
              maximumFractionDigits: val < 0.01 ? 4 : 2,
            }).format(val)
          : 'No data'}
      </div>
    </div>
  )
}

export function IncomeChart({ holdings, loading, theme }: IncomeChartProps) {
  const data = buildChartData(holdings)
  const hasAnyData = data.some(d => d.hasData)

  const accentColor = theme === 'dark' ? '#acc6e9' : '#122d45'
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(18,45,69,0.08)'
  const axisColor = theme === 'dark' ? '#64748b' : '#94a3b8'

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '24px',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        marginBottom: 24,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div>
          <div
            className="display"
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--ink)',
              letterSpacing: '-0.01em',
            }}
          >
            Cumulative Daily Income
          </div>
          <div style={{ fontSize: 12, color: 'var(--subtle)', marginTop: 2 }}>
            Last 30 days — all tokens combined
          </div>
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--subtle)',
            background: 'var(--surface-muted)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '3px 10px',
          }}
        >
          30d
        </div>
      </div>

      {loading ? (
        <div
          style={{
            height: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--subtle)',
            fontSize: 14,
          }}
        >
          Loading chart data...
        </div>
      ) : !hasAnyData ? (
        <div
          style={{
            height: 200,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--subtle)',
            fontSize: 14,
            gap: 6,
          }}
        >
          <ChartEmptyIcon />
          <span>No daily dividend data available yet</span>
          <span style={{ fontSize: 12, opacity: 0.7 }}>
            Chart populates when dividend event history is found
          </span>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="dividendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={accentColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridColor}
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: axisColor, fontFamily: 'DM Sans' }}
              tickLine={false}
              axisLine={false}
              interval={4}
            />
            <YAxis
              tick={{ fontSize: 11, fill: axisColor, fontFamily: 'DM Sans' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) =>
                v === 0 ? '$0' : v < 0.01 ? `$${v.toFixed(4)}` : `$${v.toFixed(2)}`
              }
              width={60}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: accentColor, strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={accentColor}
              strokeWidth={2}
              fill="url(#dividendGradient)"
              dot={false}
              activeDot={{ r: 4, fill: accentColor, strokeWidth: 0 }}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

function ChartEmptyIcon() {
  return (
    <svg width="40" height="32" viewBox="0 0 40 32" fill="none">
      <rect x="0" y="20" width="8" height="12" rx="2" fill="var(--border)" />
      <rect x="10" y="12" width="8" height="20" rx="2" fill="var(--border)" />
      <rect x="20" y="16" width="8" height="16" rx="2" fill="var(--border)" />
      <rect x="30" y="8" width="8" height="24" rx="2" fill="var(--border)" />
    </svg>
  )
}
