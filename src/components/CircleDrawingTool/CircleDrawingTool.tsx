import { useState, useCallback, useRef, useEffect } from 'react';
import { type MapRef } from 'react-map-gl/maplibre';
import { validateCircle, assignCircleColor, calculateDistance, formatRadius } from '../../utils/circleValidation';
import type { Circle } from '../../types';
import './CircleDrawingTool.css';

interface CircleDrawingToolProps {
  isDrawing: boolean;
  onCircleComplete: (circle: Circle) => void;
  onCancel: () => void;
  onDrawingProgress?: (center: [number, number] | null, radius: number) => void;
  existingCirclesCount: number;
  mapRef: MapRef | null;
}

type DrawingState = 'idle' | 'drawing' | 'complete';

export default function CircleDrawingTool({
  isDrawing,
  onCircleComplete,
  onCancel,
  onDrawingProgress,
  existingCirclesCount,
  mapRef
}: CircleDrawingToolProps) {
  const [drawingState, setDrawingState] = useState<DrawingState>('idle');
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [currentRadius, setCurrentRadius] = useState(0);
  const [circleName, setCircleName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Track if we've added the event listeners
  const clickListenerAdded = useRef(false);
  const mouseMoveListenerAdded = useRef(false);

  const resetDrawing = useCallback(() => {
    setDrawingState('idle');
    setCenter(null);
    setCurrentRadius(0);
    setCircleName('');
    setShowSaveDialog(false);
    setValidationError(null);
    onDrawingProgress?.(null, 0);
  }, [onDrawingProgress]);

  const handleMapClick = useCallback((e: { lngLat: { lng: number; lat: number } }) => {
    console.log('Circle drawing map click received:', { isDrawing, drawingState });
    if (!isDrawing || drawingState === 'complete') return;

    const { lng, lat } = e.lngLat;
    const clickPoint: [number, number] = [lng, lat];

    if (drawingState === 'idle') {
      // First click - set center point
      setCenter(clickPoint);
      setDrawingState('drawing');
      onDrawingProgress?.(clickPoint, 0);
    } else if (drawingState === 'drawing' && center) {
      // Second click - calculate radius and validate
      const radius = calculateDistance(center, clickPoint);
      const validation = validateCircle(center, radius);
      
      if (validation.valid) {
        setCurrentRadius(radius);
        setDrawingState('complete');
        setCircleName(`Investigation Circle ${String.fromCharCode(65 + existingCirclesCount)}`);
        setShowSaveDialog(true);
        onDrawingProgress?.(center, radius);
      } else {
        // Auto-discard invalid circle
        setValidationError(validation.error || 'Circle is invalid');
        setTimeout(() => {
          resetDrawing();
          onCancel();
        }, 2000);
      }
    }
  }, [isDrawing, drawingState, center, existingCirclesCount, resetDrawing, onCancel, onDrawingProgress]);

  const handleMapMouseMove = useCallback((e: { lngLat: { lng: number; lat: number } }) => {
    if (!isDrawing || drawingState !== 'drawing' || !center) return;

    const { lng, lat } = e.lngLat;
    const mousePoint: [number, number] = [lng, lat];
    const radius = calculateDistance(center, mousePoint);
    
    setCurrentRadius(radius);
    onDrawingProgress?.(center, radius);
  }, [isDrawing, drawingState, center, onDrawingProgress]);

  // Add/remove event listeners when drawing state changes
  useEffect(() => {
    console.log('useEffect triggered:', { map: !!mapRef, isDrawing, clickListenerAdded: clickListenerAdded.current });
    if (!mapRef) {
      console.log('Map is not available');
      return;
    }

    if (isDrawing && !clickListenerAdded.current) {
      console.log('Adding circle drawing event listeners');
      mapRef.on('click', handleMapClick);
      mapRef.on('mousemove', handleMapMouseMove);
      clickListenerAdded.current = true;
      mouseMoveListenerAdded.current = true;
      mapRef.getCanvas().style.cursor = 'crosshair';
    } else if (!isDrawing && clickListenerAdded.current) {
      console.log('Removing circle drawing event listeners');
      mapRef.off('click', handleMapClick);
      mapRef.off('mousemove', handleMapMouseMove);
      clickListenerAdded.current = false;
      mouseMoveListenerAdded.current = false;
      mapRef.getCanvas().style.cursor = '';
      resetDrawing();
    }

    return () => {
      if (clickListenerAdded.current) {
        mapRef.off('click', handleMapClick);
        mapRef.off('mousemove', handleMapMouseMove);
        clickListenerAdded.current = false;
        mouseMoveListenerAdded.current = false;
        mapRef.getCanvas().style.cursor = '';
      }
    };
  }, [mapRef, isDrawing, handleMapClick, handleMapMouseMove, resetDrawing]);

  const handleSave = () => {
    if (center && currentRadius > 0) {
      const circle: Circle = {
        id: `circle_${Date.now()}`,
        name: circleName,
        center,
        radius: currentRadius,
        userId: 'current_user',
        color: assignCircleColor(existingCirclesCount),
        createdAt: new Date()
      };
      
      onCircleComplete(circle);
      resetDrawing();
    }
  };

  const handleDiscard = useCallback(() => {
    resetDrawing();
    onCancel();
  }, [resetDrawing, onCancel]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleDiscard();
    }
  }, [handleDiscard]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isDrawing) return null;

  return (
    <>
      {/* Drawing Instructions */}
      {drawingState !== 'complete' && (
        <div className="circle-drawing-instructions">
          <div className="instruction-content">
            <span className="instruction-text">
              {drawingState === 'idle' 
                ? 'Click center point, then click to set radius'
                : `Radius: ${formatRadius(currentRadius)} - Click to confirm`
              }
            </span>
            <button className="cancel-drawing-btn" onClick={handleDiscard}>
              Cancel (ESC)
            </button>
          </div>
          <div className="circle-progress">
            <div className={`progress-step ${drawingState !== 'idle' ? 'completed' : ''}`} />
            <div className={`progress-step ${drawingState === 'drawing' ? 'active' : ''}`} />
          </div>
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
        <div className="circle-save-dialog">
          <div className="dialog-content">
            <h3>Save Circle</h3>
            <div className="circle-preview">
              <span 
                className="circle-icon" 
                style={{ color: assignCircleColor(existingCirclesCount) }}
              >
                ○
              </span>
              <span>
                Circle created - {formatRadius(currentRadius)} radius
              </span>
            </div>
            
            <div className="name-input-group">
              <label htmlFor="circleName">Name:</label>
              <input
                id="circleName"
                type="text"
                value={circleName}
                onChange={(e) => setCircleName(e.target.value)}
                placeholder="Enter circle name"
                autoFocus
              />
            </div>
            
            <div className="dialog-actions">
              <button className="save-btn" onClick={handleSave}>
                Save
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