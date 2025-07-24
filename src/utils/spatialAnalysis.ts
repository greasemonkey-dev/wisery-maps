import type { MapPoint, Triangle, Circle, Polygon } from '../types';

/**
 * Calculate distance between two points using Haversine formula
 * @param point1 First point [lng, lat] 
 * @param point2 Second point [lng, lat]
 * @returns Distance in meters
 */
export function calculateDistance(point1: [number, number], point2: [number, number]): number {
  const [lng1, lat1] = point1;
  const [lng2, lat2] = point2;
  
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Check if a point is inside a triangle using barycentric coordinates
 * @param point Point to test [lng, lat]
 * @param triangle Triangle vertices [[lng, lat], [lng, lat], [lng, lat]]
 * @returns True if point is inside triangle
 */
export function isPointInTriangle(
  point: [number, number], 
  triangle: [[number, number], [number, number], [number, number]]
): boolean {
  const [px, py] = point;
  const [[x1, y1], [x2, y2], [x3, y3]] = triangle;

  // Calculate barycentric coordinates
  const denominator = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
  
  if (Math.abs(denominator) < 1e-10) {
    // Degenerate triangle
    return false;
  }

  const a = ((y2 - y3) * (px - x3) + (x3 - x2) * (py - y3)) / denominator;
  const b = ((y3 - y1) * (px - x3) + (x1 - x3) * (py - y3)) / denominator;
  const c = 1 - a - b;

  // Point is inside if all barycentric coordinates are non-negative
  return a >= 0 && b >= 0 && c >= 0;
}

/**
 * Check if a point is inside a circle
 * @param point Point to test [lng, lat] 
 * @param center Circle center [lng, lat]
 * @param radius Circle radius in meters
 * @returns True if point is inside circle
 */
export function isPointInCircle(
  point: [number, number],
  center: [number, number], 
  radius: number
): boolean {
  const distance = calculateDistance(point, center);
  return distance <= radius;
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 * @param point Point to test [lng, lat]
 * @param polygon Polygon vertices [[lng, lat], ...]
 * @returns True if point is inside polygon
 */
export function isPointInPolygon(
  point: [number, number],
  polygon: [number, number][]
): boolean {
  if (polygon.length < 3) return false;

  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Get all locations that fall within a triangle AOI
 * @param triangle Triangle AOI
 * @param locations Array of map points to test
 * @returns Array of locations inside the triangle
 */
export function getLocationsInTriangle(
  triangle: Triangle,
  locations: MapPoint[]
): MapPoint[] {
  return locations.filter(location => 
    isPointInTriangle(location.coordinates, triangle.vertices)
  );
}

/**
 * Get all locations that fall within a circle AOI
 * @param circle Circle AOI
 * @param locations Array of map points to test
 * @returns Array of locations inside the circle
 */
export function getLocationsInCircle(
  circle: Circle,
  locations: MapPoint[]
): MapPoint[] {
  return locations.filter(location =>
    isPointInCircle(location.coordinates, circle.center, circle.radius)
  );
}

/**
 * Get all locations that fall within a polygon AOI
 * @param polygon Polygon AOI
 * @param locations Array of map points to test
 * @returns Array of locations inside the polygon
 */
export function getLocationsInPolygon(
  polygon: Polygon,
  locations: MapPoint[]
): MapPoint[] {
  return locations.filter(location =>
    isPointInPolygon(location.coordinates, polygon.vertices)
  );
}

/**
 * AOI with contained locations for analysis
 */
export interface AOIAnalysis {
  id: string;
  name: string;
  type: 'triangle' | 'circle' | 'polygon';
  color: string;
  createdAt: Date;
  containedLocations: MapPoint[];
  locationCount: number;
}

/**
 * Analyze all AOIs and return which locations they contain
 * @param triangles Array of triangle AOIs
 * @param circles Array of circle AOIs  
 * @param polygons Array of polygon AOIs
 * @param locations Array of all map points
 * @returns Array of AOI analyses with contained locations
 */
export function analyzeAllAOIs(
  triangles: Triangle[],
  circles: Circle[],
  polygons: Polygon[],
  locations: MapPoint[]
): AOIAnalysis[] {
  const analyses: AOIAnalysis[] = [];

  // Analyze triangles
  triangles.forEach(triangle => {
    const containedLocations = getLocationsInTriangle(triangle, locations);
    analyses.push({
      id: triangle.id,
      name: triangle.name,
      type: 'triangle',
      color: triangle.color,
      createdAt: triangle.createdAt,
      containedLocations,
      locationCount: containedLocations.length
    });
  });

  // Analyze circles
  circles.forEach(circle => {
    const containedLocations = getLocationsInCircle(circle, locations);
    analyses.push({
      id: circle.id,
      name: circle.name,
      type: 'circle',
      color: circle.color,
      createdAt: circle.createdAt,
      containedLocations,
      locationCount: containedLocations.length
    });
  });

  // Analyze polygons
  polygons.forEach(polygon => {
    const containedLocations = getLocationsInPolygon(polygon, locations);
    analyses.push({
      id: polygon.id,
      name: polygon.name,
      type: 'polygon',
      color: polygon.color,
      createdAt: polygon.createdAt,
      containedLocations,
      locationCount: containedLocations.length
    });
  });

  return analyses;
}

/**
 * Get summary statistics for spatial analysis
 * @param analyses Array of AOI analyses
 * @returns Summary statistics
 */
export function getSpatialAnalysisSummary(analyses: AOIAnalysis[]) {
  const totalAOIs = analyses.length;
  const totalLocations = analyses.reduce((sum, analysis) => sum + analysis.locationCount, 0);
  const emptyAOIs = analyses.filter(analysis => analysis.locationCount === 0).length;
  const mostPopulatedAOI = analyses.reduce((max, analysis) => 
    analysis.locationCount > max.locationCount ? analysis : max, 
    { locationCount: 0 } as AOIAnalysis
  );

  return {
    totalAOIs,
    totalLocations,
    emptyAOIs,
    nonEmptyAOIs: totalAOIs - emptyAOIs,
    averageLocationsPerAOI: totalAOIs > 0 ? totalLocations / totalAOIs : 0,
    mostPopulatedAOI: mostPopulatedAOI.locationCount > 0 ? mostPopulatedAOI : null
  };
}