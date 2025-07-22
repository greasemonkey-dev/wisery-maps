import type { MapPoint, MessageGroup } from '../types';
import mockEventsData from '../data/mockEvents.json';

export interface MockConversation {
  conversationId: string;
  title: string;
  timestamp: string;
  messages: MockMessage[];
}

export interface MockMessage {
  messageId: string;
  summary: string;
  timestamp: string;
  locations: MockLocation[];
}

export interface MockLocation {
  id: string;
  coordinates: [number, number];
  label: string;
  context: string;
  timestamp: string;
}

export interface MockEventsData {
  conversations: MockConversation[];
  metadata: {
    total_conversations: number;
    total_messages: number;
    total_locations: number;
    date_range: {
      start: string;
      end: string;
    };
    geographic_coverage: {
      primary_city: string;
      secondary_locations: string[];
      bounding_box: {
        west: number;
        east: number;
        south: number;
        north: number;
      };
    };
    clustering_test_scenarios: Record<string, string>;
  };
}

/**
 * Load mock events data
 */
export function loadMockEvents(): MockEventsData {
  return mockEventsData as unknown as MockEventsData;
}

/**
 * Convert mock location to MapPoint format
 */
export function convertToMapPoint(location: MockLocation, messageId: string): MapPoint {
  return {
    id: location.id,
    coordinates: location.coordinates,
    label: location.label,
    messageId: messageId,
    context: location.context,
    timestamp: location.timestamp,
  };
}

/**
 * Convert mock message to MessageGroup format
 */
export function convertToMessageGroup(message: MockMessage): MessageGroup {
  return {
    messageId: message.messageId,
    summary: message.summary,
    locations: message.locations.map(loc => convertToMapPoint(loc, message.messageId)),
    timestamp: new Date(message.timestamp),
  };
}

/**
 * Get all locations from all conversations as MapPoints
 */
export function getAllLocationsAsMapPoints(): MapPoint[] {
  const data = loadMockEvents();
  const allLocations: MapPoint[] = [];

  data.conversations.forEach(conversation => {
    conversation.messages.forEach(message => {
      message.locations.forEach(location => {
        allLocations.push(convertToMapPoint(location, message.messageId));
      });
    });
  });

  return allLocations;
}

/**
 * Get locations by conversation ID
 */
export function getLocationsByConversation(conversationId: string): MessageGroup[] {
  const data = loadMockEvents();
  const conversation = data.conversations.find(c => c.conversationId === conversationId);
  
  if (!conversation) {
    return [];
  }

  return conversation.messages.map(convertToMessageGroup);
}

/**
 * Get locations by message ID
 */
export function getLocationsByMessage(messageId: string): MapPoint[] {
  const data = loadMockEvents();
  
  for (const conversation of data.conversations) {
    for (const message of conversation.messages) {
      if (message.messageId === messageId) {
        return message.locations.map(loc => convertToMapPoint(loc, message.messageId));
      }
    }
  }
  
  return [];
}

/**
 * Get predefined test scenarios for clustering
 */
export function getClusteringTestScenarios(): Record<string, MapPoint[]> {
  const scenarios: Record<string, MapPoint[]> = {};
  
  // Dense cluster scenario (Covent Garden)
  scenarios.dense_cluster = getLocationsByMessage('msg_covent_garden');
  
  // Warehouse investigation scenario
  scenarios.warehouse_investigation = getLocationsByMessage('msg_warehouse_calls');
  
  // Gang territory scenario
  scenarios.gang_territory = getLocationsByMessage('msg_south_london');
  
  // Transport hubs scenario
  scenarios.transport_hubs = getLocationsByMessage('msg_kings_cross');
  
  return scenarios;
}

/**
 * Get locations within a specific geographic area
 */
export function getLocationsByBoundingBox(
  west: number,
  south: number,
  east: number,
  north: number
): MapPoint[] {
  const allLocations = getAllLocationsAsMapPoints();
  
  return allLocations.filter(location => {
    const [lng, lat] = location.coordinates;
    return lng >= west && lng <= east && lat >= south && lat <= north;
  });
}

/**
 * Get London-specific locations (primary test area)
 */
export function getLondonLocations(): MapPoint[] {
  // London bounding box (approximately)
  return getLocationsByBoundingBox(-0.5, 51.4, 0.1, 51.6);
}

/**
 * Get international locations for testing multi-region scenarios
 */
export function getInternationalLocations(): MapPoint[] {
  const londonBounds = { west: -0.5, east: 0.1, south: 51.4, north: 51.6 };
  const allLocations = getAllLocationsAsMapPoints();
  
  return allLocations.filter(location => {
    const [lng, lat] = location.coordinates;
    return !(lng >= londonBounds.west && lng <= londonBounds.east && 
             lat >= londonBounds.south && lat <= londonBounds.north);
  });
}

/**
 * Get mock data statistics
 */
export function getMockDataStats() {
  const data = loadMockEvents();
  const allLocations = getAllLocationsAsMapPoints();
  
  return {
    conversations: data.conversations.length,
    messages: data.conversations.reduce((sum, conv) => sum + conv.messages.length, 0),
    locations: allLocations.length,
    londonLocations: getLondonLocations().length,
    internationalLocations: getInternationalLocations().length,
    dateRange: data.metadata.date_range,
    boundingBox: data.metadata.geographic_coverage.bounding_box,
  };
}