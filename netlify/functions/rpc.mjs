/**
 * Netlify Function — RPC proxy
 * Forwards JSON-RPC to Arc Mainnet server-side.
 */

const RPC_URLS = [
  'https://rpc.mainnet.arc.io/',
  'https://rpc.blockdaemon.mainnet.arc.io/',
  'https://rpc.drpc.mainnet.arc.io/',
  'https://rpc.quicknode.mainnet.arc.io/',
]

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: 405, message: 'Method not allowed' } }),
      { status: 405, headers: { 'Content-Type': 'application/json' } },
    )
  }

  let body
  try {
    body = await req.json()
  } catch {
    return new Response(
      JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: 400, message: 'Invalid JSON body' } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
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
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    } catch {
      // try next RPC
    }
  }

  return new Response(
    JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: 502, message: 'All Arc RPC endpoints unavailable' } }),
    { status: 502, headers: { 'Content-Type': 'application/json' } },
  )
}

export const config = { path: '/api/rpc' }
