import { useEffect, useMemo } from 'react';
import { Map } from '@maptiler/sdk';
import * as turf from '@turf/turf';

interface DrawingPreviewLayerProps {
  vertices: [number, number][];
  isDrawing: boolean;
  circleCenter?: [number, number] | null;
  circleRadius?: number;
  isDrawingCircle?: boolean;
  isDrawingPolygon?: boolean;
  map?: Map | null;
}

export default function DrawingPreviewLayer({ 
  vertices, 
  isDrawing, 
  circleCenter, 
  circleRadius, 
  isDrawingCircle, 
  isDrawingPolygon,
  map 
}: DrawingPreviewLayerProps) {
  console.log('DrawingPreviewLayer: Preview state', { 
    vertices: vertices.length, 
    isDrawing, 
    isDrawingCircle, 
    isDrawingPolygon,
    circleCenter,
    circleRadius
  });

  // Generate circle preview GeoJSON
  const circleGeoJSON = useMemo(() => {
    if (!isDrawingCircle || !circleCenter || !circleRadius || circleRadius <= 0) {
      return null;
    }

    try {
      // Create circle using Turf.js with radius in meters
      const center = turf.point(circleCenter);
      const circle = turf.circle(center, circleRadius / 1000, { steps: 64, units: 'kilometers' });
      
      return {
        type: 'FeatureCollection' as const,
        features: [
          {
            type: 'Feature' as const,
            geometry: circle.geometry,
            properties: {
              id: 'preview-circle',
              type: 'preview'
            }
          }
        ]
      };
    } catch (error) {
      console.error('Error creating circle preview:', error);
      return null;
    }
  }, [isDrawingCircle, circleCenter, circleRadius]);

  // Generate polygon preview GeoJSON
  const polygonGeoJSON = useMemo(() => {
    if (!isDrawingPolygon || vertices.length < 2) {
      return null;
    }

    const coordinates = [...vertices];
    
    return {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          geometry: {
            type: 'LineString' as const,
            coordinates
          },
          properties: {
            id: 'preview-polygon',
            type: 'preview'
          }
        }
      ]
    };
  }, [isDrawingPolygon, vertices]);

  // Add/update circle preview layer
  useEffect(() => {
    if (!map || !isDrawingCircle) {
      // Remove circle preview if not drawing
      if (map?.getSource('preview-circle-source')) {
        map.removeLayer('preview-circle-fill');
        map.removeLayer('preview-circle-outline');
        map.removeSource('preview-circle-source');
      }
      return;
    }

    if (!circleGeoJSON) return;

    try {
      // Add or update circle preview source
      if (map.getSource('preview-circle-source')) {
        const source = map.getSource('preview-circle-source') as any;
        source.setData(circleGeoJSON);
      } else {
        // Add source
        map.addSource('preview-circle-source', {
          type: 'geojson',
          data: circleGeoJSON
        });

        // Add fill layer
        map.addLayer({
          id: 'preview-circle-fill',
          type: 'fill',
          source: 'preview-circle-source',
          paint: {
            'fill-color': '#4CBACB',
            'fill-opacity': 0.2
          }
        });

        // Add outline layer
        map.addLayer({
          id: 'preview-circle-outline',
          type: 'line',
          source: 'preview-circle-source',
          paint: {
            'line-color': '#4CBACB',
            'line-width': 2,
            'line-dasharray': [5, 5]
          }
        });
      }
    } catch (error) {
      console.error('Error adding circle preview layer:', error);
    }
  }, [map, isDrawingCircle, circleGeoJSON]);

  // Add/update polygon preview layer
  useEffect(() => {
    if (!map || !isDrawingPolygon) {
      // Remove polygon preview if not drawing
      if (map?.getSource('preview-polygon-source')) {
        map.removeLayer('preview-polygon-line');
        map.removeSource('preview-polygon-source');
      }
      return;
    }

    if (!polygonGeoJSON) return;

    try {
      // Add or update polygon preview source
      if (map.getSource('preview-polygon-source')) {
        const source = map.getSource('preview-polygon-source') as any;
        source.setData(polygonGeoJSON);
      } else {
        // Add source
        map.addSource('preview-polygon-source', {
          type: 'geojson',
          data: polygonGeoJSON
        });

        // Add line layer
        map.addLayer({
          id: 'preview-polygon-line',
          type: 'line',
          source: 'preview-polygon-source',
          paint: {
            'line-color': '#4CBACB',
            'line-width': 2,
            'line-dasharray': [5, 5]
          }
        });
      }
    } catch (error) {
      console.error('Error adding polygon preview layer:', error);
    }
  }, [map, isDrawingPolygon, polygonGeoJSON]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (map) {
        // Clean up circle preview
        try {
          if (map.getSource('preview-circle-source')) {
            map.removeLayer('preview-circle-fill');
            map.removeLayer('preview-circle-outline');
            map.removeSource('preview-circle-source');
          }
        } catch (error) {
          console.warn('Error cleaning up circle preview:', error);
        }

        // Clean up polygon preview
        try {
          if (map.getSource('preview-polygon-source')) {
            map.removeLayer('preview-polygon-line');
            map.removeSource('preview-polygon-source');
          }
        } catch (error) {
          console.warn('Error cleaning up polygon preview:', error);
        }
      }
    };
  }, [map]);

  return null;
}