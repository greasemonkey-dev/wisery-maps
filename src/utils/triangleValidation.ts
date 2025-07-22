import type { TriangleValidationResult } from '../types';

export const TRIANGLE_COLORS = [
  '#4CBACB', // Teal - Default
  '#E74C3C', // Red
  '#F39C12', // Orange
  '#27AE60', // Green
  '#8E44AD', // Purple
  '#3498DB', // Blue
];

export const MIN_AREA_DEGREES = 0.001; // ~100m² at equator

/**
 * Calculate triangle area using the shoelace formula
 * Area = 0.5 * |x1(y2-y3) + x2(y3-y1) + x3(y1-y2)|
 */
export function calculateTriangleArea(vertices: [[number, number], [number, number], [number, number]]): number {
  const [[x1, y1], [x2, y2], [x3, y3]] = vertices;
  return Math.abs(0.5 * (x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)));
}

/**
 * Validate a triangle meets minimum size requirements
 */
export function validateTriangle(vertices: [[number, number], [number, number], [number, number]]): TriangleValidationResult {
  // Check if vertices form a valid triangle (not collinear)
  const area = calculateTriangleArea(vertices);
  
  if (area < MIN_AREA_DEGREES) {
    return {
      valid: false,
      error: "Triangle too small - please draw a larger area",
      area
    };
  }
  
  return {
    valid: true,
    area
  };
}

/**
 * Assign color to triangle based on index
 */
export function assignTriangleColor(triangleIndex: number): string {
  return TRIANGLE_COLORS[triangleIndex % TRIANGLE_COLORS.length];
}