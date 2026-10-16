import { useState } from 'react'
import { Copy, Check, ExternalLink } from 'lucide-react'

const DIVIDEND_CA = '0xE9b7A558D7d46018a4A9bc32C249338D4aAEcA6e'

export function DividendHero() {
  const [copied, setCopied] = useState(false)

  async function copyCA() {
    try {
      await navigator.clipboard.writeText(DIVIDEND_CA)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea')
      ta.value = DIVIDEND_CA
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '24px 28px',
        marginBottom: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div
            className="display"
            style={{ fontSize: 24, fontWeight: 400, color: 'var(--ink)', letterSpacing: 0 }}
          >
            $DIVIDEND
          </div>
          <div style={{ fontSize: 13, color: 'var(--subtle)', marginTop: 2 }}>
            Creator funds 30% · Dividends 70%
          </div>
        </div>
        <a
          href={`https://argus.world/token/${DIVIDEND_CA}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--accent)',
            textDecoration: 'none',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '8px 14px',
          }}
        >
          <ExternalLink size={14} />
          Buy on Argus
        </a>
      </div>

      <button
        onClick={() => void copyCA()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          background: 'var(--surface-muted)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '14px 18px',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: "'Roboto Mono', monospace",
          fontSize: 14,
          color: 'var(--ink)',
          transition: 'border-color 0.2s ease',
        }}
        onMouseEnter={e => {
          ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'
        }}
        onMouseLeave={e => {
          ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
        }}
      >
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {DIVIDEND_CA}
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 600,
            color: copied ? 'var(--success)' : 'var(--accent)',
            flexShrink: 0,
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy'}
        </span>
      </button>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
        }}
      >
        <div style={{ fontSize: 12, color: 'var(--subtle)', lineHeight: 1.6 }}>
          <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Step 1</span> — Bridge your funds to Arc:{' '}
          <a href="https://argus.world/bridge" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
            argus.world/bridge ↗
          </a>
        </div>
        <div style={{ fontSize: 12, color: 'var(--subtle)', lineHeight: 1.6 }}>
          <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Step 2</span> — Buy $DIVIDEND through Argus (CA above, click to copy)
        </div>
      </div>
    </div>
  )
}
