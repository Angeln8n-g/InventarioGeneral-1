/**
 * Tests for Button Component
 * 
 * Verifies:
 * - Button variants render correctly (Requirements 8.1, 8.3, 8.4, 8.5)
 * - Disabled state prevents interaction (Requirement 8.7)
 * - Loading state displays spinner (Requirement 8.8)
 * - Keyboard accessibility
 * - Focus states
 * 
 * @requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';
import { colors, borders } from '@/design-system/tokens';

describe('Button Component', () => {
  describe('rendering', () => {
    it('should render children correctly', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('should render with default props', () => {
      render(<Button>Default Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'button');
      expect(button).not.toBeDisabled();
    });

    it('should render with custom type', () => {
      render(<Button type="submit">Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('should render with aria-label', () => {
      render(<Button aria-label="Close dialog">X</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Close dialog');
    });

    it('should render with data-testid', () => {
      render(<Button>Test Button</Button>);
      expect(screen.getByTestId('ds-button')).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    /**
     * @see Requirement 8.1 - Primary uses Primary (#E50914) background with white text
     */
    it('should render primary variant with correct styles', () => {
      render(<Button variant="primary">Primary</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('data-variant', 'primary');
      expect(button).toHaveStyle({
        backgroundColor: colors.primary,
        color: colors.textPrimary,
      });
    });

    /**
     * @see Requirement 8.3 - Secondary uses transparent background with Primary border and text
     */
    it('should render secondary variant with correct styles', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('data-variant', 'secondary');
      expect(button).toHaveStyle({
        color: colors.primary,
      });
      // Verify transparent background via computed style (transparent = rgba(0, 0, 0, 0))
      const computedStyle = window.getComputedStyle(button);
      expect(computedStyle.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    });

    /**
     * @see Requirement 8.4 - Ghost uses transparent background with Text_Secondary text
     */
    it('should render ghost variant with correct styles', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('data-variant', 'ghost');
      expect(button).toHaveStyle({
        color: colors.textSecondary,
      });
      // Verify transparent background via computed style (transparent = rgba(0, 0, 0, 0))
      const computedStyle = window.getComputedStyle(button);
      expect(computedStyle.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    });

    /**
     * @see Requirement 8.5 - Danger uses Danger (#EF4444) background with white text
     */
    it('should render danger variant with correct styles', () => {
      render(<Button variant="danger">Danger</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('data-variant', 'danger');
      expect(button).toHaveStyle({
        backgroundColor: colors.danger,
        color: colors.textPrimary,
      });
    });
  });

  describe('sizes', () => {
    it('should render small size', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('data-size', 'sm');
      expect(button).toHaveStyle({ minHeight: '32px' });
    });

    it('should render medium size (default)', () => {
      render(<Button size="md">Medium</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('data-size', 'md');
      expect(button).toHaveStyle({ minHeight: '40px' });
    });

    it('should render large size', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('data-size', 'lg');
      expect(button).toHaveStyle({ minHeight: '48px' });
    });

    /**
     * @see Requirement 8.6 - All buttons use 16px horizontal padding
     */
    it('should have 16px horizontal padding', () => {
      render(<Button>Padded Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveStyle({
        paddingLeft: '16px',
        paddingRight: '16px',
      });
    });

    /**
     * @see Requirement 8.6 - All buttons use 10px border radius
     */
    it('should have 10px border radius', () => {
      render(<Button>Rounded Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveStyle({
        borderRadius: `${borders.radius.button}px`,
      });
    });
  });

  describe('disabled state', () => {
    /**
     * @see Requirement 8.7 - Disabled buttons use Disabled (#6B7280) background
     */
    it('should render disabled state with correct styles', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveStyle({
        backgroundColor: colors.disabled,
        cursor: 'not-allowed',
      });
    });

    /**
     * @see Requirement 8.7 - Disabled buttons prevent interaction
     */
    it('should not call onClick when disabled', () => {
      const handleClick = jest.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not call onClick on keyboard interaction when disabled', () => {
      const handleClick = jest.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });
      fireEvent.keyDown(button, { key: ' ' });
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    /**
     * @see Requirement 8.8 - All buttons display a loading spinner when in loading state
     */
    it('should display loading spinner when loading', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('data-loading', 'true');
      expect(button).toHaveAttribute('aria-busy', 'true');
      // Check for SVG spinner
      expect(button.querySelector('svg.animate-spin')).toBeInTheDocument();
    });

    it('should be non-interactive when loading', () => {
      const handleClick = jest.fn();
      render(<Button loading onClick={handleClick}>Loading</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should be disabled when loading', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
    });

    it('should still show children text when loading', () => {
      render(<Button loading>Submit</Button>);
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });
  });

  describe('click handling', () => {
    it('should call onClick when clicked', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not throw when onClick is not provided', () => {
      render(<Button>No handler</Button>);
      
      expect(() => {
        fireEvent.click(screen.getByRole('button'));
      }).not.toThrow();
    });
  });

  describe('keyboard accessibility', () => {
    it('should call onClick on Enter key', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Keyboard</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick on Space key', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Keyboard</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: ' ' });
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick on other keys', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Keyboard</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Tab' });
      fireEvent.keyDown(button, { key: 'Escape' });
      fireEvent.keyDown(button, { key: 'a' });
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should be focusable', () => {
      render(<Button>Focusable</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      expect(document.activeElement).toBe(button);
    });
  });

  describe('icons', () => {
    it('should render left icon', () => {
      const LeftIcon = () => <span data-testid="left-icon">←</span>;
      render(<Button leftIcon={<LeftIcon />}>With Left Icon</Button>);
      
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('should render right icon', () => {
      const RightIcon = () => <span data-testid="right-icon">→</span>;
      render(<Button rightIcon={<RightIcon />}>With Right Icon</Button>);
      
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('should render both icons', () => {
      const LeftIcon = () => <span data-testid="left-icon">←</span>;
      const RightIcon = () => <span data-testid="right-icon">→</span>;
      render(
        <Button leftIcon={<LeftIcon />} rightIcon={<RightIcon />}>
          Both Icons
        </Button>
      );
      
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('should hide icons when loading', () => {
      const LeftIcon = () => <span data-testid="left-icon">←</span>;
      const RightIcon = () => <span data-testid="right-icon">→</span>;
      render(
        <Button loading leftIcon={<LeftIcon />} rightIcon={<RightIcon />}>
          Loading
        </Button>
      );
      
      expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument();
    });
  });

  describe('fullWidth', () => {
    it('should render full width when fullWidth is true', () => {
      render(<Button fullWidth>Full Width</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveStyle({ width: '100%' });
    });

    it('should not be full width by default', () => {
      render(<Button>Normal Width</Button>);
      const button = screen.getByRole('button');
      
      expect(button).not.toHaveStyle({ width: '100%' });
    });
  });

  describe('ref forwarding', () => {
    it('should forward ref to button element', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Ref Button</Button>);
      
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current?.textContent).toContain('Ref Button');
    });
  });

  describe('custom props', () => {
    it('should pass through additional HTML attributes', () => {
      render(
        <Button data-custom="value" id="custom-button">
          Custom Props
        </Button>
      );
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('data-custom', 'value');
      expect(button).toHaveAttribute('id', 'custom-button');
    });

    it('should apply custom className', () => {
      render(<Button className="custom-class">Custom Class</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('custom-class');
    });

    it('should merge custom styles', () => {
      render(
        <Button style={{ marginTop: '10px' }}>
          Custom Style
        </Button>
      );
      const button = screen.getByRole('button');
      
      expect(button).toHaveStyle({ marginTop: '10px' });
    });
  });
});
