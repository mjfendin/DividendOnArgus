/**
 * RPC proxy — forwards JSON-RPC to Arc Mainnet server-side.
 * Node signature (req, res) for Vercel serverless functions.
 */

const RPC_URLS = [
  'https://rpc.mainnet.arc.io/',
  'https://rpc.blockdaemon.mainnet.arc.io/',
  'https://rpc.drpc.mainnet.arc.io/',
  'https://rpc.quicknode.mainnet.arc.io/',
]

export const config = { maxDuration: 60 }

export default async function handler(
  req: { method?: string; body?: unknown },
  res: { status: (code: number) => { json: (data: unknown) => void } },
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ jsonrpc: '2.0', id: null, error: { code: 405, message: 'Method not allowed' } })
    return
  }

  const body = req.body
  if (body === null || typeof body !== 'object') {
    res.status(400).json({ jsonrpc: '2.0', id: null, error: { code: 400, message: 'Invalid JSON body' } })
    return
  }

  for (const url of RPC_URLS) {
    try {
      const upstream = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (upstream.ok) {
        const data = await upstream.json()
        res.status(200).json(data)
        return
      }
    } catch {
      // try next RPC
    }
  }

  res.status(502).json({ jsonrpc: '2.0', id: null, error: { code: 502, message: 'All Arc RPC endpoints unavailable' } })
}
