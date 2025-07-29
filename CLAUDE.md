# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 Current Project Status

**Status**: ✅ **PRODUCTION READY** - MapTiler SDK Migration Complete  
**Last Updated**: January 29, 2025  
**Development Stage**: Phase 2B (CRUD Operations & Layer Management) - Ready to Start  
**PRD Compliance**: ~50% (Core visualization + professional MapTiler infrastructure + all drawing tools + spatial analysis)  

### 📈 Key Metrics
- **✅ 123/123 Unit Tests Passing** (Vitest) - 64 new tests added
- **✅ 16/16 E2E Features Tested** (Playwright MCP)
- **✅ Clean Code Quality** (ESLint, TypeScript)
- **✅ Production Build Ready** 
- **🌐 Live Demo**: http://localhost:5176

### 🎯 What's Working Now
- **MapTiler SDK Integration**: Professional mapping with MapTiler Cloud infrastructure
- **Native Point Clustering**: Built-in MapTiler clustering with expansion zoom (2-11 points per cluster)
- **Secure Configuration**: Environment variable-based API key management (.env file)
- Complete map interface with London-centered view and MapTiler Streets style
- 31 realistic mock locations across 6 conversations
- **Triangle drawing system** with 3-click workflow and area validation
- **Circle drawing system** with 2-click workflow and 10m-50km radius validation
- **Polygon drawing system** with n-sided polygons, self-intersection detection
- **Spatial analysis workflow** - see which locations fall within each AOI
- **AOI details panel** with contained locations and interaction
- **Real-time location counting** for all AOI types in LocationPanel
- Location panel with hierarchical organization and AOI sections
- Custom popup implementation with detailed location info
- Visibility toggles and keyboard shortcuts (ESC cancellation)

## Project Overview

Wisery Maps is a comprehensive mapping application for AI lab workflows, supporting full AOI/POI management, location-based querying, and team collaboration. **Current scope has expanded beyond initial triangle-only approach to meet full PRD requirements.**

### **🎯 PRD Compliance Goals**
- **Full Drawing Tools**: Circles, polygons, triangles, and points with visual feedback
- **CRUD Operations**: Complete layer/AOI/POI management with team-level storage
- **Location Visualization**: Extracted locations from conversations with geocoding
- **Query Integration**: Location-based queries sent to conversation agents
- **Import/Export**: CSV/GeoJSON support for data interchange
- **Collaboration**: Team management, permissions, and sharing capabilities

## Architecture & Tech Stack

### Frontend Stack
- **@maptiler/sdk**: Professional mapping infrastructure with MapTiler Cloud
- **@turf/turf**: Spatial analysis, area calculations, distance measurements
- **supercluster**: Point clustering for location density management (transitioning to MapTiler native)
- **zustand**: Global state management for layers, AOIs, POIs (planned for Phase 2B)
- **papaparse**: CSV import/export functionality
- **geojson-utils**: GeoJSON validation and processing

### Enhanced Components Structure (PRD Compliant)
```
src/
├── components/
│   ├── MapInterface/           # Main container with toolbar
│   ├── MapCanvas/             # Main map rendering
│   ├── LocationPanel/         # Left sidebar with extracted locations
│   ├── DrawingTools/          # Enhanced drawing toolbar
│   │   ├── TriangleDrawingTool/   # Triangle creation (existing)
│   │   ├── CircleDrawingTool/     # Circle creation (new)
│   │   ├── PolygonDrawingTool/    # N-sided polygon creation (new)
│   │   └── POICreationTool/       # Point creation (enhanced)
│   ├── QueryBuilder/          # Location-based query interface
│   ├── LayerManager/          # Layer CRUD operations
│   ├── ShapeEditor/           # Post-creation shape editing
│   ├── ImportExport/          # CSV/GeoJSON handling
│   ├── ExtractedLocationsTree/ # Hierarchical location list
│   ├── LocationPopup/         # Location info display
│   └── TeamManagement/       # Collaboration features
├── stores/
│   ├── layersStore.ts         # Layer management state
│   ├── aoisStore.ts          # AOI management state  
│   ├── poisStore.ts          # POI management state
│   └── uiStore.ts            # UI state management
├── utils/
│   ├── triangleValidation.ts  # Area validation and constraints
│   ├── pointClustering.ts     # Supercluster configuration
│   ├── colorAssignment.ts     # Shape color management
│   ├── geoJsonUtils.ts       # GeoJSON processing
│   ├── csvUtils.ts           # CSV import/export
│   └── queryBuilder.ts       # Query construction
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

interface Circle {
  id: string;
  name: string;
  center: [number, number]; // [lng, lat]
  radius: number; // radius in meters
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
Predefined shape colors (cycle through in order for both triangles and circles):
1. `#4CBACB` (Teal) - Default
2. `#E74C3C` (Red)
3. `#F39C12` (Orange) 
4. `#27AE60` (Green)
5. `#8E44AD` (Purple)
6. `#3498DB` (Blue)

### Circle Creation & Validation
- **2-Click Flow**: Click center point → drag to set radius → click to confirm → save/discard popup
- **Distance Constraints**: 10m minimum to 50km maximum radius using Haversine formula
- **Real-time Preview**: Dashed circle outline shows during radius selection
- **Validation Logic**: `distance = 2 * R * asin(sqrt(sin²(Δφ/2) + cos φ₁ ⋅ cos φ₂ ⋅ sin²(Δλ/2)))`
- **Auto-discard**: Circles outside constraints are automatically cancelled
- **User Feedback**: "Circle too small/large - radius must be between 10m and 50km"

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

## MapTiler SDK Configuration

### API Key Setup
```bash
# Copy environment template
cp .env.example .env

# Add your MapTiler Cloud API key
VITE_MAPTILER_API_KEY=your_api_key_here
```

### MapTiler Features Used
- **Professional Map Styles**: MapStyle.STREETS with high-quality tiles
- **Native Clustering**: Built-in point clustering with expansion zoom
- **GeoJSON Sources**: Direct map layer rendering without React components
- **Event System**: Native event listeners (map.on/off) for interactions
- **Spatial Queries**: queryRenderedFeatures for click handling

### Security Best Practices
- API keys stored in environment variables (never in source code)
- .env file excluded from git commits
- Error handling for missing configuration
- Production-ready environment variable validation

## Development Commands

### Initial Setup
```bash
npm install
# Configure MapTiler API key in .env file
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
POST /api/user/circles                  // Save user circles
GET /api/user/circles                   // Get user circles
DELETE /api/circles/{id}                // Delete circle
POST /api/queries/location-based        // Submit location-based queries
```

## 📋 PRD Compliance Implementation Roadmap

### ✅ Phase 1: Core Visualization (COMPLETED)
- [x] Basic map rendering with react-map-gl (MapLibre)
- [x] Display extracted locations as clustered points
- [x] Group locations by message in left panel
- [x] Click for location info popup
- [x] Simple triangle drawing (3 clicks)
- [x] Triangle validation and auto-discard
- [x] Save/name triangles with color assignment
- [x] Toggle location groups visibility
- [x] Error handling and user feedback
- [x] Desktop keyboard shortcuts (ESC cancellation)

### ✅ Phase 2A: Enhanced Drawing Tools (2-3 weeks) - **COMPLETED**

#### 2A.1 Circle Drawing Implementation ✅ **COMPLETED**
- [x] Install dependencies: `@mapbox/mapbox-gl-draw-circle`, `papaparse`, `geojson-utils`
- [x] Create `CircleDrawingTool` component with 2-click workflow
- [x] Implement center-point + radius circle creation with real-time preview
- [x] Add circle validation (10m-50km radius with Haversine distance calculation)
- [x] Integrate circle drawing into main toolbar and LocationPanel
- [x] Add circle color assignment and styling (cycling through 6 predefined colors)
- [x] **Bonus**: CirclesLayer with GeoJSON polygon approximation for rendering
- [x] **Bonus**: Comprehensive test suite (23 tests covering validation, colors, distances)

#### 2A.2 Enhanced Polygon Drawing ✅ **COMPLETED**
- [x] Create `PolygonDrawingTool` component with n-sided polygon support
- [x] Add polygon completion logic (double-click, first vertex click, Enter key)
- [x] Implement polygon validation (minimum area, self-intersection detection)
- [x] Add real-time preview with dashed lines and vertex highlighting
- [x] Create `PolygonsLayer` with GeoJSON rendering and color coding
- [x] **Bonus**: Spatial analysis workflow with AOI-location relationships
- [x] **Bonus**: AOI details panel with contained locations interaction
- [x] **Bonus**: Real-time location counting for all AOI types

#### 2A.3 Point/POI Creation Enhancement
- [ ] Create dedicated `POICreationTool` component
- [ ] Add drag-and-drop POI placement
- [ ] Implement POI icons and customization
- [ ] Add POI validation and snapping
- [ ] Create POI editing interface

#### 2A.4 Visual Feedback System
- [ ] Add real-time drawing preview with dashed lines
- [ ] Implement hover states for all drawing tools
- [ ] Add drawing progress indicators
- [ ] Create drawing instructions overlay
- [ ] Add undo/redo functionality for drawing actions

### 🎯 Phase 2B: CRUD Operations & Layer Management (2-3 weeks) - **NEXT PRIORITY**

#### 2B.1 Global State Management
- [ ] Install and configure Zustand for state management
- [ ] Create stores: `layersStore`, `aoisStore`, `poisStore`, `uiStore`
- [ ] Implement state persistence (localStorage)
- [ ] Add state hydration on app load

#### 2B.2 AOI/POI CRUD Operations
- [ ] Create `AOIManager` utility class
- [ ] Implement Create operations (save drawn shapes)
- [ ] Add Read operations (load existing shapes)
- [ ] Build Update operations (edit shape properties)
- [ ] Implement Delete operations with confirmation
- [ ] Add bulk operations (select multiple, delete multiple)

#### 2B.3 Layer Management System
- [ ] Create `LayerManager` component
- [ ] Implement layer creation/deletion
- [ ] Add layer visibility toggles
- [ ] Create layer reordering (drag-and-drop priority)
- [ ] Implement layer grouping and nesting
- [ ] Add layer metadata (name, description, created date)

### 🔍 Phase 2C: Search & Query System (2-3 weeks)

#### 2C.1 Search Bar Implementation
- [ ] Create `MapSearchBar` component with autocomplete
- [ ] Implement location name search with fuzzy matching
- [ ] Add coordinate-based search (lat/lng input)
- [ ] Create recent searches history
- [ ] Add search result filtering and sorting

#### 2C.2 Query Builder System
- [ ] Create `QueryBuilder` component
- [ ] Implement visual query construction (drag shapes to query)
- [ ] Add spatial query types (within, intersects, contains)
- [ ] Create query parameter validation
- [ ] Build query preview and execution

#### 2C.3 Agent Integration Interface
- [ ] Create `AgentConnector` service
- [ ] Implement query serialization for agent consumption
- [ ] Add query result processing and display
- [ ] Create conversation integration hooks
- [ ] Build query history and rerun functionality

### 📤 Phase 3A: Import/Export & Data Management (2-3 weeks)

#### 3A.1 GeoJSON Support
- [ ] Create `GeoJSONImporter` utility
- [ ] Implement GeoJSON file parsing and validation
- [ ] Add GeoJSON export functionality
- [ ] Support FeatureCollection and individual features
- [ ] Handle coordinate system transformations

#### 3A.2 CSV Support
- [ ] Create `CSVImporter` utility using papaparse
- [ ] Implement CSV to POI conversion
- [ ] Add CSV export with custom field mapping
- [ ] Support bulk POI import/export
- [ ] Add data validation and error handling

### 🎨 Phase 3B: Styling & Customization (1-2 weeks)

#### 3B.1 Shape Styling System
- [ ] Create `StyleManager` utility
- [ ] Implement color picker components
- [ ] Add shape outline/fill customization
- [ ] Create icon library and selector
- [ ] Support custom icon uploads

#### 3B.2 Selection & Highlighting
- [ ] Add shape selection with bounding boxes
- [ ] Implement multi-select functionality
- [ ] Create highlight animations and effects
- [ ] Add selection-based bulk operations
- [ ] Implement keyboard shortcuts for selection

### 🤝 Phase 4: Collaboration & Advanced Features (3-4 weeks)

#### 4.1 Team Management
- [ ] Create user authentication integration
- [ ] Implement team/workspace concept
- [ ] Add user permissions system (view/edit/admin)
- [ ] Create team member management UI

#### 4.2 Sharing & Permissions
- [ ] Implement layer sharing with permission levels
- [ ] Add share link generation
- [ ] Create collaborative editing controls
- [ ] Add version history and conflict resolution

### 📋 Phase 5: Polish & Production Ready (1-2 weeks)

#### 5.1 Error Handling & Validation
- [ ] Add comprehensive error boundaries
- [ ] Implement user-friendly error messages
- [ ] Create data validation throughout
- [ ] Add loading states and progress indicators

## ⏱️ Timeline Summary
- **Phase 2A-2C**: 6-9 weeks (Enhanced drawing, CRUD, search/query)
- **Phase 3A-3B**: 3-4 weeks (Import/export, styling)  
- **Phase 4**: 3-4 weeks (Collaboration & advanced features)
- **Phase 5**: 1-2 weeks (Polish & production)

**Total Estimated Timeline**: 13-19 weeks for full PRD compliance  
**Current Priority**: Phase 2B.1 - Global State Management (Zustand integration)

## Desktop-Only Optimizations

- **Keyboard Shortcuts**: ESC (cancel drawing), ENTER (complete)
- **Right-Click Menus**: Context menus for triangles and points
- **Hover States**: Rich tooltips on desktop
- **Precise Clicking**: No touch-friendly large tap targets needed

## Important Implementation Notes

### **🔄 Scope Evolution**
- **Original Scope**: Triangle-only drawing with basic visualization
- **PRD Requirements**: Full drawing tools (circles, polygons, points) with comprehensive CRUD operations
- **Current Approach**: Incremental enhancement while maintaining existing functionality

### **🎯 Technical Guidelines**
- **Desktop First**: No mobile responsiveness required
- **Progressive Enhancement**: Build new features without breaking existing ones
- **Performance Target**: Handle thousands of locations efficiently with virtualization
- **Error Prevention**: Validate all shapes, prevent invalid geometries
- **Color Consistency**: Expand color palette, support custom colors
- **State Management**: Transition from local state to Zustand for complex operations
- **Testing**: Maintain 100% test coverage using Playwright MCP for new features

### **📐 Drawing Tool Standards**
- **Triangles**: Maintain existing 3-click workflow ✅ **Implemented**
- **Circles**: Center-point + radius approach with live preview ✅ **Implemented**
- **Polygons**: Click-to-add vertices, double-click or close to complete 🎯 **Next**
- **Points**: Single-click placement with drag-to-position
- **Visual Feedback**: Real-time preview for all drawing operations ✅ **Circles Complete**
- **Validation**: Minimum/maximum size constraints for all shapes ✅ **Circles Complete**

## Testing Strategy & Results

### 🧪 Unit Testing (Vitest)
```bash
npm test        # Run all unit tests
npm run test:ui # Run tests with UI interface  
npm run test:run # Run tests once without watch
```

**Current Status**: ✅ **123/123 tests passing**
- **Spatial Analysis**: 23 tests (MapTiler SDK integration)
- **Triangle Validation**: 14 tests (area validation, color assignment)
- **Circle Validation**: 23 tests (radius validation, distance calculations)
- **Polygon Validation**: 18 tests (self-intersection, area validation)
- **Mock Data**: 20 tests (clustering scenarios, location loading)
- **Point Clustering**: 25 tests (supercluster integration)

### ⚠️ MapTiler SDK Testing Issues & Solutions

**Common Problem**: MapTiler SDK imports browser-specific APIs that fail in Node.js test environment

**Solution**: Add comprehensive mocking in `src/test/setup.ts`:
```typescript
// Mock MapTiler SDK to avoid browser-specific imports
vi.mock('@maptiler/sdk', () => ({
  math: {
    haversineDistanceWgs84: (p1, p2) => { /* mock implementation */ },
    wgs84ToMercator: (point) => [point[0] * 111320, point[1] * 110540],
    // ... other math functions
  },
  Map: vi.fn().mockImplementation(() => ({
    on: vi.fn(), off: vi.fn(), addSource: vi.fn(),
    // ... other map methods
  }))
}))
```

### 🎭 Browser Testing (Playwright MCP)

**⚠️ CRITICAL: Playwright Session Management Issues**

**Common Problems Encountered**:
1. `Browser is already in use for mcp-chrome-profile` 
2. Session conflicts between test runs
3. Stale browser processes preventing new connections

**Proven Solutions** (add to workflow):

```bash
# 1. Clear Playwright cache before testing
rm -rf /Users/admin/Library/Caches/ms-playwright/mcp-chrome-profile

# 2. Kill any existing Chrome processes
pkill -f "chrome.*mcp-chrome-profile" || true

# 3. Wait before starting new session
sleep 2

# 4. Navigate to application
# mcp__playwright__browser_navigate -> http://localhost:5173
```

**Testing Workflow**:
1. **Start Dev Server**: `npm run dev` (runs on http://localhost:5173)
2. **Clear Browser Cache**: Remove mcp-chrome-profile directory
3. **Kill Stale Processes**: pkill chrome processes
4. **Navigate & Test**: Use Playwright MCP tools

**✅ MapTiler SDK Integration Verified**: January 29, 2025
- Application loads successfully with MapTiler Cloud infrastructure
- All interface elements render properly (location panel, map canvas, drawing tools)
- Unit tests pass: 123/123 tests with comprehensive MapTiler SDK mocking
- Build process clean with no TypeScript errors

### ✅ Completed Testing (Playwright MCP)
All core features have been thoroughly tested using Playwright MCP browser automation:

**📍 Core Map Interface (MapTiler SDK)**
- [x] Map loading with MapTiler SDK and Streets style
- [x] MapTiler Cloud API key authentication via environment variables
- [x] Native MapTiler clustering with proper counts (2-11 locations per cluster) 
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