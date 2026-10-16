/**
 * Discovery endpoint — returns cached Argus dividend discovery data.
 *
 * The actual on-chain scan is heavy (many getLogs calls against a rate-limited
 * Arc RPC), so this endpoint serves a server-side cache that is refreshed by
 * the Vercel cron (api/cron-refresh.ts) and on-demand when empty.
 */

import { getCachedDiscovery, setCachedDiscovery, KV_AVAILABLE } from './_kv'

export const config = { runtime: 'edge' }

export default async function handler(): Promise<Response> {
  let data = await getCachedDiscovery()

  if (!data) {
    // First hit after cold start — run a lightweight scan inline.
    try {
      const { scanArgusPortals } = await import('./_scan')
      const result = await scanArgusPortals(2n) // shallow scan for first paint
      data = {
        tokens: result.tokens,
        leaderboard: result.leaderboard,
        updatedAt: Date.now(),
        source: 'onchain-inline',
      }
      await setCachedDiscovery(data)
    } catch {
      data = null
    }
  }

  if (!data) {
    return new Response(
      JSON.stringify({
        tokens: [],
        leaderboard: [],
        updatedAt: null,
        source: KV_AVAILABLE ? 'kv-empty' : 'kv-unavailable',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    )
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
