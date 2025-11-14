/**
 * Stagger Animation Utility
 * Creates staggered animations for lists and grids
 */

// ============================================
// TYPES
// ============================================

export type StaggerDirection = 'forward' | 'reverse' | 'center';

export interface StaggerConfig {
  delay: number; // Base delay in ms
  maxDelay: number; // Maximum total delay in ms
  direction: StaggerDirection;
  easing: string;
}

// ============================================
// DEFAULT CONFIGURATION
// ============================================

const DEFAULT_CONFIG: StaggerConfig = {
  delay: 50,
  maxDelay: 300,
  direction: 'forward',
  easing: 'ease-out',
};

// ============================================
// STAGGER ANIMATION FUNCTIONS
// ============================================

/**
 * Create stagger animation for a list of elements
 */
export function createStaggerAnimation(
  elements: HTMLElement[],
  config: Partial<StaggerConfig> = {}
): void {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const { delay, maxDelay, direction, easing } = finalConfig;

  // Calculate delays based on direction
  const delays = calculateDelays(elements.length, delay, maxDelay, direction);

  // Apply animation delays
  elements.forEach((element, index) => {
    const animationDelay = delays[index];
    element.style.animationDelay = `${animationDelay}ms`;
    element.style.animationTimingFunction = easing;
    element.style.animationFillMode = 'both';
  });
}

/**
 * Calculate delays for each element based on direction
 */
function calculateDelays(
  count: number,
  baseDelay: number,
  maxDelay: number,
  direction: StaggerDirection
): number[] {
  const delays: number[] = [];

  // Calculate total delay if we used baseDelay for all
  const totalDelay = baseDelay * (count - 1);

  // If total exceeds max, scale down the delay
  const effectiveDelay = totalDelay > maxDelay 
    ? maxDelay / (count - 1) 
    : baseDelay;

  switch (direction) {
    case 'forward':
      // 0, delay, 2*delay, 3*delay, ...
      for (let i = 0; i < count; i++) {
        delays.push(i * effectiveDelay);
      }
      break;

    case 'reverse':
      // (n-1)*delay, (n-2)*delay, ..., delay, 0
      for (let i = 0; i < count; i++) {
        delays.push((count - 1 - i) * effectiveDelay);
      }
      break;

    case 'center':
      // Start from center and go outwards
      const mid = Math.floor(count / 2);
      for (let i = 0; i < count; i++) {
        const distance = Math.abs(i - mid);
        delays.push(distance * effectiveDelay);
      }
      break;
  }

  return delays;
}

/**
 * Remove stagger animation from elements
 */
export function removeStaggerAnimation(elements: HTMLElement[]): void {
  elements.forEach((element) => {
    element.style.animationDelay = '';
    element.style.animationTimingFunction = '';
    element.style.animationFillMode = '';
  });
}

/**
 * Apply stagger animation class to elements
 */
export function applyStaggerClass(
  elements: HTMLElement[],
  className: string,
  config: Partial<StaggerConfig> = {}
): void {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const { delay, maxDelay, direction } = finalConfig;

  const delays = calculateDelays(elements.length, delay, maxDelay, direction);

  elements.forEach((element, index) => {
    element.classList.add(className);
    element.style.animationDelay = `${delays[index]}ms`;
  });
}

/**
 * Remove stagger animation class from elements
 */
export function removeStaggerClass(elements: HTMLElement[], className: string): void {
  elements.forEach((element) => {
    element.classList.remove(className);
    element.style.animationDelay = '';
  });
}
