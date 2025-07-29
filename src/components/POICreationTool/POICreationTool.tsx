import { useState, useCallback, useRef, useEffect } from 'react';
import { Map } from '@maptiler/sdk';
import { 
  validatePOI, 
  validatePOILocation, 
  snapPOICoordinates,
  assignPOIColor, 
  assignPOIIcon,
  getPOICategories,
  getPOIIcons 
} from '../../utils/poiValidation';
import type { POI } from '../../types';
import './POICreationTool.css';

interface POICreationToolProps {
  isCreating: boolean;
  onPOIComplete: (poi: POI) => void;
  onCancel: () => void;
  existingPOIs: POI[];
  existingPOIsCount: number;
  mapRef: Map | null;
}

type CreationState = 'idle' | 'placing' | 'dragging' | 'complete';
type Coordinate = [number, number];

export default function POICreationTool({
  isCreating,
  onPOIComplete,
  onCancel,
  existingPOIs,
  existingPOIsCount,
  mapRef
}: POICreationToolProps) {
  const map = mapRef;
  const [creationState, setCreationState] = useState<CreationState>('idle');
  const [coordinates, setCoordinates] = useState<Coordinate | null>(null);
  const [poiName, setPOIName] = useState('');
  const [poiDescription, setPOIDescription] = useState('');
  const [poiCategory, setPOICategory] = useState('general');
  const [poiIcon, setPOIIcon] = useState('marker');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [snapInfo, setSnapInfo] = useState<{ snapped: boolean; target?: [number, number] }>({ snapped: false });

  // Track event listeners
  const clickListenerAdded = useRef(false);
  const dragListenerAdded = useRef(false);

  const resetCreation = useCallback(() => {
    setCreationState('idle');
    setCoordinates(null);
    setPOIName('');
    setPOIDescription('');
    setPOICategory('general');
    setPOIIcon('marker');
    setShowSaveDialog(false);
    setValidationError(null);
    setIsDragging(false);
    setSnapInfo({ snapped: false });
  }, []);

  const handleMapClick = useCallback((e: { lngLat: { lng: number; lat: number } }) => {
    console.log('POI creation map click received:', { isCreating, creationState });
    if (!isCreating || creationState === 'complete') return;

    const { lng, lat } = e.lngLat;
    const newCoordinates: Coordinate = [lng, lat];
    
    // Validate basic coordinates
    const validation = validatePOI(newCoordinates);
    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid coordinates');
      return;
    }

    // Check location proximity to existing POIs
    const locationValidation = validatePOILocation(newCoordinates, existingPOIs);
    if (!locationValidation.valid) {
      setValidationError(locationValidation.error || 'Invalid location');
      return;
    }

    // Snap to nearby features if applicable
    const snapTargets = existingPOIs.map(poi => poi.coordinates);
    const snapResult = snapPOICoordinates(newCoordinates, snapTargets);
    
    setCoordinates(snapResult.coordinates);
    setSnapInfo({ 
      snapped: snapResult.snapped, 
      target: snapResult.snapTarget 
    });
    setCreationState('placing');
    setPOIName(`POI ${String.fromCharCode(65 + existingPOIsCount)}`);
    setPOIIcon(assignPOIIcon(poiCategory, existingPOIsCount));
    setShowSaveDialog(true);
  }, [isCreating, creationState, existingPOIs, existingPOIsCount, poiCategory]);

  const handleMouseDown = useCallback((e: any) => {
    if (!isCreating || creationState !== 'placing' || !coordinates) return;
    
    const features = map?.queryRenderedFeatures(e.point, {
      layers: ['poi-preview-layer'] // We'll create this layer for preview
    });
    
    if (features && features.length > 0) {
      setIsDragging(true);
      setCreationState('dragging');
      map!.getCanvas().style.cursor = 'grabbing';
    }
  }, [isCreating, creationState, coordinates, map]);

  const handleMouseMove = useCallback((e: { lngLat: { lng: number; lat: number } }) => {
    if (!isDragging || creationState !== 'dragging') return;

    const { lng, lat } = e.lngLat;
    const newCoordinates: Coordinate = [lng, lat];
    
    // Validate new position
    const validation = validatePOI(newCoordinates);
    if (validation.valid) {
      // Check location proximity
      const locationValidation = validatePOILocation(newCoordinates, existingPOIs);
      if (locationValidation.valid) {
        // Snap to nearby features
        const snapTargets = existingPOIs.map(poi => poi.coordinates);
        const snapResult = snapPOICoordinates(newCoordinates, snapTargets);
        
        setCoordinates(snapResult.coordinates);
        setSnapInfo({ 
          snapped: snapResult.snapped, 
          target: snapResult.snapTarget 
        });
        setValidationError(null);
      } else {
        setValidationError(locationValidation.error || 'Invalid location');
      }
    }
  }, [isDragging, creationState, existingPOIs]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setCreationState('placing');
      if (map) {
        map.getCanvas().style.cursor = 'pointer';
      }
    }
  }, [isDragging, map]);

  // Add/remove event listeners when creation state changes
  useEffect(() => {
    console.log('POI useEffect triggered:', { map: !!map, isCreating, clickListenerAdded: clickListenerAdded.current });
    if (!map) {
      console.log('Map is not available');
      return;
    }

    if (isCreating && !clickListenerAdded.current) {
      console.log('Adding POI creation click listener');
      map.on('click', handleMapClick);
      clickListenerAdded.current = true;
      map.getCanvas().style.cursor = 'crosshair';
    } else if (!isCreating && clickListenerAdded.current) {
      console.log('Removing POI creation click listener');
      map.off('click', handleMapClick);
      clickListenerAdded.current = false;
      map.getCanvas().style.cursor = '';
      resetCreation();
    }

    return () => {
      if (clickListenerAdded.current) {
        map.off('click', handleMapClick);
        clickListenerAdded.current = false;
        map.getCanvas().style.cursor = '';
      }
    };
  }, [map, isCreating, handleMapClick, resetCreation]);

  // Add drag listeners when placing
  useEffect(() => {
    if (!map || creationState !== 'placing') return;

    if (!dragListenerAdded.current) {
      map.on('mousedown', handleMouseDown);
      map.on('mousemove', handleMouseMove);
      map.on('mouseup', handleMouseUp);
      dragListenerAdded.current = true;
    }

    return () => {
      if (dragListenerAdded.current) {
        map.off('mousedown', handleMouseDown);
        map.off('mousemove', handleMouseMove);
        map.off('mouseup', handleMouseUp);
        dragListenerAdded.current = false;
      }
    };
  }, [map, creationState, handleMouseDown, handleMouseMove, handleMouseUp]);

  const handleSave = () => {
    if (coordinates && poiName.trim()) {
      const poi: POI = {
        id: `poi_${Date.now()}`,
        name: poiName.trim(),
        coordinates,
        userId: 'current_user',
        color: assignPOIColor(existingPOIsCount),
        icon: poiIcon,
        description: poiDescription.trim() || undefined,
        category: poiCategory,
        createdAt: new Date()
      };
      
      onPOIComplete(poi);
      resetCreation();
    }
  };

  const handleDiscard = useCallback(() => {
    resetCreation();
    onCancel();
  }, [resetCreation, onCancel]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleDiscard();
    }
  }, [handleDiscard]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isCreating) return null;

  return (
    <>
      {/* Creation Instructions */}
      {creationState === 'idle' && (
        <div className="poi-creation-instructions">
          <div className="instruction-content">
            <span className="instruction-text">
              Click on the map to place a POI marker
            </span>
            <button className="cancel-creation-btn" onClick={handleDiscard}>
              Cancel (ESC)
            </button>
          </div>
        </div>
      )}

      {/* Dragging Instructions */}
      {(creationState === 'placing' || creationState === 'dragging') && !showSaveDialog && (
        <div className="poi-creation-instructions">
          <div className="instruction-content">
            <span className="instruction-text">
              {isDragging ? 'Drag to reposition POI' : 'Click and drag to reposition, or save current location'}
            </span>
            <button className="cancel-creation-btn" onClick={handleDiscard}>
              Cancel (ESC)
            </button>
          </div>
          {snapInfo.snapped && (
            <div className="snap-indicator">
              📌 Snapped to nearby feature
            </div>
          )}
        </div>
      )}

      {/* Validation Error */}
      {validationError && (
        <div className="validation-error">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{validationError}</span>
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="poi-save-dialog">
          <div className="dialog-content">
            <h3>Create POI</h3>
            <div className="poi-preview">
              <span 
                className="poi-icon" 
                style={{ color: assignPOIColor(existingPOIsCount) }}
              >
                📍
              </span>
              <span>POI placed successfully</span>
              {snapInfo.snapped && <span className="snap-badge">Snapped</span>}
            </div>
            
            <div className="poi-form">
              <div className="form-group">
                <label htmlFor="poiName">Name:</label>
                <input
                  id="poiName"
                  type="text"
                  value={poiName}
                  onChange={(e) => setPOIName(e.target.value)}
                  placeholder="Enter POI name"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="poiDescription">Description (optional):</label>
                <textarea
                  id="poiDescription"
                  value={poiDescription}
                  onChange={(e) => setPOIDescription(e.target.value)}
                  placeholder="Enter description"
                  rows={2}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="poiCategory">Category:</label>
                  <select
                    id="poiCategory"
                    value={poiCategory}
                    onChange={(e) => {
                      setPOICategory(e.target.value);
                      setPOIIcon(assignPOIIcon(e.target.value, existingPOIsCount));
                    }}
                  >
                    {getPOICategories().map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="poiIcon">Icon:</label>
                  <select
                    id="poiIcon"
                    value={poiIcon}
                    onChange={(e) => setPOIIcon(e.target.value)}
                  >
                    {getPOIIcons().map(icon => (
                      <option key={icon} value={icon}>
                        {icon.charAt(0).toUpperCase() + icon.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {coordinates && (
                <div className="coordinates-display">
                  <small>
                    Coordinates: {coordinates[1].toFixed(6)}, {coordinates[0].toFixed(6)}
                  </small>
                </div>
              )}
            </div>
            
            <div className="dialog-actions">
              <button 
                className="save-btn" 
                onClick={handleSave}
                disabled={!poiName.trim()}
              >
                Save POI
              </button>
              <button className="discard-btn" onClick={handleDiscard}>
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}