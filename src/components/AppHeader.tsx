import { ConnectKitButton } from 'connectkit'
import { Moon, Sun, RefreshCw } from 'lucide-react'
import { formatUSDCAmount } from '../hooks/useDividendData'

interface AppHeaderProps {
  theme: 'dark' | 'light'
  onThemeToggle: () => void
  usdcBalance: bigint | null
  balanceLoading: boolean
  onRefresh?: () => void
  refreshing?: boolean
}

export function AppHeader({
  theme,
  onThemeToggle,
  usdcBalance,
  balanceLoading,
  onRefresh,
  refreshing,
}: AppHeaderProps) {
  return (
    <header
      style={{
        borderBottom: '1px solid var(--border)',
        background: 'rgba(15, 16, 17, 0.72)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        {/* Logo + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <LogoMark />
          <div style={{ minWidth: 0 }}>
            <div
              className="display"
              style={{
                fontSize: 20,
                fontWeight: 400,
                color: 'var(--ink)',
                letterSpacing: 0,
                whiteSpace: 'nowrap',
              }}
            >
              Dividend Tracker
            </div>
            <div
              className="eyebrow"
              style={{ fontSize: 10 }}
            >
              Arc Mainnet
            </div>
          </div>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* USDC balance pill */}
          {usdcBalance !== null && (
            <div className="pill" style={{ whiteSpace: 'nowrap' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
              {balanceLoading ? 'Loading…' : `${formatUSDCAmount(usdcBalance)} USDC`}
            </div>
          )}

          {/* Refresh */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              title="Refresh data"
              className="btn btn-ghost"
              style={{ padding: '8px 10px' }}
            >
              <RefreshCw
                size={16}
                style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}
              />
            </button>
          )}

          {/* Theme toggle */}
          <button
            onClick={onThemeToggle}
            title="Toggle theme"
            className="btn btn-ghost"
            style={{ padding: '8px 10px' }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Wallet button */}
          <ConnectKitButton />
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </header>
  )
}

function LogoMark() {
  return (
    <img
      src="/logo-square.png"
      alt="Dividend Portfolio Tracker"
      width={48}
      height={48}
      style={{
        borderRadius: '50%',
        objectFit: 'contain',
        display: 'block',
        border: '1px solid var(--border-strong)',
      }}
    />
  )
}
