import ExtractedLocationsTree from '../ExtractedLocationsTree';
import type { MapPoint, Triangle } from '../../types';
import './LocationPanel.css';

interface LocationPanelProps {
  onLocationClick?: (location: MapPoint) => void;
  onLocationGroupToggle?: (messageId: string, visible: boolean) => void;
  onStartDrawing?: () => void;
  triangles?: Triangle[];
}

export default function LocationPanel({ 
  onLocationClick, 
  onLocationGroupToggle, 
  onStartDrawing,
  triangles = []
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
    </div>
  );
}