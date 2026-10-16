/**
 * Cron refresh — refreshes the discovery cache.
 * Node signature (req, res) for Vercel serverless functions.
 */

import { scanArgusPortals } from './_scan.ts'
import { getCachedDiscovery, setCachedDiscovery } from './_kv.ts'

export const config = { maxDuration: 60 }

export default async function handler(
  req: { method?: string },
  res: { status: (code: number) => { json: (data: unknown) => void } },
): Promise<void> {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  try {
    const previous = await getCachedDiscovery()
    const prevUpdatedAt = previous?.updatedAt ?? 0

    // Refresh at most once per 15 minutes
    if (Date.now() - prevUpdatedAt < 15 * 60 * 1000) {
      res.status(200).json({
        ok: true,
        skipped: true,
        reason: 'cache-fresh',
        updatedAt: prevUpdatedAt,
      })
      return
    }

    const result = await scanArgusPortals(0n)

    await setCachedDiscovery({
      tokens: result.tokens,
      leaderboard: result.leaderboard,
      updatedAt: Date.now(),
      source: 'verified-static',
    })

    res.status(200).json({
      ok: true,
      tokens: result.tokens.length,
      leaderboard: result.leaderboard.length,
      updatedAt: Date.now(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ ok: false, error: message })
  }
}
