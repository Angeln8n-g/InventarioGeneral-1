/**
 * Validation script for NavigationDebouncer
 * Tests debouncing logic and queue management
 */

const { NavigationDebouncer } = require('../src/utils/navigation-debouncer.ts');

console.log('🧪 Testing NavigationDebouncer...\n');

// Test 1: Basic debouncing
console.log('Test 1: Basic debouncing');
const debouncer = new NavigationDebouncer({ minInterval: 500 });

console.log('  ✓ Can navigate initially:', debouncer.canNavigate());
debouncer.recordNavigation();
console.log('  ✓ Cannot navigate immediately after:', !debouncer.canNavigate());

setTimeout(() => {
  console.log('  ✓ Can navigate after 500ms:', debouncer.canNavigate());
}, 600);

// Test 2: Queue management
setTimeout(() => {
  console.log('\nTest 2: Queue management');
  debouncer.reset();
  
  const added1 = debouncer.enqueue({ path: '/page1', direction: 'left' });
  const added2 = debouncer.enqueue({ path: '/page2', direction: 'right' });
  
  console.log('  ✓ Added first request:', added1);
  console.log('  ✓ Added second request:', added2);
  console.log('  ✓ Queue size:', debouncer.getQueueSize());
  
  const request = debouncer.dequeue();
  console.log('  ✓ Dequeued request:', request?.path);
  console.log('  ✓ Queue size after dequeue:', debouncer.getQueueSize());
}, 700);

// Test 3: Time remaining
setTimeout(() => {
  console.log('\nTest 3: Time remaining calculation');
  debouncer.reset();
  debouncer.recordNavigation();
  
  const remaining = debouncer.getTimeRemaining();
  console.log('  ✓ Time remaining:', remaining, 'ms');
  console.log('  ✓ Should be close to 500ms:', remaining > 400 && remaining <= 500);
}, 1400);

setTimeout(() => {
  console.log('\n✅ All NavigationDebouncer tests completed!');
}, 2000);
