/**
 * Tests for Skeleton Component
 * 
 * Verifies:
 * - Skeleton variants render correctly (text, circular, rectangular)
 * - Animation types work properly (pulse, wave, none)
 * - SkeletonCard composite component renders correctly
 * - Accessibility attributes are present
 * 
 * @requirements 13.1, 13.2
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Skeleton, SkeletonCard } from '../Skeleton';
import { colors, borders, spacing } from '@/design-system/tokens';

describe('Skeleton Component', () => {
  describe('rendering', () => {
    it('should render with default props', () => {
      render(<Skeleton />);
      const skeleton = screen.getByTestId('skeleton');
      
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveAttribute('data-variant', 'text');
      expect(skeleton).toHaveAttribute('data-animation', 'pulse');
    });

    it('should render with custom data-testid', () => {
      render(<Skeleton data-testid="custom-skeleton" />);
      expect(screen.getByTestId('custom-skeleton')).toBeInTheDocument();
    });

    it('should be hidden from accessibility tree', () => {
      render(<Skeleton />);
      const skeleton = screen.getByTestId('skeleton');
      
      expect(skeleton).toHaveAttribute('aria-hidden', 'true');
      expect(skeleton).toHaveAttribute('role', 'presentation');
    });
  });

  describe('variants', () => {
    /**
     * @see Requirement 13.1 - Display skeleton placeholders matching expected content shape
     */
    it('should render text variant with correct styles', () => {
      render(<Skeleton variant="text" />);
      const skeleton = screen.getByTestId('skeleton');
      
      expect(skeleton).toHaveAttribute('data-variant', 'text');
      expect(skeleton).toHaveStyle({
        borderRadius: '4px',
        width: '100%',
        height: '1em',
      });
    });

    it('should render circular variant with correct styles', () => {
      render(<Skeleton variant="circular" />);
      const skeleton = screen.getByTestId('skeleton');
      
      expect(skeleton).toHaveAttribute('data-variant', 'circular');
      expect(skeleton).toHaveStyle({
        borderRadius: '50%',
        width: '40px',
        height: '40px',
      });
    });

    it('should render rectangular variant with correct styles', () => {
      render(<Skeleton variant="rectangular" />);
      const skeleton = screen.getByTestId('skeleton');
      
      expect(skeleton).toHaveAttribute('data-variant', 'rectangular');
      expect(skeleton).toHaveStyle({
        borderRadius: `${borders.radius.card}px`,
        width: '100%',
        height: '100px',
      });
    });
  });

  describe('dimensions', () => {
    it('should accept width as number (pixels)', () => {
      render(<Skeleton width={200} />);
      const skeleton = screen.getByTestId('skeleton');
      
      expect(skeleton).toHaveStyle({ width: '200px' });
    });

    it('should accept width as string', () => {
      render(<Skeleton width="50%" />);
      const skeleton = screen.getByTestId('skeleton');
      
      expect(skeleton).toHaveStyle({ width: '50%' });
    });

    it('should accept height as number (pixels)', () => {
      render(<Skeleton height={100} />);
      const skeleton = screen.getByTestId('skeleton');
      
      expect(skeleton).toHaveStyle({ height: '100px' });
    });

    it('should accept height as string', () => {
      render(<Skeleton height="2rem" />);
      const skeleton = screen.getByTestId('skeleton');
      
      expect(skeleton).toHaveStyle({ height: '2rem' });
    });

    it('should override default dimensions with custom values', () => {
      render(<Skeleton variant="circular" width={60} height={60} />);
      const skeleton = screen.getByTestId('skeleton');
      
      expect(skeleton).toHaveStyle({
        width: '60px',
        height: '60px',
      });
    });
  });

  describe('background color', () => {
    /**
     * @see Requirement 13.2 - Use Surface (#151A21) background
     */
    it('should use Surface color as background', () => {
      render(<Skeleton />);
      const skeleton = screen.getByTestId('skeleton');
      
      expect(skeleton).toHaveStyle({
        backgroundColor: colors.surface,
      });
    });
  });

  describe('animations', () => {
    /**
     * @see Requirement 13.2 - Use pulse animation
     */
    it('should use pulse animation by default', () => {
      render(<Skeleton />);
      const skeleton = screen.getByTestId('skeleton');
      
      expect(skeleton).toHaveAttribute('data-animation', 'pulse');
      expect(skeleton).toHaveStyle({
        animation: 'skeleton-pulse 1.5s ease-in-out infinite',
      });
    });

    it('should render wave animation', () => {
      render(<Skeleton animation="wave" />);
      const skeleton = screen.getByTestId('skeleton');
      
      expect(skeleton).toHaveAttribute('data-animation', 'wave');
      expect(skeleton).toHaveStyle({
        position: 'relative',
        overflow: 'hidden',
      });
    });

    it('should render without animation when set to none', () => {
      render(<Skeleton animation="none" />);
      const skeleton = screen.getByTestId('skeleton');
      
      expect(skeleton).toHaveAttribute('data-animation', 'none');
    });
  });

  describe('custom styling', () => {
    it('should apply custom className', () => {
      render(<Skeleton className="custom-class" />);
      const skeleton = screen.getByTestId('skeleton');
      
      expect(skeleton).toHaveClass('custom-class');
    });

    it('should merge custom styles', () => {
      render(<Skeleton style={{ marginTop: '10px' }} />);
      const skeleton = screen.getByTestId('skeleton');
      
      expect(skeleton).toHaveStyle({ marginTop: '10px' });
    });
  });
});

describe('SkeletonCard Component', () => {
  describe('rendering', () => {
    it('should render with default props', () => {
      render(<SkeletonCard />);
      const card = screen.getByTestId('skeleton-card');
      
      expect(card).toBeInTheDocument();
    });

    it('should render with custom data-testid', () => {
      render(<SkeletonCard data-testid="custom-card" />);
      expect(screen.getByTestId('custom-card')).toBeInTheDocument();
    });

    it('should be hidden from accessibility tree', () => {
      render(<SkeletonCard />);
      const card = screen.getByTestId('skeleton-card');
      
      expect(card).toHaveAttribute('aria-hidden', 'true');
      expect(card).toHaveAttribute('role', 'presentation');
    });
  });

  describe('card styling', () => {
    it('should use Card background color', () => {
      render(<SkeletonCard />);
      const card = screen.getByTestId('skeleton-card');
      
      expect(card).toHaveStyle({
        backgroundColor: colors.card,
      });
    });

    it('should have card border radius', () => {
      render(<SkeletonCard />);
      const card = screen.getByTestId('skeleton-card');
      
      expect(card).toHaveStyle({
        borderRadius: `${borders.radius.card}px`,
      });
    });

    it('should have border with Border color', () => {
      render(<SkeletonCard />);
      const card = screen.getByTestId('skeleton-card');
      
      expect(card).toHaveStyle({
        border: `1px solid ${colors.border}`,
      });
    });

    it('should have proper padding', () => {
      render(<SkeletonCard />);
      const card = screen.getByTestId('skeleton-card');
      
      expect(card).toHaveStyle({
        padding: `${spacing.lg}px`,
      });
    });
  });

  describe('icon display', () => {
    it('should show icon by default', () => {
      render(<SkeletonCard />);
      const icon = screen.getByTestId('skeleton-card-icon');
      
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('data-variant', 'circular');
    });

    it('should hide icon when showIcon is false', () => {
      render(<SkeletonCard showIcon={false} />);
      
      expect(screen.queryByTestId('skeleton-card-icon')).not.toBeInTheDocument();
    });
  });

  describe('text lines', () => {
    it('should render 3 lines by default', () => {
      render(<SkeletonCard />);
      
      expect(screen.getByTestId('skeleton-card-line-0')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-card-line-1')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-card-line-2')).toBeInTheDocument();
      expect(screen.queryByTestId('skeleton-card-line-3')).not.toBeInTheDocument();
    });

    it('should render custom number of lines', () => {
      render(<SkeletonCard lines={5} />);
      
      expect(screen.getByTestId('skeleton-card-line-0')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-card-line-1')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-card-line-2')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-card-line-3')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-card-line-4')).toBeInTheDocument();
      expect(screen.queryByTestId('skeleton-card-line-5')).not.toBeInTheDocument();
    });

    it('should render 1 line when lines is 1', () => {
      render(<SkeletonCard lines={1} />);
      
      expect(screen.getByTestId('skeleton-card-line-0')).toBeInTheDocument();
      expect(screen.queryByTestId('skeleton-card-line-1')).not.toBeInTheDocument();
    });

    it('should render 0 lines when lines is 0', () => {
      render(<SkeletonCard lines={0} />);
      
      expect(screen.queryByTestId('skeleton-card-line-0')).not.toBeInTheDocument();
    });
  });

  describe('title skeleton', () => {
    it('should render title skeleton', () => {
      render(<SkeletonCard />);
      const title = screen.getByTestId('skeleton-card-title');
      
      expect(title).toBeInTheDocument();
      expect(title).toHaveAttribute('data-variant', 'text');
    });
  });

  describe('custom styling', () => {
    it('should apply custom className', () => {
      render(<SkeletonCard className="custom-class" />);
      const card = screen.getByTestId('skeleton-card');
      
      expect(card).toHaveClass('custom-class');
    });

    it('should merge custom styles', () => {
      render(<SkeletonCard style={{ marginTop: '20px' }} />);
      const card = screen.getByTestId('skeleton-card');
      
      expect(card).toHaveStyle({ marginTop: '20px' });
    });
  });
});
