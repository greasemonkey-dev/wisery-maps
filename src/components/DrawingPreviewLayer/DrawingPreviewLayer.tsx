import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';

interface DrawingPreviewLayerProps {
  vertices: [number, number][];
  isDrawing: boolean;
  // Circle preview props
  circleCenter?: [number, number] | null;
  circleRadius?: number;
  isDrawingCircle?: boolean;
}

/**
 * Convert circle to GeoJSON polygon approximation for preview
 */
function createCirclePolygon(center: [number, number], radiusInMeters: number) {
  const points = 32; // Fewer points for preview performance
  const coordinates = [];
  
  // Convert radius from meters to degrees (rough approximation)
  const radiusInDegrees = radiusInMeters / 111320;
  
  for (let i = 0; i <= points; i++) {
    const angle = (i * 2 * Math.PI) / points;
    const lng = center[0] + radiusInDegrees * Math.cos(angle);
    const lat = center[1] + radiusInDegrees * Math.sin(angle);
    coordinates.push([lng, lat]);
  }
  
  return coordinates;
}

export default function DrawingPreviewLayer({ 
  vertices, 
  isDrawing, 
  circleCenter, 
  circleRadius = 0, 
  isDrawingCircle = false 
}: DrawingPreviewLayerProps) {
  const previewGeoJSON = useMemo(() => {
    if (!isDrawing || (vertices.length === 0 && !isDrawingCircle)) {
      return {
        type: 'FeatureCollection' as const,
        features: [],
      };
    }

    const features = [];

    // Handle circle preview
    if (isDrawingCircle && circleCenter && circleRadius > 0) {
      // Add center point
      features.push({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: circleCenter,
        },
        properties: {
          type: 'circle-center',
        },
      });

      // Add circle outline
      features.push({
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [createCirclePolygon(circleCenter, circleRadius)],
        },
        properties: {
          type: 'circle',
        },
      });
    }

    // Handle triangle preview (existing logic)
    if (!isDrawingCircle && vertices.length > 0) {
      // Add vertex points
      vertices.forEach((vertex, index) => {
        features.push({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: vertex,
          },
          properties: {
            type: 'vertex',
            index,
          },
        });
      });

      // Add lines between vertices
      if (vertices.length > 1) {
        features.push({
          type: 'Feature' as const,
          geometry: {
            type: 'LineString' as const,
            coordinates: vertices,
          },
          properties: {
            type: 'edge',
          },
        });
      }

      // Add triangle fill when we have 3 vertices
      if (vertices.length === 3) {
        features.push({
          type: 'Feature' as const,
          geometry: {
            type: 'Polygon' as const,
            coordinates: [[...vertices, vertices[0]]], // Close the polygon
          },
          properties: {
            type: 'triangle',
          },
        });
      }
    }

    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }, [vertices, isDrawing, isDrawingCircle, circleCenter, circleRadius]);

  if (!isDrawing || (vertices.length === 0 && !isDrawingCircle)) {
    return null;
  }

  return (
    <Source id="drawing-preview" type="geojson" data={previewGeoJSON}>
      {/* Triangle fill (only when complete) */}
      <Layer
        id="drawing-preview-fill"
        type="fill"
        paint={{
          'fill-color': '#4CBACB',
          'fill-opacity': 0.2,
        }}
        filter={['==', ['get', 'type'], 'triangle']}
      />
      
      {/* Lines between vertices */}
      <Layer
        id="drawing-preview-line"
        type="line"
        paint={{
          'line-color': '#4CBACB',
          'line-width': 2,
          'line-dasharray': [2, 2],
          'line-opacity': 0.8,
        }}
        filter={['==', ['get', 'type'], 'edge']}
      />
      
      {/* Vertex points */}
      <Layer
        id="drawing-preview-vertices"
        type="circle"
        paint={{
          'circle-color': '#4CBACB',
          'circle-radius': 6,
          'circle-stroke-color': 'white',
          'circle-stroke-width': 2,
        }}
        filter={['==', ['get', 'type'], 'vertex']}
      />
      
      {/* Circle preview fill */}
      <Layer
        id="drawing-preview-circle-fill"
        type="fill"
        paint={{
          'fill-color': '#4CBACB',
          'fill-opacity': 0.1,
        }}
        filter={['==', ['get', 'type'], 'circle']}
      />
      
      {/* Circle preview outline */}
      <Layer
        id="drawing-preview-circle-outline"
        type="line"
        paint={{
          'line-color': '#4CBACB',
          'line-width': 2,
          'line-dasharray': [3, 3],
          'line-opacity': 0.8,
        }}
        filter={['==', ['get', 'type'], 'circle']}
      />
      
      {/* Circle center point */}
      <Layer
        id="drawing-preview-circle-center"
        type="circle"
        paint={{
          'circle-color': '#4CBACB',
          'circle-radius': 8,
          'circle-stroke-color': 'white',
          'circle-stroke-width': 2,
        }}
        filter={['==', ['get', 'type'], 'circle-center']}
      />
    </Source>
  );
}