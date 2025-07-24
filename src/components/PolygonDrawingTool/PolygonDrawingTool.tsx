import { useState, useCallback, useRef, useEffect } from 'react';
import { type MapRef } from 'react-map-gl/maplibre';
import { validatePolygon, assignPolygonColor, isPointNearby } from '../../utils/polygonValidation';
import type { Polygon } from '../../types';
import './PolygonDrawingTool.css';

interface PolygonDrawingToolProps {
  isDrawing: boolean;
  onPolygonComplete: (polygon: Polygon) => void;
  onCancel: () => void;
  onDrawingProgress?: (vertices: [number, number][]) => void;
  existingPolygonsCount: number;
  mapRef: MapRef | null;
}

type DrawingState = 'idle' | 'drawing' | 'complete';
type Coordinate = [number, number];

export default function PolygonDrawingTool({
  isDrawing,
  onPolygonComplete,
  onCancel,
  onDrawingProgress,
  existingPolygonsCount,
  mapRef
}: PolygonDrawingToolProps) {
  const map = mapRef;
  const [drawingState, setDrawingState] = useState<DrawingState>('idle');
  const [vertices, setVertices] = useState<Coordinate[]>([]);
  const [polygonName, setPolygonName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [hoverVertex, setHoverVertex] = useState<number | null>(null);

  // Track if we've added the event listeners
  const clickListenerAdded = useRef(false);
  const mouseMoveListenerAdded = useRef(false);
  const dblClickListenerAdded = useRef(false);
  const lastClickTime = useRef(0);

  const resetDrawing = useCallback(() => {
    setDrawingState('idle');
    setVertices([]);
    setPolygonName('');
    setShowSaveDialog(false);
    setValidationError(null);
    setHoverVertex(null);
    onDrawingProgress?.([]);
  }, [onDrawingProgress]);

  const completePolygon = useCallback(() => {
    if (vertices.length < 3) {
      setValidationError('Polygon must have at least 3 points');
      setTimeout(() => setValidationError(null), 2000);
      return;
    }

    const validation = validatePolygon(vertices);
    
    if (validation.valid) {
      setDrawingState('complete');
      setPolygonName(`Investigation Area ${String.fromCharCode(65 + existingPolygonsCount)}`);
      setShowSaveDialog(true);
      onDrawingProgress?.(vertices);
    } else {
      // Auto-discard invalid polygon
      setValidationError(validation.error || 'Polygon is invalid');
      setTimeout(() => {
        resetDrawing();
        onCancel();
      }, 2000);
    }
  }, [vertices, existingPolygonsCount, resetDrawing, onCancel, onDrawingProgress]);

  const handleMapClick = useCallback((e: { lngLat: { lng: number; lat: number } }) => {
    console.log('Polygon drawing map click received:', { isDrawing, drawingState });
    if (!isDrawing || drawingState === 'complete') return;

    const currentTime = Date.now();
    const { lng, lat } = e.lngLat;
    const newVertex: Coordinate = [lng, lat];

    // Check for double-click (within 300ms)
    const isDoubleClick = currentTime - lastClickTime.current < 300;
    lastClickTime.current = currentTime;

    if (isDoubleClick && vertices.length >= 3) {
      // Double-click to complete polygon
      completePolygon();
      return;
    }

    // Check if clicking near the first vertex to close polygon
    if (vertices.length >= 3 && isPointNearby(newVertex, vertices[0], 0.002)) {
      completePolygon();
      return;
    }

    // Add new vertex
    const newVertices = [...vertices, newVertex];
    setVertices(newVertices);
    setDrawingState('drawing');
    
    // Update preview
    onDrawingProgress?.(newVertices);
  }, [isDrawing, drawingState, vertices, completePolygon, onDrawingProgress]);

  const handleMapMouseMove = useCallback((e: { lngLat: { lng: number; lat: number } }) => {
    if (!isDrawing || drawingState !== 'drawing' || vertices.length === 0) return;

    const { lng, lat } = e.lngLat;
    const mousePoint: Coordinate = [lng, lat];

    // Check if hovering over first vertex (for closing indication)
    if (vertices.length >= 3 && isPointNearby(mousePoint, vertices[0], 0.002)) {
      setHoverVertex(0);
    } else {
      setHoverVertex(null);
    }

    // Update preview with current mouse position
    const previewVertices = [...vertices, mousePoint];
    onDrawingProgress?.(previewVertices);
  }, [isDrawing, drawingState, vertices, onDrawingProgress]);

  const handleMapDoubleClick = useCallback(() => {
    if (!isDrawing || drawingState === 'complete' || vertices.length < 3) return;
    
    // Complete polygon on double-click
    completePolygon();
  }, [isDrawing, drawingState, vertices.length, completePolygon]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isDrawing) return;

    if (e.key === 'Escape') {
      resetDrawing();
      onCancel();
    } else if (e.key === 'Enter' && vertices.length >= 3) {
      completePolygon();
    } else if (e.key === 'Backspace' && vertices.length > 0) {
      // Remove last vertex
      const newVertices = vertices.slice(0, -1);
      setVertices(newVertices);
      onDrawingProgress?.(newVertices);
      if (newVertices.length === 0) {
        setDrawingState('idle');
      }
    }
  }, [isDrawing, vertices, completePolygon, resetDrawing, onCancel, onDrawingProgress]);

  // Add/remove event listeners when drawing state changes
  useEffect(() => {
    console.log('useEffect triggered:', { map: !!map, isDrawing, clickListenerAdded: clickListenerAdded.current });
    if (!map) {
      console.log('Map is not available');
      return;
    }

    if (isDrawing && !clickListenerAdded.current) {
      console.log('Adding polygon drawing event listeners');
      map.on('click', handleMapClick);
      map.on('mousemove', handleMapMouseMove);
      map.on('dblclick', handleMapDoubleClick);
      clickListenerAdded.current = true;
      mouseMoveListenerAdded.current = true;
      dblClickListenerAdded.current = true;
      map.getCanvas().style.cursor = 'crosshair';
    } else if (!isDrawing && clickListenerAdded.current) {
      console.log('Removing polygon drawing event listeners');
      map.off('click', handleMapClick);
      map.off('mousemove', handleMapMouseMove);
      map.off('dblclick', handleMapDoubleClick);
      clickListenerAdded.current = false;
      mouseMoveListenerAdded.current = false;
      dblClickListenerAdded.current = false;
      map.getCanvas().style.cursor = '';
      resetDrawing();
    }

    return () => {
      if (clickListenerAdded.current) {
        map.off('click', handleMapClick);
        map.off('mousemove', handleMapMouseMove);
        map.off('dblclick', handleMapDoubleClick);
        clickListenerAdded.current = false;
        mouseMoveListenerAdded.current = false;
        dblClickListenerAdded.current = false;
        map.getCanvas().style.cursor = '';
      }
    };
  }, [map, isDrawing, handleMapClick, handleMapMouseMove, handleMapDoubleClick, resetDrawing]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleSave = () => {
    if (vertices.length >= 3) {
      const polygon: Polygon = {
        id: `polygon_${Date.now()}`,
        name: polygonName,
        vertices: vertices,
        userId: 'current_user',
        color: assignPolygonColor(existingPolygonsCount),
        createdAt: new Date()
      };
      
      onPolygonComplete(polygon);
      resetDrawing();
    }
  };

  const handleDiscard = useCallback(() => {
    resetDrawing();
    onCancel();
  }, [resetDrawing, onCancel]);

  if (!isDrawing) return null;

  return (
    <>
      {/* Drawing Instructions */}
      {drawingState !== 'complete' && (
        <div className="polygon-drawing-instructions">
          <div className="instruction-content">
            <span className="instruction-text">
              {vertices.length === 0 
                ? 'Click to add vertices. Double-click or press Enter to complete (min 3 points)'
                : vertices.length < 3
                ? `${vertices.length}/3+ vertices - Continue clicking to add points`
                : `${vertices.length} vertices - Double-click, click first point, or press Enter to complete`
              }
            </span>
            <div className="instruction-actions">
              <button className="cancel-drawing-btn" onClick={handleDiscard}>
                Cancel (ESC)
              </button>
              {vertices.length >= 3 && (
                <button className="complete-polygon-btn" onClick={completePolygon}>
                  Complete (Enter)
                </button>
              )}
            </div>
          </div>
          {vertices.length > 0 && (
            <div className="polygon-progress">
              <div className="vertex-count">
                {vertices.length} vertices
                {vertices.length >= 3 && (
                  <span className="complete-hint">
                    {hoverVertex === 0 ? ' - Click first point to close' : ' - Ready to complete'}
                  </span>
                )}
              </div>
              <div className="vertex-indicators">
                {vertices.map((_, i) => (
                  <div 
                    key={i} 
                    className={`vertex-dot ${hoverVertex === i ? 'highlighted' : ''}`} 
                  />
                ))}
              </div>
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
        <div className="polygon-save-dialog">
          <div className="dialog-content">
            <h3>Save Polygon</h3>
            <div className="polygon-preview">
              <span 
                className="polygon-icon" 
                style={{ color: assignPolygonColor(existingPolygonsCount) }}
              >
                ⬟
              </span>
              <span>
                Polygon created successfully ({vertices.length} vertices)
              </span>
            </div>
            
            <div className="name-input-group">
              <label htmlFor="polygonName">Name:</label>
              <input
                id="polygonName"
                type="text"
                value={polygonName}
                onChange={(e) => setPolygonName(e.target.value)}
                placeholder="Enter polygon name"
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