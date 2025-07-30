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
  isDrawingTriangle?: boolean;
  map?: Map | null;
}

export default function DrawingPreviewLayer({ 
  vertices, 
  isDrawing, 
  circleCenter, 
  circleRadius, 
  isDrawingCircle, 
  isDrawingPolygon,
  isDrawingTriangle,
  map 
}: DrawingPreviewLayerProps) {
  console.log('DrawingPreviewLayer: Preview state', { 
    vertices: vertices.length, 
    isDrawing, 
    isDrawingCircle, 
    isDrawingPolygon,
    isDrawingTriangle,
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

  // Generate triangle preview GeoJSON
  const triangleGeoJSON = useMemo(() => {
    if (!isDrawingTriangle || vertices.length === 0) {
      return null;
    }

    if (vertices.length === 1) {
      // Show first point
      return {
        type: 'FeatureCollection' as const,
        features: [
          {
            type: 'Feature' as const,
            geometry: {
              type: 'Point' as const,
              coordinates: vertices[0]
            },
            properties: {
              id: 'preview-triangle-point',
              type: 'preview'
            }
          }
        ]
      };
    } else if (vertices.length === 2) {
      // Show line between first two points
      return {
        type: 'FeatureCollection' as const,
        features: [
          {
            type: 'Feature' as const,
            geometry: {
              type: 'LineString' as const,
              coordinates: vertices
            },
            properties: {
              id: 'preview-triangle-line',
              type: 'preview'
            }
          }
        ]
      };
    } else if (vertices.length === 3) {
      // Show complete triangle
      return {
        type: 'FeatureCollection' as const,
        features: [
          {
            type: 'Feature' as const,
            geometry: {
              type: 'Polygon' as const,
              coordinates: [
                [
                  ...vertices,
                  vertices[0] // Close the triangle
                ]
              ]
            },
            properties: {
              id: 'preview-triangle',
              type: 'preview'
            }
          }
        ]
      };
    }

    return null;
  }, [isDrawingTriangle, vertices]);

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

  // Add/update triangle preview layer
  useEffect(() => {
    if (!map || !isDrawingTriangle) {
      // Remove triangle preview if not drawing
      if (map?.getSource('preview-triangle-source')) {
        try {
          map.removeLayer('preview-triangle-fill');
          map.removeLayer('preview-triangle-outline');
          map.removeLayer('preview-triangle-point');
          map.removeLayer('preview-triangle-line');
          map.removeSource('preview-triangle-source');
        } catch (error) {
          console.warn('Error removing triangle preview layers:', error);
        }
      }
      return;
    }

    if (!triangleGeoJSON) return;

    try {
      // Add or update triangle preview source
      if (map.getSource('preview-triangle-source')) {
        const source = map.getSource('preview-triangle-source') as any;
        source.setData(triangleGeoJSON);
      } else {
        // Add source
        map.addSource('preview-triangle-source', {
          type: 'geojson',
          data: triangleGeoJSON
        });

        // Add point layer (for first click)
        map.addLayer({
          id: 'preview-triangle-point',
          type: 'circle',
          source: 'preview-triangle-source',
          filter: ['==', '$type', 'Point'],
          paint: {
            'circle-color': '#4CBACB',
            'circle-radius': 6,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff'
          }
        });

        // Add line layer (for second click)
        map.addLayer({
          id: 'preview-triangle-line',
          type: 'line',
          source: 'preview-triangle-source',
          filter: ['==', '$type', 'LineString'],
          paint: {
            'line-color': '#4CBACB',
            'line-width': 2,
            'line-dasharray': [5, 5]
          }
        });

        // Add fill layer (for completed triangle)
        map.addLayer({
          id: 'preview-triangle-fill',
          type: 'fill',
          source: 'preview-triangle-source',
          filter: ['==', '$type', 'Polygon'],
          paint: {
            'fill-color': '#4CBACB',
            'fill-opacity': 0.2
          }
        });

        // Add outline layer (for completed triangle)
        map.addLayer({
          id: 'preview-triangle-outline',
          type: 'line',
          source: 'preview-triangle-source',
          filter: ['==', '$type', 'Polygon'],
          paint: {
            'line-color': '#4CBACB',
            'line-width': 2,
            'line-dasharray': [5, 5]
          }
        });
      }
    } catch (error) {
      console.error('Error adding triangle preview layer:', error);
    }
  }, [map, isDrawingTriangle, triangleGeoJSON]);

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

        // Clean up triangle preview
        try {
          if (map.getSource('preview-triangle-source')) {
            map.removeLayer('preview-triangle-fill');
            map.removeLayer('preview-triangle-outline');
            map.removeLayer('preview-triangle-point');
            map.removeLayer('preview-triangle-line');
            map.removeSource('preview-triangle-source');
          }
        } catch (error) {
          console.warn('Error cleaning up triangle preview:', error);
        }
      }
    };
  }, [map]);

  return null;
}