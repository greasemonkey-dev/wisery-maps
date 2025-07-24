import { describe, it, expect } from 'vitest';
import { 
  calculatePolygonArea,
  checkSelfIntersection,
  validatePolygon,
  assignPolygonColor,
  isPointNearby
} from './polygonValidation';

describe('polygonValidation', () => {
  describe('calculatePolygonArea', () => {
    it('should calculate area of simple square', () => {
      const square: [number, number][] = [
        [0, 0],
        [1, 0], 
        [1, 1],
        [0, 1]
      ];
      expect(calculatePolygonArea(square)).toBe(1);
    });

    it('should calculate area of triangle', () => {
      const triangle: [number, number][] = [
        [0, 0],
        [2, 0],
        [1, 2]
      ];
      expect(calculatePolygonArea(triangle)).toBe(2);
    });

    it('should return 0 for less than 3 vertices', () => {
      expect(calculatePolygonArea([[0, 0], [1, 1]])).toBe(0);
      expect(calculatePolygonArea([[0, 0]])).toBe(0);
      expect(calculatePolygonArea([])).toBe(0);
    });

    it('should handle clockwise and counterclockwise consistently', () => {
      const clockwise: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]];
      const counterclockwise: [number, number][] = [[0, 0], [0, 1], [1, 1], [1, 0]];
      
      expect(calculatePolygonArea(clockwise)).toBe(calculatePolygonArea(counterclockwise));
    });
  });

  describe('checkSelfIntersection', () => {
    it('should return false for simple shapes', () => {
      const triangle: [number, number][] = [[0, 0], [1, 0], [0.5, 1]];
      expect(checkSelfIntersection(triangle)).toBe(false);

      const square: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]];
      expect(checkSelfIntersection(square)).toBe(false);
    });

    it('should return true for self-intersecting polygons', () => {
      // Bowtie/hourglass shape
      const bowtie: [number, number][] = [
        [0, 0],
        [1, 1], 
        [1, 0],
        [0, 1]
      ];
      expect(checkSelfIntersection(bowtie)).toBe(true);
    });

    it('should return false for triangles', () => {
      const triangle: [number, number][] = [[0, 0], [1, 0], [0.5, 1]];
      expect(checkSelfIntersection(triangle)).toBe(false);
    });

    it('should handle complex valid polygons', () => {
      // Star-like shape that doesn't self-intersect
      const validComplex: [number, number][] = [
        [0, 0],
        [0.3, 0.3],
        [1, 0.2],
        [0.7, 0.7],
        [0.8, 1.2],
        [0.4, 1],
        [-0.2, 1.1],
        [0.1, 0.6]
      ];
      expect(checkSelfIntersection(validComplex)).toBe(false);
    });
  });

  describe('validatePolygon', () => {
    it('should reject polygons with less than 3 vertices', () => {
      const result = validatePolygon([[0, 0], [1, 1]]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least 3 vertices');
    });

    it('should reject self-intersecting polygons', () => {
      const bowtie: [number, number][] = [
        [0, 0], [1, 1], [1, 0], [0, 1]
      ];
      const result = validatePolygon(bowtie);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('intersect itself');
      expect(result.selfIntersects).toBe(true);
    });

    it('should reject polygons that are too small', () => {
      const tinyTriangle: [number, number][] = [
        [0, 0],
        [0.0001, 0],
        [0.00005, 0.0001]
      ];
      const result = validatePolygon(tinyTriangle);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too small');
      expect(result.area).toBeDefined();
      expect(result.area! < 0.001).toBe(true);
    });

    it('should accept valid polygons', () => {
      const validSquare: [number, number][] = [
        [0, 0], [0.1, 0], [0.1, 0.1], [0, 0.1]
      ];
      const result = validatePolygon(validSquare);
      expect(result.valid).toBe(true);
      expect(result.area).toBeCloseTo(0.01, 10); // 0.1 * 0.1
      expect(result.selfIntersects).toBe(false);
    });

    it('should accept valid complex polygons', () => {
      const pentagon: [number, number][] = [
        [0, 0.1],
        [0.05, 0],
        [0.1, 0.03],
        [0.08, 0.08],
        [0.02, 0.08]
      ];
      const result = validatePolygon(pentagon);
      expect(result.valid).toBe(true);
      expect(result.selfIntersects).toBe(false);
    });
  });

  describe('assignPolygonColor', () => {
    it('should cycle through colors correctly', () => {
      const colors = [
        '#4CBACB', '#E74C3C', '#F39C12', 
        '#27AE60', '#8E44AD', '#3498DB'
      ];
      
      for (let i = 0; i < colors.length; i++) {
        expect(assignPolygonColor(i)).toBe(colors[i]);
      }
      
      // Test cycling
      expect(assignPolygonColor(6)).toBe(colors[0]);
      expect(assignPolygonColor(7)).toBe(colors[1]);
    });
  });

  describe('isPointNearby', () => {
    it('should detect nearby points', () => {
      expect(isPointNearby([0, 0], [0.0005, 0.0005], 0.001)).toBe(true);
      expect(isPointNearby([0, 0], [0.0007, 0.0007], 0.001)).toBe(true);
    });

    it('should reject distant points', () => {
      expect(isPointNearby([0, 0], [0.002, 0.002], 0.001)).toBe(false);
      expect(isPointNearby([0, 0], [0.1, 0.1], 0.001)).toBe(false);
    });

    it('should use custom threshold', () => {
      expect(isPointNearby([0, 0], [0.005, 0.005], 0.01)).toBe(true);
      expect(isPointNearby([0, 0], [0.005, 0.005], 0.001)).toBe(false);
    });

    it('should handle exact matches', () => {
      expect(isPointNearby([1.5, 2.3], [1.5, 2.3], 0.001)).toBe(true);
    });
  });
});