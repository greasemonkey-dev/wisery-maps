import { useState, useCallback, useRef, useEffect } from 'react';
import { type MapRef } from 'react-map-gl/maplibre';
import { validateTriangle, assignTriangleColor } from '../../utils/triangleValidation';
import type { Triangle } from '../../types';
import './TriangleDrawingTool.css';

interface TriangleDrawingToolProps {
  isDrawing: boolean;
  onTriangleComplete: (triangle: Triangle) => void;
  onCancel: () => void;
  onDrawingProgress?: (vertices: [number, number][]) => void;
  existingTrianglesCount: number;
  mapRef: MapRef | null;
}

type DrawingState = 'idle' | 'drawing' | 'complete';
type Coordinate = [number, number];

export default function TriangleDrawingTool({
  isDrawing,
  onTriangleComplete,
  onCancel,
  onDrawingProgress,
  existingTrianglesCount,
  mapRef
}: TriangleDrawingToolProps) {
  const map = mapRef;
  const [drawingState, setDrawingState] = useState<DrawingState>('idle');
  const [clickCount, setClickCount] = useState(0);
  const [vertices, setVertices] = useState<Coordinate[]>([]);
  const [triangleName, setTriangleName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Track if we've added the click listener
  const clickListenerAdded = useRef(false);

  const resetDrawing = useCallback(() => {
    setDrawingState('idle');
    setClickCount(0);
    setVertices([]);
    setTriangleName('');
    setShowSaveDialog(false);
    setValidationError(null);
    onDrawingProgress?.([]);
  }, [onDrawingProgress]);

  const handleMapClick = useCallback((e: { lngLat: { lng: number; lat: number } }) => {
    console.log('Triangle drawing map click received:', { isDrawing, drawingState });
    if (!isDrawing || drawingState === 'complete') return;

    const { lng, lat } = e.lngLat;
    const newVertex: Coordinate = [lng, lat];
    
    const newVertices = [...vertices, newVertex];
    const newClickCount = clickCount + 1;
    
    setVertices(newVertices);
    setClickCount(newClickCount);
    
    // Update preview
    onDrawingProgress?.(newVertices as [number, number][]);
    
    if (newClickCount === 3) {
      // Triangle completed - validate it
      const triangleVertices: [[number, number], [number, number], [number, number]] = [
        newVertices[0] as [number, number],
        newVertices[1] as [number, number], 
        newVertices[2] as [number, number]
      ];
      
      const validation = validateTriangle(triangleVertices);
      
      if (validation.valid) {
        setDrawingState('complete');
        setTriangleName(`Investigation Area ${String.fromCharCode(65 + existingTrianglesCount)}`);
        setShowSaveDialog(true);
      } else {
        // Auto-discard invalid triangle
        setValidationError(validation.error || 'Triangle is invalid');
        setTimeout(() => {
          resetDrawing();
          onCancel();
        }, 2000);
      }
    } else {
      setDrawingState('drawing');
    }
  }, [isDrawing, drawingState, vertices, clickCount, existingTrianglesCount, resetDrawing, onCancel]);

  // Add/remove click listener when drawing state changes
  useEffect(() => {
    console.log('useEffect triggered:', { map: !!map, isDrawing, clickListenerAdded: clickListenerAdded.current });
    if (!map) {
      console.log('Map is not available');
      return;
    }

    if (isDrawing && !clickListenerAdded.current) {
      console.log('Adding triangle drawing click listener');
      map.on('click', handleMapClick);
      clickListenerAdded.current = true;
      map.getCanvas().style.cursor = 'crosshair';
    } else if (!isDrawing && clickListenerAdded.current) {
      console.log('Removing triangle drawing click listener');
      map.off('click', handleMapClick);
      clickListenerAdded.current = false;
      map.getCanvas().style.cursor = '';
      resetDrawing();
    }

    return () => {
      if (clickListenerAdded.current) {
        map.off('click', handleMapClick);
        clickListenerAdded.current = false;
        map.getCanvas().style.cursor = '';
      }
    };
  }, [map, isDrawing, handleMapClick, resetDrawing]);

  const handleSave = () => {
    if (vertices.length === 3) {
      const triangle: Triangle = {
        id: `triangle_${Date.now()}`,
        name: triangleName,
        vertices: vertices as [[number, number], [number, number], [number, number]],
        userId: 'current_user',
        color: assignTriangleColor(existingTrianglesCount),
        createdAt: new Date()
      };
      
      onTriangleComplete(triangle);
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
        <div className="drawing-instructions">
          <div className="instruction-content">
            <span className="instruction-text">
              Click {clickCount === 0 ? '3 points' : clickCount === 1 ? '2 more points' : '1 more point'} to draw triangle
            </span>
            <button className="cancel-drawing-btn" onClick={handleDiscard}>
              Cancel (ESC)
            </button>
          </div>
          {clickCount > 0 && (
            <div className="click-progress">
              {Array.from({ length: 3 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`progress-dot ${i < clickCount ? 'completed' : ''}`} 
                />
              ))}
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
        <div className="triangle-save-dialog">
          <div className="dialog-content">
            <h3>Save Triangle</h3>
            <div className="triangle-preview">
              <span 
                className="triangle-icon" 
                style={{ color: assignTriangleColor(existingTrianglesCount) }}
              >
                △
              </span>
              <span>Triangle created successfully</span>
            </div>
            
            <div className="name-input-group">
              <label htmlFor="triangleName">Name:</label>
              <input
                id="triangleName"
                type="text"
                value={triangleName}
                onChange={(e) => setTriangleName(e.target.value)}
                placeholder="Enter triangle name"
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
      
      {/* Triangle Preview on Map */}
      {vertices.length > 0 && (
        <div className="triangle-preview-overlay">
          {/* This would render the triangle preview - simplified for now */}
        </div>
      )}
    </>
  );
}