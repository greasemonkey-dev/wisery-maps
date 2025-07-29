import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock MapTiler SDK to avoid browser-specific imports in tests
vi.mock('@maptiler/sdk', () => ({
  math: {
    EARTH_RADIUS: 6371000,
    EARTH_CIRCUMFERENCE: 40075016.685578488,
    haversineDistanceWgs84: (point1: [number, number], point2: [number, number]) => {
      // Simple Haversine distance implementation for testing
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
    },
    haversineCumulatedDistanceWgs84: (points: [number, number][]) => {
      // Mock cumulative distance calculation
      const distances: number[] = [];
      let totalDistance = 0;
      
      for (let i = 1; i < points.length; i++) {
        const distance = Math.random() * 1000; // Mock distance for testing
        totalDistance += distance;
        distances.push(totalDistance);
      }
      
      return distances;
    },
    wgs84ToMercator: (point: [number, number]) => {
      // Simple mock conversion
      const [lng, lat] = point;
      return [lng * 111320, lat * 110540];
    },
    mercatorToWgs84: (point: [number, number]) => {
      // Simple mock conversion
      const [x, y] = point;
      return [x / 111320, y / 110540];
    },
    wgs84ToTileIndex: (point: [number, number], zoom: number) => {
      // Simple mock tile index calculation
      const [lng, lat] = point;
      const n = Math.pow(2, zoom);
      return [
        Math.floor((lng + 180) / 360 * n),
        Math.floor((1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) / 2 * n)
      ];
    }
  },
  config: {
    apiKey: 'test-api-key'
  },
  MapStyle: {
    STREETS: 'streets-style-url'
  },
  Map: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    off: vi.fn(),
    getCanvas: vi.fn(() => ({ style: { cursor: '' } })),
    addSource: vi.fn(),
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    removeSource: vi.fn(),
    getLayer: vi.fn(),
    getSource: vi.fn(),
    queryRenderedFeatures: vi.fn(() => []),
    easeTo: vi.fn(),
    flyTo: vi.fn(),
    getCenter: vi.fn(() => ({ lng: 0, lat: 0 })),
    getZoom: vi.fn(() => 10),
    getBearing: vi.fn(() => 0),
    getPitch: vi.fn(() => 0),
    remove: vi.fn()
  }))
}))

// Mock browser APIs that might be needed
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn()
  }
})