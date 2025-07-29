export interface MapPoint {
  id: string;
  coordinates: [number, number]; // [lng, lat]
  label: string;
  messageId: string;
  timestamp?: string;
  context: string;
}

export interface Triangle {
  id: string;
  name: string;
  vertices: [[number, number], [number, number], [number, number]];
  userId: string;
  color: string;
  createdAt: Date;
}

export interface MessageGroup {
  messageId: string;
  summary: string;
  locations: MapPoint[];
  timestamp: Date;
}

export interface Circle {
  id: string;
  name: string;
  center: [number, number]; // [lng, lat]
  radius: number; // in meters
  userId: string;
  color: string;
  createdAt: Date;
}

export interface TriangleValidationResult {
  valid: boolean;
  error?: string;
  area?: number;
}

export interface CircleValidationResult {
  valid: boolean;
  error?: string;
  radius?: number;
  area?: number;
}

export interface Polygon {
  id: string;
  name: string;
  vertices: [number, number][]; // Array of [lng, lat] coordinates
  userId: string;
  color: string;
  createdAt: Date;
}

export interface PolygonValidationResult {
  valid: boolean;
  error?: string;
  area?: number;
  selfIntersects?: boolean;
}

export interface AOIAnalysis {
  id: string;
  name: string;
  type: 'triangle' | 'circle' | 'polygon' | 'poi';
  color: string;
  createdAt: Date;
  containedLocations: MapPoint[];
  locationCount: number;
}

export interface SpatialAnalysisSummary {
  totalAOIs: number;
  totalLocations: number;
  emptyAOIs: number;
  nonEmptyAOIs: number;
  averageLocationsPerAOI: number;
  mostPopulatedAOI: AOIAnalysis | null;
}

export interface POI {
  id: string;
  name: string;
  coordinates: [number, number]; // [lng, lat]
  userId: string;
  color: string;
  icon: string;
  description?: string;
  category?: string;
  createdAt: Date;
}

export interface POIValidationResult {
  valid: boolean;
  error?: string;
  coordinates?: [number, number];
}