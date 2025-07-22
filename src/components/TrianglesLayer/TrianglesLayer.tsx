import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import type { Triangle } from '../../types';

interface TrianglesLayerProps {
  triangles: Triangle[];
}

export default function TrianglesLayer({ triangles }: TrianglesLayerProps) {
  const triangleGeoJSON = useMemo(() => {
    const features = triangles.map((triangle) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            triangle.vertices[0],
            triangle.vertices[1], 
            triangle.vertices[2],
            triangle.vertices[0], // Close the polygon
          ]
        ],
      },
      properties: {
        id: triangle.id,
        name: triangle.name,
        color: triangle.color,
        userId: triangle.userId,
        createdAt: triangle.createdAt.toISOString(),
      },
    }));

    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }, [triangles]);

  if (triangles.length === 0) {
    return null;
  }

  return (
    <Source id="triangles" type="geojson" data={triangleGeoJSON}>
      <Layer
        id="triangles-fill"
        type="fill"
        paint={{
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.3,
        }}
      />
      <Layer
        id="triangles-outline"
        type="line"
        paint={{
          'line-color': ['get', 'color'],
          'line-width': 2,
          'line-opacity': 0.8,
        }}
      />
      <Layer
        id="triangles-vertices"
        type="circle"
        paint={{
          'circle-color': ['get', 'color'],
          'circle-radius': 4,
          'circle-stroke-color': 'white',
          'circle-stroke-width': 2,
        }}
        filter={['==', '$type', 'Point']}
      />
    </Source>
  );
}