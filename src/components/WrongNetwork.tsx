import { useSwitchChain } from 'wagmi'
import { arc } from 'viem/chains'

export function WrongNetworkBanner() {
  const { switchChain, isPending } = useSwitchChain()

  return (
    <div
      style={{
        background: 'rgba(186, 43, 76, 0.12)',
        border: '1px solid rgba(186, 43, 76, 0.35)',
        borderRadius: 12,
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 24,
        flexWrap: 'wrap',
      }}
    >
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--danger)', marginBottom: 2 }}>
          Wrong Network
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
          Please switch to Arc Mainnet (chain ID 5042) to use this dashboard.
        </div>
      </div>
      <button
        onClick={() => switchChain({ chainId: arc.id })}
        disabled={isPending}
        style={{
          background: 'var(--danger)',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '9px 16px',
          fontSize: 13,
          fontWeight: 700,
          cursor: isPending ? 'not-allowed' : 'pointer',
          opacity: isPending ? 0.7 : 1,
          fontFamily: 'DM Sans, sans-serif',
          whiteSpace: 'nowrap',
        }}
      >
        {isPending ? 'Switching...' : 'Switch Network'}
      </button>
    </div>
  )
}
