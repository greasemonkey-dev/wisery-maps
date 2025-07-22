import Supercluster from 'supercluster';
import type { MapPoint } from '../types';

export const CLUSTER_RADIUS = 50; // pixels
export const CLUSTER_MAX_ZOOM = 15; // Stop clustering at city block level
export const CLUSTER_MIN_ZOOM = 0;
export const CLUSTER_MIN_POINTS = 2;

export interface ClusterPoint {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: MapPoint & {
    cluster?: boolean;
    cluster_id?: number;
    point_count?: number;
    point_count_abbreviated?: string;
  };
}

/**
 * Configure and create a Supercluster instance
 */
export function createClusterInstance(): Supercluster<MapPoint> {
  return new Supercluster<MapPoint>({
    radius: CLUSTER_RADIUS,
    maxZoom: CLUSTER_MAX_ZOOM,
    minZoom: CLUSTER_MIN_ZOOM,
    minPoints: CLUSTER_MIN_POINTS,
  });
}

/**
 * Convert MapPoint array to GeoJSON features for clustering
 */
export function mapPointsToGeoJSON(points: MapPoint[]): ClusterPoint[] {
  return points.map(point => ({
    type: 'Feature' as const,
    geometry: {
      type: 'Point' as const,
      coordinates: point.coordinates,
    },
    properties: point,
  }));
}

/**
 * Initialize clustering with map points
 */
export function initializeClustering(points: MapPoint[]): Supercluster<MapPoint> {
  const cluster = createClusterInstance();
  const geoJsonPoints = mapPointsToGeoJSON(points);
  cluster.load(geoJsonPoints);
  return cluster;
}

/**
 * Get clusters for a specific zoom level and bounding box
 */
export function getClusters(
  cluster: Supercluster<MapPoint>,
  bbox: [number, number, number, number], // [westLng, southLat, eastLng, northLat]
  zoom: number
): ClusterPoint[] {
  return cluster.getClusters(bbox, Math.floor(zoom)) as ClusterPoint[];
}

/**
 * Check if clustering should be applied at current zoom level
 */
export function shouldCluster(zoom: number): boolean {
  return zoom < CLUSTER_MAX_ZOOM;
}

/**
 * Get points within a cluster
 */
export function getClusterPoints(
  cluster: Supercluster<MapPoint>,
  clusterId: number
): ClusterPoint[] {
  return cluster.getLeaves(clusterId) as ClusterPoint[];
}

/**
 * Calculate clustering distance threshold in degrees based on zoom level
 */
export function getClusteringDistance(zoom: number): number {
  // Simplified approximation: higher zoom = smaller clustering distance
  // At zoom 0, we want large distances; at zoom 15+, very small distances
  const baseDistance = 1.0; // 1 degree at zoom 0
  return baseDistance / Math.pow(2, zoom);
}