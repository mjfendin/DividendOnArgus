/**
 * Netlify Function — discovery
 * Serves verified Argus dividend token data.
 */

const VERIFIED_TOKENS = [
  { token: '0xE9b7A558D7d46018a4A9bc32C249338D4aAEcA6e', name: 'Dividend', symbol: 'DIVIDEND', portalId: 7, splitter: null, totalPaid: '0', payoutCount: 0, buyTaxBps: 0, sellTaxBps: 0, dividendBps: 7000 },
  { token: '0xd96ac2f97f02845c0dd8e80aa6e3c6928583b205', name: 'UpSide Down Cat', symbol: 'USDC', portalId: 7, splitter: '0xd94c8f93a1', totalPaid: '0', payoutCount: 0, buyTaxBps: 0, sellTaxBps: 25, dividendBps: 10000 },
  { token: '0x1096514f516d9ee354899cee035a335f22fee6ab', name: 'RAMP', symbol: 'RAMP', portalId: 7, splitter: '0x2d8227310222e191afe263cd57a494ff12fdc793', totalPaid: '0', payoutCount: 0, buyTaxBps: 100, sellTaxBps: 100, dividendBps: 2500 },
  { token: '0xecd11966a993d694ae2c12c46c2a3538378d9758', name: 'DIETCOKE', symbol: 'DIETCOKE', portalId: 7, splitter: '0x476202d28d8d54c14728c8a71d1199ef48a19e0f', totalPaid: '0', payoutCount: 0, buyTaxBps: 100, sellTaxBps: 100, dividendBps: 2500 },
  { token: '0xafff46c8bf5a6951bd34de332a9d71f3df347ac3', name: 'DANTE', symbol: 'DANTE', portalId: 7, splitter: '0xeb29dc9bdea0e4e27d7b9a63cd6e9e0a19e84f4a', totalPaid: '0', payoutCount: 0, buyTaxBps: 100, sellTaxBps: 100, dividendBps: 2500 },
]

export async function handler(_event) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      tokens: VERIFIED_TOKENS,
      leaderboard: [],
      updatedAt: Date.now(),
      source: 'netlify-verified-static',
    }),
  }
}
