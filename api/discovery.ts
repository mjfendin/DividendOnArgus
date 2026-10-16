/**
 * Discovery endpoint — returns verified Argus dividend discovery data.
 * Node signature (req, res) for Vercel serverless functions.
 */

import { getCachedDiscovery, setCachedDiscovery } from './_kv.ts'
import { scanArgusPortals } from './_scan.ts'

export const config = { maxDuration: 60 }

export default async function handler(
  _req: unknown,
  res: { status: (code: number) => { json: (data: unknown) => void } },
): Promise<void> {
  let data = await getCachedDiscovery()

  if (!data) {
    const result = await scanArgusPortals(0n)
    data = {
      tokens: result.tokens,
      leaderboard: result.leaderboard,
      updatedAt: Date.now(),
      source: 'verified-static',
    }
    await setCachedDiscovery(data)
  }

  res.status(200).json(data)
}
