# Implementation Plan

## Status Summary

- ✅ LanguageContext is fully enhanced with variable interpolation, formatDate, formatNumber, fallback mechanism, and HTML lang attribute updates
- ✅ Translation dictionary is comprehensive with 600+ keys covering admin, landing, login, components, and common sections
- ✅ Admin pages (tools, users, loans, audit, consumables, reports) are fully translated
- ⚠️ Admin detail pages ([id]) and form pages (new) need translation implementation
- ⚠️ Landing page components need translation implementation
- ⚠️ Login page needs translation implementation
- ⚠️ Bag, Cart, Vault, Scanner, and BulkImport components need translation implementation
- ⚠️ Language selector needs to be created as a reusable component
- ⚠️ Browser language detection needs to be implemented
- ⚠️ Documentation needs to be created

## Tasks

- [x] 1. Enhance LanguageContext with advanced features

  - Implement variable interpolation in `t()` function
  - Add `formatDate()` utility for localized date formatting
  - Add `formatNumber()` utility for localized number formatting
  - Implement fallback mechanism for missing translation keys
  - Add HTML lang attribute update on language change
  - _Requirements: 2.4, 9.1, 9.2, 9.3_

- [x] 2. Expand translation dictionary - Admin section

  - Add all missing keys for admin.users.\* (20+ keys)
  - Add all missing keys for admin.loans.\* (15+ keys)
  - Add all missing keys for admin.audit.\* (12+ keys)
  - Verify existing admin.tools._, admin.reports._, admin.consumables.\* keys are complete
  - Add Spanish translations for all new admin keys
  - _Requirements: 2.1, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 3. Expand translation dictionary - Landing and Login

  - Add all landing page keys (landing.nav._, landing.hero._, landing.features._, landing.benefits._, landing.cta._, landing.footer._) - 30+ keys
  - Add all login page keys (login.\*) - 12+ keys
  - Add Spanish translations for all landing and login keys
  - _Requirements: 2.2, 5.1, 5.2_

- [x] 4. Expand translation dictionary - Components

  - Add all bag component keys (bag.\*) - 10+ keys
  - Add all cart component keys (cart.\*) - 10+ keys
  - Add all vault component keys (vault.\*) - 10+ keys
  - Add all loan confirmation modal keys (loanConfirmation.\*) - 10+ keys
  - Add all scanner component keys (scanner.batch._, scanner.quantity._, scanner.multiMode._, scanner.error._) - 20+ keys
  - Add all bulk import keys (bulkImport.\*) - 15+ keys
  - Add all form validation keys (form.\*) - 12+ keys
  - Add Spanish translations for all component keys
  - _Requirements: 2.3, 2.5, 2.6, 2.7, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 5. Update admin/users page with translations

  - Import and use `useLanguage()` hook
  - Replace all hardcoded text with `t()` calls
  - Update search placeholder, filter labels, button text
  - Update stats cards labels
  - Update empty states and loading messages
  - Test language switching
  - _Requirements: 3.1, 3.2, 3.3, 4.2_

- [x] 6. Update admin/loans page with translations

  - Import and use `useLanguage()` hook
  - Replace all hardcoded text with `t()` calls
  - Update search and filter UI
  - Update table headers and data display
  - Update action buttons
  - Test language switching
  - _Requirements: 3.1, 3.2, 3.3, 4.5_

- [x] 7. Update admin/audit page with translations

  - Import and use `useLanguage()` hook
  - Replace all hardcoded text with `t()` calls
  - Update table headers and filters
  - Update search and pagination UI
  - Test language switching
  - _Requirements: 3.1, 3.2, 3.3, 4.6_

- [ ] 8. Update admin detail pages with translations
- [ ] 8.1 Update admin/tools/[id] page

  - Import `useLanguage()` hook
  - Replace hardcoded text with translations (Status, Details, Category, Serial Number, etc.)
  - Update button text (Back to Tools, Change Status, Download QR Code, Print QR Code)
  - Update status labels using translation keys
  - _Requirements: 3.1, 3.2, 4.7_

- [ ] 8.2 Update admin/users/[id] page

  - Import `useLanguage()` hook
  - Replace hardcoded text with translations
  - Update profile information labels
  - Update action buttons
  - _Requirements: 3.1, 3.2, 4.7_

- [ ] 8.3 Update admin/consumables/[id] page

  - Import `useLanguage()` hook
  - Replace hardcoded text with translations
  - Update stock information labels
  - Update action buttons
  - _Requirements: 3.1, 3.2, 4.7_

- [ ] 9. Update admin form pages with translations
- [ ] 9.1 Update admin/tools/new page

  - Import `useLanguage()` hook
  - Replace form labels with translations
  - Update validation messages using form.\* keys
  - Update submit button text
  - _Requirements: 3.1, 3.2, 4.8_

- [ ] 9.2 Update admin/users/new page

  - Import `useLanguage()` hook
  - Replace form labels with translations
  - Update validation messages using form.\* keys
  - Update submit button text
  - _Requirements: 3.1, 3.2, 4.8_

- [ ] 9.3 Update admin/item-types/new page

  - Import `useLanguage()` hook
  - Replace form labels with translations
  - Update validation messages using form.\* keys
  - Update submit button text
  - _Requirements: 3.1, 3.2, 4.8_

- [ ] 10. Update Bag components with translations
- [ ] 10.1 Update BagButton component

  - Import `useLanguage()` hook
  - Replace badge text and tooltip
  - _Requirements: 3.1, 3.2, 6.1_

- [ ] 10.2 Update BagModal component

  - Replace title, empty state, and button text
  - Update item count display
  - _Requirements: 3.1, 3.2, 6.1_

- [ ] 10.3 Update LoanConfirmationModal component

  - Replace all form labels and placeholders
  - Update button text and messages
  - Update date picker labels
  - _Requirements: 3.1, 3.2, 6.1_

- [ ] 11. Update Cart components with translations
- [ ] 11.1 Update CartButton component

  - Import `useLanguage()` hook
  - Replace badge text and tooltip
  - _Requirements: 3.1, 3.2, 6.2_

- [ ] 11.2 Update CartModal component

  - Replace title, empty state, and button text
  - Update quantity labels
  - Update total display
  - _Requirements: 3.1, 3.2, 6.2_

- [ ] 12. Update Vault components with translations
- [ ] 12.1 Update VaultButton component

  - Import `useLanguage()` hook
  - Replace badge text and tooltip
  - _Requirements: 3.1, 3.2, 6.3_

- [ ] 12.2 Update VaultModal component

  - Replace title, empty state, and button text
  - Update item count display
  - _Requirements: 3.1, 3.2, 6.3_

- [ ] 13. Update Scanner components with translations
- [ ] 13.1 Update BatchConfirmation component

  - Replace title and button text
  - Update scanned items count
  - _Requirements: 3.1, 3.2, 6.4_

- [ ] 13.2 Update QuantityModal component

  - Replace title, labels, and placeholders
  - Update validation messages
  - Update button text
  - _Requirements: 3.1, 3.2, 6.4_

- [ ] 13.3 Update MultiModeToggle component

  - Replace mode labels
  - Update tooltips
  - _Requirements: 3.1, 3.2, 6.4_

- [ ] 13.4 Update ScannedItemsList component

  - Replace empty state text
  - Update item labels
  - _Requirements: 3.1, 3.2, 6.4_

- [ ] 14. Update BulkImportConsumables component with translations

  - Import `useLanguage()` hook
  - Replace modal title and instructions
  - Update file upload labels and messages
  - Update button text and status messages
  - Update success/error messages with variable interpolation
  - _Requirements: 3.1, 3.2, 3.4, 6.5_

- [ ] 15. Update Landing page components with translations
- [ ] 15.1 Update Navigation component

  - Import `useLanguage()` hook
  - Replace navigation links
  - Add language selector
  - _Requirements: 3.1, 3.2, 5.1, 8.1_

- [ ] 15.2 Update HeroSection component

  - Replace title, subtitle, and CTA button
  - _Requirements: 3.1, 3.2, 5.1_

- [ ] 15.3 Update FeaturesSection component

  - Replace section title
  - Replace all feature titles and descriptions
  - _Requirements: 3.1, 3.2, 5.1_

- [ ] 15.4 Update BenefitsSection component

  - Replace section title
  - Replace all benefit titles and descriptions
  - _Requirements: 3.1, 3.2, 5.1_

- [ ] 15.5 Update CTASection component

  - Replace title, subtitle, and button text
  - _Requirements: 3.1, 3.2, 5.1_

- [ ] 15.6 Update Footer component

  - Replace footer links and copyright text
  - _Requirements: 3.1, 3.2, 5.1_

- [ ] 16. Update Login page with translations

  - Import `useLanguage()` hook
  - Replace page title and welcome message
  - Replace form labels and placeholders
  - Replace button text and loading states
  - Replace error messages
  - Add language selector
  - _Requirements: 3.1, 3.2, 5.2, 5.4, 8.1_

- [ ] 17. Improve language selector UI

  - Create reusable LanguageSelector component in src/components/shared/
  - Add flag icons (🇺🇸 🇪🇸) or clear language names
  - Make it keyboard accessible (tab navigation, enter/space to select)
  - Add ARIA labels for screen readers
  - Add to Header component for authenticated users
  - Add to Navigation component on landing page
  - Add to login page
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 18. Implement browser language detection

  - Update LanguageContext to detect browser language using navigator.language
  - Set default language based on browser if no localStorage preference exists
  - Support language codes like 'es', 'es-ES', 'es-MX' → 'es'
  - Support language codes like 'en', 'en-US', 'en-GB' → 'en'
  - Respect user's explicit language choice over browser detection
  - _Requirements: 8.4_

- [ ] 19. Create comprehensive test suite
- [ ]\* 19.1 Create translation coverage tests

  - Test that all keys exist in both languages
  - Test that no translations are empty
  - Test that variable placeholders are consistent
  - _Requirements: 7.4_

- [ ]\* 19.2 Create component translation tests

  - Test that components render translated text
  - Test that text updates when language changes
  - Test that language persists on reload
  - _Requirements: 7.1, 7.2, 7.3_

- [ ]\* 19.3 Create visual regression tests

  - Test that layout doesn't break with longer Spanish text
  - Test button and card layouts
  - Test mobile responsive layouts
  - _Requirements: 7.6_

- [ ] 20. Manual testing and validation

  - Test all admin pages in both languages (tools, users, loans, audit, consumables, reports)
  - Test all admin detail pages in both languages
  - Test all admin form pages in both languages
  - Test all landing page sections in both languages
  - Test login page in both languages
  - Test all components in both languages (bag, cart, vault, scanner)
  - Verify language persistence across navigation
  - Verify no [key] placeholders appear in any page
  - Test on mobile devices for layout issues with longer Spanish text
  - Test keyboard navigation of language selector (Tab, Enter, Space)
  - Test screen reader announcements for language changes
  - Verify HTML lang attribute updates when language changes
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 21. Add missing translation keys to dictionary

  - Add admin detail page keys (admin.details._, admin.qr._)
  - Add admin form page keys (admin.form.\*)
  - Add common.previous key for audit log
  - Add keys for tool detail page (Status, Details, Category, Serial Number, Added, Last Updated, Condition Notes, QR Code, QR Code Value, Download QR Code, Print QR Code, Back to Tools, Change Status)
  - Add keys for user detail page
  - Add keys for consumable detail page
  - Add Spanish translations for all new keys
  - _Requirements: 2.1, 3.1, 3.2_

- [ ] 22. Create i18n documentation

  - Create docs/i18n-guide.md with developer guide
  - Document how to add new translations
  - Document naming conventions for keys (module.section.element)
  - Document how to use useLanguage() hook
  - Document how to handle variables in translations ({variable})
  - Document how to format dates and numbers
  - Add examples and best practices
  - Include troubleshooting section for missing keys
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 23. Performance optimization and final polish


  - Verify no performance issues with translation system
  - Optimize re-renders if needed (use React.memo for static components)
  - Add error boundary for translation errors
  - Verify HTML lang attribute updates on language change
  - Final code review and cleanup
  - Update README.md with i18n information
  - _Requirements: 7.1, 7.2_
