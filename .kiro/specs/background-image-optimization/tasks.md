# Implementation Plan

- [x] 1. Configure Next.js image optimization settings

  - Update `next.config.ts` to add image optimization configuration with WebP/AVIF formats, device sizes, and cache settings
  - Configure image formats array with WebP and AVIF support
  - Set deviceSizes for responsive breakpoints (640, 750, 828, 1080, 1200, 1920, 2048, 3840)
  - Configure minimumCacheTTL to 31536000 (1 year) for optimal caching
  - _Requirements: 1.1, 1.2, 4.1, 4.2_

- [x] 2. Create reusable OptimizedBackgroundImage component

  - [x] 2.1 Create component file and TypeScript interfaces

    - Create `src/components/ui/OptimizedBackgroundImage.tsx` file
    - Define `OptimizedBackgroundImageProps` interface with src, alt, children, priority, overlayOpacity, darkOverlayOpacity, className, and quality props
    - _Requirements: 3.1, 3.3, 5.2, 5.3_

  - [x] 2.2 Implement core component with Next.js Image

    - Implement component using Next.js `next/image` with fill, priority, quality, and sizes props
    - Configure `sizes="100vw"` for full-width responsive images
    - Use `className="object-cover"` for background-like behavior
    - Add fixed positioning for background layer (z-0) and relative positioning for content layer (z-10)
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

  - [x] 2.3 Add blur placeholder generation

    - Implement `generateBlurDataURL` helper function
    - Create `shimmer` SVG generator for animated placeholder
    - Implement `toBase64` utility for base64 encoding
    - Configure Image component with `placeholder="blur"` and `blurDataURL`
    - _Requirements: 2.1, 2.2, 2.5_

  - [x] 2.4 Implement overlay system for contrast

    - Add light mode overlay div with configurable opacity
    - Add dark mode overlay div with separate configurable opacity
    - Use inline styles for dynamic opacity values
    - Position overlays absolutely within background layer
    - _Requirements: 5.3, 7.3_

  - [x] 2.5 Add error handling with gradient fallback

    - Implement `imageError` state with useState
    - Add `onError` handler to Image component
    - Create fallback div with gradient background matching theme
    - Ensure content remains accessible when fallback is shown
    - _Requirements: 7.1, 7.3, 7.5_

- [x] 3. Create image configuration types and constants

  - Create `src/types/images.ts` file
  - Define `BackgroundImageConfig` interface
  - Create `BACKGROUND_IMAGES` constant with configuration for all 5 pages (login, toolsScan, toolsReturn, consumablesScan, consumablesReturn)
  - Set priority=true only for login page, false for others
  - Configure quality values (85 for login, 80 for others)
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 4. Migrate login page to use OptimizedBackgroundImage

  - [x] 4.1 Import and integrate OptimizedBackgroundImage component

    - Import `OptimizedBackgroundImage` component in `src/app/login/page.tsx`
    - Replace existing div with inline style backgroundImage with OptimizedBackgroundImage wrapper
    - Configure with `priority={true}` for critical LCP optimization
    - Set `overlayOpacity={0.2}` and `darkOverlayOpacity={0.4}`
    - _Requirements: 3.2, 5.4, 5.5_

  - [x] 4.2 Remove old background implementation

    - Remove `style={{ backgroundImage: 'url(...)' }}` from div
    - Remove `bg-cover bg-center bg-no-repeat bg-gradient-to-br` classes (now handled by component)
    - Keep content structure intact within component children
    - Verify overlay div is removed (now handled by component)
    - _Requirements: 5.5_

  - [ ] 4.3 Test login page performance
    - Verify page loads with blur placeholder visible immediately
    - Verify smooth transition from placeholder to full image
    - Check Network tab for WebP format delivery
    - Verify overlay contrast in both light and dark modes
    - _Requirements: 2.2, 2.3, 4.3, 6.2_

- [x] 5. Migrate tools scan page to use OptimizedBackgroundImage

  - Import `OptimizedBackgroundImage` in `src/app/tools/scan/page.tsx`
  - Replace div with inline style backgroundImage with OptimizedBackgroundImage wrapper
  - Configure with `priority={false}` and `loading="lazy"`
  - Set appropriate overlay opacity values
  - Remove old background implementation code
  - _Requirements: 3.3, 5.4, 5.5_

- [x] 6. Migrate tools return page to use OptimizedBackgroundImage

  - Import `OptimizedBackgroundImage` in `src/app/tools/return/page.tsx`
  - Replace div with inline style backgroundImage with OptimizedBackgroundImage wrapper
  - Configure with `priority={false}` and `loading="lazy"`
  - Set appropriate overlay opacity values
  - Remove old background implementation code
  - _Requirements: 3.3, 5.4, 5.5_

- [x] 7. Refactor consumables scan page to use shared component

  - Update `src/app/consumables/scan/page.tsx` to use `OptimizedBackgroundImage` component instead of direct Image usage
  - Replace existing background Image implementation with component
  - Configure with `priority={true}` (already set correctly)
  - Maintain existing overlay opacity values (0.4 light, 0.5 dark)
  - Remove redundant overlay divs (now handled by component)
  - _Requirements: 5.1, 5.4_

- [x] 8. Migrate consumables return page to use OptimizedBackgroundImage

  - Import `OptimizedBackgroundImage` in `src/app/consumables/return/page.tsx`
  - Replace div with inline style backgroundImage with OptimizedBackgroundImage wrapper
  - Configure with `priority={false}` and very low overlay opacity (0.03 light, 0.02 dark)
  - Remove old background implementation code
  - _Requirements: 3.3, 5.4, 5.5_

- [x] 9. Verify all pages and measure performance improvements

  - [x] 9.1 Run Lighthouse audits on all 5 pages

    - Run Lighthouse on /login, /tools/scan, /tools/return, /consumables/scan, /consumables/return
    - Record Performance scores before and after
    - Verify Performance score improvement of at least 15 points
    - Document LCP, FCP, and TTI metrics
    - _Requirements: 6.1, 6.2_

  - [x] 9.2 Measure image transfer sizes

    - Check Network tab for each page's background image size
    - Compare original JPEG sizes vs optimized WebP sizes
    - Verify at least 60% reduction in transfer size
    - Document actual compression ratios achieved
    - _Requirements: 1.4, 6.4_

  - [ ] 9.3 Validate LCP metrics

    - Measure LCP for each page using Chrome DevTools
    - Verify LCP is under 2.5 seconds for all pages
    - Verify at least 40% reduction compared to original implementation
    - Test on simulated 3G connection
    - _Requirements: 4.5, 6.3_

  - [ ] 9.4 Test responsive image delivery

    - Test each page on mobile (640px), tablet (1024px), and desktop (1920px) viewports
    - Verify appropriate image sizes are served for each breakpoint
    - Check Network tab to confirm different srcset images are loaded
    - Verify no layout shift occurs during image load
    - _Requirements: 1.2, 1.3_

  - [x] 9.5 Verify browser compatibility and fallbacks

    - Test WebP delivery in Chrome/Firefox
    - Test JPEG fallback in older browsers
    - Verify gradient fallback appears on image error
    - Test with JavaScript disabled to ensure graceful degradation
    - Verify functionality in Chrome 90+, Firefox 88+, Safari 14+
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 9.6 Validate accessibility and visual quality
    - Verify all images have appropriate alt text
    - Check overlay contrast ratios meet WCAG standards
    - Verify blur placeholders don't cause confusion
    - Test keyboard navigation is not affected
    - Verify no visible quality loss in optimized images
    - _Requirements: 1.4, 2.1, 2.3_

- [ ] 10. Document performance results and create summary report
  - Create performance comparison table with before/after metrics
  - Document LCP improvements for each page
  - Document image size reductions achieved
  - Document Lighthouse score improvements
  - Add recommendations for future optimizations
  - _Requirements: 6.1, 6.2, 6.3, 6.4_
