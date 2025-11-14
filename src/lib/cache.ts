/**
 * Sistema de Caché en Memoria
 * 
 * Implementa un caché simple pero efectivo para reducir queries a la base de datos.
 * Ideal para datos que no cambian frecuentemente como item_types, categories, etc.
 */

interface CacheEntry<T> {
  data: T
  expiry: number
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0
  }

  /**
   * Obtener un valor del caché
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.stats.misses++
      return null
    }

    // Verificar si expiró
    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      this.stats.misses++
      return null
    }

    this.stats.hits++
    return entry.data as T
  }

  /**
   * Guardar un valor en el caché
   */
  set<T>(key: string, data: T, ttlMs: number = 300000): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs
    })
    this.stats.sets++
  }

  /**
   * Eliminar un valor del caché
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    if (deleted) this.stats.deletes++
    return deleted
  }

  /**
   * Eliminar múltiples valores por patrón
   */
  deletePattern(pattern: string): number {
    let count = 0
    const regex = new RegExp(pattern)
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
        count++
      }
    }
    
    this.stats.deletes += count
    return count
  }

  /**
   * Limpiar todo el caché
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Obtener estadísticas del caché
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0
    
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: hitRate.toFixed(2) + '%'
    }
  }

  /**
   * Limpiar entradas expiradas
   */
  cleanup(): number {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key)
        cleaned++
      }
    }

    return cleaned
  }
}

// Instancia singleton del caché
export const cache = new MemoryCache()

// Limpiar caché expirado cada 5 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const cleaned = cache.cleanup()
    if (cleaned > 0) {
      console.log(`[Cache] Cleaned ${cleaned} expired entries`)
    }
  }, 5 * 60 * 1000)
}

/**
 * Helper para cachear el resultado de una función
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = 300000
): Promise<T> {
  // Intentar obtener del caché
  const cached = cache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // Si no está en caché, ejecutar fetcher
  const data = await fetcher()
  
  // Guardar en caché
  cache.set(key, data, ttlMs)
  
  return data
}

/**
 * TTLs predefinidos
 */
export const CacheTTL = {
  SHORT: 60 * 1000,           // 1 minuto
  MEDIUM: 5 * 60 * 1000,      // 5 minutos
  LONG: 15 * 60 * 1000,       // 15 minutos
  VERY_LONG: 60 * 60 * 1000,  // 1 hora
} as const

/**
 * Claves de caché predefinidas
 */
export const CacheKeys = {
  ITEM_TYPES_ALL: 'item_types:all',
  ITEM_TYPES_TOOLS: 'item_types:tools',
  ITEM_TYPES_CONSUMABLES: 'item_types:consumables',
  ITEM_TYPE: (id: number) => `item_type:${id}`,
  CONSUMABLE_STOCK_ALL: 'consumable_stock:all',
  CONSUMABLE_STOCK: (id: number) => `consumable_stock:${id}`,
  USER: (id: number) => `user:${id}`,
  DASHBOARD_STATS: 'dashboard:stats',
} as const

/**
 * Invalidar caché relacionado
 */
export function invalidateCache(pattern: string): number {
  return cache.deletePattern(pattern)
}

// Exponer stats en desarrollo
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  ;(window as any).__cacheStats = () => cache.getStats()
}
