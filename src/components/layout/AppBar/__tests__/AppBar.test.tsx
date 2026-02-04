/**
 * AppBar Component Tests
 * 
 * Unit tests for the AppBar header component.
 * 
 * @requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppBar } from '../AppBar';

// Mock the useResponsive hook
jest.mock('@/hooks/useResponsive', () => ({
  useResponsive: jest.fn(),
}));

import { useResponsive } from '@/hooks/useResponsive';

const mockUseResponsive = useResponsive as jest.MockedFunction<typeof useResponsive>;

describe('AppBar', () => {
  beforeEach(() => {
    // Default to desktop view
    mockUseResponsive.mockReturnValue({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      breakpoint: 'desktop',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Requirement 4.1: Logo Display', () => {
    it('should display the application logo on the left side', () => {
      render(<AppBar />);
      
      const logo = screen.getByTestId('app-logo');
      expect(logo).toBeInTheDocument();
    });
  });

  describe('Requirement 4.2: Title Display', () => {
    it('should display the page title left-aligned on desktop', () => {
      mockUseResponsive.mockReturnValue({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        breakpoint: 'desktop',
      });

      render(<AppBar title="Test Dashboard" />);
      
      const title = screen.getByTestId('appbar-title');
      expect(title).toHaveTextContent('Test Dashboard');
      // On desktop, title should NOT be centered (no textAlign: center)
      expect(title).not.toHaveStyle({ textAlign: 'center' });
    });

    it('should display the page title centered on mobile', () => {
      mockUseResponsive.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        breakpoint: 'mobile',
      });

      render(<AppBar title="Test Dashboard" />);
      
      const title = screen.getByTestId('appbar-title');
      expect(title).toHaveTextContent('Test Dashboard');
      expect(title).toHaveStyle({ textAlign: 'center' });
    });

    it('should use default title when not provided', () => {
      render(<AppBar />);
      
      const title = screen.getByTestId('appbar-title');
      expect(title).toHaveTextContent('Dashboard');
    });
  });

  describe('Requirement 4.3: Notifications Badge', () => {
    it('should display notifications icon when showNotifications is true', () => {
      render(<AppBar showNotifications={true} />);
      
      const notificationButton = screen.getByLabelText(/notifications/i);
      expect(notificationButton).toBeInTheDocument();
    });

    it('should not display notifications icon when showNotifications is false', () => {
      render(<AppBar showNotifications={false} />);
      
      const notificationButton = screen.queryByLabelText(/notifications/i);
      expect(notificationButton).not.toBeInTheDocument();
    });

    it('should display unread count badge when notificationCount > 0', () => {
      render(<AppBar showNotifications={true} notificationCount={5} />);
      
      const badge = screen.getByTestId('notification-count');
      expect(badge).toHaveTextContent('5');
    });

    it('should not display badge when notificationCount is 0', () => {
      render(<AppBar showNotifications={true} notificationCount={0} />);
      
      const badge = screen.queryByTestId('notification-count');
      expect(badge).not.toBeInTheDocument();
    });

    it('should display "99+" when notificationCount exceeds 99', () => {
      render(<AppBar showNotifications={true} notificationCount={150} />);
      
      const badge = screen.getByTestId('notification-count');
      expect(badge).toHaveTextContent('99+');
    });

    it('should call onNotificationsClick when notifications icon is clicked', () => {
      const handleClick = jest.fn();
      render(
        <AppBar 
          showNotifications={true} 
          onNotificationsClick={handleClick} 
        />
      );
      
      const notificationButton = screen.getByLabelText(/notifications/i);
      fireEvent.click(notificationButton);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Requirement 4.4: User Menu', () => {
    const mockUser = {
      name: 'John Doe',
      email: 'john@example.com',
    };

    it('should display user avatar when showUserMenu is true and user is provided', () => {
      render(<AppBar showUserMenu={true} user={mockUser} />);
      
      const avatar = screen.getByLabelText('User menu');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveTextContent('JD'); // Initials
    });

    it('should not display user menu when showUserMenu is false', () => {
      render(<AppBar showUserMenu={false} user={mockUser} />);
      
      const avatar = screen.queryByLabelText('User menu');
      expect(avatar).not.toBeInTheDocument();
    });

    it('should open dropdown menu when avatar is clicked', () => {
      render(<AppBar showUserMenu={true} user={mockUser} />);
      
      const avatar = screen.getByLabelText('User menu');
      fireEvent.click(avatar);
      
      const menu = screen.getByRole('menu');
      expect(menu).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('should display Profile and Logout options in dropdown', () => {
      render(<AppBar showUserMenu={true} user={mockUser} />);
      
      const avatar = screen.getByLabelText('User menu');
      fireEvent.click(avatar);
      
      expect(screen.getByRole('menuitem', { name: 'Profile' })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'Logout' })).toBeInTheDocument();
    });

    it('should call onProfileClick when Profile is clicked', () => {
      const handleProfileClick = jest.fn();
      render(
        <AppBar 
          showUserMenu={true} 
          user={mockUser} 
          onProfileClick={handleProfileClick}
        />
      );
      
      const avatar = screen.getByLabelText('User menu');
      fireEvent.click(avatar);
      
      const profileButton = screen.getByRole('menuitem', { name: 'Profile' });
      fireEvent.click(profileButton);
      
      expect(handleProfileClick).toHaveBeenCalledTimes(1);
    });

    it('should call onLogoutClick when Logout is clicked', () => {
      const handleLogoutClick = jest.fn();
      render(
        <AppBar 
          showUserMenu={true} 
          user={mockUser} 
          onLogoutClick={handleLogoutClick}
        />
      );
      
      const avatar = screen.getByLabelText('User menu');
      fireEvent.click(avatar);
      
      const logoutButton = screen.getByRole('menuitem', { name: 'Logout' });
      fireEvent.click(logoutButton);
      
      expect(handleLogoutClick).toHaveBeenCalledTimes(1);
    });

    it('should close menu when clicking outside', () => {
      render(<AppBar showUserMenu={true} user={mockUser} />);
      
      const avatar = screen.getByLabelText('User menu');
      fireEvent.click(avatar);
      
      expect(screen.getByRole('menu')).toBeInTheDocument();
      
      // Click outside
      fireEvent.mouseDown(document.body);
      
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  describe('Requirement 4.5 & 4.6: Responsive Height', () => {
    it('should have height of 56px on mobile', () => {
      mockUseResponsive.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        breakpoint: 'mobile',
      });

      render(<AppBar />);
      
      const appbar = screen.getByTestId('appbar');
      expect(appbar).toHaveStyle({ height: '56px' });
    });

    it('should have height of 64px on desktop', () => {
      mockUseResponsive.mockReturnValue({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        breakpoint: 'desktop',
      });

      render(<AppBar />);
      
      const appbar = screen.getByTestId('appbar');
      expect(appbar).toHaveStyle({ height: '64px' });
    });

    it('should have height of 64px on tablet', () => {
      mockUseResponsive.mockReturnValue({
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        breakpoint: 'tablet',
      });

      render(<AppBar />);
      
      const appbar = screen.getByTestId('appbar');
      expect(appbar).toHaveStyle({ height: '64px' });
    });
  });

  describe('Requirement 4.7: Styling', () => {
    it('should use Surface (#151A21) background color', () => {
      render(<AppBar />);
      
      const appbar = screen.getByTestId('appbar');
      expect(appbar).toHaveStyle({ backgroundColor: '#151A21' });
    });

    it('should have Border (#2A3242) bottom border', () => {
      render(<AppBar />);
      
      const appbar = screen.getByTestId('appbar');
      expect(appbar).toHaveStyle({ borderBottom: '1px solid #2A3242' });
    });
  });

  describe('Menu Button (Mobile)', () => {
    it('should show menu button on mobile when onMenuClick is provided', () => {
      mockUseResponsive.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        breakpoint: 'mobile',
      });

      const handleMenuClick = jest.fn();
      render(<AppBar onMenuClick={handleMenuClick} />);
      
      const menuButton = screen.getByLabelText('Open menu');
      expect(menuButton).toBeInTheDocument();
    });

    it('should not show menu button on desktop', () => {
      mockUseResponsive.mockReturnValue({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        breakpoint: 'desktop',
      });

      const handleMenuClick = jest.fn();
      render(<AppBar onMenuClick={handleMenuClick} />);
      
      const menuButton = screen.queryByLabelText('Open menu');
      expect(menuButton).not.toBeInTheDocument();
    });

    it('should call onMenuClick when menu button is clicked', () => {
      mockUseResponsive.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        breakpoint: 'mobile',
      });

      const handleMenuClick = jest.fn();
      render(<AppBar onMenuClick={handleMenuClick} />);
      
      const menuButton = screen.getByLabelText('Open menu');
      fireEvent.click(menuButton);
      
      expect(handleMenuClick).toHaveBeenCalledTimes(1);
    });
  });
});
