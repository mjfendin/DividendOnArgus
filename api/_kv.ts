/**
 * KV helper for serverless discovery cache.
 *
 * Uses Vercel KV when KV_REST_API_URL / KV_REST_API_TOKEN are present.
 * Falls back to an in-memory object (per-function-instance) when not
 * configured — the cron will still refresh it, but cache is not durable
 * across cold starts in that mode.
 */

export const KV_AVAILABLE = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
)

const KV_DISCOVERY_KEY = 'dividentonargus:discovery'

interface DiscoveryPayload {
  tokens: unknown[]
  leaderboard: unknown[]
  updatedAt: number | null
  source?: string
}

export async function getCachedDiscovery(): Promise<DiscoveryPayload | null> {
  if (KV_AVAILABLE) {
    try {
      const { kv } = await import('@vercel/kv')
      const raw = await kv.get<string>(KV_DISCOVERY_KEY)
      if (raw) return JSON.parse(raw) as DiscoveryPayload
      return null
    } catch {
      return null
    }
  }

  // In-memory fallback (per instance)
  const g = globalThis as unknown as { __dptDiscoveryCache?: DiscoveryPayload }
  return g.__dptDiscoveryCache ?? null
}

export async function setCachedDiscovery(data: DiscoveryPayload): Promise<void> {
  if (KV_AVAILABLE) {
    try {
      const { kv } = await import('@vercel/kv')
      await kv.set(KV_DISCOVERY_KEY, JSON.stringify(data))
      return
    } catch {
      // fall through to memory
    }
  }

  const g = globalThis as unknown as { __dptDiscoveryCache?: DiscoveryPayload }
  g.__dptDiscoveryCache = data
}
