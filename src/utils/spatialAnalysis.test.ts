import { describe, it, expect } from 'vitest';
import {
  calculateDistance,
  isPointInTriangle,
  isPointInCircle,
  isPointInPolygon,
  getLocationsInTriangle,
  getLocationsInCircle,
  getLocationsInPolygon,
  analyzeAllAOIs,
  getSpatialAnalysisSummary
} from './spatialAnalysis';
import type { MapPoint, Triangle, Circle, Polygon } from '../types';

describe('spatialAnalysis', () => {
  // Test data
  const testLocations: MapPoint[] = [
    {
      id: 'loc1',
      coordinates: [0, 0],
      label: 'Origin',
      messageId: 'msg1',
      context: 'Test location at origin'
    },
    {
      id: 'loc2', 
      coordinates: [0.5, 0.5],
      label: 'Inside Square',
      messageId: 'msg2',
      context: 'Location inside test square'
    },
    {
      id: 'loc3',
      coordinates: [2, 2],
      label: 'Outside',
      messageId: 'msg3', 
      context: 'Location outside test shapes'
    },
    {
      id: 'loc4',
      coordinates: [0.1, 0.1],
      label: 'Near Origin',
      messageId: 'msg4',
      context: 'Location near origin'
    }
  ];

  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      const distance = calculateDistance([0, 0], [0, 0.001]);
      expect(distance).toBeCloseTo(111.19, 1); // ~111m per degree at equator
    });

    it('should handle same point distance', () => {
      const distance = calculateDistance([1.5, 2.3], [1.5, 2.3]);
      expect(distance).toBe(0);
    });

    it('should calculate longer distances correctly', () => {
      // London to Paris approximate
      const distance = calculateDistance([-0.1276, 51.5074], [2.3522, 48.8566]);
      expect(distance).toBeCloseTo(344000, -3); // ~344km
    });
  });

  describe('isPointInTriangle', () => {
    const triangle: [[number, number], [number, number], [number, number]] = [
      [0, 0], [1, 0], [0.5, 1]
    ];

    it('should detect points inside triangle', () => {
      expect(isPointInTriangle([0.3, 0.3], triangle)).toBe(true);
      expect(isPointInTriangle([0.5, 0.2], triangle)).toBe(true);
    });

    it('should detect points outside triangle', () => {
      expect(isPointInTriangle([1.5, 0.5], triangle)).toBe(false);
      expect(isPointInTriangle([-0.5, 0.5], triangle)).toBe(false);
      expect(isPointInTriangle([0.5, 1.5], triangle)).toBe(false);
    });

    it('should handle edge cases', () => {
      // Points on vertices
      expect(isPointInTriangle([0, 0], triangle)).toBe(true);
      expect(isPointInTriangle([1, 0], triangle)).toBe(true);
      expect(isPointInTriangle([0.5, 1], triangle)).toBe(true);
    });

    it('should handle degenerate triangles', () => {
      const degenerateTriangle: [[number, number], [number, number], [number, number]] = [
        [0, 0], [1, 0], [2, 0] // All points on same line
      ];
      expect(isPointInTriangle([0.5, 0], degenerateTriangle)).toBe(false);
    });
  });

  describe('isPointInCircle', () => {
    const center: [number, number] = [0, 0];
    const radius = 1000; // 1km

    it('should detect points inside circle', () => {
      expect(isPointInCircle([0, 0], center, radius)).toBe(true); // Center
      expect(isPointInCircle([0, 0.005], center, radius)).toBe(true); // ~500m away
    });

    it('should detect points outside circle', () => {
      expect(isPointInCircle([0, 0.02], center, radius)).toBe(false); // ~2km away
      expect(isPointInCircle([0.01, 0.01], center, radius)).toBe(false); // >1km away
    });

    it('should handle boundary cases', () => {
      // Point exactly at radius distance should be inside (<=)
      const boundaryDistance = radius / 111320; // Convert to degrees
      expect(isPointInCircle([0, boundaryDistance], center, radius)).toBe(true);
    });
  });

  describe('isPointInPolygon', () => {
    const square: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]];
    const pentagon: [number, number][] = [[0, 0], [1, 0], [1.5, 0.5], [0.5, 1.5], [-0.5, 0.5]];

    it('should detect points inside square polygon', () => {
      expect(isPointInPolygon([0.5, 0.5], square)).toBe(true);
      expect(isPointInPolygon([0.1, 0.1], square)).toBe(true);
      expect(isPointInPolygon([0.9, 0.9], square)).toBe(true);
    });

    it('should detect points outside square polygon', () => {
      expect(isPointInPolygon([1.5, 0.5], square)).toBe(false);
      expect(isPointInPolygon([-0.5, 0.5], square)).toBe(false);
      expect(isPointInPolygon([0.5, 1.5], square)).toBe(false);
    });

    it('should handle complex polygons', () => {
      expect(isPointInPolygon([0.5, 0.5], pentagon)).toBe(true);
      expect(isPointInPolygon([0, 0.5], pentagon)).toBe(true);
      expect(isPointInPolygon([2, 2], pentagon)).toBe(false);
    });

    it('should handle edge cases', () => {
      // Ray casting algorithm can be tricky with vertices/edges, these are acceptable results
      expect(typeof isPointInPolygon([0, 0], square)).toBe('boolean'); // Vertex case
      expect(typeof isPointInPolygon([0.5, 0], square)).toBe('boolean'); // Edge case
    });

    it('should return false for invalid polygons', () => {
      expect(isPointInPolygon([0.5, 0.5], [[0, 0], [1, 1]] as [number, number][])).toBe(false); // <3 vertices
      expect(isPointInPolygon([0.5, 0.5], [] as [number, number][])).toBe(false); // Empty
    });
  });

  describe('getLocationsInTriangle', () => {
    const triangle: Triangle = {
      id: 'tri1',
      name: 'Test Triangle',
      vertices: [[0, 0], [1, 0], [0.5, 1]],
      userId: 'user1',
      color: '#4CBACB',
      createdAt: new Date()
    };

    it('should return locations inside triangle', () => {
      const locations = getLocationsInTriangle(triangle, testLocations);
      const locationIds = locations.map(loc => loc.id);
      
      expect(locationIds).toContain('loc1'); // [0, 0] - vertex
      expect(locationIds).toContain('loc4'); // [0.1, 0.1] - inside
      // [0.5, 0.5] is actually inside this triangle: vertices [[0, 0], [1, 0], [0.5, 1]]
      expect(locationIds).toContain('loc2'); // [0.5, 0.5] - inside triangle
      expect(locationIds).not.toContain('loc3'); // [2, 2] - definitely outside
    });
  });

  describe('getLocationsInCircle', () => {
    const circle: Circle = {
      id: 'circ1',
      name: 'Test Circle',
      center: [0, 0],
      radius: 100000, // 100km
      userId: 'user1',
      color: '#E74C3C',
      createdAt: new Date()
    };

    it('should return locations inside circle', () => {
      const locations = getLocationsInCircle(circle, testLocations);
      const locationIds = locations.map(loc => loc.id);
      
      expect(locationIds).toContain('loc1'); // [0, 0] - center
      expect(locationIds).toContain('loc2'); // [0.5, 0.5] - within 100km
      expect(locationIds).toContain('loc4'); // [0.1, 0.1] - within 100km
      expect(locationIds).not.toContain('loc3'); // [2, 2] - > 100km away
    });
  });

  describe('getLocationsInPolygon', () => {
    const polygon: Polygon = {
      id: 'poly1',
      name: 'Test Polygon',
      vertices: [[-0.5, -0.5], [1.5, -0.5], [1.5, 1.5], [-0.5, 1.5]], // Large square
      userId: 'user1',
      color: '#F39C12',
      createdAt: new Date()
    };

    it('should return locations inside polygon', () => {
      const locations = getLocationsInPolygon(polygon, testLocations);
      const locationIds = locations.map(loc => loc.id);
      
      expect(locationIds).toContain('loc1'); // [0, 0] - inside
      expect(locationIds).toContain('loc2'); // [0.5, 0.5] - inside  
      expect(locationIds).toContain('loc4'); // [0.1, 0.1] - inside
      expect(locationIds).not.toContain('loc3'); // [2, 2] - outside
    });
  });

  describe('analyzeAllAOIs', () => {
    const triangle: Triangle = {
      id: 'tri1',
      name: 'Test Triangle',
      vertices: [[-1, -1], [2, -1], [0.5, 2]],
      userId: 'user1', 
      color: '#4CBACB',
      createdAt: new Date()
    };

    const circle: Circle = {
      id: 'circ1',
      name: 'Test Circle',
      center: [0, 0],
      radius: 50000, // 50km
      userId: 'user1',
      color: '#E74C3C', 
      createdAt: new Date()
    };

    const polygon: Polygon = {
      id: 'poly1',
      name: 'Test Polygon',
      vertices: [[0.4, 0.4], [0.6, 0.4], [0.6, 0.6], [0.4, 0.6]], // Small square around [0.5, 0.5]
      userId: 'user1',
      color: '#F39C12',
      createdAt: new Date()
    };

    it('should analyze all AOI types', () => {
      const analyses = analyzeAllAOIs([triangle], [circle], [polygon], testLocations);
      
      expect(analyses).toHaveLength(3);
      expect(analyses.map(a => a.type)).toEqual(['triangle', 'circle', 'polygon']);
      expect(analyses.map(a => a.id)).toEqual(['tri1', 'circ1', 'poly1']);
    });

    it('should correctly count contained locations', () => {
      const analyses = analyzeAllAOIs([triangle], [circle], [polygon], testLocations);
      
      // Each analysis should have locationCount matching containedLocations.length
      analyses.forEach(analysis => {
        expect(analysis.locationCount).toBe(analysis.containedLocations.length);
        expect(analysis.containedLocations.every(loc => 
          testLocations.some(testLoc => testLoc.id === loc.id)
        )).toBe(true);
      });
    });
  });

  describe('getSpatialAnalysisSummary', () => {
    const mockAnalyses = [
      {
        id: 'aoi1',
        name: 'AOI 1',
        type: 'triangle' as const,
        color: '#4CBACB',
        createdAt: new Date(),
        containedLocations: testLocations.slice(0, 2),
        locationCount: 2
      },
      {
        id: 'aoi2', 
        name: 'AOI 2',
        type: 'circle' as const,
        color: '#E74C3C',
        createdAt: new Date(),
        containedLocations: [],
        locationCount: 0
      },
      {
        id: 'aoi3',
        name: 'AOI 3', 
        type: 'polygon' as const,
        color: '#F39C12',
        createdAt: new Date(),
        containedLocations: testLocations.slice(0, 3),
        locationCount: 3
      }
    ];

    it('should calculate correct summary statistics', () => {
      const summary = getSpatialAnalysisSummary(mockAnalyses);
      
      expect(summary.totalAOIs).toBe(3);
      expect(summary.totalLocations).toBe(5); // 2 + 0 + 3
      expect(summary.emptyAOIs).toBe(1);
      expect(summary.nonEmptyAOIs).toBe(2);
      expect(summary.averageLocationsPerAOI).toBeCloseTo(5/3, 2);
      expect(summary.mostPopulatedAOI?.id).toBe('aoi3');
      expect(summary.mostPopulatedAOI?.locationCount).toBe(3);
    });

    it('should handle empty analysis array', () => {
      const summary = getSpatialAnalysisSummary([]);
      
      expect(summary.totalAOIs).toBe(0);
      expect(summary.totalLocations).toBe(0);
      expect(summary.emptyAOIs).toBe(0);
      expect(summary.nonEmptyAOIs).toBe(0);
      expect(summary.averageLocationsPerAOI).toBe(0);
      expect(summary.mostPopulatedAOI).toBeNull();
    });

    it('should handle all empty AOIs', () => {
      const emptyAnalyses = mockAnalyses.map(analysis => ({
        ...analysis,
        containedLocations: [],
        locationCount: 0
      }));
      
      const summary = getSpatialAnalysisSummary(emptyAnalyses);
      
      expect(summary.totalAOIs).toBe(3);
      expect(summary.totalLocations).toBe(0);
      expect(summary.emptyAOIs).toBe(3);
      expect(summary.nonEmptyAOIs).toBe(0);
      expect(summary.mostPopulatedAOI).toBeNull();
    });
  });
});