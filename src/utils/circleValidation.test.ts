import { describe, it, expect } from 'vitest';
import {
  validateCircle,
  assignCircleColor,
  calculateDistance,
  formatRadius,
  formatArea,
  CIRCLE_MIN_RADIUS,
  CIRCLE_MAX_RADIUS,
  CIRCLE_COLORS
} from './circleValidation';

describe('circleValidation', () => {
  describe('validateCircle', () => {
    it('should validate circles with acceptable radius', () => {
      const center: [number, number] = [-0.1276, 51.5074];
      const radius = 100; // 100 meters
      
      const result = validateCircle(center, radius);
      
      expect(result.valid).toBe(true);
      expect(result.radius).toBe(radius);
      expect(result.area).toBeCloseTo(Math.PI * radius * radius);
    });

    it('should reject circles with radius below minimum', () => {
      const center: [number, number] = [-0.1276, 51.5074];
      const radius = CIRCLE_MIN_RADIUS - 1; // Below minimum
      
      const result = validateCircle(center, radius);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Circle too small');
      expect(result.radius).toBe(radius);
    });

    it('should reject circles with radius above maximum', () => {
      const center: [number, number] = [-0.1276, 51.5074];
      const radius = CIRCLE_MAX_RADIUS + 1; // Above maximum
      
      const result = validateCircle(center, radius);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Circle too large');
      expect(result.radius).toBe(radius);
    });

    it('should accept minimum radius exactly', () => {
      const center: [number, number] = [-0.1276, 51.5074];
      const radius = CIRCLE_MIN_RADIUS;
      
      const result = validateCircle(center, radius);
      
      expect(result.valid).toBe(true);
    });

    it('should accept maximum radius exactly', () => {
      const center: [number, number] = [-0.1276, 51.5074];
      const radius = CIRCLE_MAX_RADIUS;
      
      const result = validateCircle(center, radius);
      
      expect(result.valid).toBe(true);
    });
  });

  describe('assignCircleColor', () => {
    it('should return first color for first circle', () => {
      const color = assignCircleColor(0);
      expect(color).toBe(CIRCLE_COLORS[0]);
    });

    it('should cycle through colors', () => {
      for (let i = 0; i < CIRCLE_COLORS.length * 2; i++) {
        const color = assignCircleColor(i);
        expect(color).toBe(CIRCLE_COLORS[i % CIRCLE_COLORS.length]);
      }
    });

    it('should handle large numbers correctly', () => {
      const color = assignCircleColor(100);
      expect(color).toBe(CIRCLE_COLORS[100 % CIRCLE_COLORS.length]);
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      // London to roughly 1km east
      const point1: [number, number] = [-0.1276, 51.5074];
      const point2: [number, number] = [-0.1132, 51.5074]; // Roughly 1km east
      
      const distance = calculateDistance(point1, point2);
      
      // Should be approximately 1000 meters (allowing for some variation due to approximation)
      expect(distance).toBeGreaterThan(900);
      expect(distance).toBeLessThan(1100);
    });

    it('should return 0 for identical points', () => {
      const point: [number, number] = [-0.1276, 51.5074];
      const distance = calculateDistance(point, point);
      
      expect(distance).toBeCloseTo(0, 1);
    });

    it('should handle points across the equator', () => {
      const point1: [number, number] = [0, 0];
      const point2: [number, number] = [0, 1]; // 1 degree north
      
      const distance = calculateDistance(point1, point2);
      
      // Should be approximately 111km (1 degree of latitude)
      expect(distance).toBeGreaterThan(110000);
      expect(distance).toBeLessThan(112000);
    });
  });

  describe('formatRadius', () => {
    it('should format small radius in meters', () => {
      expect(formatRadius(50)).toBe('50m');
      expect(formatRadius(999)).toBe('999m');
    });

    it('should format large radius in kilometers', () => {
      expect(formatRadius(1000)).toBe('1.0km');
      expect(formatRadius(2500)).toBe('2.5km');
      expect(formatRadius(10000)).toBe('10.0km');
    });

    it('should round meters to nearest integer', () => {
      expect(formatRadius(123.7)).toBe('124m');
      expect(formatRadius(123.2)).toBe('123m');
    });

    it('should show one decimal place for kilometers', () => {
      expect(formatRadius(1234)).toBe('1.2km');
      expect(formatRadius(12345)).toBe('12.3km');
    });
  });

  describe('formatArea', () => {
    it('should format small area in square meters', () => {
      expect(formatArea(500)).toBe('500 m²');
      expect(formatArea(999999)).toBe('999999 m²');
    });

    it('should format large area in square kilometers', () => {
      expect(formatArea(1000000)).toBe('1.00 km²');
      expect(formatArea(2500000)).toBe('2.50 km²');
      expect(formatArea(10000000)).toBe('10.00 km²');
    });

    it('should round square meters to nearest integer', () => {
      expect(formatArea(123.7)).toBe('124 m²');
      expect(formatArea(123.2)).toBe('123 m²');
    });

    it('should show two decimal places for square kilometers', () => {
      expect(formatArea(1234567)).toBe('1.23 km²');
      expect(formatArea(12345678)).toBe('12.35 km²');
    });
  });

  describe('constants', () => {
    it('should have reasonable minimum radius', () => {
      expect(CIRCLE_MIN_RADIUS).toBe(10);
    });

    it('should have reasonable maximum radius', () => {
      expect(CIRCLE_MAX_RADIUS).toBe(50000);
    });

    it('should have 6 predefined colors', () => {
      expect(CIRCLE_COLORS).toHaveLength(6);
      expect(CIRCLE_COLORS[0]).toBe('#4CBACB'); // Teal
    });

    it('should have valid hex colors', () => {
      CIRCLE_COLORS.forEach(color => {
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });
  });
});