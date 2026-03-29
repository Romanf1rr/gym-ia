/**
 * Lightweight in-memory TTL cache for API responses.
 * Prevents redundant network calls on tab focus events.
 *
 * Usage:
 *   import cache from './cache.service';
 *   const data = await cache.fetch('key', () => api.get('/endpoint'), 60);
 *   cache.invalidate('key');
 *   cache.invalidateAll();
 */

const store = new Map(); // key → { data, expiresAt }

const cache = {
  /**
   * Get cached value if still fresh, otherwise fetch and cache it.
   * @param {string} key   - Cache key
   * @param {Function} fn  - Async function that returns the fresh data
   * @param {number} ttl   - Time to live in seconds (default 30)
   */
  async fetch(key, fn, ttl = 30) {
    const entry = store.get(key);
    if (entry && Date.now() < entry.expiresAt) {
      return entry.data;
    }
    const data = await fn();
    store.set(key, { data, expiresAt: Date.now() + ttl * 1000 });
    return data;
  },

  /** Force-invalidate one key (e.g. after a mutation). */
  invalidate(key) {
    store.delete(key);
  },

  /** Invalidate all keys that start with a given prefix. */
  invalidatePrefix(prefix) {
    for (const key of store.keys()) {
      if (key.startsWith(prefix)) store.delete(key);
    }
  },

  /** Wipe the entire cache (e.g. on logout). */
  invalidateAll() {
    store.clear();
  },

  /** Manually set a value (useful after a write to pre-warm cache). */
  set(key, data, ttl = 30) {
    store.set(key, { data, expiresAt: Date.now() + ttl * 1000 });
  },
};

export default cache;
