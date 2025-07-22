import { describe, it, expect } from 'vitest';
import {
  loadMockEvents,
  convertToMapPoint,
  convertToMessageGroup,
  getAllLocationsAsMapPoints,
  getLocationsByConversation,
  getLocationsByMessage,
  getClusteringTestScenarios,
  getLocationsByBoundingBox,
  getLondonLocations,
  getInternationalLocations,
  getMockDataStats,
} from './mockDataLoader';

describe('mockDataLoader', () => {
  describe('loadMockEvents', () => {
    it('should load mock events data successfully', () => {
      const data = loadMockEvents();
      
      expect(data).toBeDefined();
      expect(data.conversations).toBeDefined();
      expect(data.metadata).toBeDefined();
      expect(Array.isArray(data.conversations)).toBe(true);
    });

    it('should contain expected number of conversations', () => {
      const data = loadMockEvents();
      expect(data.conversations.length).toBeGreaterThan(0);
      expect(data.metadata.total_conversations).toBe(data.conversations.length);
    });
  });

  describe('convertToMapPoint', () => {
    it('should convert mock location to MapPoint format', () => {
      const mockLocation = {
        id: 'test_location',
        coordinates: [-0.1276, 51.5074] as [number, number],
        label: 'Test Location',
        context: 'Test context',
        timestamp: '2025-07-31T14:30:00Z',
      };

      const mapPoint = convertToMapPoint(mockLocation, 'test_message');

      expect(mapPoint).toEqual({
        id: 'test_location',
        coordinates: [-0.1276, 51.5074],
        label: 'Test Location',
        messageId: 'test_message',
        context: 'Test context',
        timestamp: '2025-07-31T14:30:00Z',
      });
    });
  });

  describe('convertToMessageGroup', () => {
    it('should convert mock message to MessageGroup format', () => {
      const mockMessage = {
        messageId: 'test_message',
        summary: 'Test summary',
        timestamp: '2025-07-31T14:30:00Z',
        locations: [
          {
            id: 'loc1',
            coordinates: [-0.1276, 51.5074] as [number, number],
            label: 'Location 1',
            context: 'Context 1',
            timestamp: '2025-07-31T14:30:00Z',
          },
        ],
      };

      const messageGroup = convertToMessageGroup(mockMessage);

      expect(messageGroup.messageId).toBe('test_message');
      expect(messageGroup.summary).toBe('Test summary');
      expect(messageGroup.locations).toHaveLength(1);
      expect(messageGroup.timestamp).toEqual(new Date('2025-07-31T14:30:00Z'));
    });
  });

  describe('getAllLocationsAsMapPoints', () => {
    it('should return all locations from all conversations', () => {
      const locations = getAllLocationsAsMapPoints();
      
      expect(Array.isArray(locations)).toBe(true);
      expect(locations.length).toBeGreaterThan(0);
      
      // Check that each item is a proper MapPoint
      locations.forEach(location => {
        expect(location).toHaveProperty('id');
        expect(location).toHaveProperty('coordinates');
        expect(location).toHaveProperty('label');
        expect(location).toHaveProperty('messageId');
        expect(location).toHaveProperty('context');
        expect(Array.isArray(location.coordinates)).toBe(true);
        expect(location.coordinates).toHaveLength(2);
      });
    });

    it('should match metadata total count', () => {
      const data = loadMockEvents();
      const locations = getAllLocationsAsMapPoints();
      
      expect(locations.length).toBe(data.metadata.total_locations);
    });
  });

  describe('getLocationsByConversation', () => {
    it('should return locations for warehouse investigation', () => {
      const messageGroups = getLocationsByConversation('conv_warehouse_investigation');
      
      expect(messageGroups.length).toBeGreaterThan(0);
      expect(messageGroups[0].messageId).toBe('msg_warehouse_calls');
      expect(messageGroups[0].locations.length).toBe(3); // 3 warehouse locations
    });

    it('should return empty array for non-existent conversation', () => {
      const messageGroups = getLocationsByConversation('non_existent_conv');
      expect(messageGroups).toEqual([]);
    });
  });

  describe('getLocationsByMessage', () => {
    it('should return locations for warehouse calls message', () => {
      const locations = getLocationsByMessage('msg_warehouse_calls');
      
      expect(locations).toHaveLength(3);
      expect(locations[0].label).toBe('Warehouse Loading Bay');
      expect(locations[1].label).toBe('Warehouse Office Complex');
      expect(locations[2].label).toBe('Warehouse Security Gate');
    });

    it('should return empty array for non-existent message', () => {
      const locations = getLocationsByMessage('non_existent_msg');
      expect(locations).toEqual([]);
    });
  });

  describe('getClusteringTestScenarios', () => {
    it('should return predefined test scenarios', () => {
      const scenarios = getClusteringTestScenarios();
      
      expect(scenarios).toHaveProperty('dense_cluster');
      expect(scenarios).toHaveProperty('warehouse_investigation');
      expect(scenarios).toHaveProperty('gang_territory');
      expect(scenarios).toHaveProperty('transport_hubs');
      
      // Dense cluster should have 8 points (Covent Garden)
      expect(scenarios.dense_cluster).toHaveLength(8);
      
      // Warehouse investigation should have 3 points
      expect(scenarios.warehouse_investigation).toHaveLength(3);
      
      // Gang territory should have 4 points
      expect(scenarios.gang_territory).toHaveLength(4);
      
      // Transport hubs should have 3 points
      expect(scenarios.transport_hubs).toHaveLength(3);
    });

    it('should have realistic coordinates for each scenario', () => {
      const scenarios = getClusteringTestScenarios();
      
      // All London scenarios should be within London bounds
      const londonBounds = { west: -0.5, east: 0.1, south: 51.4, north: 51.6 };
      
      ['dense_cluster', 'warehouse_investigation', 'gang_territory', 'transport_hubs'].forEach(scenarioName => {
        scenarios[scenarioName].forEach(location => {
          const [lng, lat] = location.coordinates;
          expect(lng).toBeGreaterThanOrEqual(londonBounds.west);
          expect(lng).toBeLessThanOrEqual(londonBounds.east);
          expect(lat).toBeGreaterThanOrEqual(londonBounds.south);
          expect(lat).toBeLessThanOrEqual(londonBounds.north);
        });
      });
    });
  });

  describe('getLocationsByBoundingBox', () => {
    it('should filter locations by bounding box', () => {
      // London area bounding box
      const londonLocations = getLocationsByBoundingBox(-0.5, 51.4, 0.1, 51.6);
      
      expect(londonLocations.length).toBeGreaterThan(0);
      
      londonLocations.forEach(location => {
        const [lng, lat] = location.coordinates;
        expect(lng).toBeGreaterThanOrEqual(-0.5);
        expect(lng).toBeLessThanOrEqual(0.1);
        expect(lat).toBeGreaterThanOrEqual(51.4);
        expect(lat).toBeLessThanOrEqual(51.6);
      });
    });

    it('should return empty array for empty bounding box', () => {
      // Very small bounding box with no locations
      const emptyLocations = getLocationsByBoundingBox(0, 0, 0.001, 0.001);
      expect(emptyLocations).toEqual([]);
    });
  });

  describe('getLondonLocations', () => {
    it('should return only London-based locations', () => {
      const londonLocations = getLondonLocations();
      
      expect(londonLocations.length).toBeGreaterThan(0);
      
      londonLocations.forEach(location => {
        const [lng, lat] = location.coordinates;
        expect(lng).toBeGreaterThanOrEqual(-0.5);
        expect(lng).toBeLessThanOrEqual(0.1);
        expect(lat).toBeGreaterThanOrEqual(51.4);
        expect(lat).toBeLessThanOrEqual(51.6);
      });
    });
  });

  describe('getInternationalLocations', () => {
    it('should return only international locations (non-London)', () => {
      const internationalLocations = getInternationalLocations();
      
      expect(internationalLocations.length).toBeGreaterThan(0);
      
      // Should contain Paris, Amsterdam, Berlin locations
      const parisLocation = internationalLocations.find(loc => loc.label.includes('Louvre'));
      const amsterdamLocation = internationalLocations.find(loc => loc.label.includes('Amsterdam'));
      const berlinLocation = internationalLocations.find(loc => loc.label.includes('Brandenburg'));
      
      expect(parisLocation).toBeDefined();
      expect(amsterdamLocation).toBeDefined();
      expect(berlinLocation).toBeDefined();
    });

    it('should not include London locations', () => {
      const internationalLocations = getInternationalLocations();
      
      internationalLocations.forEach(location => {
        const [lng, lat] = location.coordinates;
        const isInLondon = lng >= -0.5 && lng <= 0.1 && lat >= 51.4 && lat <= 51.6;
        expect(isInLondon).toBe(false);
      });
    });
  });

  describe('getMockDataStats', () => {
    it('should return correct statistics', () => {
      const stats = getMockDataStats();
      
      expect(stats).toHaveProperty('conversations');
      expect(stats).toHaveProperty('messages');
      expect(stats).toHaveProperty('locations');
      expect(stats).toHaveProperty('londonLocations');
      expect(stats).toHaveProperty('internationalLocations');
      expect(stats).toHaveProperty('dateRange');
      expect(stats).toHaveProperty('boundingBox');
      
      expect(stats.conversations).toBeGreaterThan(0);
      expect(stats.messages).toBeGreaterThan(0);
      expect(stats.locations).toBeGreaterThan(0);
      expect(stats.londonLocations).toBeGreaterThan(0);
      expect(stats.internationalLocations).toBeGreaterThan(0);
      
      // Total should equal London + International
      expect(stats.locations).toBe(stats.londonLocations + stats.internationalLocations);
    });

    it('should have valid date range', () => {
      const stats = getMockDataStats();
      
      expect(stats.dateRange.start).toBeDefined();
      expect(stats.dateRange.end).toBeDefined();
      
      const startDate = new Date(stats.dateRange.start);
      const endDate = new Date(stats.dateRange.end);
      
      expect(startDate.getTime()).toBeLessThan(endDate.getTime());
    });

    it('should have valid bounding box covering Europe', () => {
      const stats = getMockDataStats();
      const bbox = stats.boundingBox;
      
      expect(bbox.west).toBeLessThan(bbox.east);
      expect(bbox.south).toBeLessThan(bbox.north);
      
      // Should roughly cover London to Berlin
      expect(bbox.west).toBeLessThan(0); // West of London
      expect(bbox.east).toBeGreaterThan(10); // East of Berlin  
      expect(bbox.south).toBeLessThan(50); // South of London
      expect(bbox.north).toBeGreaterThan(52); // North of Berlin
    });
  });
});