import { useState } from 'react';
import type { AOIAnalysis, MapPoint } from '../../types';
import './AOIDetailsPanel.css';

interface AOIDetailsPanelProps {
  aoiAnalysis: AOIAnalysis;
  onClose: () => void;
  onLocationClick: (location: MapPoint) => void;
}

export default function AOIDetailsPanel({ 
  aoiAnalysis, 
  onClose, 
  onLocationClick 
}: AOIDetailsPanelProps) {
  const [showAllLocations, setShowAllLocations] = useState(false);
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'triangle': return '△';
      case 'circle': return '○';
      case 'polygon': return '⬟';
      default: return '●';
    }
  };

  const displayedLocations = showAllLocations 
    ? aoiAnalysis.containedLocations 
    : aoiAnalysis.containedLocations.slice(0, 5);

  return (
    <div className="aoi-details-panel">
      <div className="aoi-details-header">
        <div className="aoi-title">
          <span 
            className="aoi-type-icon" 
            style={{ color: aoiAnalysis.color }}
          >
            {getTypeIcon(aoiAnalysis.type)}
          </span>
          <div className="aoi-info">
            <h3>{aoiAnalysis.name}</h3>
            <span className="aoi-meta">
              {aoiAnalysis.type} • Created {aoiAnalysis.createdAt.toLocaleDateString()}
            </span>
          </div>
        </div>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="aoi-details-content">
        <div className="locations-summary">
          <div className="summary-stat">
            <span className="stat-value">{aoiAnalysis.locationCount}</span>
            <span className="stat-label">
              {aoiAnalysis.locationCount === 1 ? 'Location' : 'Locations'} Found
            </span>
          </div>
        </div>

        {aoiAnalysis.locationCount === 0 ? (
          <div className="no-locations">
            <div className="no-locations-icon">📍</div>
            <p>No locations found within this AOI</p>
            <span className="no-locations-hint">
              Try adjusting the AOI size or position to capture relevant locations
            </span>
          </div>
        ) : (
          <div className="locations-list">
            <div className="locations-header">
              <h4>Contained Locations</h4>
              {aoiAnalysis.locationCount > 5 && (
                <button 
                  className="toggle-all-btn"
                  onClick={() => setShowAllLocations(!showAllLocations)}
                >
                  {showAllLocations ? 'Show Less' : `Show All (${aoiAnalysis.locationCount})`}
                </button>
              )}
            </div>
            
            <div className="location-items">
              {displayedLocations.map((location) => (
                <div 
                  key={location.id} 
                  className="location-item"
                  onClick={() => onLocationClick(location)}
                >
                  <div className="location-main">
                    <span className="location-icon">📍</span>
                    <div className="location-details">
                      <span className="location-name">{location.label}</span>
                      <span className="location-context">{location.context}</span>
                    </div>
                  </div>
                  <div className="location-coords">
                    {location.coordinates[1].toFixed(4)}, {location.coordinates[0].toFixed(4)}
                  </div>
                </div>
              ))}
            </div>

            {!showAllLocations && aoiAnalysis.locationCount > 5 && (
              <div className="locations-truncated">
                ... and {aoiAnalysis.locationCount - 5} more locations
              </div>
            )}
          </div>
        )}

        <div className="aoi-actions">
          <button className="action-btn primary">
            📊 Generate Report
          </button>
          <button className="action-btn secondary">
            🔍 Query Locations
          </button>
          <button className="action-btn secondary">
            📤 Export Data
          </button>
        </div>
      </div>
    </div>
  );
}