import type { CircleValidationResult } from '../types';

export const CIRCLE_MIN_RADIUS = 10; // 10 meters minimum
export const CIRCLE_MAX_RADIUS = 50000; // 50 km maximum

/**
 * Predefined circle colors (cycle through in order)
 */
export const CIRCLE_COLORS = [
  '#4CBACB', // Teal (default)
  '#E74C3C', // Red
  '#F39C12', // Orange
  '#27AE60', // Green
  '#8E44AD', // Purple
  '#3498DB'  // Blue
];

/**
 * Validate a circle based on radius constraints
 */
export function validateCircle(_center: [number, number], radius: number): CircleValidationResult {
  if (radius < CIRCLE_MIN_RADIUS) {
    return {
      valid: false,
      error: `Circle too small - minimum radius is ${CIRCLE_MIN_RADIUS}m`,
      radius
    };
  }

  if (radius > CIRCLE_MAX_RADIUS) {
    return {
      valid: false,
      error: `Circle too large - maximum radius is ${CIRCLE_MAX_RADIUS / 1000}km`,
      radius
    };
  }

  // Calculate area in square meters
  const area = Math.PI * radius * radius;

  return {
    valid: true,
    radius,
    area
  };
}

/**
 * Assign circle color based on existing circles count
 */
export function assignCircleColor(existingCirclesCount: number): string {
  return CIRCLE_COLORS[existingCirclesCount % CIRCLE_COLORS.length];
}

/**
 * Calculate distance between two points in meters using Haversine formula
 */
export function calculateDistance(
  point1: [number, number], 
  point2: [number, number]
): number {
  const [lng1, lat1] = point1;
  const [lng2, lat2] = point2;
  
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

/**
 * Format radius for display
 */
export function formatRadius(radius: number): string {
  if (radius < 1000) {
    return `${Math.round(radius)}m`;
  }
  return `${(radius / 1000).toFixed(1)}km`;
}

/**
 * Format area for display
 */
export function formatArea(area: number): string {
  if (area < 1000000) {
    return `${Math.round(area)} m²`;
  }
  return `${(area / 1000000).toFixed(2)} km²`;
}