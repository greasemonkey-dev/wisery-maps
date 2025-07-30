import { useMemo } from 'react';
import ExtractedLocationsTree from '../ExtractedLocationsTree';
import { analyzeAllAOIs } from '../../utils/spatialAnalysis';
import { getAllLocationsAsMapPoints } from '../../utils/mockDataLoader';
import type { MapPoint, Triangle, Circle, Polygon, POI, AOIAnalysis } from '../../types';
import './LocationPanel.css';

interface LocationPanelProps {
  onLocationClick?: (location: MapPoint) => void;
  onLocationGroupToggle?: (messageId: string, visible: boolean) => void;
  onStartDrawing?: () => void;
  onStartCircleDrawing?: () => void;
  onStartPolygonDrawing?: () => void;
  onStartPOICreation?: () => void;
  onAOIClick?: (aoiAnalysis: AOIAnalysis) => void;
  triangles?: Triangle[];
  circles?: Circle[];
  polygons?: Polygon[];
  pois?: POI[];
  visibleLocations?: MapPoint[];
}

export default function LocationPanel({ 
  onLocationClick, 
  onLocationGroupToggle, 
  onStartDrawing,
  onStartCircleDrawing,
  onStartPolygonDrawing,
  onStartPOICreation,
  onAOIClick,
  triangles = [],
  circles = [],
  polygons = [],
  pois = [],
  visibleLocations
}: LocationPanelProps) {
  // Calculate spatial analysis for all AOIs using visible locations
  const allLocations = useMemo(() => getAllLocationsAsMapPoints(), []);
  const locationsForAnalysis = visibleLocations || allLocations;
  const aoiAnalyses = useMemo(() => {
    return analyzeAllAOIs(triangles, circles, polygons, locationsForAnalysis);
  }, [triangles, circles, polygons, locationsForAnalysis]);

  // Helper to get analysis for specific AOI
  const getAOIAnalysis = (id: string, type: string) => {
    return aoiAnalyses.find(analysis => analysis.id === id && analysis.type === type);
  };
  return (
    <div className="location-panel">
      <div className="locations-section">
        <ExtractedLocationsTree 
          onLocationClick={onLocationClick}
          onLocationGroupToggle={onLocationGroupToggle}
        />
      </div>

      <div className="triangles-section">
        <div className="section-header">
          <h3>△ My Triangles</h3>
          <button 
            className="add-triangle-btn"
            onClick={onStartDrawing}
          >
            [+ New]
          </button>
        </div>
        
        <div className="triangle-items">
          {triangles.map((triangle) => {
            const analysis = getAOIAnalysis(triangle.id, 'triangle');
            return (
              <div 
                key={triangle.id} 
                className="triangle-item"
                onClick={() => analysis && onAOIClick?.(analysis)}
              >
                <span className="triangle-icon" style={{ color: triangle.color }}>△</span>
                <div className="aoi-info">
                  <span className="triangle-name">{triangle.name}</span>
                  <span className="location-count">
                    {analysis?.locationCount || 0} locations
                  </span>
                </div>
              </div>
            );
          })}
          {triangles.length === 0 && (
            <div className="no-triangles">
              <span className="placeholder-text">No triangles yet. Click [+ New] to draw one.</span>
            </div>
          )}
        </div>
      </div>

      <div className="circles-section">
        <div className="section-header">
          <h3>○ My Circles</h3>
          <button 
            className="add-circle-btn"
            onClick={onStartCircleDrawing}
          >
            [+ New]
          </button>
        </div>
        
        <div className="circle-items">
          {circles.map((circle) => {
            const analysis = getAOIAnalysis(circle.id, 'circle');
            return (
              <div 
                key={circle.id} 
                className="circle-item"
                onClick={() => analysis && onAOIClick?.(analysis)}
              >
                <span className="circle-icon" style={{ color: circle.color }}>○</span>  
                <div className="aoi-info">
                  <span className="circle-name">{circle.name}</span>
                  <span className="location-count">
                    {analysis?.locationCount || 0} locations
                  </span>
                </div>
              </div>
            );
          })}
          {circles.length === 0 && (
            <div className="no-circles">
              <span className="placeholder-text">No circles yet. Click [+ New] to draw one.</span>
            </div>
          )}
        </div>
      </div>

      <div className="polygons-section">
        <div className="section-header">
          <h3>⬟ My Polygons</h3>
          <button 
            className="add-polygon-btn"
            onClick={onStartPolygonDrawing}
          >
            [+ New]
          </button>
        </div>
        
        <div className="polygon-items">
          {polygons.map((polygon) => {
            const analysis = getAOIAnalysis(polygon.id, 'polygon');
            return (
              <div 
                key={polygon.id} 
                className="polygon-item"
                onClick={() => analysis && onAOIClick?.(analysis)}
              >
                <span className="polygon-icon" style={{ color: polygon.color }}>⬟</span>
                <div className="polygon-info">
                  <span className="polygon-name">{polygon.name}</span>
                  <div className="polygon-meta">
                    <span className="polygon-details">({polygon.vertices.length} vertices)</span>
                    <span className="location-count">
                      {analysis?.locationCount || 0} locations
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {polygons.length === 0 && (
            <div className="no-polygons">
              <span className="placeholder-text">No polygons yet. Click [+ New] to draw one.</span>
            </div>
          )}
        </div>
      </div>

      <div className="pois-section">
        <div className="section-header">
          <h3>📍 My POIs</h3>
          <button 
            className="add-poi-btn"
            onClick={onStartPOICreation}
          >
            [+ New]
          </button>
        </div>
        
        <div className="poi-items">
          {pois.map((poi) => (
            <div 
              key={poi.id} 
              className="poi-item"
              onClick={() => console.log('POI clicked from panel:', poi)}
            >
              <span className="poi-icon" style={{ color: poi.color }}>📍</span>
              <div className="poi-info">
                <span className="poi-name">{poi.name}</span>
                <div className="poi-meta">
                  <span className="poi-category">({poi.category})</span>
                  {poi.description && (
                    <span className="poi-description">{poi.description}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {pois.length === 0 && (
            <div className="no-pois">
              <span className="placeholder-text">No POIs yet. Click [+ New] to create one.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}