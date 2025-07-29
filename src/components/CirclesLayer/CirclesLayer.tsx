import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import type { Circle } from '../../types';

interface CirclesLayerProps {
  circles: Circle[];
}

/**
 * Convert circle to GeoJSON polygon approximation
 * Using 64 points for smooth circle appearance
 */
function createCirclePolygon(center: [number, number], radiusInMeters: number) {
  const points = 64;
  const coordinates = [];
  
  // Convert radius from meters to degrees with proper geographic scaling
  // Latitude degrees are consistent, but longitude degrees vary by latitude
  const radiusInLatDegrees = radiusInMeters / 111320; // Consistent for latitude
  const radiusInLngDegrees = radiusInMeters / (111320 * Math.cos(center[1] * Math.PI / 180)); // Varies by latitude
  
  for (let i = 0; i <= points; i++) {
    const angle = (i * 2 * Math.PI) / points;
    const lng = center[0] + radiusInLngDegrees * Math.cos(angle);
    const lat = center[1] + radiusInLatDegrees * Math.sin(angle);
    coordinates.push([lng, lat]);
  }
  
  return coordinates;
}

export default function CirclesLayer({ circles }: CirclesLayerProps) {
  const circleGeoJSON = useMemo(() => {
    const features = circles.map((circle) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [createCirclePolygon(circle.center, circle.radius)],
      },
      properties: {
        id: circle.id,
        name: circle.name,
        color: circle.color,
        radius: circle.radius,
        userId: circle.userId,
        createdAt: circle.createdAt.toISOString(),
      },
    }));

    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }, [circles]);

  const centerPointsGeoJSON = useMemo(() => {
    const features = circles.map((circle) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: circle.center,
      },
      properties: {
        id: circle.id,
        name: circle.name,
        color: circle.color,
        radius: circle.radius,
      },
    }));

    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }, [circles]);

  if (circles.length === 0) {
    return null;
  }

  return (
    <>
      {/* Circle fills */}
      <Source id="circles" type="geojson" data={circleGeoJSON}>
        <Layer
          id="circles-fill"
          type="fill"
          paint={{
            'fill-color': ['get', 'color'],
            'fill-opacity': 0.15,
          }}
        />
        <Layer
          id="circles-outline"
          type="line"
          paint={{
            'line-color': ['get', 'color'],
            'line-width': 2,
            'line-opacity': 0.8,
          }}
        />
      </Source>
      
      {/* Center points */}
      <Source id="circle-centers" type="geojson" data={centerPointsGeoJSON}>
        <Layer
          id="circle-centers"
          type="circle"
          paint={{
            'circle-color': ['get', 'color'],
            'circle-radius': 6,
            'circle-stroke-color': 'white',
            'circle-stroke-width': 2,
            'circle-opacity': 0.9,
          }}
        />
      </Source>
    </>
  );
}