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

export interface TriangleValidationResult {
  valid: boolean;
  error?: string;
  area?: number;
}