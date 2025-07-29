import { math } from '@maptiler/sdk';
import type { MapPoint, Triangle, Circle, Polygon } from '../types';

/**
 * Calculate distance between two points using MapTiler SDK's optimized Haversine formula
 * @param point1 First point [lng, lat] 
 * @param point2 Second point [lng, lat]
 * @returns Distance in meters
 */
export function calculateDistance(point1: [number, number], point2: [number, number]): number {
  // Use MapTiler SDK's optimized Haversine distance calculation
  return math.haversineDistanceWgs84(point1, point2);
}

/**
 * Calculate total distance of a route using MapTiler SDK
 * @param points Array of points forming a route
 * @returns Total distance in meters
 */
export function calculateRouteDistance(points: [number, number][]): number {
  if (points.length < 2) return 0;
  
  // Use MapTiler SDK's cumulative distance calculation
  const distances = math.haversineCumulatedDistanceWgs84(points);
  // Return the final cumulative distance
  return distances[distances.length - 1] || 0;
}

/**
 * Convert WGS84 coordinates to Mercator projection using MapTiler SDK
 * @param wgs84Point Point in WGS84 [lng, lat]
 * @returns Point in Mercator projection
 */
export function wgs84ToMercator(wgs84Point: [number, number]): [number, number] {
  const result = math.wgs84ToMercator(wgs84Point);
  return [result[0], result[1]];
}

/**
 * Convert Mercator coordinates to WGS84 using MapTiler SDK
 * @param mercatorPoint Point in Mercator projection
 * @returns Point in WGS84 [lng, lat]
 */
export function mercatorToWgs84(mercatorPoint: [number, number]): [number, number] {
  const result = math.mercatorToWgs84(mercatorPoint);
  return [result[0], result[1]];
}

/**
 * Get tile indices for a point at a given zoom level
 * @param point Point in WGS84 [lng, lat]
 * @param zoom Zoom level
 * @returns Tile indices [x, y]
 */
export function getTileIndices(point: [number, number], zoom: number): [number, number] {
  const result = math.wgs84ToTileIndex(point, zoom);
  return [result[0], result[1]];
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

/**
 * Calculate the centroid of a set of points using MapTiler SDK helpers
 * @param points Array of points [lng, lat]
 * @returns Centroid point [lng, lat]
 */
export function calculateCentroid(points: [number, number][]): [number, number] {
  if (points.length === 0) return [0, 0];
  if (points.length === 1) return points[0];

  // Convert to Mercator for accurate centroid calculation
  const mercatorPoints = points.map(point => wgs84ToMercator(point));
  
  const sumX = mercatorPoints.reduce((sum, point) => sum + point[0], 0);
  const sumY = mercatorPoints.reduce((sum, point) => sum + point[1], 0);
  
  const centroidMercator: [number, number] = [sumX / points.length, sumY / points.length];
  
  // Convert back to WGS84
  return mercatorToWgs84(centroidMercator);
}

/**
 * Find the nearest location to a given point
 * @param targetPoint Target point [lng, lat]
 * @param locations Array of locations to search
 * @returns Nearest location and distance, or null if no locations
 */
export function findNearestLocation(
  targetPoint: [number, number], 
  locations: MapPoint[]
): { location: MapPoint; distance: number } | null {
  if (locations.length === 0) return null;

  let nearestLocation = locations[0];
  let minDistance = calculateDistance(targetPoint, nearestLocation.coordinates);

  for (let i = 1; i < locations.length; i++) {
    const distance = calculateDistance(targetPoint, locations[i].coordinates);
    if (distance < minDistance) {
      minDistance = distance;
      nearestLocation = locations[i];
    }
  }

  return { location: nearestLocation, distance: minDistance };
}

/**
 * Get locations within a certain distance of a point
 * @param centerPoint Center point [lng, lat]
 * @param radius Radius in meters
 * @param locations Array of locations to filter
 * @returns Locations within the radius
 */
export function getLocationsWithinRadius(
  centerPoint: [number, number],
  radius: number,
  locations: MapPoint[]
): MapPoint[] {
  return locations.filter(location => {
    const distance = calculateDistance(centerPoint, location.coordinates);
    return distance <= radius;
  });
}

/**
 * Enhanced constants from MapTiler SDK
 */
export const EARTH_RADIUS = math.EARTH_RADIUS; // Earth's radius in meters
export const EARTH_CIRCUMFERENCE = math.EARTH_CIRCUMFERENCE; // Earth's circumference in meters