// In-memory cache with TTL
const cache = new Map<string, { data: string; expires: number }>();

export const cacheManager = {
  async get(key: string): Promise<string | null> {
    const item = cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expires) {
      cache.delete(key);
      return null;
    }
    return item.data;
  },
  async set(key: string, data: string, ttlSeconds: number = 300): Promise<void> {
    cache.set(key, { data, expires: Date.now() + ttlSeconds * 1000 });
  },
  async clear(): Promise<void> {
    cache.clear();
  },
  get stats() {
    return { size: cache.size, entries: Array.from(cache.entries()).filter(([_, v]) => Date.now() < v.expires).length };
  }
};
