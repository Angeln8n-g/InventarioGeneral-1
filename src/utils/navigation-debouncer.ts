/**
 * NavigationDebouncer
 * Prevents rapid consecutive navigations and manages navigation queue
 */

// ============================================
// TYPES
// ============================================

export interface NavigationRequest {
  path: string;
  timestamp: number;
  direction: 'left' | 'right';
}

export interface NavigationDebouncerConfig {
  minInterval: number;  // Minimum time between navigations (ms)
  maxQueueSize: number; // Maximum queued navigation requests
}

// ============================================
// NAVIGATION DEBOUNCER CLASS
// ============================================

export class NavigationDebouncer {
  private lastNavigation: number = 0;
  private config: NavigationDebouncerConfig;
  private queue: NavigationRequest[] = [];
  private isProcessing: boolean = false;

  constructor(config: Partial<NavigationDebouncerConfig> = {}) {
    this.config = {
      minInterval: config.minInterval ?? 500,
      maxQueueSize: config.maxQueueSize ?? 3,
    };
  }

  /**
   * Check if navigation can proceed immediately
   */
  canNavigate(): boolean {
    const now = Date.now();
    const timeSinceLastNav = now - this.lastNavigation;
    return timeSinceLastNav >= this.config.minInterval;
  }

  /**
   * Get time remaining until next navigation is allowed
   */
  getTimeRemaining(): number {
    const now = Date.now();
    const timeSinceLastNav = now - this.lastNavigation;
    const remaining = this.config.minInterval - timeSinceLastNav;
    return Math.max(0, remaining);
  }

  /**
   * Record a navigation
   */
  recordNavigation(): void {
    this.lastNavigation = Date.now();
  }

  /**
   * Add navigation request to queue
   */
  enqueue(request: Omit<NavigationRequest, 'timestamp'>): boolean {
    // Check if queue is full
    if (this.queue.length >= this.config.maxQueueSize) {
      return false;
    }

    // Add to queue with timestamp
    this.queue.push({
      ...request,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Get next navigation request from queue
   */
  dequeue(): NavigationRequest | null {
    return this.queue.shift() || null;
  }

  /**
   * Clear all queued navigation requests
   */
  clearQueue(): void {
    this.queue = [];
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Check if queue is empty
   */
  isQueueEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Process queued navigations
   */
  async processQueue(
    navigationHandler: (request: NavigationRequest) => Promise<void>
  ): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    while (!this.isQueueEmpty()) {
      // Wait for minimum interval
      const timeRemaining = this.getTimeRemaining();
      if (timeRemaining > 0) {
        await new Promise(resolve => setTimeout(resolve, timeRemaining));
      }

      // Process next request
      const request = this.dequeue();
      if (request) {
        try {
          await navigationHandler(request);
          this.recordNavigation();
        } catch (error) {
          console.error('Navigation failed:', error);
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * Reset debouncer state
   */
  reset(): void {
    this.lastNavigation = 0;
    this.queue = [];
    this.isProcessing = false;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<NavigationDebouncerConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let instance: NavigationDebouncer | null = null;

/**
 * Get singleton instance of NavigationDebouncer
 */
export function getNavigationDebouncer(): NavigationDebouncer {
  if (!instance) {
    instance = new NavigationDebouncer();
  }
  return instance;
}

/**
 * Reset singleton instance (useful for testing)
 */
export function resetNavigationDebouncer(): void {
  instance = null;
}
