/**
 * BottomNavigation Component Tests
 * 
 * Unit tests for the BottomNavigation mobile navigation component.
 * 
 * @requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomNavigation } from '../BottomNavigation';
import type { NavItem } from '../BottomNavigation.types';

// Mock the useResponsive hook
jest.mock('@/hooks/useResponsive', () => ({
  useResponsive: jest.fn(),
}));

import { useResponsive } from '@/hooks/useResponsive';

const mockUseResponsive = useResponsive as jest.MockedFunction<typeof useResponsive>;

// Mock navigator.vibrate for haptic feedback tests
const mockVibrate = jest.fn();
Object.defineProperty(navigator, 'vibrate', {
  value: mockVibrate,
  writable: true,
});

// Sample navigation items for testing
const createMockItems = (count: number): NavItem[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${i + 1}`,
    label: `Item ${i + 1}`,
    icon: <span data-testid={`icon-${i + 1}`}>Icon</span>,
    href: `/path-${i + 1}`,
  }));
};

describe('BottomNavigation', () => {
  beforeEach(() => {
    // Default to mobile view
    mockUseResponsive.mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      breakpoint: 'mobile',
    });
    mockVibrate.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Requirement 5.6: Mobile-Only Rendering', () => {
    it('should render on mobile viewports (< 768px)', () => {
      mockUseResponsive.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        breakpoint: 'mobile',
      });

      render(<BottomNavigation items={createMockItems(3)} />);
      
      const nav = screen.getByTestId('bottom-navigation');
      expect(nav).toBeInTheDocument();
    });

    it('should NOT render on tablet viewports (>= 768px)', () => {
      mockUseResponsive.mockReturnValue({
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        breakpoint: 'tablet',
      });

      render(<BottomNavigation items={createMockItems(3)} />);
      
      const nav = screen.queryByTestId('bottom-navigation');
      expect(nav).not.toBeInTheDocument();
    });

    it('should NOT render on desktop viewports (>= 1024px)', () => {
      mockUseResponsive.mockReturnValue({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        breakpoint: 'desktop',
      });

      render(<BottomNavigation items={createMockItems(3)} />);
      
      const nav = screen.queryByTestId('bottom-navigation');
      expect(nav).not.toBeInTheDocument();
    });
  });

  describe('Requirement 5.1: Maximum 5 Items', () => {
    it('should display all items when 5 or fewer are provided', () => {
      render(<BottomNavigation items={createMockItems(5)} />);
      
      for (let i = 1; i <= 5; i++) {
        expect(screen.getByTestId(`nav-item-item-${i}`)).toBeInTheDocument();
      }
    });

    it('should display only 5 items when more than 5 are provided', () => {
      render(<BottomNavigation items={createMockItems(8)} />);
      
      // First 5 items should be visible
      for (let i = 1; i <= 5; i++) {
        expect(screen.getByTestId(`nav-item-item-${i}`)).toBeInTheDocument();
      }
      
      // Items 6-8 should NOT be visible
      expect(screen.queryByTestId('nav-item-item-6')).not.toBeInTheDocument();
      expect(screen.queryByTestId('nav-item-item-7')).not.toBeInTheDocument();
      expect(screen.queryByTestId('nav-item-item-8')).not.toBeInTheDocument();
    });

    it('should handle empty items array', () => {
      render(<BottomNavigation items={[]} />);
      
      const nav = screen.getByTestId('bottom-navigation');
      expect(nav).toBeInTheDocument();
      // No nav items should be rendered
      expect(screen.queryByTestId(/nav-item-/)).not.toBeInTheDocument();
    });
  });

  describe('Requirement 5.2 & 5.3: Active State Highlighting', () => {
    it('should highlight active item with Primary (#E50914) color', () => {
      const items = createMockItems(3);
      render(<BottomNavigation items={items} activeId="item-2" />);
      
      const activeItem = screen.getByTestId('nav-item-item-2');
      expect(activeItem).toHaveStyle({ color: '#E50914' });
    });

    it('should display inactive items in Text_Secondary (#9CA3AF) color', () => {
      const items = createMockItems(3);
      render(<BottomNavigation items={items} activeId="item-2" />);
      
      const inactiveItem1 = screen.getByTestId('nav-item-item-1');
      const inactiveItem3 = screen.getByTestId('nav-item-item-3');
      
      expect(inactiveItem1).toHaveStyle({ color: '#9CA3AF' });
      expect(inactiveItem3).toHaveStyle({ color: '#9CA3AF' });
    });

    it('should set aria-current="page" on active item', () => {
      const items = createMockItems(3);
      render(<BottomNavigation items={items} activeId="item-2" />);
      
      const activeItem = screen.getByTestId('nav-item-item-2');
      expect(activeItem).toHaveAttribute('aria-current', 'page');
    });

    it('should not set aria-current on inactive items', () => {
      const items = createMockItems(3);
      render(<BottomNavigation items={items} activeId="item-2" />);
      
      const inactiveItem = screen.getByTestId('nav-item-item-1');
      expect(inactiveItem).not.toHaveAttribute('aria-current');
    });
  });

  describe('Requirement 5.4: Haptic Feedback', () => {
    it('should trigger haptic feedback when item is tapped', () => {
      const items = createMockItems(3);
      render(<BottomNavigation items={items} />);
      
      const navItem = screen.getByTestId('nav-item-item-1');
      fireEvent.click(navItem);
      
      expect(mockVibrate).toHaveBeenCalledWith(10);
    });

    it('should call onNavigate callback when item is clicked', () => {
      const items = createMockItems(3);
      const handleNavigate = jest.fn();
      render(<BottomNavigation items={items} onNavigate={handleNavigate} />);
      
      const navItem = screen.getByTestId('nav-item-item-2');
      fireEvent.click(navItem);
      
      expect(handleNavigate).toHaveBeenCalledTimes(1);
      expect(handleNavigate).toHaveBeenCalledWith(items[1]);
    });
  });

  describe('Requirement 5.5: Height and Safe Area', () => {
    it('should have a height of 64px', () => {
      render(<BottomNavigation items={createMockItems(3)} />);
      
      const nav = screen.getByTestId('bottom-navigation');
      expect(nav).toHaveStyle({ height: '64px' });
    });

    it('should have safe area padding for devices with home indicators', () => {
      render(<BottomNavigation items={createMockItems(3)} />);
      
      const nav = screen.getByTestId('bottom-navigation');
      expect(nav).toHaveStyle({ paddingBottom: 'env(safe-area-inset-bottom, 0px)' });
    });
  });

  describe('Styling', () => {
    it('should use Surface (#151A21) background color', () => {
      render(<BottomNavigation items={createMockItems(3)} />);
      
      const nav = screen.getByTestId('bottom-navigation');
      expect(nav).toHaveStyle({ backgroundColor: '#151A21' });
    });

    it('should have Border (#2A3242) top border', () => {
      render(<BottomNavigation items={createMockItems(3)} />);
      
      const nav = screen.getByTestId('bottom-navigation');
      expect(nav).toHaveStyle({ borderTop: '1px solid #2A3242' });
    });

    it('should be fixed at the bottom of the viewport', () => {
      render(<BottomNavigation items={createMockItems(3)} />);
      
      const nav = screen.getByTestId('bottom-navigation');
      expect(nav).toHaveStyle({
        position: 'fixed',
        bottom: '0',
        left: '0',
        right: '0',
      });
    });
  });

  describe('Accessibility', () => {
    it('should have role="navigation"', () => {
      render(<BottomNavigation items={createMockItems(3)} />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('should have aria-label for navigation', () => {
      render(<BottomNavigation items={createMockItems(3)} />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Main navigation');
    });

    it('should have aria-label on each nav item button', () => {
      const items = createMockItems(3);
      render(<BottomNavigation items={items} />);
      
      items.forEach((item) => {
        const button = screen.getByTestId(`nav-item-${item.id}`);
        expect(button).toHaveAttribute('aria-label', item.label);
      });
    });
  });

  describe('Item Content', () => {
    it('should display icon for each item', () => {
      render(<BottomNavigation items={createMockItems(3)} />);
      
      for (let i = 1; i <= 3; i++) {
        expect(screen.getByTestId(`icon-${i}`)).toBeInTheDocument();
      }
    });

    it('should display label for each item', () => {
      const items = createMockItems(3);
      render(<BottomNavigation items={items} />);
      
      items.forEach((item) => {
        expect(screen.getByText(item.label)).toBeInTheDocument();
      });
    });
  });
});
