import type { TokenHolding } from '../hooks/useDividendData'
import { formatUSDCAmount, formatTokenBalance } from '../hooks/useDividendData'

function figureToString(figure: TokenHolding['dividendTotal']): string {
  if (figure.status === 'available') {
    return formatUSDCAmount(figure.value, figure.decimals).replace('$', '').replace(',', '')
  }
  return 'unavailable'
}

export function exportDividendsCSV(holdings: TokenHolding[]): void {
  const header = [
    'token',
    'ticker',
    'balance',
    'dividends_24h',
    'dividends_7d',
    'dividends_30d',
    'dividends_all_time',
    'yield_percent',
  ]

  const rows = holdings.map(h => [
    h.name,
    h.symbol,
    formatTokenBalance(h.balance, h.balanceDecimals),
    figureToString(h.dividend24h),
    figureToString(h.dividend7d),
    figureToString(h.dividend30d),
    figureToString(h.dividendTotal),
    h.yieldPercent !== null ? h.yieldPercent.toFixed(2) + '%' : 'unavailable',
  ])

  const csvContent = [header, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dividend-portfolio-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
