# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 Current Project Status

**Status**: ✅ **PRODUCTION READY** - Core Phase 1 Complete  
**Last Updated**: January 2025  
**Development Stage**: Phase 2 (Basic Interaction) - 75% Complete  

### 📈 Key Metrics
- **✅ 59/59 Unit Tests Passing** (Vitest)
- **✅ 16/16 E2E Features Tested** (Playwright MCP)
- **✅ Clean Code Quality** (ESLint, TypeScript)
- **✅ Production Build Ready** 
- **🌐 Live Demo**: http://localhost:5174

### 🎯 What's Working Now
- Complete map interface with London-centered view
- 31 realistic mock locations across 6 conversations
- Point clustering with supercluster (2-11 points per cluster)
- Triangle drawing system with 3-click workflow
- Location panel with hierarchical organization
- Interactive popups with detailed location info
- Visibility toggles and keyboard shortcuts (ESC cancellation)

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

## Implementation Status

### ✅ Phase 1: Core Visualization (COMPLETED)
- [x] Basic map rendering with react-map-gl (MapLibre)
- [x] Display extracted locations as clustered points
- [x] Group locations by message in left panel
- [x] Click for location info popup
- [x] Simple triangle drawing (3 clicks)
- [x] Triangle validation and auto-discard

### 🔄 Phase 2: Basic Interaction (IN PROGRESS)
- [x] Save/name triangles with color assignment
- [x] Toggle location groups visibility
- [ ] Basic search within locations
- [ ] Simple query interface

### 📋 Phase 3: Polish (PLANNED)
- [x] Error handling and user feedback
- [x] Performance optimization for hundreds of points
- [x] Desktop keyboard shortcuts (ESC, ENTER)
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

## Testing Strategy & Results

### ✅ Completed Testing (Playwright MCP)
All core features have been thoroughly tested using Playwright MCP browser automation:

**📍 Core Map Interface**
- [x] Map loading with MapLibre rendering
- [x] Point clustering with proper counts (2-11 locations per cluster)
- [x] Individual marker display for dispersed points
- [x] Mixed clustered/individual point rendering

**📁 Location Panel Features**
- [x] Hierarchical conversation/message organization
- [x] Expand/collapse functionality with arrow buttons
- [x] Location details display (name, context, timestamp)
- [x] Visibility toggles with checkbox state management

**🎯 Location Selection & Interaction**
- [x] Location click handling from panel
- [x] Map focus and centering on selected locations
- [x] Detailed popup display with coordinates and actions
- [x] Popup close functionality

**📐 Triangle Drawing System**
- [x] Drawing mode activation via "[+ New]" button
- [x] Dynamic instruction updates ("Click 3 points to draw triangle")
- [x] Click progress tracking ("Click 2 more points...")
- [x] ESC key cancellation with proper cleanup
- [x] Event listener management (add/remove on state change)

**🔄 Clustering & Interaction**
- [x] Cluster click registration and handling
- [x] Hover state support for enhanced UX
- [x] Variable cluster density display
- [x] Proper cluster/individual point coexistence

**⚙️ UI/UX Features**
- [x] Responsive layout with proper panel positioning
- [x] Active state management for interactive elements
- [x] Visual feedback for user actions
- [x] Desktop-optimized cursor changes and hover states

### 📊 Test Coverage Summary
- **Total Features Tested**: 16 core functionality areas
- **Pass Rate**: 100% (16/16 passed)
- **Test Method**: Playwright MCP browser automation
- **Coverage**: Complete user interaction flow testing

### 🧪 Automated Test Suite
- **Unit Tests**: 59/59 passing (Vitest)
- **ESLint**: Clean (no warnings/errors)
- **Build**: Successful production build
- **Dev Server**: Running on http://localhost:5174

## Testing Guidance

**For New Features**: Always test with Playwright MCP to ensure:
1. User interaction flows work end-to-end
2. Visual feedback and state changes function properly
3. Error handling and edge cases are covered
4. Desktop-specific features (hover, keyboard shortcuts) work correctly