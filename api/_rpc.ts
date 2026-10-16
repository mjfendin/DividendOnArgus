/**
 * Serverless RPC proxy for Arc Mainnet.
 *
 * The browser cannot reliably call rpc.mainnet.arc.io (CORS + rate limits),
 * so this function forwards JSON-RPC requests server-side where the Arc
 * endpoints are reachable and shared rate limits are avoided.
 */

const RPC_URLS = [
  'https://rpc.mainnet.arc.io/',
  'https://rpc.blockdaemon.mainnet.arc.io/',
  'https://rpc.drpc.mainnet.arc.io/',
  'https://rpc.quicknode.mainnet.arc.io/',
]

export async function handleRpcRequest(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (req.method !== 'POST') {
    return jsonError('Method not allowed', 405)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonError('Invalid JSON body', 400)
  }

  const isBatch = Array.isArray(body)

  for (const url of RPC_URLS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const data = await res.text()
        return new Response(data, {
          status: 200,
          headers: corsHeaders(),
        })
      }
      // Some endpoints return JSON-RPC errors with 200; try next on HTTP failure
    } catch {
      // try next RPC
    }
  }

  return jsonError('All Arc RPC endpoints unavailable', 502)
}

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function jsonError(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: status, message } }),
    { status, headers: corsHeaders() },
  )
}
