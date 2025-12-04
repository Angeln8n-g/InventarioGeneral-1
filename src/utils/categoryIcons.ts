/**
 * Category Icon Utilities
 * 
 * Provides functions to get category icons for electronic devices.
 * Supports dynamic icons from the database with fallback to default icons.
 */

import { DeviceCategory } from '@/types/database'

// Default icons for categories (fallback when no icon is set in database)
export const DEFAULT_CATEGORY_ICONS: Record<string, string> = {
  'Laptops': '💻',
  'Tablets': '📲',
  'Smartphones': '📱',
  'Periféricos': '⌨️',
  'Digitales': '📷',
  'Otros': '📦',
}

// Generic default icon when category is unknown
export const GENERIC_DEFAULT_ICON = '📦'

/**
 * Get the icon for a category
 * @param categoryName - The name of the category
 * @param categoryIcon - The icon stored in the database (optional)
 * @returns The icon emoji to display
 */
export function getCategoryIcon(categoryName: string | null | undefined, categoryIcon?: string | null): string {
  // If a custom icon is set in the database, use it
  if (categoryIcon) {
    return categoryIcon
  }
  
  // Otherwise, use the default icon for the category
  if (categoryName && DEFAULT_CATEGORY_ICONS[categoryName]) {
    return DEFAULT_CATEGORY_ICONS[categoryName]
  }
  
  // Fallback to generic icon
  return GENERIC_DEFAULT_ICON
}

/**
 * Get the icon for a category from a categories map
 * @param categoryName - The name of the category
 * @param categoriesMap - Map of category names to DeviceCategory objects
 * @returns The icon emoji to display
 */
export function getCategoryIconFromMap(
  categoryName: string | null | undefined,
  categoriesMap: Map<string, DeviceCategory> | Record<string, DeviceCategory>
): string {
  if (!categoryName) {
    return GENERIC_DEFAULT_ICON
  }
  
  // Handle both Map and Record types
  const category = categoriesMap instanceof Map 
    ? categoriesMap.get(categoryName)
    : categoriesMap[categoryName]
  
  if (category?.icon) {
    return category.icon
  }
  
  // Fallback to default icons
  return DEFAULT_CATEGORY_ICONS[categoryName] || GENERIC_DEFAULT_ICON
}

/**
 * Create a categories map from an array of categories
 * @param categories - Array of DeviceCategory objects
 * @returns Map of category names to DeviceCategory objects
 */
export function createCategoriesMap(categories: DeviceCategory[]): Map<string, DeviceCategory> {
  return new Map(categories.map(cat => [cat.name, cat]))
}
