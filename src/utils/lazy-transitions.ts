/**
 * Lazy Transitions Utility
 * Dynamically loads complex animations only when needed
 */

// ============================================
// TYPES
// ============================================

export type ComplexAnimation = 'bounce' | 'elastic' | 'spring';

export interface AnimationModule {
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
}

// ============================================
// ANIMATION CACHE
// ============================================

const animationCache = new Map<ComplexAnimation, AnimationModule>();

// ============================================
// ANIMATION DEFINITIONS
// ============================================

/**
 * Bounce animation keyframes
 */
const bounceAnimation: AnimationModule = {
  keyframes: [
    { transform: 'scale(1)', offset: 0 },
    { transform: 'scale(1.1)', offset: 0.3 },
    { transform: 'scale(0.95)', offset: 0.5 },
    { transform: 'scale(1.05)', offset: 0.7 },
    { transform: 'scale(1)', offset: 1 },
  ],
  options: {
    duration: 600,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
};

/**
 * Elastic animation keyframes
 */
const elasticAnimation: AnimationModule = {
  keyframes: [
    { transform: 'scale(1)', offset: 0 },
    { transform: 'scale(1.25)', offset: 0.4 },
    { transform: 'scale(0.75)', offset: 0.6 },
    { transform: 'scale(1.15)', offset: 0.8 },
    { transform: 'scale(1)', offset: 1 },
  ],
  options: {
    duration: 800,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
};

/**
 * Spring animation keyframes
 */
const springAnimation: AnimationModule = {
  keyframes: [
    { transform: 'scale(0)', offset: 0 },
    { transform: 'scale(1.2)', offset: 0.5 },
    { transform: 'scale(0.9)', offset: 0.75 },
    { transform: 'scale(1)', offset: 1 },
  ],
  options: {
    duration: 500,
    easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
};

// ============================================
// LAZY LOADING FUNCTIONS
// ============================================

/**
 * Load animation module
 */
async function loadAnimation(type: ComplexAnimation): Promise<AnimationModule> {
  // Check cache first
  if (animationCache.has(type)) {
    return animationCache.get(type)!;
  }

  // Simulate async loading (in real app, this would be dynamic import)
  await new Promise(resolve => setTimeout(resolve, 0));

  let animation: AnimationModule;

  switch (type) {
    case 'bounce':
      animation = bounceAnimation;
      break;
    case 'elastic':
      animation = elasticAnimation;
      break;
    case 'spring':
      animation = springAnimation;
      break;
    default:
      throw new Error(`Unknown animation type: ${type}`);
  }

  // Cache the animation
  animationCache.set(type, animation);

  return animation;
}

/**
 * Apply lazy-loaded animation to element
 */
export async function applyLazyAnimation(
  element: HTMLElement,
  type: ComplexAnimation
): Promise<Animation> {
  const animation = await loadAnimation(type);
  return element.animate(animation.keyframes, animation.options);
}

/**
 * Preload animations
 */
export async function preloadAnimations(types: ComplexAnimation[]): Promise<void> {
  await Promise.all(types.map(type => loadAnimation(type)));
}

/**
 * Clear animation cache
 */
export function clearAnimationCache(): void {
  animationCache.clear();
}

/**
 * Get cached animation count
 */
export function getCachedAnimationCount(): number {
  return animationCache.size;
}

/**
 * Check if animation is cached
 */
export function isAnimationCached(type: ComplexAnimation): boolean {
  return animationCache.has(type);
}
