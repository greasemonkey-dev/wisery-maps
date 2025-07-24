import { useState, useCallback, useMemo } from 'react';
import { type ViewState, type MapRef } from 'react-map-gl/maplibre';
import MapCanvas from '../MapCanvas';
import LocationPanel from '../LocationPanel';
import PointsLayer from '../PointsLayer';
import TrianglesLayer from '../TrianglesLayer';
import CirclesLayer from '../CirclesLayer';
import PolygonsLayer from '../PolygonsLayer';
import LocationPopup from '../LocationPopup';
import AOIDetailsPanel from '../AOIDetailsPanel';
import TriangleDrawingTool from '../TriangleDrawingTool';
import CircleDrawingTool from '../CircleDrawingTool';
import PolygonDrawingTool from '../PolygonDrawingTool';
import DrawingPreviewLayer from '../DrawingPreviewLayer';
import { getAllLocationsAsMapPoints } from '../../utils/mockDataLoader';
import type { MapPoint, Triangle, Circle, Polygon, AOIAnalysis } from '../../types';
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
  const [selectedAOI, setSelectedAOI] = useState<AOIAnalysis | null>(null);
  const [isDrawingTriangle, setIsDrawingTriangle] = useState(false);
  const [isDrawingCircle, setIsDrawingCircle] = useState(false);
  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);
  const [triangles, setTriangles] = useState<Triangle[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [polygons, setPolygons] = useState<Polygon[]>([]);
  const [drawingVertices, setDrawingVertices] = useState<[number, number][]>([]);
  const [circleCenter, setCircleCenter] = useState<[number, number] | null>(null);
  const [circleRadius, setCircleRadius] = useState(0);
  const [mapRef, setMapRef] = useState<MapRef | null>(null);

  // Load mock data
  const allLocations = useMemo(() => getAllLocationsAsMapPoints(), []);

  const handleMove = useCallback((evt: { viewState: ViewState }) => {
    setViewState(evt.viewState);
  }, []);

  const handlePointClick = useCallback((point: MapPoint) => {
    // Don't handle point clicks during drawing
    if (isDrawingTriangle || isDrawingCircle || isDrawingPolygon) return;
    
    console.log('Point clicked:', point);
    setSelectedPoint(point);
  }, [isDrawingTriangle, isDrawingCircle, isDrawingPolygon]);

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

  const handleAOIClick = useCallback((aoiAnalysis: AOIAnalysis) => {
    setSelectedAOI(aoiAnalysis);
  }, []);

  const handleAOIDetailsClose = useCallback(() => {
    setSelectedAOI(null);
  }, []);

  const handleLocationGroupToggle = useCallback((messageId: string, visible: boolean) => {
    console.log('Group toggled:', messageId, visible);
    // TODO: Filter displayed points based on visibility
  }, []);

  const handleStartDrawing = useCallback(() => {
    setIsDrawingTriangle(true);
  }, []);

  const handleStartCircleDrawing = useCallback(() => {
    setIsDrawingCircle(true);
  }, []);

  const handleStartPolygonDrawing = useCallback(() => {
    setIsDrawingPolygon(true);
  }, []);

  const handleTriangleComplete = useCallback((triangle: Triangle) => {
    setTriangles(prev => [...prev, triangle]);
    setIsDrawingTriangle(false);
    console.log('Triangle saved:', triangle);
  }, []);

  const handleCircleComplete = useCallback((circle: Circle) => {
    setCircles(prev => [...prev, circle]);
    setIsDrawingCircle(false);
    setCircleCenter(null);
    setCircleRadius(0);
    console.log('Circle saved:', circle);
  }, []);

  const handlePolygonComplete = useCallback((polygon: Polygon) => {
    setPolygons(prev => [...prev, polygon]);
    setIsDrawingPolygon(false);
    setDrawingVertices([]);
    console.log('Polygon saved:', polygon);
  }, []);

  const handleCancelDrawing = useCallback(() => {
    setIsDrawingTriangle(false);
    setIsDrawingCircle(false);
    setIsDrawingPolygon(false);
    setDrawingVertices([]);
    setCircleCenter(null);
    setCircleRadius(0);
  }, []);

  const handleDrawingProgress = useCallback((vertices: [number, number][]) => {
    setDrawingVertices(vertices);
  }, []);

  const handleCircleDrawingProgress = useCallback((center: [number, number] | null, radius: number) => {
    setCircleCenter(center);
    setCircleRadius(radius);
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
        onStartCircleDrawing={handleStartCircleDrawing}
        onStartPolygonDrawing={handleStartPolygonDrawing}
        onAOIClick={handleAOIClick}
        triangles={triangles}
        circles={circles}
        polygons={polygons}
      />
      <div className="map-main">
        <MapCanvas viewState={viewState} onMove={handleMove} onMapLoad={handleMapLoad}>
          <TrianglesLayer triangles={triangles} />
          <CirclesLayer circles={circles} />
          <PolygonsLayer polygons={polygons} />
          <DrawingPreviewLayer 
            vertices={drawingVertices} 
            isDrawing={isDrawingTriangle || isDrawingCircle || isDrawingPolygon}
            circleCenter={circleCenter}
            circleRadius={circleRadius}
            isDrawingCircle={isDrawingCircle}
            isDrawingPolygon={isDrawingPolygon}
          />
          <PointsLayer 
            points={allLocations} 
            onPointClick={handlePointClick}
            zoom={viewState.zoom}
            isDrawingDisabled={isDrawingTriangle || isDrawingCircle || isDrawingPolygon}
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
        <CircleDrawingTool
          isDrawing={isDrawingCircle}
          onCircleComplete={handleCircleComplete}
          onCancel={handleCancelDrawing}
          onDrawingProgress={handleCircleDrawingProgress}
          existingCirclesCount={circles.length}
          mapRef={mapRef}
        />
        <PolygonDrawingTool
          isDrawing={isDrawingPolygon}
          onPolygonComplete={handlePolygonComplete}
          onCancel={handleCancelDrawing}
          onDrawingProgress={handleDrawingProgress}
          existingPolygonsCount={polygons.length}
          mapRef={mapRef}
        />
        
        {/* AOI Details Panel */}
        {selectedAOI && (
          <AOIDetailsPanel
            aoiAnalysis={selectedAOI}
            onClose={handleAOIDetailsClose}
            onLocationClick={handleLocationClick}
          />
        )}
      </div>
    </div>
  );
}