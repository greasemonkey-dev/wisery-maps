import { useEffect } from 'react';
import { Map } from '@maptiler/sdk';
import type { Triangle } from '../../types';

interface TrianglesLayerProps {
  triangles: Triangle[];
  map?: Map | null;
}

export default function TrianglesLayer({ triangles, map }: TrianglesLayerProps) {
  console.log('TrianglesLayer: Rendering', triangles.length, 'triangles');

  useEffect(() => {
    if (!map) return;

    // Create GeoJSON for all triangles
    const trianglesGeoJSON = {
      type: 'FeatureCollection' as const,
      features: triangles.map(triangle => ({
        type: 'Feature' as const,
        id: triangle.id,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [
            [
              ...triangle.vertices,
              triangle.vertices[0] // Close the polygon
            ]
          ]
        },
        properties: {
          id: triangle.id,
          name: triangle.name,
          color: triangle.color,
          userId: triangle.userId,
          type: 'triangle'
        }
      }))
    };

    try {
      // Add or update triangles source
      if (map.getSource('triangles-source')) {
        const source = map.getSource('triangles-source') as any;
        source.setData(trianglesGeoJSON);
      } else {
        // Add source
        map.addSource('triangles-source', {
          type: 'geojson',
          data: trianglesGeoJSON
        });

        // Add fill layer
        map.addLayer({
          id: 'triangles-fill',
          type: 'fill',
          source: 'triangles-source',
          paint: {
            'fill-color': ['get', 'color'],
            'fill-opacity': 0.3
          }
        });

        // Add outline layer
        map.addLayer({
          id: 'triangles-outline',
          type: 'line',
          source: 'triangles-source',
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 2
          }
        });

        // Add click handler for triangles
        const handleTriangleClick = (e: any) => {
          if (e.features && e.features[0]) {
            const properties = e.features[0].properties;
            console.log('Triangle clicked:', properties);
            // TODO: Add triangle click handling
          }
        };

        const handleTriangleMouseEnter = () => {
          map.getCanvas().style.cursor = 'pointer';
        };

        const handleTriangleMouseLeave = () => {
          map.getCanvas().style.cursor = '';
        };

        map.on('click', 'triangles-fill', handleTriangleClick);
        map.on('mouseenter', 'triangles-fill', handleTriangleMouseEnter);
        map.on('mouseleave', 'triangles-fill', handleTriangleMouseLeave);
      }
    } catch (error) {
      console.error('Error updating triangles layer:', error);
    }
  }, [map, triangles]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (map) {
        try {
          if (map.getSource('triangles-source')) {
            map.removeLayer('triangles-fill');
            map.removeLayer('triangles-outline');
            map.removeSource('triangles-source');
          }
        } catch (error) {
          console.warn('Error cleaning up triangles layer:', error);
        }
      }
    };
  }, [map]);

  return null;
}