import { useEffect } from 'react';
import { Map } from '@maptiler/sdk';
import type { Polygon } from '../../types';

interface PolygonsLayerProps {
  polygons: Polygon[];
  map?: Map | null;
}

export default function PolygonsLayer({ polygons, map }: PolygonsLayerProps) {
  console.log('PolygonsLayer: Rendering', polygons.length, 'polygons');

  useEffect(() => {
    if (!map) return;

    // Create GeoJSON for all polygons
    const polygonsGeoJSON = {
      type: 'FeatureCollection' as const,
      features: polygons.map(polygon => ({
        type: 'Feature' as const,
        id: polygon.id,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [
            [
              ...polygon.vertices,
              polygon.vertices[0] // Close the polygon
            ]
          ]
        },
        properties: {
          id: polygon.id,
          name: polygon.name,
          color: polygon.color,
          userId: polygon.userId,
          vertexCount: polygon.vertices.length,
          type: 'polygon'
        }
      }))
    };

    try {
      // Add or update polygons source
      if (map.getSource('polygons-source')) {
        const source = map.getSource('polygons-source') as any;
        source.setData(polygonsGeoJSON);
      } else {
        // Add source
        map.addSource('polygons-source', {
          type: 'geojson',
          data: polygonsGeoJSON
        });

        // Add fill layer
        map.addLayer({
          id: 'polygons-fill',
          type: 'fill',
          source: 'polygons-source',
          paint: {
            'fill-color': ['get', 'color'],
            'fill-opacity': 0.3
          }
        });

        // Add outline layer
        map.addLayer({
          id: 'polygons-outline',
          type: 'line',
          source: 'polygons-source',
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 2
          }
        });

        // Add click handler for polygons
        const handlePolygonClick = (e: any) => {
          if (e.features && e.features[0]) {
            const properties = e.features[0].properties;
            console.log('Polygon clicked:', properties);
            // TODO: Add polygon click handling
          }
        };

        const handlePolygonMouseEnter = () => {
          map.getCanvas().style.cursor = 'pointer';
        };

        const handlePolygonMouseLeave = () => {
          map.getCanvas().style.cursor = '';
        };

        map.on('click', 'polygons-fill', handlePolygonClick);
        map.on('mouseenter', 'polygons-fill', handlePolygonMouseEnter);
        map.on('mouseleave', 'polygons-fill', handlePolygonMouseLeave);
      }
    } catch (error) {
      console.error('Error updating polygons layer:', error);
    }
  }, [map, polygons]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (map) {
        try {
          if (map.getSource('polygons-source')) {
            map.removeLayer('polygons-fill');
            map.removeLayer('polygons-outline');
            map.removeSource('polygons-source');
          }
        } catch (error) {
          console.warn('Error cleaning up polygons layer:', error);
        }
      }
    };
  }, [map]);

  return null;
}