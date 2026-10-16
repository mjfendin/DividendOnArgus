/**
 * Cron refresh — deep-scans Argus Portals and writes the discovery cache.
 * Runs on Vercel Cron (see vercel.json) and on manual GET/POST.
 */

import { scanArgusPortals } from './_scan'
import { getCachedDiscovery, setCachedDiscovery } from './_kv'

export const config = { runtime: 'edge', maxDuration: 60 }

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const previous = await getCachedDiscovery()
    const prevUpdatedAt = previous?.updatedAt ?? 0

    // Refresh at most once per 15 minutes to avoid hammering Arc RPC
    if (Date.now() - prevUpdatedAt < 15 * 60 * 1000) {
      return new Response(
        JSON.stringify({
          ok: true,
          skipped: true,
          reason: 'cache-fresh',
          updatedAt: prevUpdatedAt,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const result = await scanArgusPortals(30n) // deeper scan for cron (3k blocks/portal)

    await setCachedDiscovery({
      tokens: result.tokens,
      leaderboard: result.leaderboard,
      updatedAt: Date.now(),
      source: 'onchain-cron',
    })

    return new Response(
      JSON.stringify({
        ok: true,
        tokens: result.tokens.length,
        leaderboard: result.leaderboard.length,
        updatedAt: Date.now(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
