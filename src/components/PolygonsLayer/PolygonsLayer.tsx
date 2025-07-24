import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import type { Polygon } from '../../types';

interface PolygonsLayerProps {
  polygons: Polygon[];
}

export default function PolygonsLayer({ polygons }: PolygonsLayerProps) {
  const polygonGeoJSON = useMemo(() => {
    const features = polygons.map((polygon) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          // Close the polygon by adding the first point at the end
          [...polygon.vertices, polygon.vertices[0]]
        ],
      },
      properties: {
        id: polygon.id,
        name: polygon.name,
        color: polygon.color,
        vertices: polygon.vertices.length,
        userId: polygon.userId,
        createdAt: polygon.createdAt.toISOString(),
      },
    }));

    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }, [polygons]);

  if (polygons.length === 0) {
    return null;
  }

  return (
    <Source id="polygons" type="geojson" data={polygonGeoJSON}>
      {/* Polygon fills */}
      <Layer
        id="polygons-fill"
        type="fill"
        paint={{
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.2,
        }}
      />
      {/* Polygon outlines */}
      <Layer
        id="polygons-outline"
        type="line"
        paint={{
          'line-color': ['get', 'color'],
          'line-width': 2,
          'line-opacity': 0.8,
        }}
      />
    </Source>
  );
}