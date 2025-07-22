import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';

interface DrawingPreviewLayerProps {
  vertices: [number, number][];
  isDrawing: boolean;
}

export default function DrawingPreviewLayer({ vertices, isDrawing }: DrawingPreviewLayerProps) {
  const previewGeoJSON = useMemo(() => {
    if (!isDrawing || vertices.length === 0) {
      return {
        type: 'FeatureCollection' as const,
        features: [],
      };
    }

    const features = [];

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

    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }, [vertices, isDrawing]);

  if (!isDrawing || vertices.length === 0) {
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
    </Source>
  );
}