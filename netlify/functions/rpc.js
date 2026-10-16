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

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: 405, message: 'Method not allowed' } }),
    }
  }

  let body
  try {
    body = JSON.parse(event.body || 'null')
  } catch {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: 400, message: 'Invalid JSON body' } }),
    }
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
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      }
    } catch {
      // try next RPC
    }
  }

  return {
    statusCode: 502,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: 502, message: 'All Arc RPC endpoints unavailable' } }),
  }
}
