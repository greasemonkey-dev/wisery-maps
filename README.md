# Wisery Maps

A comprehensive mapping application for AI lab workflows, supporting full AOI/POI management, location-based querying, and team collaboration.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MapTiler Cloud API key (free at https://cloud.maptiler.com/account/keys/)

### Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd wisery-maps
   npm install
   ```

2. **Configure MapTiler API Key:**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env and add your MapTiler API key
   VITE_MAPTILER_API_KEY=your_maptiler_api_key_here
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173`

## 🗺️ Features

### Core Mapping
- **Professional Maps**: Powered by MapTiler SDK with high-quality map tiles
- **Location Visualization**: 31 realistic mock locations across 6 conversations
- **Point Clustering**: Smart clustering with supercluster (2-11 points per cluster)
- **Interactive Popups**: Detailed location information and context

### Drawing Tools
- **Triangle Drawing**: 3-click workflow with area validation
- **Circle Drawing**: 2-click workflow with 10m-50km radius validation  
- **Polygon Drawing**: N-sided polygons with self-intersection detection
- **Spatial Analysis**: Real-time analysis of which locations fall within each AOI

### Advanced Features
- **AOI Details Panel**: View contained locations and interactions
- **Real-time Location Counting**: For all AOI types in LocationPanel
- **Hierarchical Organization**: Location panel with conversation grouping
- **Keyboard Shortcuts**: ESC cancellation, desktop-optimized interactions

## 📁 Architecture

### Tech Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Mapping**: MapTiler SDK (migrated from react-map-gl/maplibre)
- **Spatial Analysis**: @turf/turf for geometry operations
- **Clustering**: supercluster for point density management
- **State Management**: React hooks (zustand planned for Phase 2B)

### Component Structure
```
src/
├── components/
│   ├── MapInterface/           # Main container with toolbar
│   ├── MapCanvas/             # MapTiler SDK map rendering
│   ├── LocationPanel/         # Left sidebar with locations
│   ├── DrawingTools/          # Triangle/Circle/Polygon tools
│   └── Layers/               # Map layer components
├── utils/                    # Validation and data processing
└── types/                   # TypeScript definitions
```

## 🔧 Development

### Available Scripts
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run test       # Run tests with Vitest (123 tests passing)
npm run test:ui    # Run tests with UI interface
npm run lint       # ESLint code quality checks
npm run preview    # Preview production build
```

### Environment Variables
```bash
# Required: MapTiler Cloud API Key
VITE_MAPTILER_API_KEY=your_api_key_here
```

### Key Implementation Rules

#### Triangle Creation & Validation
- **3-Click Flow**: Click three points → triangle auto-closes → save/discard popup
- **Minimum Area**: 0.001 square degrees (~100m² at equator)
- **Auto-discard**: Triangles below threshold are automatically cancelled

#### Circle Creation & Validation
- **2-Click Flow**: Click center point → drag to set radius → click to confirm
- **Distance Constraints**: 10m minimum to 50km maximum radius using Haversine formula
- **Real-time Preview**: Dashed circle outline shows during radius selection

## 🎯 Project Status

**Status**: ✅ **PRODUCTION READY** - Phase 2A Enhanced Drawing Tools Complete  
**Development Stage**: Phase 2B (CRUD Operations & Layer Management) - Starting  
**PRD Compliance**: ~45% (Core visualization + all drawing tools + spatial analysis complete)  

### Recent Migration: MapTiler SDK
- ✅ Migrated from react-map-gl/maplibre to MapTiler SDK
- ✅ Professional mapping infrastructure with MapTiler Cloud
- ✅ Enhanced performance and reliability
- ✅ Native TypeScript support with complete type definitions

## 📋 Roadmap

### ✅ Completed
- Core visualization with clustering
- All drawing tools (triangles, circles, polygons)
- Spatial analysis workflow
- MapTiler SDK migration

### 🎯 Next: Phase 2B (CRUD Operations)
- Global state management with Zustand
- AOI/POI CRUD operations
- Layer management system
- Enhanced search and query capabilities

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and test thoroughly
3. Run linting: `npm run lint`
4. Run tests: `npm test`
5. Build to verify: `npm run build`
6. Create a pull request

## 📄 License

This project is part of the Wisery Maps application for AI lab workflows.

## 🔒 Security

- API keys are stored in environment variables (never commit `.env` files)
- Production builds exclude development keys
- Follow security best practices for map-based applications