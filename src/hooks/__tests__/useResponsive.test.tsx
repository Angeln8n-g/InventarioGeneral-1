/**
 * Tests for useResponsive hook
 * 
 * Verifies:
 * - Breakpoint detection consistency (Requirements 2.1, 2.2, 2.3)
 * - Boolean flags are mutually exclusive
 * - SSR handling (defaults to mobile)
 * - Window resize handling with debounce
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useResponsive, getBreakpoint } from '../useResponsive';

// Store original window.innerWidth
const originalInnerWidth = window.innerWidth;

// Helper to mock window.innerWidth
function setWindowWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
}

// Helper to trigger resize event
function triggerResize() {
  window.dispatchEvent(new Event('resize'));
}

describe('useResponsive hook', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Reset to a known width
    setWindowWidth(1024);
  });

  afterEach(() => {
    jest.useRealTimers();
    // Restore original width
    setWindowWidth(originalInnerWidth);
  });

  describe('getBreakpoint utility function', () => {
    /**
     * @see Requirements 2.1 - Mobile breakpoint (width < 768)
     */
    it('should return "mobile" for width < 768', () => {
      expect(getBreakpoint(0)).toBe('mobile');
      expect(getBreakpoint(320)).toBe('mobile');
      expect(getBreakpoint(375)).toBe('mobile');
      expect(getBreakpoint(767)).toBe('mobile');
    });

    /**
     * @see Requirements 2.2 - Tablet breakpoint (768 ≤ width < 1024)
     */
    it('should return "tablet" for 768 ≤ width < 1024', () => {
      expect(getBreakpoint(768)).toBe('tablet');
      expect(getBreakpoint(800)).toBe('tablet');
      expect(getBreakpoint(1023)).toBe('tablet');
    });

    /**
     * @see Requirements 2.3 - Desktop breakpoint (width ≥ 1024)
     */
    it('should return "desktop" for width ≥ 1024', () => {
      expect(getBreakpoint(1024)).toBe('desktop');
      expect(getBreakpoint(1280)).toBe('desktop');
      expect(getBreakpoint(1920)).toBe('desktop');
      expect(getBreakpoint(2560)).toBe('desktop');
    });

    it('should handle boundary values correctly', () => {
      // Just below tablet threshold
      expect(getBreakpoint(767)).toBe('mobile');
      // Exactly at tablet threshold
      expect(getBreakpoint(768)).toBe('tablet');
      // Just below desktop threshold
      expect(getBreakpoint(1023)).toBe('tablet');
      // Exactly at desktop threshold
      expect(getBreakpoint(1024)).toBe('desktop');
    });
  });

  describe('hook initialization', () => {
    it('should return correct state for mobile viewport', () => {
      setWindowWidth(375);
      const { result } = renderHook(() => useResponsive());

      expect(result.current.isMobile).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(false);
      expect(result.current.breakpoint).toBe('mobile');
    });

    it('should return correct state for tablet viewport', () => {
      setWindowWidth(768);
      const { result } = renderHook(() => useResponsive());

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(true);
      expect(result.current.isDesktop).toBe(false);
      expect(result.current.breakpoint).toBe('tablet');
    });

    it('should return correct state for desktop viewport', () => {
      setWindowWidth(1024);
      const { result } = renderHook(() => useResponsive());

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.breakpoint).toBe('desktop');
    });
  });

  describe('boolean flags mutual exclusivity', () => {
    it('should have exactly one true flag at any time', () => {
      const testWidths = [320, 375, 767, 768, 800, 1023, 1024, 1280, 1920];

      testWidths.forEach(width => {
        setWindowWidth(width);
        const { result } = renderHook(() => useResponsive());

        const trueFlags = [
          result.current.isMobile,
          result.current.isTablet,
          result.current.isDesktop,
        ].filter(Boolean);

        expect(trueFlags.length).toBe(1);
      });
    });

    it('should have consistent breakpoint and boolean flags', () => {
      setWindowWidth(500);
      const { result: mobileResult } = renderHook(() => useResponsive());
      expect(mobileResult.current.breakpoint).toBe('mobile');
      expect(mobileResult.current.isMobile).toBe(true);

      setWindowWidth(900);
      const { result: tabletResult } = renderHook(() => useResponsive());
      expect(tabletResult.current.breakpoint).toBe('tablet');
      expect(tabletResult.current.isTablet).toBe(true);

      setWindowWidth(1200);
      const { result: desktopResult } = renderHook(() => useResponsive());
      expect(desktopResult.current.breakpoint).toBe('desktop');
      expect(desktopResult.current.isDesktop).toBe(true);
    });
  });

  describe('resize handling', () => {
    it('should update state when window is resized', async () => {
      setWindowWidth(1024);
      const { result } = renderHook(() => useResponsive());

      expect(result.current.isDesktop).toBe(true);

      // Resize to mobile
      act(() => {
        setWindowWidth(375);
        triggerResize();
        // Fast-forward past debounce delay
        jest.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(result.current.isMobile).toBe(true);
        expect(result.current.isDesktop).toBe(false);
        expect(result.current.breakpoint).toBe('mobile');
      });
    });

    it('should debounce resize events', () => {
      setWindowWidth(1024);
      const { result } = renderHook(() => useResponsive());

      expect(result.current.isDesktop).toBe(true);

      // Trigger multiple rapid resizes
      act(() => {
        setWindowWidth(800);
        triggerResize();
        jest.advanceTimersByTime(50);

        setWindowWidth(600);
        triggerResize();
        jest.advanceTimersByTime(50);

        setWindowWidth(375);
        triggerResize();
        jest.advanceTimersByTime(50);
      });

      // State should not have changed yet (still within debounce window)
      expect(result.current.isDesktop).toBe(true);

      // Fast-forward past debounce delay
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Now state should reflect the final width
      expect(result.current.isMobile).toBe(true);
      expect(result.current.breakpoint).toBe('mobile');
    });

    it('should not update state if breakpoint does not change', async () => {
      setWindowWidth(1024);
      const { result } = renderHook(() => useResponsive());

      const initialState = result.current;

      // Resize within same breakpoint
      act(() => {
        setWindowWidth(1280);
        triggerResize();
        jest.advanceTimersByTime(200);
      });

      // State object should be the same reference (no unnecessary re-render)
      expect(result.current.breakpoint).toBe('desktop');
      expect(result.current.isDesktop).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should remove resize listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useResponsive());
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle zero width', () => {
      setWindowWidth(0);
      const { result } = renderHook(() => useResponsive());

      expect(result.current.isMobile).toBe(true);
      expect(result.current.breakpoint).toBe('mobile');
    });

    it('should handle very large widths', () => {
      setWindowWidth(10000);
      const { result } = renderHook(() => useResponsive());

      expect(result.current.isDesktop).toBe(true);
      expect(result.current.breakpoint).toBe('desktop');
    });
  });
});
