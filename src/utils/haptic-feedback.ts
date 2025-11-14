/**
 * Haptic Feedback Utility
 * Provides tactile feedback for user interactions
 */

// ============================================
// TYPES
// ============================================

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export interface HapticConfig {
  enabled: boolean;
  intensity: number; // 0-1
  patterns: Record<HapticPattern, number[]>;
}

// ============================================
// DEFAULT CONFIGURATION
// ============================================

const DEFAULT_PATTERNS: Record<HapticPattern, number[]> = {
  light: [10],
  medium: [20],
  heavy: [30],
  success: [10, 50, 10],
  warning: [20, 100, 20, 100, 20],
  error: [50, 100, 50],
};

const DEFAULT_CONFIG: HapticConfig = {
  enabled: true,
  intensity: 1.0,
  patterns: DEFAULT_PATTERNS,
};

// ============================================
// HAPTIC FEEDBACK CLASS
// ============================================

class HapticFeedbackManager {
  private config: HapticConfig = DEFAULT_CONFIG;
  private supported: boolean = false;

  constructor() {
    this.supported = this.checkSupport();
  }

  /**
   * Check if Vibration API is supported
   */
  private checkSupport(): boolean {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }

  /**
   * Check if haptic feedback is supported
   */
  public isSupported(): boolean {
    return this.supported;
  }

  /**
   * Configure haptic feedback
   */
  public configure(config: Partial<HapticConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      patterns: {
        ...this.config.patterns,
        ...(config.patterns || {}),
      },
    };
  }

  /**
   * Get current configuration
   */
  public getConfig(): HapticConfig {
    return { ...this.config };
  }

  /**
   * Trigger haptic feedback
   */
  public trigger(pattern: HapticPattern): void {
    if (!this.supported || !this.config.enabled) {
      return;
    }

    const vibrationPattern = this.config.patterns[pattern];
    if (!vibrationPattern) {
      console.warn(`Haptic pattern "${pattern}" not found`);
      return;
    }

    // Apply intensity scaling
    const scaledPattern = vibrationPattern.map(duration =>
      Math.round(duration * this.config.intensity)
    );

    try {
      navigator.vibrate(scaledPattern);
    } catch (error) {
      console.error('Error triggering haptic feedback:', error);
    }
  }

  /**
   * Cancel any ongoing vibration
   */
  public cancel(): void {
    if (this.supported) {
      try {
        navigator.vibrate(0);
      } catch (error) {
        console.error('Error canceling haptic feedback:', error);
      }
    }
  }

  /**
   * Enable haptic feedback
   */
  public enable(): void {
    this.config.enabled = true;
  }

  /**
   * Disable haptic feedback
   */
  public disable(): void {
    this.config.enabled = false;
    this.cancel();
  }

  /**
   * Set intensity (0-1)
   */
  public setIntensity(intensity: number): void {
    this.config.intensity = Math.max(0, Math.min(1, intensity));
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const HapticFeedback = new HapticFeedbackManager();

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Trigger light haptic feedback
 */
export function hapticLight(): void {
  HapticFeedback.trigger('light');
}

/**
 * Trigger medium haptic feedback
 */
export function hapticMedium(): void {
  HapticFeedback.trigger('medium');
}

/**
 * Trigger heavy haptic feedback
 */
export function hapticHeavy(): void {
  HapticFeedback.trigger('heavy');
}

/**
 * Trigger success haptic feedback
 */
export function hapticSuccess(): void {
  HapticFeedback.trigger('success');
}

/**
 * Trigger warning haptic feedback
 */
export function hapticWarning(): void {
  HapticFeedback.trigger('warning');
}

/**
 * Trigger error haptic feedback
 */
export function hapticError(): void {
  HapticFeedback.trigger('error');
}
