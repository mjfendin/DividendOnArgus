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
        background: 'var(--surface)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 20px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        {/* Logo + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <LogoMark />
          <div style={{ minWidth: 0 }}>
            <div
              className="display"
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--ink)',
                letterSpacing: '-0.02em',
                whiteSpace: 'nowrap',
              }}
            >
              Dividend Portfolio Tracker
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--subtle)',
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              Arc Mainnet
            </div>
          </div>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* USDC balance pill */}
          {usdcBalance !== null && (
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--muted)',
                background: 'var(--surface-muted)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                padding: '4px 12px',
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
              }}
            >
              {balanceLoading ? (
                <span style={{ opacity: 0.5 }}>Loading...</span>
              ) : (
                <>{formatUSDCAmount(usdcBalance)} USDC</>
              )}
            </div>
          )}

          {/* Refresh */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              title="Refresh data"
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '6px 8px',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                color: 'var(--subtle)',
                display: 'flex',
                alignItems: 'center',
                opacity: refreshing ? 0.5 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              <RefreshCw
                size={15}
                style={{
                  animation: refreshing ? 'spin 1s linear infinite' : 'none',
                }}
              />
            </button>
          )}

          {/* Theme toggle */}
          <button
            onClick={onThemeToggle}
            title="Toggle theme"
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
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
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
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="var(--accent)" opacity="0.15" />
      <circle cx="16" cy="13" r="6" fill="none" stroke="var(--accent)" strokeWidth="1.8" />
      <circle cx="16" cy="13" r="2.5" fill="var(--accent)" />
      <circle cx="10" cy="11" r="1.2" fill="var(--accent)" opacity="0.6" />
      <circle cx="22" cy="11" r="1.2" fill="var(--accent)" opacity="0.6" />
      <circle cx="16" cy="7" r="1.2" fill="var(--accent)" opacity="0.6" />
      <circle cx="16" cy="19" r="1.2" fill="var(--accent)" opacity="0.6" />
      <path d="M12 23 L16 22 L20 23" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 26 L16 24 L22 26" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}
