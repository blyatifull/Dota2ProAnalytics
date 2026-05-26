import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  HERO_STATS: 3600,      // 1 hour
  MATCH_LIST: 300,       // 5 minutes
  MATCH_DETAILS: 86400,  // 24 hours
  DRAFT_STATS: 1800,     // 30 minutes
}

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number
): Promise<T> {
  try {
    const cached = await redis.get<T>(key)
    if (cached) {
      return cached
    }
  } catch (error) {
    console.error('[Redis] Cache get error:', error)
  }

  const data = await fetcher()

  try {
    await redis.set(key, data, { ex: ttl })
  } catch (error) {
    console.error('[Redis] Cache set error:', error)
  }

  return data
}
