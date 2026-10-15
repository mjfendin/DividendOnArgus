import { ExternalLink } from 'lucide-react'

interface EmptyStateProps {
  type: 'no-tokens' | 'no-wallet' | 'wrong-network'
  onSwitchNetwork?: () => void
}

export function EmptyState({ type, onSwitchNetwork }: EmptyStateProps) {
  if (type === 'no-wallet') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 360,
          gap: 20,
          textAlign: 'center',
          padding: '40px 24px',
        }}
      >
        <WalletIllustration />
        <div>
          <div
            className="display"
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--ink)',
              letterSpacing: '-0.02em',
              marginBottom: 10,
            }}
          >
            Connect your wallet
          </div>
          <div
            style={{
              fontSize: 15,
              color: 'var(--muted)',
              maxWidth: 400,
              lineHeight: 1.6,
            }}
          >
            Connect a wallet on Arc Mainnet to see all your dividend-paying tokens
            in one place. This is a read-only dashboard — no signatures required.
          </div>
        </div>
      </div>
    )
  }

  if (type === 'wrong-network') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 360,
          gap: 20,
          textAlign: 'center',
          padding: '40px 24px',
        }}
      >
        <NetworkIllustration />
        <div>
          <div
            className="display"
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--ink)',
              letterSpacing: '-0.02em',
              marginBottom: 10,
            }}
          >
            Switch to Arc Mainnet
          </div>
          <div
            style={{
              fontSize: 15,
              color: 'var(--muted)',
              maxWidth: 400,
              lineHeight: 1.6,
              marginBottom: 20,
            }}
          >
            This dashboard reads dividend data from Arc Mainnet (chain ID 5042).
            Your wallet is currently connected to a different network.
          </div>
          {onSwitchNetwork && (
            <button
              onClick={onSwitchNetwork}
              style={{
                background: 'var(--accent)',
                color: 'var(--bg)',
                border: 'none',
                borderRadius: 10,
                padding: '12px 24px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              Switch to Arc Mainnet
            </button>
          )}
        </div>
      </div>
    )
  }

  // no-tokens
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 360,
        gap: 20,
        textAlign: 'center',
        padding: '40px 24px',
      }}
    >
      <DividendIllustration />
      <div>
        <div
          className="display"
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--ink)',
            letterSpacing: '-0.02em',
            marginBottom: 10,
          }}
        >
          No dividend tokens found
        </div>
        <div
          style={{
            fontSize: 15,
            color: 'var(--muted)',
            maxWidth: 460,
            lineHeight: 1.6,
            marginBottom: 20,
          }}
        >
          Your wallet does not currently hold any tokens with a dividend mechanism
          on Arc Mainnet. Argus tokens earn USDC dividends automatically from
          trading tax — token holders receive a share of every trade.
        </div>
        <a
          href="https://argus.world"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--accent)',
            color: 'var(--bg)',
            textDecoration: 'none',
            borderRadius: 10,
            padding: '12px 24px',
            fontSize: 14,
            fontWeight: 700,
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          <ExternalLink size={14} />
          Discover tokens on Argus
        </a>
      </div>
      <div
        style={{
          maxWidth: 440,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '16px 20px',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            color: 'var(--subtle)',
            marginBottom: 8,
          }}
        >
          How dividends work
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
          Tokens launched on Argus apply a trading tax on every buy and sell. A
          portion of that tax is distributed as USDC to all holders
          proportionally and automatically — no staking or claiming required.
        </div>
      </div>
    </div>
  )
}

function WalletIllustration() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="16" fill="var(--surface-muted)" />
      <rect x="14" y="22" width="36" height="24" rx="4" stroke="var(--accent)" strokeWidth="2" fill="none" />
      <rect x="28" y="28" width="16" height="12" rx="3" fill="var(--accent)" opacity="0.2" stroke="var(--accent)" strokeWidth="1.5" />
      <circle cx="36" cy="34" r="2" fill="var(--accent)" />
      <path d="M14 28 L50 28" stroke="var(--accent)" strokeWidth="2" />
    </svg>
  )
}

function NetworkIllustration() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="16" fill="var(--surface-muted)" />
      <circle cx="32" cy="32" r="14" stroke="var(--accent)" strokeWidth="2" fill="none" />
      <path d="M20 32 Q32 20 44 32 Q32 44 20 32" stroke="var(--accent)" strokeWidth="1.5" fill="none" />
      <line x1="32" y1="18" x2="32" y2="46" stroke="var(--accent)" strokeWidth="1.5" />
      <line x1="18" y1="32" x2="46" y2="32" stroke="var(--accent)" strokeWidth="1.5" />
    </svg>
  )
}

function DividendIllustration() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="16" fill="var(--surface-muted)" />
      <circle cx="32" cy="30" r="12" stroke="var(--accent)" strokeWidth="2" fill="none" />
      <path d="M32 22 L32 38" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
      <path d="M28 26 L32 22 L36 26" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 46 L32 42 L44 46" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </svg>
  )
}
