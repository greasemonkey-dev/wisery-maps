import type { POI, POIValidationResult } from '../types';

/**
 * Predefined POI colors (cycling through in order)
 */
const POI_COLORS = [
  '#4CBACB', // Teal (default)
  '#E74C3C', // Red
  '#F39C12', // Orange
  '#27AE60', // Green
  '#8E44AD', // Purple
  '#3498DB', // Blue
] as const;

/**
 * Predefined POI icons (Font Awesome or Unicode icons)
 */
const POI_ICONS = [
  'marker', // Default marker
  'flag',
  'star',
  'home',
  'building',
  'camera',
  'shopping-bag',
  'coffee',
  'car',
  'plane',
] as const;

/**
 * POI categories for organization
 */
const POI_CATEGORIES = [
  'general',
  'business',
  'transportation',
  'entertainment',
  'food',
  'shopping',
  'government',
  'emergency',
  'education',
  'healthcare',
] as const;

/**
 * Validates POI coordinates and basic properties
 * @param coordinates - [lng, lat] coordinates
 * @param name - POI name
 * @returns Validation result
 */
export function validatePOI(
  coordinates: [number, number],
  name: string = ''
): POIValidationResult {
  const [lng, lat] = coordinates;

  // Check if coordinates are valid numbers
  if (typeof lng !== 'number' || typeof lat !== 'number') {
    return {
      valid: false,
      error: 'Invalid coordinates - must be numbers',
    };
  }

  // Check longitude bounds (-180 to 180)
  if (lng < -180 || lng > 180) {
    return {
      valid: false,
      error: 'Longitude must be between -180 and 180 degrees',
    };
  }

  // Check latitude bounds (-90 to 90)
  if (lat < -90 || lat > 90) {
    return {
      valid: false,
      error: 'Latitude must be between -90 and 90 degrees',
    };
  }

  // Check for exact coordinate duplicates (within 1 meter precision)
  const precision = 5; // ~1 meter precision
  const roundedLng = Math.round(lng * Math.pow(10, precision)) / Math.pow(10, precision);
  const roundedLat = Math.round(lat * Math.pow(10, precision)) / Math.pow(10, precision);

  // Validate name if provided
  if (name && name.trim().length === 0) {
    return {
      valid: false,
      error: 'POI name cannot be empty',
    };
  }

  if (name && name.length > 100) {
    return {
      valid: false,
      error: 'POI name must be less than 100 characters',
    };
  }

  return {
    valid: true,
    coordinates: [roundedLng, roundedLat],
  };
}

/**
 * Assigns a color to a POI based on the existing count
 * @param existingPOIsCount - Number of existing POIs
 * @returns Color string
 */
export function assignPOIColor(existingPOIsCount: number): string {
  return POI_COLORS[existingPOIsCount % POI_COLORS.length];
}

/**
 * Assigns a default icon to a POI based on category or count
 * @param category - POI category
 * @param existingPOIsCount - Number of existing POIs (fallback)
 * @returns Icon string
 */
export function assignPOIIcon(
  category: string = 'general',
  existingPOIsCount: number = 0
): string {
  // Category-based icon assignment
  const categoryIconMap: Record<string, string> = {
    general: 'marker',
    business: 'building',
    transportation: 'car',
    entertainment: 'star',
    food: 'coffee',
    shopping: 'shopping-bag',
    government: 'flag',
    emergency: 'plus',
    education: 'graduation-cap',
    healthcare: 'heart',
  };

  return categoryIconMap[category] || POI_ICONS[existingPOIsCount % POI_ICONS.length];
}

/**
 * Checks if a POI location is too close to existing POIs
 * @param newCoordinates - New POI coordinates
 * @param existingPOIs - Array of existing POIs
 * @param minimumDistance - Minimum distance in meters (default 10m)
 * @returns Boolean indicating if location is valid
 */
export function validatePOILocation(
  newCoordinates: [number, number],
  existingPOIs: POI[],
  minimumDistance: number = 10
): { valid: boolean; error?: string; nearbyPOI?: POI } {
  const [newLng, newLat] = newCoordinates;

  for (const poi of existingPOIs) {
    const [existingLng, existingLat] = poi.coordinates;
    
    // Calculate distance using Haversine formula (simplified)
    const R = 6371000; // Earth's radius in meters
    const dLat = (existingLat - newLat) * Math.PI / 180;
    const dLng = (existingLng - newLng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(newLat * Math.PI / 180) * Math.cos(existingLat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    if (distance < minimumDistance) {
      return {
        valid: false,
        error: `POI too close to existing POI "${poi.name}" (${Math.round(distance)}m away)`,
        nearbyPOI: poi,
      };
    }
  }

  return { valid: true };
}

/**
 * Snaps POI coordinates to nearby features if within snap distance
 * @param coordinates - Original coordinates
 * @param snapTargets - Array of snap target coordinates
 * @param snapDistance - Maximum snap distance in meters (default 20m)
 * @returns Snapped coordinates or original if no snap target found
 */
export function snapPOICoordinates(
  coordinates: [number, number],
  snapTargets: [number, number][],
  snapDistance: number = 20
): { coordinates: [number, number]; snapped: boolean; snapTarget?: [number, number] } {
  const [lng, lat] = coordinates;

  for (const target of snapTargets) {
    const [targetLng, targetLat] = target;
    
    // Calculate distance
    const R = 6371000; // Earth's radius in meters
    const dLat = (targetLat - lat) * Math.PI / 180;
    const dLng = (targetLng - lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat * Math.PI / 180) * Math.cos(targetLat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    if (distance <= snapDistance) {
      return {
        coordinates: target,
        snapped: true,
        snapTarget: target,
      };
    }
  }

  return {
    coordinates,
    snapped: false,
  };
}

/**
 * Gets available POI categories
 * @returns Array of category strings
 */
export function getPOICategories(): readonly string[] {
  return POI_CATEGORIES;
}

/**
 * Gets available POI icons
 * @returns Array of icon strings
 */
export function getPOIIcons(): readonly string[] {
  return POI_ICONS;
}

/**
 * Gets available POI colors
 * @returns Array of color strings
 */
export function getPOIColors(): readonly string[] {
  return POI_COLORS;
}