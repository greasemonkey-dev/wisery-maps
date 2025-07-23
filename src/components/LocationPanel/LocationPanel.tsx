import ExtractedLocationsTree from '../ExtractedLocationsTree';
import type { MapPoint, Triangle, Circle } from '../../types';
import './LocationPanel.css';

interface LocationPanelProps {
  onLocationClick?: (location: MapPoint) => void;
  onLocationGroupToggle?: (messageId: string, visible: boolean) => void;
  onStartDrawing?: () => void;
  onStartCircleDrawing?: () => void;
  triangles?: Triangle[];
  circles?: Circle[];
}

export default function LocationPanel({ 
  onLocationClick, 
  onLocationGroupToggle, 
  onStartDrawing,
  onStartCircleDrawing,
  triangles = [],
  circles = []
}: LocationPanelProps) {
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
          {triangles.map((triangle) => (
            <div key={triangle.id} className="triangle-item">
              <span className="triangle-icon" style={{ color: triangle.color }}>△</span>
              <span className="triangle-name">{triangle.name}</span>
            </div>
          ))}
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
          {circles.map((circle) => (
            <div key={circle.id} className="circle-item">
              <span className="circle-icon" style={{ color: circle.color }}>○</span>
              <span className="circle-name">{circle.name}</span>
            </div>
          ))}
          {circles.length === 0 && (
            <div className="no-circles">
              <span className="placeholder-text">No circles yet. Click [+ New] to draw one.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}