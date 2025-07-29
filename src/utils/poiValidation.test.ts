import { describe, it, expect } from 'vitest';
import {
  validatePOI,
  validatePOILocation,
  snapPOICoordinates,
  assignPOIColor,
  assignPOIIcon,
  getPOICategories,
  getPOIIcons,
  getPOIColors
} from './poiValidation';
import type { POI } from '../types';

describe('poiValidation', () => {
  describe('validatePOI', () => {
    it('should validate correct coordinates', () => {
      const result = validatePOI([-0.1276, 51.5074], 'Test POI');
      expect(result.valid).toBe(true);
      expect(result.coordinates).toEqual([-0.1276, 51.5074]);
    });

    it('should reject invalid longitude', () => {
      const result = validatePOI([181, 51.5074], 'Test POI');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Longitude must be between -180 and 180');
    });

    it('should reject invalid latitude', () => {
      const result = validatePOI([-0.1276, 91], 'Test POI');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Latitude must be between -90 and 90');
    });

    it('should reject non-numeric coordinates', () => {
      const result = validatePOI(['invalid' as any, 51.5074], 'Test POI');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid coordinates - must be numbers');
    });

    it('should reject empty name', () => {
      const result = validatePOI([-0.1276, 51.5074], '   ');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('POI name cannot be empty');
    });

    it('should reject name that is too long', () => {
      const longName = 'a'.repeat(101);
      const result = validatePOI([-0.1276, 51.5074], longName);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('POI name must be less than 100 characters');
    });

    it('should allow undefined name', () => {
      const result = validatePOI([-0.1276, 51.5074]);
      expect(result.valid).toBe(true);
    });

    it('should round coordinates to appropriate precision', () => {
      const result = validatePOI([-0.123456789, 51.507654321], 'Test POI');
      expect(result.valid).toBe(true);
      expect(result.coordinates).toEqual([-0.12346, 51.50765]);
    });
  });

  describe('validatePOILocation', () => {
    const existingPOIs: POI[] = [
      {
        id: 'poi1',
        name: 'Existing POI',
        coordinates: [-0.1276, 51.5074],
        userId: 'user1',
        color: '#4CBACB',
        icon: 'marker',
        createdAt: new Date()
      }
    ];

    it('should allow POI at valid distance', () => {
      const result = validatePOILocation([-0.1280, 51.5078], existingPOIs, 10);
      expect(result.valid).toBe(true);
    });

    it('should reject POI too close to existing one', () => {
      const result = validatePOILocation([-0.12761, 51.50741], existingPOIs, 10);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('POI too close to existing POI');
      expect(result.nearbyPOI).toBeDefined();
    });

    it('should work with custom minimum distance', () => {
      const result = validatePOILocation([-0.1277, 51.5075], existingPOIs, 50);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('POI too close');
    });

    it('should allow placement when no existing POIs', () => {
      const result = validatePOILocation([-0.1276, 51.5074], [], 10);
      expect(result.valid).toBe(true);
    });
  });

  describe('snapPOICoordinates', () => {
    const snapTargets: [number, number][] = [
      [-0.1276, 51.5074],
      [-0.1280, 51.5078]
    ];

    it('should snap to nearby target', () => {
      const result = snapPOICoordinates([-0.12761, 51.50741], snapTargets, 20);
      expect(result.snapped).toBe(true);
      expect(result.coordinates).toEqual([-0.1276, 51.5074]);
      expect(result.snapTarget).toEqual([-0.1276, 51.5074]);
    });

    it('should not snap when too far', () => {
      const result = snapPOICoordinates([-0.1300, 51.5100], snapTargets, 20);
      expect(result.snapped).toBe(false);
      expect(result.coordinates).toEqual([-0.1300, 51.5100]);
      expect(result.snapTarget).toBeUndefined();
    });

    it('should work with custom snap distance', () => {
      const result = snapPOICoordinates([-0.1277, 51.5075], snapTargets, 50);
      expect(result.snapped).toBe(true);
      expect(result.coordinates).toEqual([-0.1276, 51.5074]);
    });

    it('should handle empty snap targets', () => {
      const result = snapPOICoordinates([-0.1276, 51.5074], [], 20);
      expect(result.snapped).toBe(false);
      expect(result.coordinates).toEqual([-0.1276, 51.5074]);
    });
  });

  describe('assignPOIColor', () => {
    it('should cycle through colors', () => {
      expect(assignPOIColor(0)).toBe('#4CBACB'); // Teal
      expect(assignPOIColor(1)).toBe('#E74C3C'); // Red
      expect(assignPOIColor(2)).toBe('#F39C12'); // Orange
      expect(assignPOIColor(6)).toBe('#4CBACB'); // Should cycle back to first
      expect(assignPOIColor(7)).toBe('#E74C3C'); // Second color again
    });
  });

  describe('assignPOIIcon', () => {
    it('should assign category-based icons', () => {
      expect(assignPOIIcon('business')).toBe('building');
      expect(assignPOIIcon('transportation')).toBe('car');
      expect(assignPOIIcon('food')).toBe('coffee');
      expect(assignPOIIcon('general')).toBe('marker');
    });

    it('should fall back to count-based icons for unknown categories', () => {
      expect(assignPOIIcon('unknown', 0)).toBe('marker');
      expect(assignPOIIcon('unknown', 1)).toBe('flag');
      expect(assignPOIIcon('unknown', 2)).toBe('star');
    });

    it('should cycle through icons when count exceeds available icons', () => {
      expect(assignPOIIcon('unknown', 10)).toBe('marker'); // Should cycle back
    });
  });

  describe('utility functions', () => {
    it('should return available categories', () => {
      const categories = getPOICategories();
      expect(categories).toContain('general');
      expect(categories).toContain('business');
      expect(categories).toContain('transportation');
      expect(categories.length).toBeGreaterThan(5);
    });

    it('should return available icons', () => {
      const icons = getPOIIcons();
      expect(icons).toContain('marker');
      expect(icons).toContain('flag');
      expect(icons).toContain('star');
      expect(icons.length).toBeGreaterThan(5);
    });

    it('should return available colors', () => {
      const colors = getPOIColors();
      expect(colors).toContain('#4CBACB');
      expect(colors).toContain('#E74C3C');
      expect(colors).toContain('#F39C12');
      expect(colors.length).toBe(6);
    });
  });
});