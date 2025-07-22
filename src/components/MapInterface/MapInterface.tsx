import { useState, useCallback, useMemo } from 'react';
import { type ViewState, type MapRef } from 'react-map-gl/maplibre';
import MapCanvas from '../MapCanvas';
import LocationPanel from '../LocationPanel';
import PointsLayer from '../PointsLayer';
import TrianglesLayer from '../TrianglesLayer';
import LocationPopup from '../LocationPopup';
import TriangleDrawingTool from '../TriangleDrawingTool';
import DrawingPreviewLayer from '../DrawingPreviewLayer';
import { getAllLocationsAsMapPoints } from '../../utils/mockDataLoader';
import type { MapPoint, Triangle } from '../../types';
import './MapInterface.css';

const INITIAL_VIEW_STATE: ViewState = {
  longitude: -0.1276,
  latitude: 51.5074,
  zoom: 12,
  bearing: 0,
  pitch: 0,
  padding: { top: 0, bottom: 0, left: 0, right: 0 }
};

export default function MapInterface() {
  const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW_STATE);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [isDrawingTriangle, setIsDrawingTriangle] = useState(false);
  const [triangles, setTriangles] = useState<Triangle[]>([]);
  const [drawingVertices, setDrawingVertices] = useState<[number, number][]>([]);
  const [mapRef, setMapRef] = useState<MapRef | null>(null);

  // Load mock data
  const allLocations = useMemo(() => getAllLocationsAsMapPoints(), []);

  const handleMove = useCallback((evt: { viewState: ViewState }) => {
    setViewState(evt.viewState);
  }, []);

  const handlePointClick = useCallback((point: MapPoint) => {
    // Don't handle point clicks during triangle drawing
    if (isDrawingTriangle) return;
    
    console.log('Point clicked:', point);
    setSelectedPoint(point);
  }, [isDrawingTriangle]);

  const handleLocationClick = useCallback((location: MapPoint) => {
    console.log('Location clicked from panel:', location);
    // Center map on location
    setViewState(prev => ({
      ...prev,
      longitude: location.coordinates[0],
      latitude: location.coordinates[1],
      zoom: Math.max(prev.zoom, 15)
    }));
    setSelectedPoint(location);
  }, []);

  const handlePopupClose = useCallback(() => {
    setSelectedPoint(null);
  }, []);

  const handleLocationGroupToggle = useCallback((messageId: string, visible: boolean) => {
    console.log('Group toggled:', messageId, visible);
    // TODO: Filter displayed points based on visibility
  }, []);

  const handleStartDrawing = useCallback(() => {
    setIsDrawingTriangle(true);
  }, []);

  const handleTriangleComplete = useCallback((triangle: Triangle) => {
    setTriangles(prev => [...prev, triangle]);
    setIsDrawingTriangle(false);
    console.log('Triangle saved:', triangle);
  }, []);

  const handleCancelDrawing = useCallback(() => {
    setIsDrawingTriangle(false);
    setDrawingVertices([]);
  }, []);

  const handleDrawingProgress = useCallback((vertices: [number, number][]) => {
    setDrawingVertices(vertices);
  }, []);

  const handleMapLoad = useCallback((map: MapRef) => {
    console.log('Map loaded, setting mapRef');
    setMapRef(map);
  }, []);

  return (
    <div className="map-interface">
      <LocationPanel 
        onLocationClick={handleLocationClick}
        onLocationGroupToggle={handleLocationGroupToggle}
        onStartDrawing={handleStartDrawing}
        triangles={triangles}
      />
      <div className="map-main">
        <MapCanvas viewState={viewState} onMove={handleMove} onMapLoad={handleMapLoad}>
          <TrianglesLayer triangles={triangles} />
          <DrawingPreviewLayer vertices={drawingVertices} isDrawing={isDrawingTriangle} />
          <PointsLayer 
            points={allLocations} 
            onPointClick={handlePointClick}
            zoom={viewState.zoom}
            isDrawingDisabled={isDrawingTriangle}
          />
          {selectedPoint && (
            <LocationPopup 
              location={selectedPoint}
              onClose={handlePopupClose}
            />
          )}
        </MapCanvas>
        <TriangleDrawingTool
          isDrawing={isDrawingTriangle}
          onTriangleComplete={handleTriangleComplete}
          onCancel={handleCancelDrawing}
          onDrawingProgress={handleDrawingProgress}
          existingTrianglesCount={triangles.length}
          mapRef={mapRef}
        />
      </div>
    </div>
  );
}