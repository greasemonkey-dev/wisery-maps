import type { PolygonValidationResult } from '../types';

// Minimum area threshold (same as triangles: ~100m² at equator)
const MIN_AREA_THRESHOLD = 0.001; // square degrees

// Colors for polygons (shared with triangles and circles)
const POLYGON_COLORS = [
  '#4CBACB', // Teal - Default
  '#E74C3C', // Red
  '#F39C12', // Orange
  '#27AE60', // Green
  '#8E44AD', // Purple
  '#3498DB'  // Blue
];

/**
 * Calculate the area of a polygon using the Shoelace formula
 * @param vertices Array of [lng, lat] coordinates
 * @returns Area in square degrees
 */
export function calculatePolygonArea(vertices: [number, number][]): number {
  if (vertices.length < 3) return 0;

  let area = 0;
  const n = vertices.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += vertices[i][0] * vertices[j][1];
    area -= vertices[j][0] * vertices[i][1];
  }

  return Math.abs(area) / 2;
}

/**
 * Check if two line segments intersect
 * @param p1 First point of first segment
 * @param q1 Second point of first segment  
 * @param p2 First point of second segment
 * @param q2 Second point of second segment
 * @returns True if segments intersect
 */
function doSegmentsIntersect(
  p1: [number, number], 
  q1: [number, number], 
  p2: [number, number], 
  q2: [number, number]
): boolean {
  // Helper function to find orientation of ordered triplet (p, q, r)
  // Returns 0 if colinear, 1 if clockwise, 2 if counterclockwise
  function orientation(p: [number, number], q: [number, number], r: [number, number]): number {
    const val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);
    if (Math.abs(val) < 1e-10) return 0; // Colinear
    return val > 0 ? 1 : 2; // Clockwise or counterclockwise
  }

  // Helper function to check if point q lies on segment pr
  function onSegment(p: [number, number], q: [number, number], r: [number, number]): boolean {
    return q[0] <= Math.max(p[0], r[0]) && q[0] >= Math.min(p[0], r[0]) &&
           q[1] <= Math.max(p[1], r[1]) && q[1] >= Math.min(p[1], r[1]);
  }

  const o1 = orientation(p1, q1, p2);
  const o2 = orientation(p1, q1, q2);
  const o3 = orientation(p2, q2, p1);
  const o4 = orientation(p2, q2, q1);

  // General case
  if (o1 !== o2 && o3 !== o4) return true;

  // Special cases
  if (o1 === 0 && onSegment(p1, p2, q1)) return true;
  if (o2 === 0 && onSegment(p1, q2, q1)) return true;
  if (o3 === 0 && onSegment(p2, p1, q2)) return true;
  if (o4 === 0 && onSegment(p2, q1, q2)) return true;

  return false;
}

/**
 * Check if a polygon has self-intersections
 * @param vertices Array of [lng, lat] coordinates
 * @returns True if polygon self-intersects
 */
export function checkSelfIntersection(vertices: [number, number][]): boolean {
  const n = vertices.length;
  if (n < 4) return false; // Triangle or less cannot self-intersect

  // Check each edge against every non-adjacent edge
  for (let i = 0; i < n; i++) {
    const current = vertices[i];
    const next = vertices[(i + 1) % n];

    for (let j = i + 2; j < n; j++) {
      // Skip adjacent edges and the closing edge
      if (j === n - 1 && i === 0) continue;
      
      const other = vertices[j];
      const otherNext = vertices[(j + 1) % n];

      if (doSegmentsIntersect(current, next, other, otherNext)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Validate a polygon for area and self-intersection
 * @param vertices Array of [lng, lat] coordinates
 * @returns Validation result with details
 */
export function validatePolygon(vertices: [number, number][]): PolygonValidationResult {
  if (vertices.length < 3) {
    return {
      valid: false,
      error: 'Polygon must have at least 3 vertices'
    };
  }

  // Check for self-intersection
  const selfIntersects = checkSelfIntersection(vertices);
  if (selfIntersects) {
    return {
      valid: false,
      error: 'Polygon cannot intersect itself',
      selfIntersects: true
    };
  }

  // Calculate area
  const area = calculatePolygonArea(vertices);
  
  if (area < MIN_AREA_THRESHOLD) {
    return {
      valid: false,
      error: 'Polygon too small - please draw a larger area',
      area,
      selfIntersects: false
    };
  }

  return {
    valid: true,
    area,
    selfIntersects: false
  };
}

/**
 * Get the color for a polygon based on count
 * @param count Number of existing polygons
 * @returns Color string
 */
export function assignPolygonColor(count: number): string {
  return POLYGON_COLORS[count % POLYGON_COLORS.length];
}

/**
 * Check if a point is close to another point (for closing polygon)
 * @param point1 First point [lng, lat]
 * @param point2 Second point [lng, lat]  
 * @param threshold Distance threshold in degrees (default: ~10 pixels at zoom 10)
 * @returns True if points are close enough
 */
export function isPointNearby(
  point1: [number, number], 
  point2: [number, number], 
  threshold: number = 0.001
): boolean {
  const dx = point1[0] - point2[0];
  const dy = point1[1] - point2[1];
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance <= threshold;
}