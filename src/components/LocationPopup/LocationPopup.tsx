import { Popup } from 'react-map-gl/maplibre';
import type { MapPoint } from '../../types';
import './LocationPopup.css';

interface LocationPopupProps {
  location: MapPoint;
  onClose: () => void;
}

export default function LocationPopup({ location, onClose }: LocationPopupProps) {
  const formatDate = (timestamp?: string) => {
    if (!timestamp) return 'Time unknown';
    
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatCoordinates = (coordinates: [number, number]) => {
    const [lng, lat] = coordinates;
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  return (
    <Popup
      longitude={location.coordinates[0]}
      latitude={location.coordinates[1]}
      onClose={onClose}
      closeButton={true}
      closeOnClick={false}
      anchor="bottom"
      maxWidth="300px"
    >
      <div className="location-popup">
        <div className="popup-header">
          <h3 className="popup-title">📍 Location Details</h3>
        </div>
        
        <div className="popup-content">
          <div className="popup-field">
            <strong className="field-label">Name:</strong>
            <span className="field-value">{location.label}</span>
          </div>
          
          <div className="popup-field">
            <strong className="field-label">Time:</strong>
            <span className="field-value">{formatDate(location.timestamp)}</span>
          </div>
          
          <div className="popup-field">
            <strong className="field-label">Context:</strong>
            <span className="field-value">{location.context}</span>
          </div>
          
          <div className="popup-field">
            <strong className="field-label">Coordinates:</strong>
            <span className="field-value coordinates">
              {formatCoordinates(location.coordinates)}
            </span>
          </div>
        </div>
        
        <div className="popup-actions">
          <button className="action-btn primary">View in Conversation</button>
          <button className="action-btn secondary">Add to Query</button>
        </div>
      </div>
    </Popup>
  );
}