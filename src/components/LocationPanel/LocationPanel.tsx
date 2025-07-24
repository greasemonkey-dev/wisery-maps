import { useMemo } from 'react';
import ExtractedLocationsTree from '../ExtractedLocationsTree';
import { analyzeAllAOIs } from '../../utils/spatialAnalysis';
import { getAllLocationsAsMapPoints } from '../../utils/mockDataLoader';
import type { MapPoint, Triangle, Circle, Polygon, AOIAnalysis } from '../../types';
import './LocationPanel.css';

interface LocationPanelProps {
  onLocationClick?: (location: MapPoint) => void;
  onLocationGroupToggle?: (messageId: string, visible: boolean) => void;
  onStartDrawing?: () => void;
  onStartCircleDrawing?: () => void;
  onStartPolygonDrawing?: () => void;
  onAOIClick?: (aoiAnalysis: AOIAnalysis) => void;
  triangles?: Triangle[];
  circles?: Circle[];
  polygons?: Polygon[];
}

export default function LocationPanel({ 
  onLocationClick, 
  onLocationGroupToggle, 
  onStartDrawing,
  onStartCircleDrawing,
  onStartPolygonDrawing,
  onAOIClick,
  triangles = [],
  circles = [],
  polygons = []
}: LocationPanelProps) {
  // Calculate spatial analysis for all AOIs
  const allLocations = useMemo(() => getAllLocationsAsMapPoints(), []);
  const aoiAnalyses = useMemo(() => {
    return analyzeAllAOIs(triangles, circles, polygons, allLocations);
  }, [triangles, circles, polygons, allLocations]);

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
    </div>
  );
}