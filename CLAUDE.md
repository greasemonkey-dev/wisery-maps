# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wisery Maps is a simplified mapping application focused on triangular area selection and location visualization from conversations. Key principles:

- **Simplicity First**: Designed for non-tech users with intuitive interactions
- **Triangles Only**: No complex polygons or circles, only triangle drawing
- **Extracted Locations Priority**: Primary focus on visualizing locations from conversations
- **User Isolation**: No real-time sharing between users
- **Moderate Scale**: Handle hundreds of locations efficiently

## Architecture & Tech Stack

### Frontend Stack
- **react-map-gl**: Base mapping component with desktop-optimized interactions
- **@mapbox/mapbox-gl-draw**: Triangle creation (simplified to 3-click triangles)
- **turf.js**: Area calculations, point clustering, distance measurements
- **supercluster**: Point clustering for location density management
- **State Management**: React useState/useContext (no complex store needed)

### Core Components Structure
```
src/
├── components/
│   ├── MapInterface/           # Main container
│   ├── MapCanvas/             # Main map rendering
│   ├── LocationPanel/         # Left sidebar with extracted locations
│   ├── SimpleToolbar/         # Top toolbar with drawing tools
│   ├── QueryBuilder/          # Bottom query interface
│   ├── ExtractedLocationsTree/ # Hierarchical location list
│   ├── TriangleDrawingTool/   # 3-click triangle creation
│   ├── LocationPopup/         # Location info display
│   └── SimpleQueryInterface/  # Basic query builder
├── utils/
│   ├── triangleValidation.js  # Area validation and constraints
│   ├── pointClustering.js     # Supercluster configuration
│   └── colorAssignment.js     # Triangle color management
└── types/
    └── index.ts              # TypeScript definitions
```

## Data Models

### Core Interfaces
```typescript
interface MapPoint {
  id: string;
  coordinates: [number, number]; // [lng, lat]
  label: string;
  messageId: string;
  timestamp?: string;
  context: string;
}

interface Triangle {
  id: string;
  name: string;
  vertices: [[number, number], [number, number], [number, number]];
  userId: string;
  color: string;
  createdAt: Date;
}

interface MessageGroup {
  messageId: string;
  summary: string;
  locations: MapPoint[];
  timestamp: Date;
}
```

## Key Implementation Rules

### Triangle Creation & Validation
- **3-Click Flow**: Click three points → triangle auto-closes → save/discard popup
- **Minimum Area**: 0.001 square degrees (~100m² at equator)
- **Validation Logic**: `Area = 0.5 * |x1(y2-y3) + x2(y3-y1) + x3(y1-y2)|`
- **Auto-discard**: Triangles below threshold are automatically cancelled
- **User Feedback**: "Triangle too small - please draw a larger area"

### Color System
Predefined triangle colors (cycle through in order):
1. `#4CBACB` (Teal) - Default
2. `#E74C3C` (Red)
3. `#F39C12` (Orange) 
4. `#27AE60` (Green)
5. `#8E44AD` (Purple)
6. `#3498DB` (Blue)

### Location Clustering Rules
- **Clustering Threshold**: Multiple points within 50m radius
- **Visual Indicator**: Single marker with count badge "📍 3"
- **Zoom Behavior**: Separate points when zoom >= 15 (city block level)
- **Cluster Message**: "Multiple Events at This Location (3) - Please zoom in for better view"

## Mock Data

The project includes comprehensive mock events data (`src/data/mockEvents.json`) with 31 realistic locations across 6 conversations. Use `mockDataLoader.ts` utilities to access data:

### Key Test Scenarios
- **Warehouse Investigation**: 3 suspicious activities clustered in London warehouse district
- **Dense Cluster**: 8 events in Covent Garden within 200m radius (tests clustering badges)
- **Gang Territory**: 4 coordinated meeting points in South London
- **Transport Hubs**: Multi-location security monitoring at stations
- **International**: Cross-border tracking (Paris, Amsterdam, Berlin)

### Usage Examples
```typescript
import { getAllLocationsAsMapPoints, getClusteringTestScenarios } from './utils/mockDataLoader';

// Load all 31 locations for map display
const allLocations = getAllLocationsAsMapPoints();

// Get specific test scenarios
const scenarios = getClusteringTestScenarios();
const warehouseEvents = scenarios.warehouse_investigation; // 3 locations
const denseArea = scenarios.dense_cluster; // 8 locations for clustering tests
```

See `src/examples/mockDataExamples.ts` for complete usage examples supporting all HLD workflows.

## Development Commands

### Initial Setup
```bash
npm install
```

### Development
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run test       # Run tests with Vitest (59 tests)
npm run test:ui    # Run tests with UI interface
npm run test:run   # Run tests once without watch mode
npm run lint       # ESLint
npm run preview    # Preview production build
```

## API Requirements

### Essential Endpoints
```typescript
GET /api/conversations/{id}/locations    // Retrieve extracted locations
POST /api/user/triangles                // Save user triangles
GET /api/user/triangles                 // Get user triangles
DELETE /api/triangles/{id}              // Delete triangle
POST /api/queries/location-based        // Submit location-based queries
```

## Implementation Phases

### Phase 1: Core Visualization (Priority)
- [ ] Basic map rendering with react-map-gl
- [ ] Display extracted locations as clustered points
- [ ] Group locations by message in left panel
- [ ] Click for location info popup
- [ ] Simple triangle drawing (3 clicks)
- [ ] Triangle validation and auto-discard

### Phase 2: Basic Interaction
- [ ] Save/name triangles with color assignment
- [ ] Toggle location groups visibility
- [ ] Basic search within locations
- [ ] Simple query interface

### Phase 3: Polish
- [ ] Error handling and user feedback
- [ ] Performance optimization for hundreds of points
- [ ] Desktop keyboard shortcuts (ESC, ENTER)
- [ ] Right-click context menus

## Desktop-Only Optimizations

- **Keyboard Shortcuts**: ESC (cancel drawing), ENTER (complete)
- **Right-Click Menus**: Context menus for triangles and points
- **Hover States**: Rich tooltips on desktop
- **Precise Clicking**: No touch-friendly large tap targets needed

## Important Implementation Notes

- **No Complex Polygons**: Only triangles are supported by design
- **Desktop First**: No mobile responsiveness required
- **User Isolation**: No real-time collaboration features
- **Performance Target**: Handle hundreds of locations efficiently
- **Error Prevention**: Auto-validate triangles, prevent tiny areas
- **Color Consistency**: Use predefined color palette, cycle through colors

## Testing Strategy

Focus testing on:
- Triangle drawing and validation logic
- Point clustering at different zoom levels
- Color assignment cycling
- Location popup interactions
- Query building with selected areas