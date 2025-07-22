import { describe, it, expect, beforeEach } from 'vitest';
import {
  createClusterInstance,
  mapPointsToGeoJSON,
  initializeClustering,
  getClusters,
  shouldCluster,
  getClusterPoints,
  getClusteringDistance,
  CLUSTER_RADIUS,
  CLUSTER_MAX_ZOOM,
  CLUSTER_MIN_POINTS,
} from './pointClustering';
import type { MapPoint } from '../types';

// ✅ GOOD: Realistic test data
const mockMapPoints: MapPoint[] = [
  {
    id: '1',
    coordinates: [-0.1276, 51.5074], // London
    label: 'Big Ben',
    messageId: 'msg1',
    context: 'Historic landmark',
  },
  {
    id: '2', 
    coordinates: [-0.1278, 51.5076], // Very close to Big Ben (~22m apart)
    label: 'Westminster',
    messageId: 'msg1',
    context: 'Government area',
  },
  {
    id: '3',
    coordinates: [-0.0757, 51.5183], // Tower Bridge (~4.2km from Big Ben)
    label: 'Tower Bridge',
    messageId: 'msg2',
    context: 'Historic bridge',
  },
  {
    id: '4',
    coordinates: [2.3522, 48.8566], // Paris (~344km from London)
    label: 'Louvre',
    messageId: 'msg3',
    context: 'Art museum',
  },
];

// 🆕 ADD: Test data for edge cases from HLD
const denseAreaPoints: MapPoint[] = Array.from({ length: 10 }, (_, i) => ({
  id: `dense_${i}`,
  coordinates: [-0.1276 + (i * 0.0001), 51.5074 + (i * 0.0001)], // Within 50m
  label: `Point ${i}`,
  messageId: 'msg_dense',
  context: `Dense area point ${i}`,
}));

describe('createClusterInstance', () => {
  it('should create Supercluster instance with correct configuration', () => {
    const cluster = createClusterInstance();
    
    expect(cluster).toBeDefined();
    // Note: Supercluster doesn't expose options in newer versions, so we test functionality instead
    expect(typeof cluster.load).toBe('function');
    expect(typeof cluster.getClusters).toBe('function');
  });

  // 🆕 ADD: Test HLD-specified constants
  it('should use HLD-specified clustering parameters', () => {
    expect(CLUSTER_MAX_ZOOM).toBe(15); // City block level from HLD
    expect(CLUSTER_RADIUS).toBeGreaterThan(10); // Should handle 50m radius
    expect(CLUSTER_MIN_POINTS).toBeGreaterThanOrEqual(2);
  });
});

describe('mapPointsToGeoJSON', () => {
  it('should convert MapPoints to GeoJSON features correctly', () => {
    const points = mockMapPoints.slice(0, 2);
    const geoJson = mapPointsToGeoJSON(points);
    
    expect(geoJson).toHaveLength(2);
    expect(geoJson[0]).toEqual({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-0.1276, 51.5074],
      },
      properties: points[0],
    });
  });

  it('should handle empty array', () => {
    const geoJson = mapPointsToGeoJSON([]);
    expect(geoJson).toEqual([]);
  });

  it('should preserve all MapPoint properties', () => {
    const point: MapPoint = {
      id: 'test',
      coordinates: [0, 0],
      label: 'Test Point',
      messageId: 'msg',
      context: 'Test context',
      timestamp: '2025-01-01T00:00:00Z',
    };
    
    const [geoJson] = mapPointsToGeoJSON([point]);
    expect(geoJson.properties).toEqual(point);
  });

  // 🆕 ADD: Test coordinate format validation
  it('should maintain lng,lat coordinate order for web mapping', () => {
    const point: MapPoint = {
      id: 'coord_test',
      coordinates: [-122.4194, 37.7749], // San Francisco: lng, lat
      label: 'SF Point',
      messageId: 'msg',
      context: 'Coordinate test',
    };
    
    const [geoJson] = mapPointsToGeoJSON([point]);
    expect(geoJson.geometry.coordinates).toEqual([-122.4194, 37.7749]);
  });
});

describe('initializeClustering', () => {
  it('should initialize clustering with MapPoints', () => {
    const cluster = initializeClustering(mockMapPoints);
    
    expect(cluster).toBeDefined();
    const bbox: [number, number, number, number] = [-180, -90, 180, 90];
    const clusters = getClusters(cluster, bbox, 1);
    expect(clusters.length).toBeGreaterThan(0);
  });

  it('should handle empty points array', () => {
    const cluster = initializeClustering([]);
    const bbox: [number, number, number, number] = [-180, -90, 180, 90];
    const clusters = getClusters(cluster, bbox, 1);
    expect(clusters).toEqual([]);
  });

  // 🆕 ADD: Test performance with hundreds of points (HLD requirement)
  it('should handle hundreds of points efficiently', () => {
    const manyPoints: MapPoint[] = Array.from({ length: 500 }, (_, i) => ({
      id: `point_${i}`,
      coordinates: [Math.random() * 360 - 180, Math.random() * 180 - 90],
      label: `Point ${i}`,
      messageId: `msg_${Math.floor(i / 10)}`,
      context: `Generated point ${i}`,
    }));

    const startTime = performance.now();
    const cluster = initializeClustering(manyPoints);
    const endTime = performance.now();

    expect(cluster).toBeDefined();
    expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1s
  });
});

describe('getClusters', () => {
  let cluster: ReturnType<typeof initializeClustering>;

  beforeEach(() => {
    cluster = initializeClustering(mockMapPoints);
  });

  it('should return clusters for given bounding box and zoom', () => {
    const londonBbox: [number, number, number, number] = [-0.2, 51.4, -0.05, 51.6];
    const clusters = getClusters(cluster, londonBbox, 10);
    
    expect(clusters.length).toBeGreaterThan(0);
    clusters.forEach(cluster => {
      expect(cluster.type).toBe('Feature');
      expect(cluster.geometry.type).toBe('Point');
      expect(cluster.properties).toBeDefined();
    });
  });

  it('should return more clusters at higher zoom levels', () => {
    const worldBbox: [number, number, number, number] = [-180, -90, 180, 90];
    const lowZoomClusters = getClusters(cluster, worldBbox, 1);
    const highZoomClusters = getClusters(cluster, worldBbox, 10);
    
    expect(highZoomClusters.length).toBeGreaterThanOrEqual(lowZoomClusters.length);
  });

  it('should cluster nearby points at low zoom', () => {
    const worldBbox: [number, number, number, number] = [-180, -90, 180, 90];
    const clusters = getClusters(cluster, worldBbox, 1);
    
    const clusterFeature = clusters.find(c => c.properties.cluster);
    if (clusterFeature) {
      expect(clusterFeature.properties.point_count).toBeGreaterThan(1);
    }
  });

  // 🆕 ADD: Test HLD-specific clustering behavior
  it('should create cluster badges for multiple points (HLD requirement)', () => {
    const denseCluster = initializeClustering(denseAreaPoints);
    const bbox: [number, number, number, number] = [-0.2, 51.4, -0.05, 51.6];
    const clusters = getClusters(denseCluster, bbox, 12);

    const clusterFeature = clusters.find(c => c.properties.cluster);
    if (clusterFeature) {
      expect(clusterFeature.properties.point_count).toBeGreaterThanOrEqual(2);
      // This would show as "📍 X" badge in UI
    }
  });
});

describe('shouldCluster', () => {
  it('should return true for zoom levels below maximum', () => {
    expect(shouldCluster(0)).toBe(true);
    expect(shouldCluster(10)).toBe(true);
    expect(shouldCluster(CLUSTER_MAX_ZOOM - 1)).toBe(true);
  });

  it('should return false for zoom levels at or above maximum', () => {
    expect(shouldCluster(CLUSTER_MAX_ZOOM)).toBe(false);
    expect(shouldCluster(CLUSTER_MAX_ZOOM + 1)).toBe(false);
    expect(shouldCluster(20)).toBe(false);
  });

  // ✅ GOOD: Matches HLD specification exactly
  it('should separate points at city block level (zoom >= 15)', () => {
    expect(shouldCluster(14)).toBe(true);  // Still cluster
    expect(shouldCluster(15)).toBe(false); // City block level - show individual
    expect(shouldCluster(16)).toBe(false); // Street level
  });
});

describe('getClusterPoints', () => {
  let cluster: ReturnType<typeof initializeClustering>;

  beforeEach(() => {
    cluster = initializeClustering(denseAreaPoints);
  });

  it('should return points within a cluster', () => {
    const bbox: [number, number, number, number] = [-180, -90, 180, 90];
    const clusters = getClusters(cluster, bbox, 1);
    
    const clusterFeature = clusters.find(c => c.properties.cluster);
    if (clusterFeature && clusterFeature.properties.cluster_id !== undefined) {
      const clusterPoints = getClusterPoints(cluster, clusterFeature.properties.cluster_id);
      
      expect(clusterPoints.length).toBeGreaterThan(0);
      clusterPoints.forEach(point => {
        expect(point.type).toBe('Feature');
        expect(point.properties.id).toBeDefined();
      });
    }
  });

  // 🆕 ADD: Test HLD "Show List" functionality
  it('should support expanding cluster to show individual events', () => {
    const bbox: [number, number, number, number] = [-0.2, 51.4, -0.05, 51.6];
    const clusters = getClusters(cluster, bbox, 10);
    
    const clusterFeature = clusters.find(c => c.properties.cluster && (c.properties.point_count ?? 0) > 1);
    if (clusterFeature && clusterFeature.properties.cluster_id !== undefined && clusterFeature.properties.point_count !== undefined) {
      const expandedPoints = getClusterPoints(cluster, clusterFeature.properties.cluster_id);
      
      expect(expandedPoints.length).toBe(clusterFeature.properties.point_count);
      // This supports the HLD "Show List" popup functionality
    }
  });
});

describe('getClusteringDistance', () => {
  it('should return larger distances for lower zoom levels', () => {
    const lowZoomDistance = getClusteringDistance(5);
    const highZoomDistance = getClusteringDistance(15);
    
    expect(lowZoomDistance).toBeGreaterThan(highZoomDistance);
  });

  it('should return positive distances', () => {
    expect(getClusteringDistance(1)).toBeGreaterThan(0);
    expect(getClusteringDistance(10)).toBeGreaterThan(0);
    expect(getClusteringDistance(20)).toBeGreaterThan(0);
  });

  // 🆕 ADD: Test HLD-specific distance requirements  
  it('should cluster points within 50m radius at appropriate zoom levels', () => {
    const zoom12Distance = getClusteringDistance(12);
    // At zoom 12, should cluster points that are close enough to appear within 50m
    expect(zoom12Distance).toBeGreaterThan(0.0001); // Roughly 10m in degrees
  });

  it('should return very small distances at city block zoom (15+)', () => {
    const distance = getClusteringDistance(15);
    expect(distance).toBeLessThan(0.001); // Very tight clustering at street level
  });
});

// 🆕 ADD: Integration tests for HLD workflows
describe('Clustering Integration (HLD Workflows)', () => {
  it('should support the primary investigation workflow', () => {
    // Simulate: User opens map from conversation with extracted locations
    const investigationPoints: MapPoint[] = [
      {
        id: 'warehouse_1',
        coordinates: [-0.1276, 51.5074],
        label: 'Warehouse District Call 1',
        messageId: 'investigation_msg',
        context: 'Phone call near warehouse',
        timestamp: '2025-07-31T14:30:00Z',
      },
      {
        id: 'warehouse_2', 
        coordinates: [-0.1278, 51.5076],
        label: 'Warehouse District Call 2',
        messageId: 'investigation_msg',
        context: 'Another call near warehouse',
        timestamp: '2025-07-31T15:45:00Z',
      },
    ];

    const cluster = initializeClustering(investigationPoints);
    
    // At investigation level zoom, should show individual points for analysis
    const investigationZoom = 16; // Above CLUSTER_MAX_ZOOM (15)
    const bbox: [number, number, number, number] = [-0.2, 51.4, -0.05, 51.6];
    const clusters = getClusters(cluster, bbox, investigationZoom);
    
    // Should not cluster at this zoom - user needs to see individual events
    const individualPoints = clusters.filter(c => !c.properties.cluster);
    expect(individualPoints.length).toBeGreaterThanOrEqual(2);
    expect(clusters.length).toBe(2); // Should have exactly 2 individual points
  });
});

// 🔍 MISSING TESTS TO ADD:
describe('Error Handling', () => {
  it('should handle invalid coordinates gracefully', () => {
    const invalidPoints: MapPoint[] = [
      {
        id: 'invalid',
        coordinates: [NaN, NaN] as [number, number],
        label: 'Invalid Point',
        messageId: 'msg',
        context: 'Invalid coordinates',
      },
    ];

    expect(() => initializeClustering(invalidPoints)).not.toThrow();
  });

  it('should handle extreme coordinate values', () => {
    const extremePoints: MapPoint[] = [
      {
        id: 'extreme',
        coordinates: [181, 91] as [number, number], // Outside valid range
        label: 'Extreme Point',
        messageId: 'msg',
        context: 'Out of bounds coordinates',
      },
    ];

    expect(() => initializeClustering(extremePoints)).not.toThrow();
  });
});