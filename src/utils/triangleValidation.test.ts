import { describe, it, expect } from 'vitest';
import { 
  calculateTriangleArea, 
  validateTriangle, 
  assignTriangleColor,
  TRIANGLE_COLORS,
  MIN_AREA_DEGREES 
} from './triangleValidation';

describe('calculateTriangleArea', () => {
  it('should calculate area correctly for a simple triangle', () => {
    const vertices: [[number, number], [number, number], [number, number]] = [
      [0, 0],
      [1, 0], 
      [0, 1]
    ];
    const area = calculateTriangleArea(vertices);
    expect(area).toBe(0.5);
  });

  it('should calculate area correctly for a larger triangle', () => {
    const vertices: [[number, number], [number, number], [number, number]] = [
      [0, 0],
      [2, 0],
      [1, 2]
    ];
    const area = calculateTriangleArea(vertices);
    expect(area).toBe(2);
  });

  it('should return 0 for collinear points', () => {
    const vertices: [[number, number], [number, number], [number, number]] = [
      [0, 0],
      [1, 0],
      [2, 0]
    ];
    const area = calculateTriangleArea(vertices);
    expect(area).toBe(0);
  });

  it('should handle negative coordinates', () => {
    const vertices: [[number, number], [number, number], [number, number]] = [
      [-1, -1],
      [1, -1],
      [0, 1]
    ];
    const area = calculateTriangleArea(vertices);
    expect(area).toBe(2);
  });
});

describe('validateTriangle', () => {
  it('should accept triangles above minimum area threshold', () => {
    // Large triangle (area = 0.5, well above 0.001 threshold)
    const vertices: [[number, number], [number, number], [number, number]] = [
      [0, 0],
      [1, 0],
      [0, 1]
    ];
    const result = validateTriangle(vertices);
    
    expect(result.valid).toBe(true);
    expect(result.area).toBe(0.5);
    expect(result.error).toBeUndefined();
  });

  it('should reject triangles below minimum area threshold', () => {
    // Very small triangle (area = 0.0005, below 0.001 threshold)
    const vertices: [[number, number], [number, number], [number, number]] = [
      [0, 0],
      [0.001, 0],
      [0, 0.001]
    ];
    const result = validateTriangle(vertices);
    
    expect(result.valid).toBe(false);
    expect(result.area).toBe(0.0000005);
    expect(result.error).toBe("Triangle too small - please draw a larger area");
  });

  it('should reject collinear points (zero area)', () => {
    const vertices: [[number, number], [number, number], [number, number]] = [
      [0, 0],
      [1, 0],
      [2, 0]
    ];
    const result = validateTriangle(vertices);
    
    expect(result.valid).toBe(false);
    expect(result.area).toBe(0);
    expect(result.error).toBe("Triangle too small - please draw a larger area");
  });

  it('should accept triangle exactly at minimum threshold', () => {
    // Triangle with area exactly at MIN_AREA_DEGREES (0.001)
    const vertices: [[number, number], [number, number], [number, number]] = [
      [0, 0],
      [Math.sqrt(0.002), 0],
      [0, Math.sqrt(0.002)]
    ];
    const result = validateTriangle(vertices);
    
    expect(result.valid).toBe(true);
    expect(result.area).toBeCloseTo(0.001, 6);
  });

  it('should handle real-world GPS coordinates', () => {
    // Triangle covering a substantial area (using significant coordinate differences)
    const vertices: [[number, number], [number, number], [number, number]] = [
      [0, 0],
      [0.1, 0], // 0.1 degree longitude difference
      [0, 0.1]  // 0.1 degree latitude difference
    ];
    const result = validateTriangle(vertices);
    
    expect(result.valid).toBe(true);
    expect(result.area).toBeGreaterThan(MIN_AREA_DEGREES);
    expect(result.area).toBeCloseTo(0.005, 6); // 0.5 * 0.1 * 0.1 = 0.005
  });
});

describe('assignTriangleColor', () => {
  it('should return first color for index 0', () => {
    expect(assignTriangleColor(0)).toBe(TRIANGLE_COLORS[0]);
    expect(assignTriangleColor(0)).toBe('#4CBACB');
  });

  it('should cycle through all colors', () => {
    for (let i = 0; i < TRIANGLE_COLORS.length; i++) {
      expect(assignTriangleColor(i)).toBe(TRIANGLE_COLORS[i]);
    }
  });

  it('should cycle back to first color after reaching end', () => {
    const colorCount = TRIANGLE_COLORS.length;
    expect(assignTriangleColor(colorCount)).toBe(TRIANGLE_COLORS[0]);
    expect(assignTriangleColor(colorCount + 1)).toBe(TRIANGLE_COLORS[1]);
    expect(assignTriangleColor(colorCount * 2)).toBe(TRIANGLE_COLORS[0]);
  });

  it('should handle large indices correctly', () => {
    const largeIndex = 1000;
    const expectedColorIndex = largeIndex % TRIANGLE_COLORS.length;
    expect(assignTriangleColor(largeIndex)).toBe(TRIANGLE_COLORS[expectedColorIndex]);
  });

  it('should have exactly 6 predefined colors', () => {
    expect(TRIANGLE_COLORS).toHaveLength(6);
    expect(TRIANGLE_COLORS).toEqual([
      '#4CBACB', // Teal
      '#E74C3C', // Red
      '#F39C12', // Orange
      '#27AE60', // Green
      '#8E44AD', // Purple
      '#3498DB'  // Blue
    ]);
  });
});